# LA PREUVE LAB — release v1.0 (2026-10-24)

Canonical: https://pigapocket.com/la-preuve-avant-le-diagnostic
App: https://pigapocket.com/la-preuve-avant-le-diagnostic/app.html
Self-contained offline download: app.html (save/download via link on landing).
Reference: Mounir Akarkach, La preuve avant le diagnostic, ISBN 979-8-16097-121-6, 378-page Scholar 3.1 PDF (title page labels Scholar 3.0).
Source grounding: Drive manuscript LA_PREUVE_SCHOLAR_3_1_KDP_INTERIEUR_378P_POLICES_INTEGREES.pdf, Section 01 D-001..040, Section 15 blood analyses, Section 34 scientific audit.

## What works
- Local arithmetic comparison against user-provided, context-specific reference interval; reject poor quality.
- PIGA Gate 1 outputs ALLOW / DELAY / BLOCK / UNKNOWN for *documentary arithmetic comparison only*.
- PIGA Gate 2 always BLOCK for all patient-facing / clinical / prescription / LIMS actions.
- Seven documentary verification steps; reverse trace; bounded re-entry (maximum 7 per dossier).
- Search of 40 book index entries; Bayes pedagogic PPV/NPV formulas; JSON / semicolon CSV export.
- Memory-only form/audit state; no patient data to server; file-download offline; PWA code cache.
- Free research demonstration, separate professional/institutional licensing requests.

## Important
NOT a medical device; NOT clinically validated; never enter real patient data; requires independent expert/regulatory review before a clinical intended use. No costs, new provider, engine, cron, persistent agent or background clinical processing added.
