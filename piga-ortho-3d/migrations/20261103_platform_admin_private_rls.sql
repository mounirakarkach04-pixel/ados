-- PIGA ORTHO / private admin invitation defense in depth.
-- Deny all ordinary access; only privileged server-side SECURITY DEFINER routines.
begin;
alter table ortho_private.platform_admin_preapprovals enable row level security;
alter table ortho_private.platform_admin_events enable row level security;
revoke all on ortho_private.platform_admin_preapprovals from PUBLIC,anon,authenticated;
revoke all on ortho_private.platform_admin_events from PUBLIC,anon,authenticated;
commit;
