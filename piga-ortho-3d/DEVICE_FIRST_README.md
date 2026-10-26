# PIGA ORTHO 3D – device-first offline architecture (26 Oct 2026)

This edition **extends the existing PIGA ORTHO 3D PWA**. The original visualizations,
three-dimensional model viewer, workflow navigation, report generator, devices module,
and local operations remain separate application modules.

## 1. Universal screen layout

- `ortho-light.css` now has desktop, tablet, and smartphone viewport rules.
- Desktop navigation defaults to a compact 80px icon rail with a switch to expand labels.
- Existing content containers can use the remaining viewport width.
- The STL viewer, dashboard cards, inventory and workflow areas receive larger working spaces.
- On mobile, the original bottom-navigation menu is retained.

## 2. Device database, no Supabase

`device-store.js` opens browser IndexedDB `PIGA_ORTHO_DEVICE_V1`.
It contains three stores:

| Store | Primary key | Role |
|---|---|---|
| `snapshots` | `name` | `suite` and `direct` browser-owned app records |
| `jobs` | `id` | bounded device worker queue |
| `events` | `id` | local worker results/evidence metadata |

The existing namespaced storage `piga-ortho-v12-local` and
`piga-ortho-direct-v1` is **read at initial migration and retained** as a
compatibility mirror. The app loads the IndexedDB snapshot as its preferred source
and writes changes there asynchronously. The older localStorage mirror remains
in place while existing module code uses synchronous reads.

Access and isolation are managed by the browser profile. This is **not** user-level
authentication or encrypted-at-rest patient storage. Do not enter real patient
records, sensitive personnel/payroll data, or confidential clinic production data.

## 3. Local worker execution

`device-worker.js` is a Web Worker, with a bounded maximum of five jobs per run.
A job is first committed to IndexedDB and then claimed for execution.
Allowed kinds: `HEALTH_CHECK`, `WORKFLOW_SUMMARY`, `INVENTORY_FORECAST`.
Worker outputs include SHA-256 digests, not tamper-proof evidence or medical decisions.
The worker performs no `fetch`, printer action, network transfer, or clinical inference.
Stale RUNNING jobs may be requeued after a new invocation.

A browser Worker and Service Worker are **not** an always-on 24/7 daemon.
Tasks progress while a supported tab/PWA session is active and execution is requested.
Nothing about this implementation grants execution authority to existing remote
Pocket Enterprise runners. That would require a separately designed, explicitly
authorized secure device connector and transport.

## 4. Cross-device availability

The same web PWA is usable in current browsers on phones, tablets, and desktops.
Each device keeps its **own independent IndexedDB** database. There is **no live
multi-device synchronization or conflict resolution** yet.

`device-hub.html` permits **manual encrypted file transport**:
1. On source device, enter a strong passphrase, export JSON file encrypted with
   PBKDF2-SHA256 (250,000 iterations) and AES-256-GCM.
2. Move the file to the destination device using an appropriate secure file transfer.
3. On destination device, open the hub, choose file, enter the passphrase, and confirm
   explicit replacement of the destination local test data.
4. Reload any other open Ortho browser tabs after import.

The passphrase is not saved. This is a replacement import, **not** a merge or
collaborative database. Do not use for clinical or other regulated data.

## 5. Reliability / recovery

Browser IndexedDB and PWA program-cache lifetimes depend on operating-system/browser
policies, quota/eviction, private browsing mode and user deletion. Use `storage.persist()`
request in the hub when supported. Export backups regularly and store the passphrase
separately. IndexedDB write failures trigger a browser warning event; the old
localStorage compatibility mirror remains a limited fallback.

The website needs HTTPS to run its service worker and most browser cryptographic APIs.

## 6. Tests and known boundaries

- New test: `node scripts/piga-ortho-device-qa.mjs`
- GitHub workflow: `PIGA ORTHO 3D — Device-first QA`
- Legacy Android/web-asset parity QA still targets the original 3D Studio/Android
  package and its old Supabase authentication; it is **not** certification of the
  new PWA and may fail until the native Android asset-copy is updated.
- No real printer or clinical outcome was approved or tested as part of this change.
- The hosted web PWA is updated. The separate old packaged native Android APK
  is **not** automatically replaced by these website changes.

## 7. Zero-cost boundary

All the above works with browser-native features, no paid SaaS, and no
mandatory Supabase account. Cloud file hosting of static PWA code is separate from
storage of its local operational records.

## 8. Automatic offer and native encrypted sharing (26 Oct 2026)

- Global Ortho navigation loads `transfer-offer.js` on every application screen.
- New browser/device without existing local test records: offers encrypted data import.
- Existing device with unbacked-up records: offers an encrypted transfer / backup action.
- After new local changes: the offer may reappear after a daily cooldown, never an
  interruptive auto-upload. The user may always dismiss it.
- `device-store.js` tracks metadata for last change, export and import; no passphrase
  or clinic data is sent to a remote endpoint.
- `device-hub.js` flushes queued IndexedDB writes before export, encrypts using
  PBKDF2-SHA256 / AES-256-GCM, and reveals native `navigator.share` only after a
  valid encrypted file exists and when the OS supports file sharing.
- `worker-autoresume.js` resumes already-queued bounded read-only jobs when a PWA
  tab becomes visible; no local infinite daemon or implicit external execution.
- Existing Pocket Enterprise 24/7 needs the existing **external Windows self-hosted
  runner**. See private `piga-pocket-enterprise/docs/piga-ortho-24x7-runner-and-sync.md`.
  The host's availability cannot be inferred from browser-worker completion.

**This release does not implement automatic encrypted real-time sync.** Browser
portability is an offered, user-confirmed encrypted backup/import. An always-on,
cross-device replication service requires separate approved pairing and network
transport. Never use open/no-login mode for real clinical personal data.
