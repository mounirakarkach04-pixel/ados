# PIGA ORTHO 3D v0.5 · Staff / Cost / Auth architecture

**Scope:** Technical evaluation; no clinical production, no PHI, no direct insurance data. The site's `praxis.html` is a zero-third-party-library frontend using Supabase Auth endpoints and PostgREST. `sb_publishable_...` is public by design; no secret or service key is in client code.

**Existing user account backend:** Supabase project `sanrkcovmkkhgdqydxfk` (EU region); separate tables `ortho_staff`, `ortho_shifts`, `ortho_cost_settings`; separate private schema `ortho_private.owner_invites`. A dedicated ortho-only tenant / authorization boundary and contractual DPA are required before clinical launch. Project migration name `piga_ortho_staff_costs_v05`; no payment or new project required.

**Authentication:** `/auth/v1/signup`, `/auth/v1/token?grant_type=password`, `/auth/v1/recover`, `/auth/v1/logout`. Signups are pending and require approval. OAuth, passkeys, MFA, domain-specific password-reset redirect allowlist, throttling, abuse testing, data residency / contracts remain to validate. Session tokens intentionally live only in JavaScript memory, not localStorage. Browser tab refresh needs a new login.

**Owner role:** Never inferred from client-provided name or editable metadata. The legitimate verified email `dr.akarkach@gmx.de` and a server-side invitation hashed with SHA-256, 256-bit entropy, single-use, expiring, must both match before `ortho_claim_owner` sets database role. The invitation value MUST NOT be committed to any repository, printed in logs or copied into static clients.

**Role enforcement:** RLS is enabled on all three tables; `authenticated` privileges narrowed to columns. `ortho_private.is_owner()` is SECURITY DEFINER in a schema not exposed by PostgREST, with no variable SQL and a fixed empty search_path; used solely as a role check to avoid recursive RLS. Cost rows require both matching owner_id and owner status. Staff cannot read employer cost settings. Staff can INSERT their own pending profile and time for active accounts. Shift start fields are immutable on UPDATE; only end timestamp may be supplied after start.

**Costs:** €13.90/hour is 2026 gross minimum wage statutory wage floor, **not** total employer costs. Formlabs Model Resin V3 German manufacturer listed from €178.50/L including 19% VAT at consultation time, **not** guaranteed device/material compatibility or actual practice procurement price. All cost inputs are changed by owner; default unknown manufacturing values are €0 and shown as an estimate, not a true ledger or accounting profit. Calculated time from recorded shifts; job-case reference is pseudonymous. Mixed gross VAT / wages and other missing cost factors mean a commercial pricing decision requires accounting normalization.

**Integration boundary:** No PVS, VSDM/eGK, KIM/EBZ, patient identifier, reimbursement provider or insurer endpoint is actually attached. Insurance/member numbers must NEVER be entered in the prototype. Clinical workflows and manufacturer printer link require MDR, data processing agreements, TI/PVS compatibility and acceptance testing; not a CE certified product.

**Testing:** GitHub Actions verify 14 offline files byte-for-byte in APK, syntax, 12 stages and gates; RLS SQL must be independently tested using separate employee and owner auth sessions. A successful native build != clinical approval or market release.

**Files and entry points:** `piga-ortho-3d/praxis.html`, `workflow.html`, `index.html` and Android wrapper. This document is for development / controlled evaluation.
