-- PIGA ORTHO · separate system-admin enrollment v1 / 2026-11-03
-- PRIVATE invitation, one-time code, verified Supabase Auth identity.
-- Does NOT grant a practice owner, doctor, printer, license or clinical authority.
begin;
create table if not exists ortho_private.platform_admin_preapprovals (
  email text primary key
    check (email=lower(btrim(email)) and length(email) between 6 and 254 and position('@' in email)>1),
  status text not null default 'awaiting_invite'
    check (status in ('awaiting_invite','issued','activated','revoked')),
  token_hash text
    check (token_hash is null or token_hash ~ '^[0-9a-f]{64}$'),
  issued_at timestamptz,
  expires_at timestamptz,
  activated_at timestamptz,
  activated_user_id uuid references auth.users(id),
  reason text not null default 'Owner-approved platform administration only'
    check (length(reason)<=400),
  constraint platform_admin_invite_shape check (
    (status='issued' and token_hash is not null and issued_at is not null and expires_at is not null)
    or (status<>'issued')
  )
);
revoke all on ortho_private.platform_admin_preapprovals from PUBLIC,anon,authenticated;

create table if not exists ortho_private.platform_admin_events (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id),
  action text not null check(action in ('admin_activated','admin_revoked')),
  occurred_at timestamptz not null default clock_timestamp(),
  detail text not null default '' check(length(detail)<=400)
);
revoke all on ortho_private.platform_admin_events from PUBLIC,anon,authenticated;

create or replace function ortho_private.issue_platform_admin_invitation(p_email text,p_ttl_hours integer default 72)
returns text
language plpgsql security definer set search_path = ''
as $$
declare recipient ortho_private.platform_admin_preapprovals%rowtype;
        issued_token text;
begin
 if p_email is null or length(btrim(p_email))<6 or p_ttl_hours not between 1 and 168
 then raise exception 'Invalid recipient or TTL'; end if;
 select * into recipient from ortho_private.platform_admin_preapprovals
 where email=lower(btrim(p_email)) and status in ('awaiting_invite','issued')
 for update;
 if not found then raise exception 'Recipient is not explicitly preapproved';end if;
 if exists (select 1 from auth.users u join public.ortho_platform_admins a on a.user_id=u.id
            where lower(u.email)=recipient.email and a.status='active')
 then raise exception 'Administrator already active';end if;
 issued_token:='PIGA-ADMIN-'||upper(encode(extensions.gen_random_bytes(24),'hex'));
 update ortho_private.platform_admin_preapprovals
 set token_hash=encode(pg_catalog.sha256(convert_to(issued_token,'UTF8')),'hex'),
     status='issued',issued_at=clock_timestamp(),expires_at=clock_timestamp()+make_interval(hours=>p_ttl_hours)
 where email=recipient.email;
 return issued_token;
end $$;
revoke all on function ortho_private.issue_platform_admin_invitation(text,integer) from PUBLIC,anon,authenticated;

create or replace function public.ortho_platform_claim_admin(p_code text)
returns boolean
language plpgsql security definer set search_path = ''
as $$
declare actor uuid:=auth.uid();verified_email text;recipient ortho_private.platform_admin_preapprovals%rowtype;
begin
 if actor is null then raise exception 'Authentication required';end if;
 if p_code is null or p_code !~ '^PIGA-ADMIN-[A-F0-9]{48}$'
 then raise exception 'Invalid activation code';end if;
 select lower(u.email) into verified_email
 from auth.users u
 where u.id=actor and u.email_confirmed_at is not null and coalesce(u.is_anonymous,false)=false;
 if verified_email is null then raise exception 'Verified permanent email required';end if;
 select * into recipient from ortho_private.platform_admin_preapprovals
 where email=verified_email and status='issued'
   and expires_at>clock_timestamp()
   and token_hash=encode(pg_catalog.sha256(convert_to(p_code,'UTF8')),'hex')
 for update;
 if not found then raise exception 'Admin invitation invalid, expired or not addressed to this verified identity';end if;
 if exists(select 1 from public.ortho_platform_admins a where a.user_id=actor and a.status='active')
 then raise exception 'Platform admin is already active';end if;
 insert into public.ortho_platform_admins(user_id,status,activated_by,rationale)
 values(actor,'active',actor,'Identity-confirmed, single-use owner-approved platform administration; NO CLINICAL RIGHTS')
 on conflict(user_id) do update set
  status='active',activated_by=actor,activated_at=clock_timestamp(),
  rationale='Reactivated through validated single-use owner-approved invitation';
 update ortho_private.platform_admin_preapprovals
 set status='activated',activated_at=clock_timestamp(),activated_user_id=actor,token_hash=null,
     expires_at=null
 where email=recipient.email;
 insert into ortho_private.platform_admin_events(user_id,action,detail)
 values(actor,'admin_activated','Verified email and one-time token; not a clinic membership');
 return true;
end $$;
revoke all on function public.ortho_platform_claim_admin(text) from PUBLIC,anon;
grant execute on function public.ortho_platform_claim_admin(text) to authenticated;
comment on function public.ortho_platform_claim_admin(text) is
 'One-time invitation activation with verified identity. Never grants a clinician role.';
commit;
