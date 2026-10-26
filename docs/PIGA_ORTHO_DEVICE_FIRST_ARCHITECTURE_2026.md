# PIGA ORTHO 3D — Device-first Architecture & 2026 Design Review

26 October 2026. Existing five PIGA engines only. No sixth engine.

## Current working architecture
1. Browser/WebView: `PIGA_ORTHO_DEVICE_V1` IndexedDB is local primary data and local job store; no Supabase credential needed. Existing AES-GCM backup/export is operator-initiated. Browser IndexedDB is not encrypted at rest by app code: public unrestricted evaluation MUST NOT contain real patient/staff/medical records.
2. Foreground PWA: `device-resilience.js` schedules only bounded read-only jobs at approximately 15-minute intervals while page is visible. `navigator.locks` avoids multiple simultaneous tabs; worker timeout 12 seconds, max five jobs, no network, printer, clinical, financial or self-modifying effects. Browser may suspend worker anytime and cannot be a guaranteed 24/7 host.
3. Native Android: `OrthoLocalRunnerJob.java` uses device-owned separate SQLite for a persisted JobScheduler check at an approximate minimum interval of 15 minutes, including reboots. Android power management may defer jobs. The native database is only runner metadata, not an automatic browser IndexedDB mirror. No patient data or network.
4. Desktop Node.js 22+: `scripts/piga-ortho-pc-runner.mjs --daemon` uses standalone private SQLite and finite non-network technical checks every 15 minutes. Can run continuously while PC remains on and process remains alive; not installed or boot-enabled on any user's PC by source commits alone. Not a browser IndexedDB mirror.
5. Supabase: optional future secure multi-device sync. Cloud failure does not block existing local functions. A phone PWA is **not** a secure HTTPS LAN server for other practice users. True multi-device host failover needs explicit native TLS service/pairing, verified practice authorization, encrypted storage and conflict-aware signed outbox.
6. Clinical or payment actions: Gate 2 BLOCK until verified identity, entitlement and operator approval. No automatic diagnosis, printing, invoicing, purchasing, email or external sync from these worker changes.

## Self-improvement scope
`device-worker.js` has READ-ONLY `DATA_INTEGRITY_AUDIT` (duplicate IDs/orphan tasks/bad stock quantities) and `IMPROVEMENT_BACKLOG` (next safe priorities). Evidence and recommendations are not authority for code writing, clinical changes, hardware commands or paid calls. Production self-healing must be separately tested, versioned, reviewed and rollback-safe.

## Clinical production work still REQUIRED
Authenticate owner and staff, bind clinic tenancy, enforce RLS and consent, encrypted-at-rest database (e.g. SQLCipher with hardware-backed keystore), robust per-record versioned outbox, cryptographic key management, bounded retry/idempotency, patient-data protection, encrypted/offline restoration, GDP/DSGVO analysis, medical device regulatory assessment and real offline-cloud-restoration tests. Database local-first is not equivalent to clinical readiness.

## Dental rendering
`dental-anatomy.js` generates 28 synthetic differentiated crowns with gingiva and per-face enamel shading in the existing rotatable local 3D renderer. It is an illustrative reference, **not** patient-accurate or diagnostic anatomy. Patient-accurate 3D requires verified STL/DICOM geometry, normal vectors/occlusal measurements, calibrated dimensions, validated segmentation and expert review. The existing app still imports real STL.
Next high-fidelity architecture: offline-bundled Three.js/WebGL with physically-based materials and environment lighting; carefully sourced/licensed dental scan meshes; local rendering benchmarks; memory/battery budgets; nonclinical scene separated from patient geometry. MONAI Label with 3D Slicer is research tooling requiring clinical validation.

## State-of-the-art UX
Responsive window classes and adaptive panes: phone single-column/bottom nav, desktop multi-pane/side rail; large touch targets and accessible status. `manager.html` centralizes local readiness, worker backlog, optional cloud, native mode and backups; no large blocking popup or misleading '24/7 active' badge. Prefer local ready over ambiguous 'online' status.

## PC runner operation (operator must install on their actual computer)
Node 22+ is required. No paid API, no Supabase or external network required. In a checked-out `ados` repository:
```
node scripts/piga-ortho-pc-runner.mjs --once
node scripts/piga-ortho-pc-runner.mjs --status
node scripts/piga-ortho-pc-runner.mjs --daemon
```
To run after login, explicitly configure a user-level Windows Task Scheduler, launchd or systemd user service with full Node executable and repository paths. A reboot/disabled service or powered-off device stops the PC runner. Do not use an indefinite GitHub Action as a surrogate PC host.

## Links reviewed 26 Oct 2026
Android WorkManager/periodic constraints: https://developer.android.com/develop/background-work/background-tasks/persistent
Android FGS timeouts: https://developer.android.com/develop/background-work/services/fgs/timeout
PWA lifecycle: https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Offline_and_background_operation
Adaptive layout: https://developer.android.com/design/ui/mobile/guides/layout-and-content/adapt-layout
Three.js geometry and materials: https://threejs.org/manual/pages/custom-buffergeometry.html ; https://threejs.org/docs/pages/MeshPhysicalMaterial.html
MONAI Label: https://project-monai.github.io/label.html
