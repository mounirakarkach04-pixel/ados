-- PIGA ORTHO 3D / 2026-11-03 / human review authority hardening
-- Backend enforcement for final doctor checklist task, independently of UI.
begin;
create or replace function ortho_private.guard_final_doctor_task()
returns trigger language plpgsql security definer
set search_path = ''
as $$
declare missing integer;
begin
 if new.title like 'aerztliche_kontrolle:%' and new.state='done' and
    (old.state is distinct from new.state or old.responded_by is distinct from new.responded_by) then
    if auth.uid() is null or new.responded_by is distinct from auth.uid()
       or not ortho_private.clinic_allowed(new.clinic_id,array['owner']) then
       raise exception 'Final doctor approval requires active licensed clinic owner';
    end if;
    select count(*) into missing
    from (values
      ('scan_units'),('segmentierung'),('kiefer_registration'),('okklusion'),
      ('wurzeln_knochen'),('bewegungsgrenzen'),('stufen_geometrie'),
      ('druck_modell'),('druck_material')
    ) as prerequisite(code)
    where not exists (
      select 1 from public.ortho_clinic_tasks t
      where t.clinic_id=new.clinic_id and t.case_id=new.case_id
        and split_part(t.title,':',1)=prerequisite.code and t.state='done'
    );
    if missing<>0 then raise exception 'Final doctor approval blocked: prerequisite reviews missing or not done';end if;
 end if;
 return new;
end $$;
revoke all on function ortho_private.guard_final_doctor_task() from public,anon,authenticated;
drop trigger if exists ortho_guard_doctor_task on public.ortho_clinic_tasks;
create trigger ortho_guard_doctor_task before update on public.ortho_clinic_tasks
for each row execute function ortho_private.guard_final_doctor_task();

create or replace function ortho_private.invalidate_doctor_if_prerequisite_reopened()
returns trigger language plpgsql security definer
set search_path = ''
as $$
declare changed uuid;
begin
 if new.title not like 'aerztliche_kontrolle:%' and
    old.state='done' and new.state<>'done' then
   update public.ortho_clinic_tasks t
      set state='not_done', note='Ärztliche Schlusskontrolle ungültig: Pflichtschritt erneut offen',
          responded_by=auth.uid(),responded_at=clock_timestamp()
    where t.clinic_id=new.clinic_id and t.case_id=new.case_id
      and t.title like 'aerztliche_kontrolle:%' and t.state='done'
   returning id into changed;
   if changed is not null then
     insert into public.ortho_clinic_task_events(clinic_id,task_id,actor_id,state,note)
      values(new.clinic_id,changed,auth.uid(),'not_done','Automatische Rücknahme nach erneut geöffneter Pflichtprüfung');
   end if;
 end if;
 return new;
end $$;
revoke all on function ortho_private.invalidate_doctor_if_prerequisite_reopened() from public,anon,authenticated;
drop trigger if exists ortho_invalidate_doctor_on_reopen on public.ortho_clinic_tasks;
create trigger ortho_invalidate_doctor_on_reopen after update on public.ortho_clinic_tasks
for each row execute function ortho_private.invalidate_doctor_if_prerequisite_reopened();
commit;
