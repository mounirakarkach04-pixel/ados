PIGA ORTHO 3D — GLASSBOX STUDIO v0.2 | 25.10.2026
Kostenlose technische Evaluationsausgabe — NICHT FÜR KLINISCHEN PRODUKTIVBETRIEB.

START:
1. Die Hauptseite /piga-ortho-3d/ via HTTPS öffnen.
2. Auf Android in Chrome „Zum Startbildschirm hinzufügen“ nutzen, sobald HTTPS-PWA verfügbar.
3. Offline nach einmaligem erfolgreichen Laden der Service-Worker-Dateien nutzbar (STL und Glassbox).
4. Für rein lokale Ansicht Dateien mit statischem Webserver öffnen: python -m http.server 8080

STL:
- Binary- und ASCII-STL bis 25 MB.
- Rotierbares 3D-Flächenmodell (Sampling max. 12000 Dreiecke für Rendering); Hash SHA-256.
- Bounding-Box-Werte entsprechen unkalibrierten STL-Einheiten; keine automatischen mm.
- Technischer Plausibilitätscheck, nicht chirurgisch/klinisch.

DRUCKER:
- OctoPrint-Server im privaten IPv4-Netz; API-Key wird ausschließlich im RAM gehalten.
- Echtzeitstatus: GET /api/version und GET /api/job.
- Geräteaktionen: POST /api/job start | pause (action=pause) | cancel.
- Keine STL-direkt-an-Drucker-Funktion; vorher per geeignetem Slicer erzeugtes G-Code, in OctoPrint ausgewählt.
- Jede Wirkung benötigt Bedienerbestätigung, PIGA Gate 2 und Readback; keine automatischen Wiederholungen.
- Der öffentliche HTTPS-Browser kann HTTP-LAN-Aufrufe aufgrund Mixed Content / Private Network Access blockieren.
- Android-Debug-APK per reproduzierbarem GitHub Actions Build verfügbar; HTML/CSS/JS-Assets in der APK bytegenau geprüft. Hardwaretests stehen aus. Hersteller-Resindrucker mit anderem API-Protokoll benötigen einen Adapter.

GOVERNANCE:
- Gate1: technisch plausibles STL (ALLOW/DELAY/UNKNOWN), KEINE Behandlungsfreigabe.
- Gate2: nur konkrete Aktion, erneute Autoritäts- und Gerätestatusprüfung.
- Glassbox: lokale verkettete SHA-256-Ereignisse, exportierbar, aber ohne externen Zeitstempel/Signatur.
- Finite–Infinite: endlich viele bewusst begrenzte Analysezyklen; keine selbstständigen Druckbefehle.
- A7SEM Reverse: Readback nach Aktion; bei Unklarheit UNKNOWN, kein Blind-Retry.
- Fünf-Engines-Invariante: keine zusätzliche PIGA Engine.

ENTWICKLUNGSZIELE (nicht implementiert):
DICOM/CBCT, Zahnsegmentierung, klinische 3D-Planung, automatische Staging, herstellerspezifische Resindrucker,
Slicerintegration, geprüfter Android-Native-Adapter, validierte revisionssichere Speicherung,
regulatorische und versicherungsseitige Prüfung.

PIGA Forschungsprojekt – im Auftrag von Mounir Akarkach. Kostenlos für seinen Bruder.


PROZESSNAVIGATOR v0.3
---------------------
https://mounirakarkach04-pixel.github.io/ados/piga-ortho-3d/workflow.html
Eine interaktive 12-Phasen-Prozessdarstellung mit farblich gekennzeichnetem Implementierungsstatus, Eingabe-/Prüf-/Ausgabekette, Gate 1/2, A7SEM Reverse und JSON-Export. Keine klinischen Berechnungen und keine Patientendatenverarbeitung im Navigator.

V0.4 — DUAL-TRACK NAVIGATION
User Route und Ergebnis-/Glassbox-Route als interaktive, barrierearme Prozessbahnen in workflow.html. Kein Patienten- oder Druckereingriff im Navigator; jede Stufe zeigt den tatsächlichen Implementierungsstatus. Im Audit-Blueprint Export sind beide Routen ausdrücklich enthalten.

PIGA ORTHO v0.5 — PRAXIS WORKSPACE
--------------------------------
praxis.html contains Supabase-backed registration/login, recovery request, employee approval, work-time records and server-RLS-protected owner costing. New staff signups are pending; the owner receives a single-use invitation out of band. Clinical patient data and eGK/KIM interfaces are blocked. See piga-ortho-3d/ORTHO_V05_AUTH_RLS.md for backend policies, testing and deployment limits. A web UI is not a CE-certified clinical product.

PIGA ORTHO v0.6 — EMPLOYEE TRACEABILITY
----------------------------------------
Each account now has a unique, immutable, server-issued staff_code (e.g., KFO-001001), not an access password. New work events are server-generated START/END records tied to authenticated account, pseudonymous case reference and task. Each shift time is overwritten by Postgres server clocks, and employees cannot write events or modify start times. The owner-only handover timeline is RLS-restricted in the database, supports filtering by pseudonymous case and CSV export. Users must never enter real patient names or insurance identifiers. This task log does NOT substitute a complete statutory daily working-time system with breaks, corrections and legally compliant employee access. Version 0.6 remains technical evaluation. Owner activation, independent access test, real printer, clinical compliance remain pending.
