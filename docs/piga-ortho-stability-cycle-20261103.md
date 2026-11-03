# PIGA ORTHO 3D — Stabilization cycle 2026-11-03

Status: **DRAFT / NOT RELEASED / CLINICAL GATE 2 BLOCK**.
PR: https://github.com/mounirakarkach04-pixel/ados/pull/40

## Concrete defects fixed
1. Printer preflight reused checkbox confirmations from a previous file. Every file selection now clears all four attestations and printer-profile text. Stale async SHA-256 results cannot unlock the new selection; identity, clinic, current role and file SHA-256 are revalidated immediately before download. Duplicate preflight submissions are blocked.
2. Overlapping clinic task reads could render stale records after a clinic switch or logout. A per-request version gate drops old responses. Task submissions are single-flight, and modal notifications appear once per open task per clinic until rearmed.
3. Concurrent Supabase token refreshes could conflict. In-flight refresh is now coalesced and fails if the login session changes during refresh.
4. Numeric movement inputs accepted empty values as zero and truncated fractional stage indices. These inputs now fail closed.
5. The first-install popup from setup-offer.js intercepted the mobile review checkbox on the movement page (reproduced in browser). Setup guidance is now restricted to the dashboard, not treatment or clinical workflow pages.
6. Offline PWA version updated to v158 so clients can load the corrected scripts instead of retaining an older static cache.
7. Legacy CI scripts hard-coded SW cache v154 and failed solely on the cache label. Tests now assert a versioned cache contract, retain independent safety/voice checks, and no longer depend on a particular old release name.
8. Navigation now links the existing material-supply module. Public sales contract tests were updated to validate the current marketing preview, gated clinic portal and privacy boundary rather than incorrectly expecting unrestricted links to all clinical modules.

## Evidence
- Windows Node.js: `tests/movement-core.test.cjs`, `tests/ortho-portal-print.test.cjs`, `tests/ortho-portal-stability.test.cjs` → **21/21 PASS**.
- Node syntax checks: `portal.js`, `portal-stability.js`, modified movement modules → PASS.
- Headless Edge, 390×844 viewport with synthetic independently segmented teeth FDI 11 and 21:
  - `portal.html` HTTP 200, unauthenticated workspace remains hidden, registration/recovery tab toggles.
  - `movement.html` HTTP 200, import two local synthetic STL files.
  - Gate 1 initially BLOCK without explicit mm confirmation.
  - After confirmation, 3 finite A7SEM Reverse checks PASS.
  - Clinical review checkbox clickable after first-install popup fix.
  - Technical 3MF model downloaded; ZIP signature and package header verified.
  - No horizontal overflow at 390px and no browser page exceptions.
  - This is a desktop browser in mobile viewport, **not** a real Samsung hardware acceptance test.
- GitHub CI head `fd5e5cda148efb824b040087d6c3efdef83798ac`:
  - `PIGA ORTHO 3D — Device-first QA` SUCCESS (run 41731078027).
  - `PIGA Shared Voice / KFO Shop QA` SUCCESS (run 41731077976).
  - `PIGA Shared KFO AI · Chromium` in progress at observation.
  - `PIGA Portfolio — Shared UI & Navigation Contract` pending at observation.
  - `PIGA Portfolio · One Shared Assistant Contract` FAILURE; separate portfolio-wide contract issue, not marked green.

## Release authority and remaining work
- No production publish or PR merge.
- No clinical treatment recommendation, diagnostic root/periodontal/occlusion inference, appliance validation, or automatic printer start.
- 3MF is technical slicer-input geometry only. A human-prepared machine file download is NOT equivalent to manufacturing validation.
- Actual clinic memberships and platform-admin entries must be identity-provisioned and exercised before login/team E2E can pass.
- Required external acceptance: actual Samsung 3D rendering/memory, clinic role/invite login E2E, independent clinical algorithms validation, printer/material/slicer and physical device test, MDR/QMS/privacy assessment.
- Do not upload patient data to the public evaluation UI or GitHub.
