-- PIGA ORTHO 3D / 2026-11-03
-- ADDITIVE: role-labelled profiles, locked platform admin record,
-- atomic technical checklist case creation. No credentials or owner bootstrap.
-- Clinical/device Gate 2 stays BLOCK; no production/patient content.
begin;
create table if not exists public.ortho_platform_admins(
 user_id uuid primary key references auth.users(id) on delete restrict,
 status text not null default 'active' check (status in ('active','revoked')),
 activated_at timestamptz not null default now(),
 activated_by uuid references auth.users(id),
 rationale text not null default '' check(char_length(rationale)<=400)
);
alter table public.ortho_platform_admins enable row level security;
revoke all on public.ortho_platform_admins from anon,authenticated;
grant select on public.ortho_platform_admins to authenticated;
drop policy if exists ortho_platform_admin_self_read on public.ortho_platform_admins;
create policy ortho_platform_admin_self_read on public.ortho_platform_admins
 for select to authenticated using (user_id=(select auth.uid()) and status='active');
-- No browser INSERT/UPDATE/DELETE policies. Only a trusted operator can bootstrap.
comment on table public.ortho_platform_admins is
 'Fail-closed verified platform administrators. Authorized manual provisioning only. No implied clinical privilege.';

create table if not exists public.ortho_clinic_professional_profiles(
 clinic_id uuid not null,
 user_id uuid not null,
 profession text not null check(profession in ('doctor','assistant','technician','reception','accounting')),
 display_label text not null default '' check(char_length(display_label)<=80),
 updated_at timestamptz not null default now(),
 updated_by uuid references auth.users(id),
 primary key(clinic_id,user_id),
 foreign key (clinic_id,user_id)
   references public.ortho_clinic_memberships(clinic_id,user_id) on delete restrict
);
alter table public.ortho_clinic_professional_profiles enable row level security;
revoke all on public.ortho_clinic_professional_profiles from anon,authenticated;
grant select,insert,update on public.ortho_clinic_professional_profiles to authenticated;
drop policy if exists ortho_professional_read on public.ortho_clinic_professional_profiles;
create policy ortho_professional_read on public.ortho_clinic_professional_profiles
 for select to authenticated using (
  ortho_private.clinic_allowed(clinic_id,array['owner','employee','accountant'])
  and (user_id=(select auth.uid()) or ortho_private.clinic_allowed(clinic_id,array['owner']))
 );
drop policy if exists ortho_professional_owner_insert on public.ortho_clinic_professional_profiles;
create policy ortho_professional_owner_insert on public.ortho_clinic_professional_profiles
 for insert to authenticated with check (
  ortho_private.clinic_allowed(clinic_id,array['owner'])
  and exists (select 1 from public.ortho_clinic_memberships m
    where m.clinic_id=ortho_clinic_professional_profiles.clinic_id
      and m.user_id=ortho_clinic_professional_profiles.user_id
      and m.status='active'
      and (profession<>'doctor' or m.role='owner'))
 );
drop policy if exists ortho_professional_owner_update on public.ortho_clinic_professional_profiles;
create policy ortho_professional_owner_update on public.ortho_clinic_professional_profiles
 for update to authenticated
 using (ortho_private.clinic_allowed(clinic_id,array['owner']))
 with check (
  ortho_private.clinic_allowed(clinic_id,array['owner'])
  and exists (select 1 from public.ortho_clinic_memberships m
    where m.clinic_id=ortho_clinic_professional_profiles.clinic_id
      and m.user_id=ortho_clinic_professional_profiles.user_id
      and m.status='active'
      and (profession<>'doctor' or m.role='owner'))
 );
comment on table public.ortho_clinic_professional_profiles is
 'Display-only profession labels; actual authority comes from licensed membership and RLS.';

create or replace function public.ortho_clinic_open_checklist_case(p_clinic uuid,p_case_ref text)
returns uuid
language plpgsql security definer
set search_path = ''
as $$
declare new_case uuid:=gen_random_uuid();actor uuid:=auth.uid();
begin
 if actor is null or not ortho_private.clinic_allowed(p_clinic,array['owner']) then
    raise exception 'Active licensed verified practice owner required';
 end if;
 if p_case_ref is null or p_case_ref !~ '^[A-Z0-9][A-Z0-9_-]{2,39}$' then
    raise exception 'Case reference must use 3–40 uppercase A-Z, 0-9, underscore or dash';
 end if;
 -- Single transaction: either case plus all 10 checks exist, or none does.
 insert into public.ortho_clinic_cases(id,clinic_id,case_ref,state,created_by)
 values(new_case,p_clinic,p_case_ref,'open',actor);
 insert into public.ortho_clinic_tasks(
   id,clinic_id,case_id,title,assigned_to,state,note,created_by
 )
 select gen_random_uuid(),p_clinic,new_case,
   codes.code||': '||codes.title,null,'open','',actor
 from (values
   ('scan_units','Scan und mm-Einheit gegen Messreferenz kontrollieren'),
   ('segmentierung','FDI-Zähne und Segmentierungsgrenzen unabhängig prüfen'),
   ('kiefer_registration','Ober-/Unterkiefer-Registrierung und Bezugslage beurteilen'),
   ('okklusion','Okklusion und Kontakte klinisch prüfen'),
   ('wurzeln_knochen','Wurzel-/Knochenlage und Bilddatengrundlage beurteilen'),
   ('bewegungsgrenzen','Einzelzahn-Bewegungsgrenzen individuell beurteilen'),
   ('stufen_geometrie','Staging-Geometrie und technische Modellfehler prüfen'),
   ('druck_modell','Druckgeometrie, Modellbasis und geschlossene Oberfläche prüfen'),
   ('druck_material','Drucker, Material, Slicerprofil und Aushärtung prüfen'),
   ('aerztliche_kontrolle','Abschließende ärztliche Kontrolle dokumentieren')
 ) as codes(code,title);
 insert into public.ortho_clinic_audit(clinic_id,actor_id,action,object_id,note)
 values(p_clinic,actor,'technical_checklist_created',new_case,'10 individual human reviews; NO MEDICAL RELEASE');
 return new_case;
end $$;
revoke all on function public.ortho_clinic_open_checklist_case(uuid,text) from public,anon;
grant execute on function public.ortho_clinic_open_checklist_case(uuid,text) to authenticated;
comment on function public.ortho_clinic_open_checklist_case(uuid,text) is
 'License/RLS-gated, atomic technical review case. No patient treatment or printing authority.';
commit;
