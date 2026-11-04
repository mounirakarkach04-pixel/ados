# PIGA ORTHO 3D · Authentifizierung / E-Mail-Bestätigung / Praxisrollen – Gate-Review

Stand: 04.11.2026. **STATUS: PASS_SOURCE + PASS_LOCAL_NEGATIVE, ACCOUNT=DELAY, CLINICAL=BLOCK.**

## Bestätigte technische Befunde (ohne Zugriff auf persönliche Passwörter)
- Das Backend-Projekt `sanrkcovmkkhgdqydxfk` ist aktiv. `GET /auth/v1/settings` meldet `disable_signup=false`, `external.email=true` und `mailer_autoconfirm=false`: E-Mail-Registrierungen sind grundsätzlich erlaubt, aber eine Bestätigung ist nötig.
- `public.ortho_clinic_my_access()` und `public.ortho_platform_claim_admin(p_code text)` existieren. Die Praxiszugehörigkeit hängt zusätzlich von aktivem, lizenziertem Klinikstatus und bestätigter E-Mail ab; ein registriertes Konto allein ist **keine** klinische Freigabe.
- Öffentliche Callback-Datei `https://mounirakarkach04-pixel.github.io/ados/piga-ortho-3d/portal-auth.html`: **HTTP 200**. Zweiter Host `https://pigapocket.com/piga-ortho-3d/portal-auth.html`: **HTTP 404**. Deshalb **keine Gleichsetzung** der beiden Deployments.
- Die Auth-URL-Konfiguration `SITE_URL`, die `redirect_to`-Allowlist und die tatsächlichen E-Mail-Templates konnten mit den bereitgestellten Leserechten **nicht** ausgelesen werden. Es ist somit weder bewiesen, dass Redirects korrekt autorisiert sind, noch dass die E-Mails zugestellt werden.
- Ein gültiger Auth-Login kann im bisherigen Frontend fälschlich als fehlgeschlagen wirken, wenn **danach** die Lizenz-/Praxis-RPC scheitert. Source-Fix in diesem Review-Zweig trennt Login von Rollen- und Lizenzprüfung, sperrt bei fehlender Evidenz alle Praxis-/Adminfunktionen und verhindert eine irreführend fortbestehende Session nach 401.

## A7SEM Reverse BEFORE BUILD
**Ziel:** Ein bestätigter Eigentümer-Login ist erkennbar, ohne unbestätigte Praxis-/Arzt-/Adminrechte zu behaupten.

**Earliest Admissibility Divergence (EAD):** Bisheriges `Promise.all` im clientseitigen `loadAccess()`, welches bei Praxis-RPC-Ausfall eine Ausnahme bis zum Login-Fehlerhandler auslöst. Der reale Auth-Token kann dabei korrekt sein, die klinische Berechtigung aber unprüfbar.

**Gegenbeispiele:** Auth 401; Lizenz-RPC 503; Admin-RLS 403; keine aktive Klinik; unbestätigte E-Mail; abgelaufener Wiederherstellungslink; falscher Redirect-Host.

## Implementierung – nur Review-/Source-Freigabe
- `Promise.allSettled` für **getrennte** Lizenz- und Administrationsabfragen. Technische RPC-Ausfälle zeigen beim bestätigten Nutzer `DELAY`, nicht `Passwort falsch`.
- Vor dem asynchronen Rollencheck: klinischer Workspace verborgen, Adminzugang verborgen und lokale Rolle/Klinik zurückgesetzt.
- Kein Arzt-/Adminrecht aufgrund von erfolgreichen HTTP-200-Anmeldungen.
- Unbekannter Adminstatus führt zu gesperrter Admin-Code-Eingabe, bis Serverstatus überprüfbar ist.
- Auth-/User-Token 401 → nicht bestätigte Sitzung im UI verworfen; verständliche deutschsprachige Meldung.
- Kein neuer API-Key, keine Tokenpersistenz, keine RLS-/Supabase-Schema-Änderung, kein Login für echte Nutzer ausgelöst.

## Separater Supabase-URL- und E-Mail-Gatecheck
Die autorisierte Person mit Supabase-Auth-Managementrechten muss **zuerst read-only** in *Authentication → URL Configuration* und unter *Authentication → Email Templates* prüfen:

1. Der aktuell tatsächlich veröffentlichte Pages-Callback muss **exakt** als erlaubte Redirect-URL hinterlegt sein: `https://mounirakarkach04-pixel.github.io/ados/piga-ortho-3d/portal-auth.html`. Keine pauschale Stern-Wildcard; vorhandene andere erlaubte PIGA-Apps nicht löschen.
2. Der kanonische `pigapocket.com`-Callback ist derzeit HTTP 404. **Nicht als funktionierenden Rücksprung freigeben**, bis die Route wirklich live und gesondert geprüft ist.
3. `SITE_URL` ist eine **projektweite Einstellung**; bei diesem von mehreren PIGA-Apps genutzten Backend niemals ohne Auswirkungsanalyse global umstellen.
4. Eigene E-Mail-Templates dürfen nicht blind `{{ .SiteURL }}` verwenden, wenn der Pfad den gewählten `redirect_to` überschreibt. Die dokumentierten Platzhalter `{{ .ConfirmationURL }}` bzw. `{{ .RedirectTo }}` sind gegen die reale Template-Struktur zu prüfen.
5. Nach rechtmäßiger Einstellung: genau **eine** kontrollierte Registrierung mit einem tatsächlich zugehörigen Test-Postfach und explizitem Einverständnis; echte Zustellung, Ablauf/Negativlink, Rücksprung ohne Tokenleak, E-Mail-Bestätigung, Anmeldung, getrennte Praxisfreigabe und Logout protokollieren. **Keine Testkonto-Massenanlage oder Ratenlimit-Umgehung.**

Referenz: Supabase-Dokumentation `https://supabase.com/docs/guides/auth/redirect-urls` und `https://supabase.com/docs/guides/auth/auth-email-templates`.

## A7SEM Reverse AFTER RESULT – Abnahmegrenzen
- Node-Regressionen für Statusseparation, fail-closed Admin/Clinic und Sitzung: **PASS_SOURCE**.
- Browser-Negativfälle mit ausschließlich synthetischen lokalen CORS/API-Antworten (Auth 401, Lizenz 503, Admin 503, leere Mitgliedschaft): **PASS_LOCAL_NEGATIVE**, ausdrücklich **nicht** PASS_ACCOUNT.
- Echter Supabase-User-Login, echte E-Mail, Redirect-Allowlist und Samsung: **DELAY/UNKNOWN**.
- Klinik, Patientenbehandlung, Drucker- und Medizinproduktwirkung: **Gate 2 BLOCK**.
- Vollständiger Produktiv-Merge/öffentliche Aktualisierung: bedarf eigenständiger Freigabe und öffentlichem Readback; dieser Zweig darf als Draft-PR geprüft werden.

**Verknüpfungen:** PIGA ORTHO 150-Schritte-Masterplan, bestehender Draft-Einstiegs-PR #46. Beide Maßnahmen müssen vor einer Veröffentlichung in einer getesteten, eindeutigen Version zusammengeführt werden, statt den Demo-Einstieg oder die Auth-Logik zu überschreiben.
