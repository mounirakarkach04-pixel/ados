# LA PREUVE LAB — QM Workbench 3.0 (2026-10-24)

## Scope
Self-contained research/teaching HTML linked to Mounir Akarkach, *La preuve avant le diagnostic* (ISBN 979-8-16097-121-6). Published as an **additional static asset** next to the existing app, without changing the two original PIGA admission gates or adding a sixth engine.

**Only wholly synthetic SYN- sample IDs, fictional values and documentary exercises are permitted.** No real patients, human subjects, identity, instrument connections, diagnosis, prescriptions, clinical interpretation, LIMS, third-party backend, or real laboratory operations. Gate 2 stays BLOCK for all clinical external actions.

## Built capabilities
- Deterministic **48 synthetic cases per run**, 1/2/4/8 cycles up to 384 finite records, no autonomous perpetual worker.
- Fixed *non-disableable* safety/documentary constraints: identity mismatch, QC failure, suspected interference, invalid numeric interval, missing metadata, unknown QC/identity/interference.
- Versioned additional rules: add and toggle up to 20 rules. Field allowlist and safe comparators, outcomes DELAY/BLOCK only. Gate2 cannot be configured.
- Sorted P1/P2/P3 documentary deviations, linked to a fictional case ID and rule ID, including actionable reasons.
- CAPA practice transitions OPEN -> IN_PROGRESS -> REVIEWED, written justification mandatory (>= 12 chars) to mark reviewed. CAPA does **not** retroactively grant ALLOW or affect Gate 2.
- Glassbox journal and deterministic replay from a snapshot of inputs, rules and results. Replay detects technical differences; it is **not** an independent formally validated system.
- JSON state export with optional SHA-256 digest on canonical JSON (not signed or externally timestamped); local CSV exports of checks and deviations, browser print/PDF. JSON import requires structural validation, synthetic-only records and matching replay, optional digest comparison. Session memory only; reload clears data. Exports and imports are initiated by the user.
- Seven trace topics adapted to PIGA/A7SEM: identity, preanalytics, provenance, method, coherence, quality, reverse audit. This is a pedagogical mapping, not certification of A7SEM.

## Navigation
Canonical: https://pigapocket.com/la-preuve-avant-le-diagnostic/workbench.html
Direct offline download: https://pigapocket.com/la-preuve-avant-le-diagnostic/workbench-download
Fallback: https://mounirakarkach04-pixel.github.io/ados/la-preuve-avant-le-diagnostic/workbench.html

## Quality assurance
Script: `node scripts/benchmarks/la_preuve_qm_workbench_test.js artifacts/piga-pocket/public/la-preuve-avant-le-diagnostic/workbench.html`
Run 48 cases with 12 ALLOW / 20 DELAY / 4 UNKNOWN / 12 BLOCK; 8 cycles produce 384 bounded cases; check immutable Gate 2 BLOCK, optional rule rejection on ALLOW, CAPA finite transitions, replay tamper detection and synthetic input validation. GUI smoke checks separately under Chromium.

## Scientific and legal boundaries
These tests establish **internal deterministic consistency** only. They do not establish any actual reduction of error, improved patient outcomes, throughput, staff usability, ROI, medical device qualification or accreditation compliance. A SYN- string prefix is NOT an anonymization mechanism. There is NO secure identity management or multi-user persistent audit. Records in the local JSON file may be edited; optional checksum alone does not provide legal nonrepudiation.

For a real laboratory intended use, external laboratory partner, validated workflows, independent quality engineering, data protection and medical device regulatory scoping must precede such use.

## Deployment and zero-cost
The code is one HTML file with local JavaScript only, no npm dependencies for runtime. Cloudflare asset export list, static read-only gateway whitelist, GitHub Pages fallback and PWA code-cache entries must all be synchronized. Revalidate public URL and file SHA256; never infer that a commit means live deployment.
