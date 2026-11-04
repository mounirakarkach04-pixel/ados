# PIGA ORTHO 3D · Master-Rettungsplan mit 150 nachweisbaren Schritten

**Version:** 1.0 · **Datum:** 04.11.2026 · **Status:** IN ARBEIT — KEINE MARKTREIFE / klinisches Gate 2 BLOCK
**Quelle:** `mounirakarkach04-pixel/ados`; technische Entwicklungs-PR #40; isoliertes Pages-Portal PR #41; isolierter Enterprise-Worker PR #1121.

## Abnahmeregeln

1. **Nicht mehr „PASS“ aus Commit, HTTP 200, Mock oder synthetischer Geometrie ableiten.** Ein Schritt ist PASS nur bei seinem konkret genannten realen Abnahmekriterium, mit Commit, reproduzierbarem Test und Rücklesebeleg.
2. Für jeden Schritt gelten **Befund → Ursache → kleinstmögliche Korrektur → Negativtest → Browser-/Geräte-Readback → Nachweis → Freigabestatus**. Fehlende Rechte oder klinische Evidenz: `BLOCK`, keine Umgehung.
3. Technische Produktvorschau, Plattform-Administration, medizinische Therapieplanung, Druckerbetrieb und kommerzielle Lizenzierung haben **getrennte Gates**. Erst alle erforderlichen Gates gemeinsam ergeben Marktreife.
4. **Befundklassen:** `OFFEN` (nicht überprüft), `FAIL` (reproduzierter Defekt), `DELAY` (Voraussetzung fehlt), `BLOCK` (Sicherheits-/Rechts-/Rollen-Stopp), `PASS` (mit tatsächlichem Readback belegt). Ein grüner Quelltest ist nur Teilnachweis.
5. Vorgehen: P0 (Schritte 001–060) vor P1, aber zwingende medizinische Gates (076–090, 136–150) bleiben jederzeit BLOCK bis qualifizierter Abnahme. Kein automatischer Druck oder Zugriff auf Patientendaten.

## Bestätigte Eingangs-Befunde (keine Fertigmeldung)

- Nutzer meldet, dass Registrierung, Anmeldung und 3D-Funktionen nicht nutzbar sind: **P0-Fehlerbericht, nicht durch einen Mock entkräftet**.
- Der GitHub-Pages-Portal-Entry ist öffentlich, aber die kanonische `pigapocket.com/piga-ortho-3d/portal.html`-Route war bei letzter Prüfung HTTP 404. Domain- und Versionsdrift besteht.
- Im aktuell veröffentlichten `ados/main` **fehlen** `piga-ortho-3d/movement.html` und `movement.js`, obwohl das Portal auf die Bewegungsseite verlinkt: reproduzierbarer Navigationsfehler.
- Der öffentliche GoTrue-Health-Endpunkt antwortete HTTP 200; `disable_signup=false`, E-Mail-Anmeldung eingeschaltet, automatische E-Mail-Bestätigung ausgeschaltet. Daraus folgt **nicht** dass Bestätigungs-E-Mails zugestellt werden oder die Redirect-Allowlist stimmt.
- Supabase-Authentifizierung, echte Arzt-/Mitarbeiterrechte, echtes Samsung-3D, Therapieplanung, Drucker und MDR/DSGVO sind **nicht produktiv abgenommen**.
- Veröffentlichungen und negative Tests werden in GitHub und PIGA-Governance-Drive mit Datum, Commit und echter URL dokumentiert.

## 150 Prüfschritte (alle offen bis individueller Nachweis)


### 01 · Reproduzierbare Ist-Aufnahme und Fehlerlandkarte

- [ ] **001** · **P0** · Kanonische Domain und GitHub-Pages-Vorschau getrennt erfassen. **Abnahme:** Zwei Domain-Matrizen mit HTTP-Code, Build-SHA und Gültigkeitsbereich liegen vor. **Status:** OFFEN.
- [ ] **002** · **P0** · Aktiv ausgelieferte Commits pro Host identifizieren. **Abnahme:** Live-Files stimmen mit eindeutigem Commit beziehungsweise dokumentierter Abweichung überein. **Status:** OFFEN.
- [ ] **003** · **P0** · Alle 404- und Weiterleitungsfehler inventarisieren. **Abnahme:** Jeder relevante Navigationspfad ergibt 200 oder einen begründeten FAIL-Eintrag. **Status:** OFFEN.
- [ ] **004** · **P0** · Registrierungsformular wie ein neuer Nutzer durchspielen. **Abnahme:** Klick, Browservalidierung, Request und tatsächliche Serverantwort sind protokolliert. **Status:** OFFEN.
- [ ] **005** · **P0** · Anmeldeversuch ohne gültiges Konto prüfen. **Abnahme:** Deterministische verständliche Fehlermeldung statt Stille oder Freeze. **Status:** OFFEN.
- [ ] **006** · **P0** · Passwort-zurücksetzen-Formular prüfen. **Abnahme:** Anforderung wird nachvollziehbar bestätigt, ohne Kontoexistenz offenzulegen. **Status:** OFFEN.
- [ ] **007** · **P0** · Öffentliche Supabase-Auth-Health und Einstellungen abgleichen. **Abnahme:** Providerstatus, Signup-Status und Dienstversion als Beleg erfasst. **Status:** OFFEN.
- [ ] **008** · **P0** · Auslieferung des neuen Plattformadmin-Formulars nachweisen. **Abnahme:** Formular nur auf der richtigen Portalroute, nicht im alten Auth-Dokument. **Status:** OFFEN.
- [ ] **009** · **P0** · Aktuellen Rollen-/Klinikbestand ohne personenbezogene Details zählen. **Abnahme:** Statusbericht enthält nur aggregierte bestätigte Werte. **Status:** OFFEN.
- [ ] **010** · **P0** · Studio vom Startbildschirm aus erreichen. **Abnahme:** End-to-End-Klick führt zur gültigen Studio-URL mit HTTP 200. **Status:** OFFEN.
- [ ] **011** · **P0** · Zahnbewegungslink vom Portal aus verfolgen. **Abnahme:** Bewegungsoberfläche erreichbar oder 404 als P0-FAIL mit Reparaturticket. **Status:** OFFEN.
- [ ] **012** · **P0** · Echte Browserkonsole auf Desktop und Samsung auswerten. **Abnahme:** Null ungeklärte JS-Exceptions nach definierter Interaktionsfolge. **Status:** OFFEN.
- [ ] **013** · **P0** · Fehlende JS/CSS/Bild-/WASM-Dateien protokollieren. **Abnahme:** Assetmanifest mit Hash, Statuscode und MIME-Typ vollständig. **Status:** OFFEN.
- [ ] **014** · **P0** · Horizontales Overflow und Touch-Ziele auf 360/390/412 Pixeln prüfen. **Abnahme:** Keine horizontale Überlaufkante und alle Kernaktionen berührbar. **Status:** OFFEN.
- [ ] **015** · **P0** · Baseline-Report mit Screenshots und Reproduktionsschritten einfrieren. **Abnahme:** Versionierter Prüfreport vor jeder funktionalen Reparatur vorhanden. **Status:** OFFEN.

### 02 · Registrierung, Anmeldung und E-Mail-Wiederherstellung

- [ ] **016** · **P0** · Supabase Site-URL und exakte Redirect-Allowlist verifizieren. **Abnahme:** Produktiver Callback-Pfad ist ausdrücklich erlaubt und dokumentiert. **Status:** OFFEN.
- [ ] **017** · **P0** · Signup-Anfrageformat und 12-Zeichen-Passwortregel testen. **Abnahme:** Exakte GoTrue-API-Antwort für gültige und ungültige Testeingaben nachvollziehbar. **Status:** OFFEN.
- [ ] **018** · **P0** · Registrierungsstatus nach Klick dauerhaft sichtbar halten. **Abnahme:** Weder Erfolg noch Fehler verschwinden ohne Nutzereingriff. **Status:** OFFEN.
- [ ] **019** · **P0** · Serverfehler semantisch in verständliche deutsche Meldungen übersetzen. **Abnahme:** Netzwerk, Rate Limit, 400 und 500 zeigen unterschiedliche Handlungsmöglichkeiten. **Status:** OFFEN.
- [ ] **020** · **P0** · Doppelklick auf Registrierung verhindern. **Abnahme:** Genau ein Request auch bei zehn schnellen Klicks. **Status:** OFFEN.
- [ ] **021** · **P0** · E-Mail-Adresse normalisieren und Clientfehler verständlich anzeigen. **Abnahme:** Leerzeichen, ungültiges Format, Sonderzeichen ohne Crashes. **Status:** OFFEN.
- [ ] **022** · **P0** · Passwortanforderungen vor dem Absenden einblenden. **Abnahme:** Länge und Wiederholung visuell prüfbar und konsistent. **Status:** OFFEN.
- [ ] **023** · **P0** · Bestätigungs-E-Mail mit neuem Testkonto tatsächlich empfangen. **Abnahme:** Verifizierbarer Zustellnachweis ohne Veröffentlichung persönlicher Inhalte. **Status:** OFFEN.
- [ ] **024** · **P0** · Signup-Bestätigungslink auf richtige Portalroute führen. **Abnahme:** Kein Sprung zur Dashboard-/fremden Auth-Seite. **Status:** OFFEN.
- [ ] **025** · **P0** · Abgelaufene Bestätigungslinks sicher behandeln. **Abnahme:** Lesbare Fehlerausgabe und legitimer Wiederholungsweg. **Status:** OFFEN.
- [ ] **026** · **P0** · Bereits existierende Konten datenschutzfreundlich behandeln. **Abnahme:** Keine Enumeration durch unterschiedliche öffentlich sichtbare Antworten. **Status:** OFFEN.
- [ ] **027** · **P0** · Login mit bestätigtem Testkonto belegen. **Abnahme:** Auth gibt nachweislich Session und verifizierten User zurück. **Status:** OFFEN.
- [ ] **028** · **P0** · Password-Recovery-Link und Passwortwechsel Ende-zu-Ende prüfen. **Abnahme:** Neues Passwort funktioniert, altes wird gesperrt. **Status:** OFFEN.
- [ ] **029** · **P0** · Session-Ablauf, Refresh und Abmeldung fail-closed testen. **Abnahme:** Token-Wechsel ohne Doppelrequests; nach Logout null aktive UI-Rechte. **Status:** OFFEN.
- [ ] **030** · **P0** · Echten Owner-Login mit Einwilligung und Rückleseprotokoll abnehmen. **Abnahme:** Owner bestätigt eigene Anmeldung; keine KI übernimmt fremde Identität. **Status:** OFFEN.

### 03 · Plattformadmin, Arzt, Mitarbeiter und Datensicherheit

- [ ] **031** · **P0** · Plattformadmin von Praxisleitung und Arztrollen technisch trennen. **Abnahme:** Admin hat ohne Praxismitgliedschaft keine klinischen Aufgaben. **Status:** OFFEN.
- [ ] **032** · **P0** · Private Vorfreigabe auf verifizierte E-Mail festlegen. **Abnahme:** Nur genehmigter Empfänger kann Einladung claimen. **Status:** OFFEN.
- [ ] **033** · **P0** · One-Time-Admin-Code gegen Replay und Ablauf testen. **Abnahme:** Zweites Claim, falsche E-Mail und abgelaufener Code BLOCK. **Status:** OFFEN.
- [ ] **034** · **P0** · Noch nicht bestätigte Konten von jedem privilegierten RPC ausschließen. **Abnahme:** Unbestätigtes Auth-UID erhält null Zugriff. **Status:** OFFEN.
- [ ] **035** · **P0** · Anonymer Zugriff auf Praxis-RPCs prüfen. **Abnahme:** HTTP 401/403 beziehungsweise sicherer Leerzustand. **Status:** OFFEN.
- [ ] **036** · **P0** · Supabase-RLS für jede Klinik-Datentabelle inventarisieren. **Abnahme:** RLS und passende Policies je Tabelle dokumentiert. **Status:** OFFEN.
- [ ] **037** · **P0** · Ärztliche Qualifikation unabhängig vom UI-Rollenlabel nachweisen. **Abnahme:** Selbstdeklaration allein aktiviert keine medizinische Freigabe. **Status:** OFFEN.
- [ ] **038** · **P0** · Praxis-Owner-Einladung mit gültiger Lizenz verknüpfen. **Abnahme:** Nur genehmigte Mitgliedschaft erscheint im Praxisselector. **Status:** OFFEN.
- [ ] **039** · **P0** · Mitarbeiter-Einladungen ablaufend und einmalig machen. **Abnahme:** Einladung nur für E-Mail, Klinik und passende Rolle gültig. **Status:** OFFEN.
- [ ] **040** · **P0** · Buchhaltung strikt vom klinischen Arbeitsbereich trennen. **Abnahme:** Keine Patienten- oder STL-Daten über Buchhaltungsrolle abrufbar. **Status:** OFFEN.
- [ ] **041** · **P0** · Klinikwechsel und parallele Requests gegen Race Conditions prüfen. **Abnahme:** Alte Klinikdaten erscheinen nach Wechsel nie. **Status:** OFFEN.
- [ ] **042** · **P0** · Admin- und Mitarbeiter-Sitzungsabmeldung serverseitig rückprüfen. **Abnahme:** Nach Signout alle sensiblen APIs verweigern Zugriff. **Status:** OFFEN.
- [ ] **043** · **P0** · Passwort- und Tokenfunde aus DOM/Logs ausschließen. **Abnahme:** Kein Secret, Refresh-Token oder PHI in Browser-/CI-Logs. **Status:** OFFEN.
- [ ] **044** · **P0** · Audit-Ereignisse für Einladungen, Rollenwechsel und Freigaben prüfen. **Abnahme:** Ereignisse unveränderlich und der handelnden Auth-Identität zuordenbar. **Status:** OFFEN.
- [ ] **045** · **P0** · Praxis-Abnahme mit getrennten Testprofilen abschließen. **Abnahme:** Admin, Arzt, Angestellte und Buchhaltung bestehen Rechte-Matrix. **Status:** OFFEN.

### 04 · 3D-Navigation, Import und Eingangsdaten

- [ ] **046** · **P0** · 3D-Bewegungsoberfläche im richtigen Auslieferungszweig bereitstellen. **Abnahme:** /movement.html liefert 200, erforderliche Skripte laden. **Status:** OFFEN.
- [ ] **047** · **P0** · Studio/Bewegung/Dashboard verlinken ohne tote Ziele. **Abnahme:** Jeder Button verweist auf existierendes, freigegebenes Ziel. **Status:** OFFEN.
- [ ] **048** · **P0** · 3D-Einstieg mit sichtbarer Anleitung statt leerer Fläche gestalten. **Abnahme:** Neuer Nutzer erkennt Demo, Upload und Prüfstatus. **Status:** OFFEN.
- [ ] **049** · **P0** · STL-Upload über Android-Dateiauswahl ausführen. **Abnahme:** Gewählte Datei öffnet reproduzierbar und ohne Freeze. **Status:** OFFEN.
- [ ] **050** · **P0** · Binäres und ASCII-STL sauber unterscheiden. **Abnahme:** Diverse gültige STL-Formate werden korrekt erkannt. **Status:** OFFEN.
- [ ] **051** · **P0** · Falsche Dateiendungen und MIME-Typen blockieren. **Abnahme:** Nicht-STL wird mit lesbarer Begründung abgelehnt. **Status:** OFFEN.
- [ ] **052** · **P0** · Maximale Dateigröße und Vertexgrenzen festlegen. **Abnahme:** Überlimit-Dateien werden vor GPU-Upload gestoppt. **Status:** OFFEN.
- [ ] **053** · **P0** · NaN, Infinity und extrem große Koordinaten ablehnen. **Abnahme:** Keine instabilen Bounds oder Buffer-Zuweisungen. **Status:** OFFEN.
- [ ] **054** · **P0** · Zahnschema FDI 11–48 konsistent visualisieren. **Abnahme:** Zahnnummern und Kieferzuordnung prüfbar. **Status:** OFFEN.
- [ ] **055** · **P0** · Ober-/Unterkiefer-Import getrennt prüfen. **Abnahme:** Kiefer bleiben unterscheidbar und korrekt registrierungsbedürftig. **Status:** OFFEN.
- [ ] **056** · **P0** · Längeneinheit Millimeter explizit bestätigen lassen. **Abnahme:** Keine implizite Skalierung ohne überprüfbare Referenz. **Status:** OFFEN.
- [ ] **057** · **P0** · Segmentierungs-Selbstprüfung als Gate integrieren. **Abnahme:** Falsche oder fehlende Segmentgrenze führt zu BLOCK. **Status:** OFFEN.
- [ ] **058** · **P0** · STL-Bounding-Box und Orientierung protokollieren. **Abnahme:** Messwerte reproduzierbar nach erneutem Import. **Status:** OFFEN.
- [ ] **059** · **P0** · Undo/Reset beim Import verifizieren. **Abnahme:** Modell kann ohne Seitenneuladen in sauberen Zustand zurück. **Status:** OFFEN.
- [ ] **060** · **P0** · Synthetische Demo von echten Patientendaten sichtbar trennen. **Abnahme:** Vorschau ist eindeutig nicht klinisch freigegeben. **Status:** OFFEN.

### 05 · 3D-Viewer, Gesten und geometrische Korrektheit

- [ ] **061** · **P1** · WebGL2/WebGL1/Canvas2D-Fähigkeiten pro Gerät messen. **Abnahme:** Viewer wählt verfügbaren Renderpfad mit dokumentiertem Fallback. **Status:** OFFEN.
- [ ] **062** · **P1** · Sichtbares Testgebiss im realen Browser tatsächlich rendern. **Abnahme:** Pixelsignatur oder Snapshot unterscheidet sich nach Modellauswahl. **Status:** OFFEN.
- [ ] **063** · **P1** · Touch-Rotation auf Samsung testen. **Abnahme:** Wischen rotiert ohne Seiten-Scroll-Konflikt. **Status:** OFFEN.
- [ ] **064** · **P1** · Pinch-Zoom und Mausrad begrenzen. **Abnahme:** Zoom bleibt in sichtbaren Sicherheitsgrenzen. **Status:** OFFEN.
- [ ] **065** · **P1** · Kamera-Zentrierung und Reset bedienbar machen. **Abnahme:** Nach Reset entspricht die Ansicht dem Ausgangszustand. **Status:** OFFEN.
- [ ] **066** · **P1** · WebGL-Kontextverlust reproduzieren und abfangen. **Abnahme:** Viewer kann neu initialisieren oder bietet sichtbaren 2D-Fallback. **Status:** OFFEN.
- [ ] **067** · **P1** · Render-Schleife beim Tabwechsel pausieren. **Abnahme:** Keine ungebremste CPU/GPU-Last im Hintergrund. **Status:** OFFEN.
- [ ] **068** · **P1** · Zahnauswahl per Tippen und Tastatur testen. **Abnahme:** Zahnnummer und Selektion synchron. **Status:** OFFEN.
- [ ] **069** · **P1** · Anatomische Oberflächen korrekt schattieren. **Abnahme:** Normals/Beleuchtung liefern nachvollziehbare Geometrie. **Status:** OFFEN.
- [ ] **070** · **P1** · Gleiche STL auf mehreren Geräten vergleichen. **Abnahme:** Bounds und Topologiekennzahlen bleiben identisch. **Status:** OFFEN.
- [ ] **071** · **P1** · Kamera und Tiefenpuffer bei großen Modellen prüfen. **Abnahme:** Keine Flackereffekte, Clipping oder verdeckte Kontrollen. **Status:** OFFEN.
- [ ] **072** · **P1** · Vertex-/Indexbuffer begrenzen und freigeben. **Abnahme:** Nach Modellwechsel keine stetig steigende GPU-Speichernutzung. **Status:** OFFEN.
- [ ] **073** · **P1** · 3D-Ergebnis nicht mit synthetischen Deko-Elementen verwechseln. **Abnahme:** UI kennzeichnet Demo/Analyse/Originalmodell getrennt. **Status:** OFFEN.
- [ ] **074** · **P1** · Wurzel-/Knocheninformationen nur mit Quelle anzeigen. **Abnahme:** Fehlende DICOM-/CBCT-Daten sind UNKNOWN statt erfunden. **Status:** OFFEN.
- [ ] **075** · **P1** · Samsung-Funktionstest mit 3D-Drehung vollständig abnehmen. **Abnahme:** Upload, Drehung, Zoom, Reset und Export real am Gerät PASS. **Status:** OFFEN.

### 06 · Zahnbewegungen, Staging, 3MF/STL und Druck

- [ ] **076** · **P1** · Sechs Freiheitsgrade pro Zahn mathematisch gegenprüfen. **Abnahme:** Translationen/Rotationen entsprechen Referenzvektoren. **Status:** OFFEN.
- [ ] **077** · **P1** · Rotationsebenen und Koordinatensysteme dokumentieren. **Abnahme:** Kiefer-/Welt-/Zahnlokalachsen widerspruchsfrei. **Status:** OFFEN.
- [ ] **078** · **P1** · Stufen 1–40 mit exakt reproduzierbarer Interpolation prüfen. **Abnahme:** Erste/letzte Stufe und 3 Zwischenschritte stimmen überein. **Status:** OFFEN.
- [ ] **079** · **P1** · Rundungs- und Numerikfehler beim Staging isolieren. **Abnahme:** Kein unbeabsichtigter Reset oder Sprung. **Status:** OFFEN.
- [ ] **080** · **P1** · Unzulässige Bewegungsgrößen als klinisch unvalidiert kennzeichnen. **Abnahme:** Keine algorithmische Therapieempfehlung aus bloßer Geometrie. **Status:** OFFEN.
- [ ] **081** · **P1** · Kollisionen und Selbstüberschneidungen technisch erkennen. **Abnahme:** Bekannte Negativgeometrie erhält FAIL/BLOCK. **Status:** OFFEN.
- [ ] **082** · **P1** · Watertight- und Nonmanifold-Prüfungen je Mesh ausführen. **Abnahme:** Deterministische Topologieberichterstattung. **Status:** OFFEN.
- [ ] **083** · **P1** · Exportiertes STL erneut einlesen und vergleichen. **Abnahme:** Vertexanzahl, Bounds und Maße innerhalb Toleranz. **Status:** OFFEN.
- [ ] **084** · **P1** · 3MF OPC/ZIP-Struktur formal validieren. **Abnahme:** Pflichtbestandteile, XML, ZIP-Signaturen fehlerfrei. **Status:** OFFEN.
- [ ] **085** · **P1** · 3MF-Reimport mit externem Slicer prüfen. **Abnahme:** Datei wird fehlerfrei geöffnet, ohne Druckfreigabe. **Status:** OFFEN.
- [ ] **086** · **P1** · Druckorientierung, Basis und Maßstab prüfen. **Abnahme:** Druckprofil dokumentiert und reproduzierbar. **Status:** OFFEN.
- [ ] **087** · **P1** · Material/Schrumpf/Aushärtung als Geräteparameter trennen. **Abnahme:** Kein stilles Standardprofil für reale Patienten. **Status:** OFFEN.
- [ ] **088** · **P1** · Druck-Download nur nach einzelnem Kontrollhäkchen freigeben. **Abnahme:** Vier aktuelle Einwilligungen und Hash passen zur Datei. **Status:** OFFEN.
- [ ] **089** · **P1** · Reale Druckersteuerung bis gesonderter Abnahme deaktivieren. **Abnahme:** Kein Druckauftrag oder G-Code ohne Freigabekette. **Status:** OFFEN.
- [ ] **090** · **P1** · Physisches Testmodell und Maßhaltigkeit unabhängig validieren. **Abnahme:** Protokolliertes Probestück und Messabweichungen geprüft. **Status:** OFFEN.

### 07 · Praxisabläufe, Aufgaben, Benachrichtigungen und Rollen

- [ ] **091** · **P1** · Praxis-Onboarding für Owner schrittweise gestalten. **Abnahme:** Einladungsstand, Bestätigungen und fehlende Rechte sichtbar. **Status:** OFFEN.
- [ ] **092** · **P1** · Praxis-Mitarbeiterlisten pro Klinik korrekt filtern. **Abnahme:** Nur zugeordnete Personen erscheinen. **Status:** OFFEN.
- [ ] **093** · **P1** · Klinische Prüffälle ohne Patientenechtdaten anlegen. **Abnahme:** Synthetischer Prüffall wird korrekt gespeichert und gelesen. **Status:** OFFEN.
- [ ] **094** · **P1** · Zehn Pflichtprüfschritte als klare Checkliste abbilden. **Abnahme:** Jeder Schritt mit Urheber, Zeit und Stand. **Status:** OFFEN.
- [ ] **095** · **P1** · Abhakfunktion gegen Doppeltippen und Race Conditions schützen. **Abnahme:** Eine Aktion erzeugt genau einen dokumentierten Zustandswechsel. **Status:** OFFEN.
- [ ] **096** · **P1** · Popup-Hinweise mit persistiertem Readback statt Schein-PASS erzeugen. **Abnahme:** Bestätigung erscheint erst nach Backend-ACK. **Status:** OFFEN.
- [ ] **097** · **P1** · Unbearbeitete Pflichtaufgaben priorisiert anzeigen. **Abnahme:** Kritische Aufgaben in passender Reihenfolge. **Status:** OFFEN.
- [ ] **098** · **P1** · Wiedervorlagen und Erinnerungen nur mit Nutzerfreigabe aktivieren. **Abnahme:** Opt-in plus expliziter Widerruf funktioniert. **Status:** OFFEN.
- [ ] **099** · **P1** · Mitarbeiter-Berechtigungen für Kontroll- und Abschlussaktionen testen. **Abnahme:** Mitarbeiter kann nicht ärztlich finalisieren. **Status:** OFFEN.
- [ ] **100** · **P1** · Ärztliche Kontrolle mit Identitätsnachweis schützen. **Abnahme:** Nur unabhängig berechtigter Behandler kann final freigeben. **Status:** OFFEN.
- [ ] **101** · **P1** · Buchhaltung und Einkaufskosten getrennt behandeln. **Abnahme:** Keine klinischen Details bei Finanzsicht. **Status:** OFFEN.
- [ ] **102** · **P1** · Inventur- und Lagerbuchungen gegen Doppelbestände absichern. **Abnahme:** Soll-/Ist-Summen und Verlauf stimmen. **Status:** OFFEN.
- [ ] **103** · **P1** · Import/Export von Praxislisten datenschutzgerecht testen. **Abnahme:** CSV/JSON nur für berechtigte Rollen, sichere Felder. **Status:** OFFEN.
- [ ] **104** · **P1** · Historie/Protokolle nachvollziehbar und lesbar gestalten. **Abnahme:** Readback mit Version, Status und Urheber. **Status:** OFFEN.
- [ ] **105** · **P1** · Praxisleitung und Mitarbeiter nehmen einen vollständigen Fall ab. **Abnahme:** Zwei getrennte Konten, zehn Schritte, kein unzulässiger Rollenwechsel. **Status:** OFFEN.

### 08 · PIGA-Design, mobile UX und barrierearme Bedienung

- [ ] **106** · **P1** · PIGA-Design-Tokens für Farbe, Typografie, Abstände definieren. **Abnahme:** Einheitliches Designsystem ohne widersprüchliche Stildefinitionen. **Status:** OFFEN.
- [ ] **107** · **P1** · Primäre Produktnavigation neu ordnen. **Abnahme:** Maximal fünf erkennbare Hauptziele und funktionierende Rückwege. **Status:** OFFEN.
- [ ] **108** · **P1** · Anmeldeseite als verständlichen ersten Einstieg gestalten. **Abnahme:** Registrieren, Login, Hilfe und Status ohne Scrollfalle. **Status:** OFFEN.
- [ ] **109** · **P1** · 3D-Arbeitsbereich in Fokusansicht aufteilen. **Abnahme:** Modellansicht, Prüfstatus und Werkzeugleiste klar getrennt. **Status:** OFFEN.
- [ ] **110** · **P1** · Professionelle Zahnarzt-/Praxisansicht gestalten. **Abnahme:** Rollenrelevante Aktionen ohne unnötige Panels. **Status:** OFFEN.
- [ ] **111** · **P1** · Mitarbeiteransicht auf nächste Aufgabe ausrichten. **Abnahme:** Keine irrelevanten Admin- und Finanzschaltflächen. **Status:** OFFEN.
- [ ] **112** · **P1** · Abhak- und Warnmeldungen farblich und textlich unterscheiden. **Abnahme:** PASS/DELAY/BLOCK/UNKNOWN auch ohne Farbe unterscheidbar. **Status:** OFFEN.
- [ ] **113** · **P1** · PIGA-Glassbox-Evidenzpanel gut lesbar machen. **Abnahme:** Jede technische Aussage hat Quelle, Zeitstempel und Status. **Status:** OFFEN.
- [ ] **114** · **P1** · Konsistente Schaltflächen- und Formularzustände herstellen. **Abnahme:** Hover/Focus/Disabled/Loading/Error vorhanden. **Status:** OFFEN.
- [ ] **115** · **P1** · Mobile Touch-Ziele mindestens 44 Pixel gestalten. **Abnahme:** Mit Finger zuverlässig auslösbar. **Status:** OFFEN.
- [ ] **116** · **P1** · Kontrast und Tastaturfokus gemäß WCAG prüfen. **Abnahme:** Wichtige Texte/Interaktionen bestehen Kontrast- und Fokus-Test. **Status:** OFFEN.
- [ ] **117** · **P1** · Modale Dialoge mit Fokusfalle und Esc korrigieren. **Abnahme:** Keine eingefrorene oder unerreichbare Oberfläche. **Status:** OFFEN.
- [ ] **118** · **P1** · Leere Zustände und fehlende Berechtigungen verständlich erklären. **Abnahme:** Nutzer sieht konkrete nächste Handlung. **Status:** OFFEN.
- [ ] **119** · **P1** · Hilfen für STL-Format, Einheiten und Demo ergänzen. **Abnahme:** Erstnutzer schafft synthetischen Import ohne externe Anleitung. **Status:** OFFEN.
- [ ] **120** · **P1** · UI-Praxistest mit Arzt, Mitarbeiter und Admin getrennt abnehmen. **Abnahme:** Kernaufgaben ohne unverständliche Klickwege abgeschlossen. **Status:** OFFEN.

### 09 · Stabilität, Offline, Datenschutz, Tests und Qualität

- [ ] **121** · **P1** · Service-Worker-Assetliste mit tatsächlichem Deploy vergleichen. **Abnahme:** Keine alten/offline 404-Pfade im Pflichtcache. **Status:** OFFEN.
- [ ] **122** · **P1** · Stale Cache nach Release kontrolliert ersetzen. **Abnahme:** Nach Update sichtbarer Versionswechsel ohne Datenverlust. **Status:** OFFEN.
- [ ] **123** · **P1** · Keine sensiblen Kontodaten im Offline-Cache halten. **Abnahme:** Token, Patientenakte und Passwort niemals Cache Storage. **Status:** OFFEN.
- [ ] **124** · **P1** · Netzwerkausfall während Anmeldung sicher behandeln. **Abnahme:** DELAY statt endloser Ladeanimation. **Status:** OFFEN.
- [ ] **125** · **P1** · Netzwerkausfall während 3D-Import abfangen. **Abnahme:** Lokal ausgewählte Datei bleibt nutzbar oder wird sicher verworfen. **Status:** OFFEN.
- [ ] **126** · **P1** · Geräte-Tabwechsel und Android-Sleep testen. **Abnahme:** Korrekte Fortsetzung ohne Doppelaktion. **Status:** OFFEN.
- [ ] **127** · **P1** · Gerätespeicher-/GPU-Limits systematisch prüfen. **Abnahme:** Speicherzuwachs im definierten Budget. **Status:** OFFEN.
- [ ] **128** · **P1** · Mehrfachaufrufe aus Benachrichtigungen deduplizieren. **Abnahme:** Höchstens eine erfolgreiche Zustandsänderung. **Status:** OFFEN.
- [ ] **129** · **P1** · RLS-Sicherheits- und Supabase-Linter erneut ausführen. **Abnahme:** Keine kritische unbehobene Schwachstelle für Ortho. **Status:** OFFEN.
- [ ] **130** · **P1** · Abhängigkeiten und API-Versionen auf aktuelle Kompatibilität prüfen. **Abnahme:** Fixierte Versionen und reproduzierbarer Build. **Status:** OFFEN.
- [ ] **131** · **P1** · Automatisierte Negativtests für Auth/Bewegung/Print erweitern. **Abnahme:** Alle definierten BLOCK-Fälle werden deterministisch erkannt. **Status:** OFFEN.
- [ ] **132** · **P1** · Synthetische Browser-End-to-End-Fälle mit Real-API-Grenze markieren. **Abnahme:** Simulierte PASS nicht als Live-Identität freigeben. **Status:** OFFEN.
- [ ] **133** · **P1** · Lighthouse-/Performance-Budget für mobil festlegen. **Abnahme:** Startzeit, Größenlimits und Layoutverschiebung gemessen. **Status:** OFFEN.
- [ ] **134** · **P1** · Cross-Browser-Test Chrome/Edge/Android Samsung durchführen. **Abnahme:** Alle Kernaktionen mit Testmatrix wiederholbar. **Status:** OFFEN.
- [ ] **135** · **P1** · CI, Build, Hashes, Screenshots und Drive-Readback versionieren. **Abnahme:** Beweiskette aus Commit, Test, Resultat und Datum vollständig. **Status:** OFFEN.

### 10 · Recht, Kommerz, Rollout und endgültige Freigabe

- [ ] **136** · **P0/REG** · Funktionen als Forschungsdemo, Praxisverwaltung oder Medizinprodukt klassifizieren. **Abnahme:** Rechts-/Zweckbestimmung für jede Funktion dokumentiert. **Status:** OFFEN.
- [ ] **137** · **P0/REG** · EU-MDR/DSGVO/AI-Act-Anforderungen fachlich bewerten lassen. **Abnahme:** Rechtliche/klinische Lückenliste mit Verantwortlichen. **Status:** OFFEN.
- [ ] **138** · **P0/REG** · Sicherheits- und Risikomanagement inkl. VBR dokumentieren. **Abnahme:** Risiken, Schutzmaßnahmen und Restrestrisiken erfasst. **Status:** OFFEN.
- [ ] **139** · **P0/REG** · Klinische Validierung und medizinische Verantwortlichkeit definieren. **Abnahme:** Ärztliche Unterschrift nur nach externer Evidenz. **Status:** OFFEN.
- [ ] **140** · **P0/REG** · Verarbeitung und Speicherung personenbezogener Daten prüfen. **Abnahme:** Datenfluss, Rollen, Rechtsgrundlage und Löschung dokumentiert. **Status:** OFFEN.
- [ ] **141** · **P0/REG** · Datenverarbeitung/Verträge und Aufbewahrungsfristen klären. **Abnahme:** Erforderliche Dokumente vor Patienteneinsatz freigegeben. **Status:** OFFEN.
- [ ] **142** · **P0/REG** · Lizenzpreis 12.000 €/Jahr und Leistungsumfang eindeutig ausweisen. **Abnahme:** Vertrags-, Steuer- und Funktionsumfang konsistent. **Status:** OFFEN.
- [ ] **143** · **P0/REG** · Stripe-/Zahlungs- und Lizenzfreischaltung isoliert testen. **Abnahme:** Testzahlung und Rückerstattung ohne Umgehung klinischer Gates. **Status:** OFFEN.
- [ ] **144** · **P0/REG** · Test- und Vertriebsversion deutlich voneinander trennen. **Abnahme:** Keine klinische oder kommerzielle Funktion nur wegen Demo freigeschaltet. **Status:** OFFEN.
- [ ] **145** · **P0/REG** · Produktionsdomain gegen technische Vorschau abgleichen. **Abnahme:** Canonical/PWA/Pages gleiche freigegebene Versions-ID oder klare Trennung. **Status:** OFFEN.
- [ ] **146** · **P0/REG** · Release-Checkliste mit fachlicher Unterschrift etablieren. **Abnahme:** Kein Merge/Deploy ohne alle P0-PASS und Owner-Freigabe. **Status:** OFFEN.
- [ ] **147** · **P0/REG** · Kontrollierten Rollout mit Readback und Rollback testen. **Abnahme:** Gesunde Rücknahme ohne Verlust vorhandener Nutzerdaten. **Status:** OFFEN.
- [ ] **148** · **P0/REG** · Onboarding-, Hilfetexte, Datenschutz und Support bereitstellen. **Abnahme:** Kunden finden Erklärung und schriftliche Kontaktwege. **Status:** OFFEN.
- [ ] **149** · **P0/REG** · Zwei reale Praxistestläufe unter geeigneter Aufsicht dokumentieren. **Abnahme:** Akzeptanzbericht von berechtigter Praxisleitung. **Status:** OFFEN.
- [ ] **150** · **P0/REG** · Abschließendes PIGA-Gate 1/2 mit PASS/DELAY/BLOCK/UNKNOWN entscheiden. **Abnahme:** Marktreif nur bei Technik, Identität, Klinik, Datenschutz und Druckfreigaben. **Status:** OFFEN.

## Fortlaufendes Test- und Entscheidungsprotokoll

| Datum / Commit | Schritt(e) | Reproduzierter Befund | Echte Korrektur | Live-/Geräte-Nachweis | Status |
|---|---:|---|---|---|---|
| 04.11.2026 / Baseline | 001–150 | Ausgangs-Inventur läuft; 3D-Bewegungslink 404; Auth- und 3D-Nutzerbeschwerden offen | Isolierter Reparaturzweig | Kein globaler E2E-PASS | IN ARBEIT |

**PIGA-Regel für künftige Zyklen:** Ohne mindestens einen reproduzierten Anwenderfall und den bestandenen Nachtest folgt keine Abschlussbehauptung. Alle Änderungen werden einzeln belegt und mit Sicherheits-Gates freigegeben.
