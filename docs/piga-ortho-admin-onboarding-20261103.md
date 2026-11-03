# PIGA ORTHO 3D – Admin onboarding & controlled technical release

**Control time:** 2026-11-03 · **Branch:** feat/ortho-movement-staging-20261103 · **PR:** #40

## What is actually implemented
- Separate PIGA platform administrator, doctor/clinic owner, employee and accountant roles.
- Supabase Auth email confirmation and password login; session/user check; one-time email-bound platform admin claim RPC.
- Admin preapprovals stored in a private nonpublic schema with no client read grants. One-time token is 192-bit random and stored only as SHA-256, with a maximum 7-day issue TTL; token is erased after activation.
- Clinic staff/doctor access is an **independent**, licensed, server-side RLS authorization flow. Platform admin activation cannot grant clinical or printer privileges.
- Technical clinician task checklist, final doctor-only signoff gate, manual print-file preflight and export of geometry research 3MF/STL formats.

## Actual connected-account status
- A user-owned connected Gmail identity has a private **awaiting_invite** admin preapproval, with **no generated token** and no active admin authority.
- The connected Gmail identity does **not** yet match a verified Supabase Auth account. It must sign up and confirm its email in the product Auth project.
- Public `https://pigapocket.com/piga-ortho-3d/portal.html` returned HTTP **404** on 2026-11-03. Do not issue a time-limited invitation until a verified staging/production login URL is reachable.
- Existing licensed practice owner/doctor onboarding is separate; it requires the doctor's own verified account, invitation/consent and role readback. No user is impersonated or activated automatically.

## Verification
- Supabase migration `ortho_platform_admin_enrollment_20261103` applied successfully.
- Private table RLS hardening migration `ortho_platform_admin_private_rls_20261103` applied.
- Auth and RLS readback: anonymous admin claim EXECUTE **false**; authenticated self-claim **true** only via verified identity + single-use code; anonymous/authenticated cannot read preapprovals or issue invitations.
- Negative/contract SQL test: synthetic preapproval + hashed expiring token generated entirely in an explicit **rollback** transaction; no admin was granted.
- Node regression: **28/28 PASS**, including seven new enrollment/security contract tests.
- Headless Edge at 390×844, with explicitly **mocked Supabase responses**, verified login -> unprivileged panel -> code claim -> admin-only panel -> logout; no clinical workspace access, page errors or horizontal overflow. Not an E2E proof against the real Auth server.
- Five PR GitHub workflows were last fully green before the new admin changes; re-check the current head before any release.

## Hold points and subsequent controlled sequence
1. **RELEASE GATE: HOLD** while public portal is HTTP 404. No personal activation code yet.
2. Publish **technical preview only** at a verified route, with a public *evaluation* notice and all clinical and physical printer gates hard BLOCK. Confirm HTTPS, CSP, cookie policy, Auth callback redirect allowlist and email confirmation.
3. Only after route works: issue a one-use email-bound admin code to the approved connected Gmail address using the server-side private issuer and deliver via a trusted channel. The verified user signs in and claims it; confirm active RLS admin record and zero clinic roles.
4. Doctor/clinic owner must personally consent and complete separate verified/official license activation; each employee uses one-time invitation and a separate role.
5. Test end-to-end role isolation, expired/invalid/wrong-email activation tokens, password recovery, MFA/security configuration, signout, and server RLS.
6. Test large STL WebGL on real Samsung, slicer-specific output, actual printer/material and observable readback only under a separate explicitly authorized device test, and independently review EU MDR/QMS/privacy before clinical deployment.

**No live doctor/patient enrollment, no new platform admin activated, no physical printer command, no production clinical deployment.**
