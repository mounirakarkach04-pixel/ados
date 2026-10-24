# LA PREUVE LAB STUDIO — interactive release v1.0 (2026-10-24)
Author: Mounir Akarkach. Associated with the book La preuve avant le diagnostic.

Entrypoints: Primary https://pigapocket.com/la-preuve-avant-le-diagnostic/studio.html ; verified GitHub Pages fallback https://mounirakarkach04-pixel.github.io/ados/la-preuve-avant-le-diagnostic/studio.html ; offline suite generator https://mounirakarkach04-pixel.github.io/ados/la-preuve-avant-le-diagnostic/offline-suite.html

Modules:
1. Three synthetic case selector examples and fictional documentary values.
2. Gate 1: arithmetic, specimen identity, quality, interference, methods and provenance. ALLOW/DELAY/BLOCK/UNKNOWN apply only to documentary comparison.
3. Counterfactual exercise with user-chosen FICTIONAL recheck cost. No predicted clinical outcome or real cost.
4. Bayes controls for sensitivity, specificity, prevalence and predictive values; 1,000-dot waffle and simplified pretest-posttest chart. No real patients.
5. Finite 30-case creation limit, injected synthetic quality issues and exam answer feedback.
6. Local-only narrowly supported fictitious CSV, FHIR Observation Bundle JSON and HL7 v2 OBX teaching input. No general-purpose FHIR/HL7, real or anonymized patient data, or integration into LIMS/SIL. FHIR extra identity fields and non-OBX HL7 segments rejected.
7. Two-role laboratory/clinician roleplay ON ONE DEVICE; no actual communication.
8. In-memory event audit with downloaded CSV and JSON; not signed or durable.

Admission: Gate2 remains BLOCK for all actual clinical actions, diagnoses, prescriptions, patients, treatments, devices, LIMS/SIL and outside effects. No independent clinical validation, measured ROI or regulatory clearance.

Reproduction: node scripts/benchmarks/la_preuve_studio_v1_test.js artifacts/piga-pocket/public/la-preuve-avant-le-diagnostic/
Internal tests in V8 mock: 1200 Gate1 comparison cases matched original v2; 3 valid synthetic imports; 5 forbidden import cases blocked; 1000 chart points; case builder, exam, roleplay, 2 export handlers and reset checked. Synthetic only, no real clinical users.
Offline ZIP: 10 files including Studio, all CRC32 entries checked, 141 links checked with no missing local html targets. No internet needed after full extraction except external websites.
GitHub Pages Studio QA passed at a prior release revision; final security-hardening commit requires version-scoped confirmation before claiming that CI run covers it.
Cloudflare canonical production deployment is distinct from source commits and must be live-verified. No new engine, paid service, background agent or persistent worker.
Repositories: mounirakarkach04-pixel/piga-pocket-enterprise and mirror mounirakarkach04-pixel/ados.
