# LA PREUVE LAB — release v2.0 (2026-10-24)

Canonical: https://pigapocket.com/la-preuve-avant-le-diagnostic/
App: https://pigapocket.com/la-preuve-avant-le-diagnostic/app.html
Self-contained offline download: https://pigapocket.com/la-preuve-avant-le-diagnostic/download
Book: Mounir Akarkach, La preuve avant le diagnostic, ISBN 979-8-16097-121-6. Archival reference PDF: 378 pages, file labelled Scholar 3.1, title page Scholar 3.0.

## What v2 adds
- Easy guided three-stage synthetic document check (new default) delegates Gate1 to the original v1 function, cross-checking against v2 classification and failing closed on any mismatch.
- Batch CSV review of up to 300 fictional records with 13-column schema, semicolon/comma delimiters, escaped CSV, validated SYN- reference prefixes, per-record explanations, Gate1 states and downloadable CSV.
- 40 interactive educational prerequisite exercises associated with the 40 infectious-disease book index headings; these are documentary simulations, NOT 40 disease-specific clinical algorithms or a full digital edition.
- In-memory v2 audit dashboard, JSON export (optional SHA-256 digest of payload via WebCrypto, NOT an authenticated signature), CSV export and printable document.
- Original advanced lab form, PIGA / A7SEM Reverse, original atlas, Bayes calculator and original journal remain.
- Rotated v2 PWA code cache and network-first refresh, preserving offline fallback with no user data cache.

## Technical regression
- Original synthetic benchmark: node scripts/benchmarks/la_preuve_lab_100.js artifacts/piga-pocket/public/la-preuve-avant-le-diagnostic/app.html
- New v2: node scripts/benchmarks/la_preuve_lab_v2_test.js artifacts/piga-pocket/public/la-preuve-avant-le-diagnostic/app.html
- v2 tested 1,200 original-vs-v2 documentary decisions and a complete 300-row synthetic batch; also checked CSV malformed headers, quotation, negative values, formula escaping, invalid prefixed identifiers, MAX=300, 40 dossier headings and Gate2 BLOCK.
- An independent 24-case human evaluation pilot remains available at evaluation.html, but actual human laboratory results = 0.

## Admission boundary
- Gate 1 ALLOW covers only documentary arithmetic comparison, never patient results.
- Gate 2 always BLOCK for clinical interpretation, prescriptions, triage, treatment, patient data processing and LIS/LIMS authority.
- No medical universal thresholds, no clinical validation, ISO/CE compliance, certified immutable audit, measured cost/time savings, diagnostic model, outside data connection, or genuine patient identifiers.
- All examples strictly synthetic, with SYN- prefixes. Prefix validation is NOT a privacy-preserving anonymizer.
- No new paid services, external infrastructure, persistent agent or sixth PIGA engine.
- WHO LQMS handbook consulted for general quality-management domains (not endorsement): https://www.who.int/publications/i/item/9789241548274

## Deploy checks
Retain file in Expo export through existing build script, Cloudflare read-only static router, GitHub Pages fallback. Recheck production /app.html, /download and /sw.js hashes and links after update.
