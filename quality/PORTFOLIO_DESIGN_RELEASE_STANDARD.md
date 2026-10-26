# PIGA Portfolio — gemeinsamer Design- & Releasevertrag (26.10.2026)

**Status: SOURCE / REVIEW.** Ein GitHub-Commit ist keine Live-Freigabe. Keine Produktions-/Klinik-/Lizenzfreigabe ohne getrenntes Readback.

## Geltungsbereich
Dieses öffentliche Repository stellt die ADOS-, EU AI Act-, Nadia-, ORTHO-3D-, Cancer- und LA PREUVE-Anwendungen sowie KFO-Shop-Quellseiten bereit. Das private `piga-pocket-enterprise` bleibt kanonischer Ort für Showroom, Cloudflare-Runtime, Berechtigungen und zentrale PIGA-KI. Dies ist keine sechste Engine oder zweite AI-Backend-Instanz.

## Einheitlicher Qualitätsvertrag
1. **Erkennbar:** eigener Produktname, klare Aufgabe, eine primäre Aktion, verständliche Leerseiten/Statusmeldungen; bestehende lokale Markenfarben bleiben erhalten.
2. **Mobil:** sinnvolle 320/390/768/1280-px-Breiten, kein horizontaler Overflow, bedienbare Touchflächen, Tastaturbedienung.
3. **Barrierearm:** semantisches `main`, Überschriftenstruktur, direkter Sprung zum Inhalt, sichtbarer Tastaturfokus, Sprache, verständliche Labels, Reduzierung von Bewegung bei OS-Präferenz.
4. **Zuverlässig:** Offline-Wahrheit statt Fake-Funktion; dedizierte Lade-/Fehler-/Retry-/Degraded-Zustände; Dienste nie ohne Beweis als LIVE markieren.
5. **Technisch:** serverseitige Secrets und Entitlements, begrenzte Calls/Timeouts, kein fremdes Modell direkt im Browser, CSP und zugriffsbezogene Freigaben pro App.
6. **Governance:** A7SEM → Gate 1 → begrenzte Aktion (Gate 2, falls externe Wirkung) → Evidence → A7SEM Reverse; VBR nur mit tatsächlich verifizierter Nichtausführung.
7. **Kosten & Datenschutz:** keine zusätzlichen kostenpflichtigen Provider; lokale Daten bleiben lokal, außer nach ausdrücklicher und autorisierter Übertragung.
8. **Releases:** Quelle → statische Prüfung → App-spezifische QA → Berechtigungs-/Quotenprüfung → Deployment → echter HTTPS-/Funktions-Readback → Ergebnis im Drive-Protokoll.

## Eingeführte repo-übergreifende Oberfläche
`quality/portfolio-polish.css` ist ein *kleiner, additiver* gemeinsamer Accessibility-Layer. Die bestehende Markenidentität und Navigation jeder App bleiben unangetastet. Die Browserseiten binden ihn lokal ein und erhalten einen lokalisierten Skip-Link. Eine strukturelle/pixelgenaue Designmigration ist davon zu unterscheiden und braucht eigene Screenshots/Abnahme.

`quality/portfolio-registry.json` erfasst die öffentlichen App-Einstiege und `scripts/verify-portfolio-contract.mjs` testet deren Mindestvertrag in der CI ohne KI-, Netz- oder kostenpflichtige API-Aufrufe.

## Derzeitige Release-Grenzen
- Cloudflare-Kanonikalrouten **nicht** durch einen GitHub-Pages-Commit als live bestätigt.
- PIGA ONE VOICE / Showroom-Fachprofile: private DRAFT PRs, kein flächendeckend nachgewiesener produktiver Rollout.
- ORTHO-3D-Kassen-/Personal-/Geräte-/klinische Wirkungen bleiben separat zugriffsgeschützt; öffentliche Quell-HTML-Seiten sind kein zulässiges Praxis-Produktivsystem.
- Happy-Sprache, Owner-Phone-Bridge und EU-AI-Act-Lizenzwege separat per aktuellen End-to-End-Tests nachweisen.
- Bestehende fünf Engines bleiben: intake, queue, govern, evidence, decision. A7SEM Reverse ist Prüfschicht, keine sechste Engine.

**Review-Reihenfolge:** Accessibility/Navigation → Load/Error UX → Mobile Screenshot-Parität → Backend-/Auth-Vertrag → app-spezifische Funktionsprüfung → Live-/Kosten-Readback.

## Portfolio Control Room und reale Live-Prüfung (Ergänzung 26.10.2026)

- `quality/portfolio-control-room.html`: mobil optimiertes, barrierearmes **rein lesendes** Verzeichnis mit 11 App-Einstiegen, Suche, Filter, internem Quelllink und kanonischem Link. Benutzt nur `quality/portfolio-registry.json`, keine Secrets, keine Telemetrie oder automatische Backend-Aufrufe. Der Wert „hier live verifiziert“ bleibt bewusst **0**, bis separate und tatsächlich belegte Laufzeitnachweise vorliegen.
- `scripts/portfolio-live-readback.mjs`: Finite Zero-Cost-Quellprüfung ohne Netzwerk in der regulären PR-CI, explizite Netzprüfung mit `node scripts/portfolio-live-readback.mjs --live` oder für eine App `--live --only=nadias-bloom`. Zulässig nur öffentliche HTTPS-GET auf `pigapocket.com`, Redirect-Host-Prüfung, maximal 3 gleichzeitige Abrufe, 9s Request-Timeout, 2 MB Textlimit, HTML-MIME und titelbasierter falscher-Homepage-Schutz. Erzeugt `qa-artifacts/portfolio-live-readback.json` als technisches Proof-of-Readback-Artefakt; es darf bei Fehler nicht als PASS vermarktet werden.
- Technische `PASS`-Meldungen des Readbacks gelten **ausschließlich** für HTTP + HTML + passenden Titel. Es wird weder die Funktionsfähigkeit von PIGA Voice, Happy, Anmeldung, Stripe, App-State, Entitlements, klinischen Abläufen, Offline-Sync noch ein vollständiges E2E attestiert.
- Privates Cloudflare-Deployment muss die gemeinsamen Styles und kanonischen Dateien *separat* liefern. Public GitHub Pages ≠ Canonical-Domain. Kein automatischer öffentlicher Dateneinblick in Praxis- oder Eigentümerdaten.


## Projektweiter Standard: eine zentrale PIGA, unterschiedliche Fachprofile (26.10.2026)
Alle aktuellen und künftigen PIGA-Apps verwenden das **gleiche serverseitige, governed PIGA-Showroom-Modell** und die **gleichen fünf** Governance-Engines; der Anwendungskontext wird ausschließlich über ein geprüftes, serverseitiges Fachprofil spezialisiert. Keine private Schlüsselkopie im Client und keine sechste Engine. Referenz: `quality/piga-assistant-portfolio.v1.json`.
Die Darstellung von PIGA erfolgt mit einem ruhigen, erwachsenen, freundlichen, weiblichen Stimmprofil, sofern die Zielplattform eine passende Stimme bereitstellt. Reine Browser-Sprachsynthese kann Stimmgeschlecht nicht verifizieren. Eine sichtbare Wahl-/Fallbackmöglichkeit ist zulässig; keine Mikrofonaufnahme ohne eigenständige Nutzereinwilligung.
App-spezifische Nutzung setzt explizites Senden einer allgemeinen Frage voraus; niemals per DOM-Scraping vorhandene Patienten-, Familien-, Konto-, Einkaufs- oder Forschungsdaten automatisch übertragen. Klinische/finanzielle Auswirkungen und Geräteaktionen erfordern einen unabhängig autorisierten Gate-2-Schritt. Einzelne Texteingabefilter sind kein zuverlässiger Ersatz für Datenschutzprüfungen. Die zentrale Cloud-KI bleibt BLOCK/DELAY, solange Modellkosten, globale Kontingente, Identität/Host, Consent, Provider-Verfügbarkeit und Readback nicht tatsächlich freigegeben sind.
Für App-Reviews zählen nur **echte** Werte: `specialized_live_ui`, `generic_opt_in`, `PENDING_SOURCE_ADAPTER_REVIEW` und getrennte Backendzustände. Weder eine bereitgestellte Oberfläche noch ein Manifest ist ein Nachweis von 24/7-Worker-Verfügbarkeit. Vor Produktionsmerge: Projekt-QA, Datenschutzprüfung, mobile Browserprobe, zentrales Gate-1- und Kostenreadback, anschließend SHA-/HTTPS-Readback der konkreten Release-Version.
