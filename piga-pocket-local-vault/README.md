# PIGA Local Vault (Android, separate preview)

Standalone **minimal** local-first Android companion, package `com.pigapocket.localvault`. It **never** replaces the signed paired `com.pigapocket.bridge`, and does not import any private source from the private PIGA project.

- Private SQLite storage, app-scoped.
- AES-256-GCM AndroidKeyStore encryption of each imported JSON record.
- Owner-initiated JSON import and explicit, warned plaintext JSON export.
- No network permission, cloud sync, worker autonomy, Gate-2 authorization, APK silent installation, Supabase migration or signed bridge messaging.
- Do **not** clear this app's data or uninstall before exporting: hardware-bound encryption key is not transferable.
- Debug-signed preview is **not** an update of the original paired PIGA app and is not production-ready.
- The public GitHub runner builds a separate APK as a prerelease to avoid private GitHub Actions minute/storage quota. No private code, credentials or business data is included.

Published APK package: `com.pigapocket.localvault`.
