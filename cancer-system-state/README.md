# Cancer as a Legitimate System State — Research Companion v1.0

**Author:** Mounir Akarkach  
**Source book:** *Cancer as a Legitimate System State: The Mathematics of Malignancy, Biological Emergence, and Evidence-Governed State Transitions* (2026).  
**Public research source:** [Specialist book edition V119](https://drive.google.com/file/d/1t5Vg0HF8FwmYypUGTgnUeEgtr3MfyfFy/view) (availability depends on owner's sharing settings).

## Launch and offline use

Open `index.html` in a browser to use the complete single-file app. All internal navigation uses same-page anchors: nothing inside the app depends on a second local HTML file, so Android's `content://` download handling will not break internal links. External research-source links require Internet.

Hosted GitHub Pages version: https://mounirakarkach04-pixel.github.io/ados/cancer-system-state/

## What the companion provides

- A searchable **50-profile** conceptual atlas (profile labels correspond to the specialist book; a few longer disease names are clarified for navigation). The explorer does *not* embed 50 validated clinical pathways or the full copyrighted chapter text.
- Exactly **seven nonsequential, interacting A7SEM research dimensions**.
- A 24-step bounded **toy-model dynamics visualization** with side-by-side fixed reference trajectory. Coefficients are abstract; there are no treatments, tumour-size predictions, hazard rates, or clinical variables.
- A **PIGA documentary Gate 1** exercise evaluating availability of provenance, assumptions, uncertainty, counterhypotheses, falsifiability, and contradictory evidence; outcomes `ALLOW`, `DELAY`, `BLOCK`, `UNKNOWN` apply **only** to conceptual document review.
- **A7SEM Reverse** counter-check and explicitly presented remaining uncertainty.
- Locally exported **Research Passport JSON** and model-path CSV (no server upload, no digital signature, no persistence).
- Mobile-friendly, accessible focus states, reduced-motion support, print mode, no JS/CSS external dependency.

## Clinical boundary

This is not a medical device, cancer diagnostic system, prognosis engine, treatment recommendation system, or patient-care tool. **Gate 2 = BLOCK always.** A mathematical system state being allowed by a model is neither an endorsement of cancer nor evidence of clinical efficacy. Do not enter personal or patient data, even de-identified real patient histories. No real clinical data are processed, stored or transmitted by the application.

A conceptual toy-model fit is never evidence of a specific biological mechanism. PIGA/A7SEM/A7SEM Reverse are original author frameworks used here for internal reasoning; no independent clinical validation or comparative predictive benefit is claimed.

## Provenance and evidence

The 50-profile table is grounded in the author's *Public Specialist Edition V119*; overarching method and limitations are documented in the [Cancer Master Research Protocol](https://docs.google.com/document/d/1vgLNpTi7bbqaBeZdz06wZOuH5BxJIwyys0N1mNcfeBQ/edit).

## Quality assurance

The GitHub Actions job in `.github/workflows/cancer-companion-qa.yml` runs the **real Chromium browser** over three bounded rounds, both 1280px and 390px wide, covering 50 profiles, all seven dimensions, model interactions, four Gate 1 states, local-file navigation, exports, error-free JS execution, and viewport overflow. Each commit's evidence belongs to that commit; never reuse the results of an older test build to claim a later revision passed.

No additional paid runtime, API key, agent/engine or server is required.

© 2026 Mounir Akarkach.
