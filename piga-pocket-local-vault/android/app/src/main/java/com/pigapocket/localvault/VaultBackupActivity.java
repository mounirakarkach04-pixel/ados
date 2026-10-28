package com.pigapocket.localvault;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.text.InputType;
import android.widget.Button;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;

import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;

/**
 * Owner-initiated encrypted export and authenticated data-only restore.
 * Android SAF remains responsible for choosing the external destination/file.
 * This Activity is NOT exported and has no network or remote command capability.
 */
public final class VaultBackupActivity extends Activity {
    private static final int EXPORT_ENCRYPTED = 91;
    private static final int IMPORT_ENCRYPTED = 92;
    private VaultStore store;
    private char[] pendingExportPassword;

    @Override public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        store = new VaultStore(this);
        ScrollView scroll = new ScrollView(this);
        LinearLayout page = new LinearLayout(this);
        page.setOrientation(LinearLayout.VERTICAL);
        page.setPadding(30, 44, 30, 44);
        page.setBackgroundColor(Color.rgb(15, 23, 42));
        scroll.addView(page);
        setContentView(scroll);
        label(page, "PIGA / VERSCHLUESSELTE SICHERUNG", 22);
        label(page, "AES-256-GCM, PBKDF2-HMAC-SHA256, 310.000 Iterationen. "
                + "Passwort wird nicht gespeichert. Ohne Passwort keine Wiederherstellung.", 16);
        label(page, "Sicherung immer ausserhalb der App aufbewahren; "
                + "vor einem Geraetewechsel auf einer Testinstallation pruefen.", 15);
        Button export = new Button(this);
        export.setAllCaps(false);
        export.setText("Verschluesselte Sicherung erstellen");
        export.setOnClickListener(v -> promptExportPassword());
        page.addView(export);
        Button restore = new Button(this);
        restore.setAllCaps(false);
        restore.setText("Verschluesselte Sicherung wiederherstellen");
        restore.setOnClickListener(v -> {
            Intent picker = new Intent(Intent.ACTION_OPEN_DOCUMENT);
            picker.setType("*/*");
            picker.addCategory(Intent.CATEGORY_OPENABLE);
            startActivityForResult(picker, IMPORT_ENCRYPTED);
        });
        page.addView(restore);
        label(page, "Nur Daten. Keine Befehle, Owner-Rechte oder Lizenzen werden importiert. "
                + "Bereits vorhandene Datensatz-IDs werden nicht ueberschrieben.", 14);
    }

    private void label(LinearLayout parent, String value, int size) {
        TextView view = new TextView(this);
        view.setText(value);
        view.setTextSize(size);
        view.setTextColor(Color.WHITE);
        view.setPadding(0, 16, 0, 16);
        parent.addView(view);
    }

    private EditText secretField(String hint) {
        EditText field = new EditText(this);
        field.setHint(hint);
        field.setSingleLine(true);
        field.setInputType(InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_VARIATION_PASSWORD);
        return field;
    }

    private static char[] readAndClear(EditText field) {
        int length = field.getText().length();
        char[] result = new char[length];
        for (int i = 0; i < length; i++) result[i] = field.getText().charAt(i);
        field.getText().clear();
        return result;
    }

    private void discardPendingPassword() {
        if (pendingExportPassword != null) Arrays.fill(pendingExportPassword, '\0');
        pendingExportPassword = null;
    }

    private void promptExportPassword() {
        EditText first = secretField("Sicherungspasswort (mindestens 12 Zeichen)");
        EditText second = secretField("Passwort wiederholen");
        LinearLayout fields = new LinearLayout(this);
        fields.setOrientation(LinearLayout.VERTICAL);
        fields.setPadding(20, 8, 20, 8);
        fields.addView(first);
        fields.addView(second);
        new AlertDialog.Builder(this)
                .setTitle("Sicherungspasswort festlegen")
                .setMessage("Bewahre dieses Passwort getrennt von der Datei auf.")
                .setView(fields)
                .setNegativeButton("Abbrechen", null)
                .setPositiveButton("Datei auswaehlen", (dialog, which) -> {
                    char[] a = readAndClear(first);
                    char[] b = readAndClear(second);
                    try {
                        if (a.length < 12 || a.length > 256 || !Arrays.equals(a, b)) {
                            notice("Passwort muss 12-256 Zeichen haben; beide Eingaben muessen uebereinstimmen.");
                            return;
                        }
                        discardPendingPassword();
                        pendingExportPassword = a.clone();
                        Intent picker = new Intent(Intent.ACTION_CREATE_DOCUMENT);
                        picker.setType("application/octet-stream");
                        picker.addCategory(Intent.CATEGORY_OPENABLE);
                        picker.putExtra(Intent.EXTRA_TITLE, "PIGA-Local-Vault-Backup.pigavault");
                        startActivityForResult(picker, EXPORT_ENCRYPTED);
                    } finally {
                        Arrays.fill(a, '\0');
                        Arrays.fill(b, '\0');
                    }
                }).show();
    }

    @Override protected void onActivityResult(int requestCode, int resultCode, Intent intent) {
        super.onActivityResult(requestCode, resultCode, intent);
        if (resultCode != RESULT_OK || intent == null || intent.getData() == null) {
            if (requestCode == EXPORT_ENCRYPTED) discardPendingPassword();
            return;
        }
        Uri uri = intent.getData();
        if (requestCode == EXPORT_ENCRYPTED) {
            char[] password = pendingExportPassword;
            pendingExportPassword = null;
            if (password == null) { notice("Passwort nicht verfuegbar. Bitte erneut starten."); return; }
            new Thread(() -> exportEncrypted(uri, password), "piga-vault-encrypted-export").start();
        } else if (requestCode == IMPORT_ENCRYPTED) {
            EditText field = secretField("Sicherungspasswort");
            new AlertDialog.Builder(this)
                    .setTitle("Sicherung entschluesseln")
                    .setView(field)
                    .setNegativeButton("Abbrechen", null)
                    .setPositiveButton("Pruefen und wiederherstellen", (dialog, which) -> {
                        char[] password = readAndClear(field);
                        new Thread(() -> importEncrypted(uri, password),
                                "piga-vault-encrypted-import").start();
                    }).show();
        }
    }

    private void exportEncrypted(Uri uri, char[] password) {
        byte[] plaintext = null;
        byte[] encrypted = null;
        try {
            JSONObject snapshot = new JSONObject();
            snapshot.put("schema", "piga.local-vault.export.v1");
            org.json.JSONArray items = store.exportRecords();
            if (items.length() > 1000) {
                throw new IllegalStateException("Backup has over 1000 records; chunked recovery required");
            }
            snapshot.put("records", items);
            plaintext = snapshot.toString().getBytes(StandardCharsets.UTF_8);
            encrypted = VaultBackupCrypto.encrypt(plaintext, password);
            try (OutputStream out = getContentResolver().openOutputStream(uri, "wt")) {
                if (out == null) throw new IllegalStateException("Destination not writable");
                out.write(encrypted);
                out.flush();
            }
            result("Verschluesselte Sicherung gespeichert. Passwort sicher aufbewahren.");
        } catch (Exception e) {
            result("Sicherung fehlgeschlagen: " + e.getClass().getSimpleName());
        } finally {
            Arrays.fill(password, '\0');
            if (plaintext != null) Arrays.fill(plaintext, (byte) 0);
            if (encrypted != null) Arrays.fill(encrypted, (byte) 0);
        }
    }

    private void importEncrypted(Uri uri, char[] password) {
        byte[] backup = null;
        byte[] plaintext = null;
        try {
            try (InputStream in = getContentResolver().openInputStream(uri)) {
                if (in == null) throw new IllegalStateException("Backup not readable");
                backup = readBounded(in, VaultBackupCrypto.MAX_BACKUP_BYTES);
            }
            plaintext = VaultBackupCrypto.decrypt(backup, password);
            JSONObject snapshot = new JSONObject(new String(plaintext, StandardCharsets.UTF_8));
            if (!"piga.local-vault.export.v1".equals(snapshot.optString("schema", ""))) {
                throw new SecurityException("Backup is not a data-only Local Vault export");
            }
            int added = store.importRecords(snapshot.getJSONArray("records"));
            result("Sicherung geprueft: " + added + " neue Eintraege. Bestehende Daten bleiben erhalten.");
        } catch (Exception e) {
            result("Wiederherstellung abgelehnt: Passwort falsch, Backup defekt oder inkompatibel.");
        } finally {
            Arrays.fill(password, '\0');
            if (backup != null) Arrays.fill(backup, (byte) 0);
            if (plaintext != null) Arrays.fill(plaintext, (byte) 0);
        }
    }

    private static byte[] readBounded(InputStream in, int limit) throws Exception {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        byte[] buffer = new byte[8192];
        int n;
        while ((n = in.read(buffer)) != -1) {
            if (out.size() + n > limit) throw new SecurityException("Backup too large");
            out.write(buffer, 0, n);
        }
        return out.toByteArray();
    }

    private void result(String value) { runOnUiThread(() -> notice(value)); }
    private void notice(String value) {
        if (!isFinishing()) new AlertDialog.Builder(this)
                .setMessage(value).setPositiveButton("OK", null).show();
    }

    @Override protected void onDestroy() {
        discardPendingPassword();
        if (store != null) store.close();
        super.onDestroy();
    }
}
