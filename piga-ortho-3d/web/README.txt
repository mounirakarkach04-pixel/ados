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
