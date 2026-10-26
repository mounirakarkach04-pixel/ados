# PIGA ORTHO 3D — In-App Nervous System / Control Center
Release: 26 October 2026. Scope: **synthetic, nonclinical, device-local HTML evaluation**.

## Human-facing controls

Open `./piga-control.html` from the Ortho dashboard or navigation. The page consists of:

- **Brain (Gehirn)** — `piga-brain.js`, a deterministic offline module/FAQ catalog. It answers common technical and product questions immediately; it is **not** an LLM, real-time web crawler, or an authenticated knowledge connector.
- **Eyes (Augen)** — Existing STL Studio, CBCT native grayscale viewer, GPU jaw renderer and technical image review. These are not validated diagnostic methods.
- **Hands (Hände)** — Existing `device-worker.js`, three **read-only** jobs: `HEALTH_CHECK`, `INVENTORY_FORECAST`, `WORKFLOW_SUMMARY`. No printer commands, medical billing, payroll, calendar mutations or real leave approvals.
- **Nervous system (Nervensystem)** — device IndexedDB snapshot + job queue + evidence events; the Control page reads job state and events and exposes a foreground **page heartbeat**. A small PIGA launcher works across existing app pages.
- **Memory (Gedächtnis)** — saved local, bounded chat messages, review request drafts, technical staff test chat and imaging review snapshots. The AES-256-GCM/PBKDF2 encrypted device export/import now includes PIGA Control and Imaging Review alongside existing suite/direct data. It deliberately does NOT transfer executable queues so old jobs cannot replay on a different device.
- **Immune system / PIGA Admission** — review statuses are `AWAITING_REVIEW`, `TECHNICALLY_REVIEWED`, `PAUSED`, `REJECTED`; each technical acknowledgement and review remains `gate1=DELAY`, `gate2=BLOCK`, `clinicalAuthority=NOT_ASSIGNED`, `effects=0`.
- **A7SEM Reverse** — existing PIGA evidence/review flows supply local outputs, SHA-256 and explicit no-effect readback. These are NOT cryptographic digital signatures or external attestation.

## Factory flow (local)

1. User opens Control, sees live foreground indicator and queued/read-only jobs.
2. User chooses a bounded job such as inventory forecast. Job is saved to IndexedDB.
3. A short-lived local Web Worker claims up to 5 jobs, computes only sanitized aggregate results, writes a SHA-256 checksum and job event into device IndexedDB and exits.
4. The Control ticker shows recorded `DONE` or `FAILED` events. These are actual local job events, not fabricated heartbeats from a disconnected server.
5. An explicit chat command may prepare a human review request. It does not mutate a patient record, send emails, issue a clinical determination or start a device.
6. A review popup lets a local operator mark a technical draft **reviewed**, reject or pause. Final owner/clinical approvals are disabled because this open HTML evaluation has no authenticated signature authority.

## Foreground autonomy and battery

- Press **Auto bei geöffnetem Tab: AN** to periodically run previously queued, read-only, bounded jobs while the Control page remains visible; **Pausieren** stops automatic cycles.
- Press **Bildschirm aktiv halten: AN** only on a compatible device and only while you explicitly want it to remain awake. Screen Wake Lock is optional and can fail or be revoked. Battery drain and OS restrictions apply.
- Browser tabs/PWAs cannot promise 24/7 execution with the app closed, screen off, or the OS suspending JavaScript. A ticker pulse on screen is a **local page pulse**, NOT proof of a durable 24/7 worker.
- For verified 24/7 autonomy without a desktop, a continuously powered/supported native mobile foreground service or a separate secure always-on host must be deployed and tested. Existing Pocket Enterprise runner still requires its verified secrets and its durable ticket/action admission chain. NO additional engine is introduced by this release.
- Shared data among browser tabs uses a `BroadcastChannel` in the same browser profile; it does not synchronize different devices or user accounts. **No actual multiuser security**.

## Staff mode, review and team chat

Choose Mitarbeiter in Control. This reduces the local interface, allows technical help and synthetic leave requests, and hides elevated worker buttons. Switching a UI option is **not** identity verification or access control; never use for real HR, dental records, payroll or appointments.
The team chat uses device-local IndexedDB and opt-in browser notification permission. The popup contains only a generic new-message notice, not actual message contents. Other tabs in the same browser profile can receive updates.
The owner view can technically acknowledge a non-effectful draft or reject/pause it; real authorizations require a separate strong identity, signed audit, dual gate and app server before clinical production.

## Chat, public research and optional Gemini

Chat answers are deterministic and immediate; the PIGA reference catalog links to the published article
[PIGA for Everyone — 10 Rules. One Architecture](https://zenodo.org/records/21390720)
by Mounir Akarkach. The full private Google Drive research corpus is NOT copied into or readable by this static public browser app.

Two local voice steps:
1. Tap **Mikrofon** in PIGA Chat and grant permission if offered. On supported browsers this invokes Web Speech Recognition (which may contact the browser vendor).
2. Speak a question and tap **PIGA fragen**. Tap **Vorlesen** to play the resulting text if Text-to-Speech is supported.

For optional Gemini text/Live AI, never embed a long-lived API key in JavaScript, HTML or localStorage.
1. Use [Google AI Studio](https://aistudio.google.com/apikey) and a personally owned project with explicit budget/quota limits. Remote AI inference may incur charges. Do not enable billing by default.
2. Configure an authenticated backend/serverless proxy keeping the API authorization key server-side.
3. For Gemini Live real-time browser sessions, use short-lived, restricted ephemeral tokens issued by the authenticated backend, not the original key. Restrict data transfer, logging and tool-call authority.
4. Subject all LLM-generated tool proposals to deterministic PIGA Gate 1 and Gate 2 admission. This integration is **not currently connected**.
Current instant PIGA Chat works offline without any provider, API key or fees.

The Websuche button opens a public search tab for user-supplied non-personal text. The Chat does **not** read back search results; a secure internet retrieval connector would be needed for cited search-grounded answers.

## Safety and production blockers

- Browser-accessible no-login mode: synthetic/anonymized test data only.
- No medical-device certification, automatic KFO diagnosis, validated CBCT segmentation, occlusion treatment diagnosis, therapeutic tooth-level staging or unattended 3D printer execution.
- Billing reference links are not automatic claim submission; a clinician/practice is responsible for current codes, actual service and legal requirements.
- No authenticated roles, electronic signatures or enforceable paid entitlements.
- The legacy Android/Web parity QA still fails, and the Cloudflare canonical domain has not been independently verified to serve this newest release.
- CI consists of static source parsing, device-core tests, synthetic imaging and deterministic PIGA control invariants. Real on-device 24-hour uptime, phone speech, popups and hardware-level 4K rendering still require hardware/browser end-to-end tests.

## Direct links

- [PIGA Control Center](./piga-control.html)
- [Imaging Lab](./imaging.html)
- [3D Studio](./studio.html)
- [Device first worker database](./device-hub.html)
- [Practice → Lab](./handoff.html)
- [KFO support and BEMA reference](./assist.html)

Release path:
`https://mounirakarkach04-pixel.github.io/ados/piga-ortho-3d/piga-control.html`
