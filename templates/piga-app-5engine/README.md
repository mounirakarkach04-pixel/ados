# PIGA app blueprint — five-engine standard

Reusable public/offline FIRST app starter, not a clinical/production permission grant.
Copy the files into a **new** app folder only after choosing a unique app ID.
The new app must be registered as a SERVER-TRUSTED fixed specialist profile before any PIGA shared model API request. Never place provider tokens in the client.

## Five engines only
1. `intake`: user enters text intentionally; validate length and private-data exclusion.
2. `queue`: local memory queue for proposed tasks, not automatic side-effects.
3. `govern`: Gate 1 before interpretation; Gate 2 blocks external effects until separate release.
4. `evidence`: local bounded receipts; never claim live or device status without readback.
5. `decision`: DELAY/BLOCK/UNKNOWN unless verified and explicitly authorized.

A7SEM observes each cycle and A7SEM Reverse checks its resulting receipt. These are lenses, **not sixth engines**.
Existing Showroom AI remains untouched and may only be reused through `/api/piga/assistant/v1/ask` with one of the eight registered app IDs: showroom, ortho, kfo-shop, ai_act, cancer, la_preuve, barakah, nadias_bloom.

## App blueprint checklist
- Semantic responsive HTML, no forced registration before public nonclinical walkthrough.
- One-onboarding-flow, offline PWA, accessibility, translations and clear errors.
- Source SHA, test evidence, stable paths, capability contracts, security limits.
- User-initiated microphone and speech; explicitly identified female voice or text.
- No patient/employee/private data in public assistant; avoid auto purchases, devices, print jobs, email.
- Local-first fallback, recoverable data export and explicit import.
- COST 0 for newly provisioned services; changes reviewed before promotion.
- Devices must prove fresh ACK/RESULT/heartbeat; if offline status UNKNOWN.
- Signed/fenced one-attempt action tickets and owner authority to perform effects.
- Automated QA and human visual/functional test before marking market-ready.

## Reproduction
Run `node scripts/piga-factory-25x3-tick.mjs --qa` at repo root; it writes an evidence receipt to qa-reports.
The actual scheduled hourly runner is **public GitHub Actions**, not 25 processes resident on a phone. Android heartbeat is intentionally UNKNOWN until a live phone bridge is authenticated.
No automatic code mutation, deployment, payment, medical authorization or hourly email is performed by this template.
