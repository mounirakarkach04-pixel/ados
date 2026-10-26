# PIGA ORTHO 3D — Light Precision HTML Release v3
26 October 2026 · published branch `mounirakarkach04-pixel/ados:main`.

## Public HTML application
- https://mounirakarkach04-pixel.github.io/ados/piga-ortho-3d/dashboard.html
- https://mounirakarkach04-pixel.github.io/ados/piga-ortho-3d/studio.html
- https://mounirakarkach04-pixel.github.io/ados/piga-ortho-3d/assist.html
- https://mounirakarkach04-pixel.github.io/ados/piga-ortho-3d/sales.html

The original Ortho pages remain intact. `index.html` redirects to the HTML dashboard.

## Design
Eleven working HTML views share `ortho-visual-v3.css` and `ortho-visual-v3.js`.
New responsive cyan/white mastheads with locally hosted original SVG artworks, desktop workspace improvements, compact navigation, mobile-friendly controls, and larger 3D model viewport. Dashboard replaces its old placeholder aligner drawing with the new illustrated asset. Duplicate stylesheet/script includes removed.
Pages: dashboard, studio, praxis, team, inventory, workflow, devices, assist, report, direct, device-hub.
The visuals are illustrative and do not depict actual patient data.

## Function improvements
- On the assistant page, `assist-help.js` implements interactive topic prompts and a local technical help input. It gives bounded, rule-based answers and navigates to real existing tools. It is **not** cloud LLM inference and cannot diagnose or recommend therapy.
- `ortho-install.js` offers native browser PWA installation via `beforeinstallprompt` where supported, and meaningful manual steps for browsers that do not support prompting.
- All ten primary modules' hardcoded `$('id')` references were statically compared with their HTML element IDs; none were missing at the time of review.
- Existing local operations, report import/print/export, printer Gate 2 control, workflow tabs, scanner demos, 3D model inspection, wireless guidance and IndexedDB persistency remain in place.
- `sw.js` cache version `piga-ortho-v131-installable-html` includes the HTML v3 CSS/JS, SVGs, help and installer.

## Test evidence
- Extended GitHub Actions workflow: `PIGA ORTHO 3D — Device-first QA`.
- Positive test verifies all 11 HTML views, no duplicate visual assets, local relative files, parser syntax of key scripts, core handlers, artwork, responsive breakpoints, and bounded worker / encrypted transfer contracts.
- The separate legacy Workflow UX & Glassbox QA fails because it still requires exact content parity between the new HTML site and the original unmodified Android APK assets. Do not reclassify this failure as a successful Android package release.
- Physical printers, WLAN/BT hardware, native Android app features, clinical workflows and server-side Stripe entitlements are **not** fully end-to-end verified.

## Safety and release boundary
This is an openly accessible **technical evaluation HTML PWA**; avoid real patient, HR and payroll data. Its local-first browser data are not a multi-user secured clinic backend. No medical-device approval or clinical validity is implied.
`https://pigapocket.com/piga-ortho-3d/` is the intended commercial canonical subpage only; the Cloudflare deployment remains unresolved. Do not advertise that as live or publish payment links before access control and entitlement gates pass.
The Stripe Ortho product remains inactive (commercial HOLD). Protect production app access at the server, not by hiding buttons in a public HTML page.

## HTML installation
Navigate to the GitHub Pages app in a secure browser. Choose “App auf Gerät installieren” and accept the browser's install prompt where supported; otherwise follow the displayed browser-specific instructions. The service worker caches the visual and UI assets for previously visited pages. Offline access depends on the browser and stored resources.

## 27 October 2026 — Landing-page / offline-feature parity & preserved Showroom PIGA KI
- `sales.html` retains the original six illustrated product panels, pricing and licensing text unchanged, but adds direct launch and 18 real existing HTML module deep links: dashboard, local practice, STL, imaging, devices, encrypted device hub, KFO Atlas, shared PIGA voice, guided workflow, 12-stage navigator, team, handoff, inventory, supply, procurement, reports, diagnostics, and setup.
- The `ortho-preview` assistant on sales and `ortho-workspace` on dashboard now bind to the already established server-trusted `ortho` profile of `/api/piga/assistant/v1/ask`, not the incompatible legacy `ortho-practice` client string. The existing showroom implementation is not modified, replaced, redeployed or given additional authority.
- Unified generic PIGA widget enforces maximum 420 characters, one-use opt-in consent, exact profile/app answer matching and female-voice-only device speech. The shared Cloudflare Workers AI service can still be delayed or blocked by its independent runtime/quotas; no provider key is bundled. Offline local modules remain useful even if remote inference is unavailable.
- Service worker cache advances to `piga-ortho-v153-kfo-html-parity-shared-showroom` for updated public static assets; preexisting offline state in IndexedDB is not rewritten by this change.
- Validation contract: `node quality/piga-assistant-portfolio.test.mjs`, `node quality/kfo-sales-parity.test.mjs` and `node scripts/piga-ortho-device-qa.mjs`. GitHub Actions/build/readback must separately pass before claiming LIVE.
- No printer activation, automatic purchase, payroll or clinical authorization. Production patient data remain excluded. Actual Android APK asset parity and canonical pigapocket.com Cloudflare delivery are separate gates.
