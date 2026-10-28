package com.pigapocket.localvault;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.view.View;
import android.view.WindowInsets;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;

public final class MainActivity extends Activity {
    private static final int IMPORT_JSON = 71;
    private static final int EXPORT_JSON = 72;
    private TextView status;
    private VaultStore store;

    private TextView text(String value, int size, int color) {
        TextView t = new TextView(this);
        t.setText(value);
        t.setTextSize(size);
        t.setTextColor(color);
        t.setPadding(0, 14, 0, 10);
        return t;
    }

    private Button button(String title) {
        Button b = new Button(this);
        b.setText(title);
        b.setAllCaps(false);
        return b;
    }

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        store = new VaultStore(this);
        getWindow().setStatusBarColor(Color.rgb(15, 23, 42));
        getWindow().setNavigationBarColor(Color.rgb(15, 23, 42));
        getWindow().getDecorView().setSystemUiVisibility(0);
        ScrollView scroll = new ScrollView(this);
        scroll.setFillViewport(true);
        LinearLayout page = new LinearLayout(this);
        page.setOrientation(LinearLayout.VERTICAL);
        page.setPadding(28, 50, 28, 40);
        page.setBackgroundColor(Color.rgb(15, 23, 42));
        scroll.addView(page);
        setContentView(scroll);

        page.addView(text("PIGA  /  POCKET ENTERPRISE", 14, Color.rgb(94, 234, 212)));
        page.addView(text("Local Vault", 32, Color.WHITE));
        page.addView(text("Eigenständiger Offline-Begleiter für dein Samsung. Keine Anmeldung, keine Cloud-Abhängigkeit.", 17, Color.rgb(203, 213, 225)));
        status = text("", 20, Color.rgb(94, 234, 212));
        page.addView(status);
        refresh();

        page.addView(text("DATEN", 15, Color.WHITE));
        Button importButton = button("JSON-Daten auf diesem Gerät importieren");
        importButton.setOnClickListener(v -> chooseImport());
        page.addView(importButton);

        Button exportButton = button("Meine Daten als JSON exportieren");
        exportButton.setOnClickListener(v -> new AlertDialog.Builder(this)
                .setTitle("Unverschlüsselter Export")
                .setMessage("Die Daten sind in der App mit AndroidKeyStore geschützt. Der exportierte JSON-Text ist NICHT verschlüsselt. Speichere ihn nur an einem sicheren Ort.")
                .setNegativeButton("Abbrechen", null)
                .setPositiveButton("Weiter", (d, w) -> chooseExport()).show());
        page.addView(exportButton);

        page.addView(text("SICHERHEIT", 15, Color.WHITE));
        page.addView(text("AES-256-GCM im AndroidKeyStore · App-private SQLite-Datenbank · Datenimport ohne Befehlsausführung · kein Netzwerkzugriff aus der App.", 16, Color.rgb(203, 213, 225)));
        page.addView(text("Diese App ersetzt NICHT die gekoppelte Phone Bridge und synchronisiert noch keine Supabase-Daten. Beim Löschen der App-Daten geht der Geräteschlüssel verloren. Sichere deine Daten vor einem Gerätewechsel durch Export.", 15, Color.rgb(251, 191, 36)));
        Button piga = button("PIGA-Kommandozentrale im Browser");
        piga.setOnClickListener(v -> startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse("https://app.pigapocket.com"))));
        page.addView(piga);
        page.addView(text("PIGA Local Vault · Device-first Preview 0.1.0 · keine Produktions- oder Autonomiefreigabe", 13, Color.rgb(148, 163, 184)));
    }

    private void refresh() {
        try {
            status.setText("Geräte-SQLite: AKTIV\nLokal gespeicherte Einträge: " + store.count());
        } catch (Exception e) {
            status.setText("Geräte-SQLite: DELAY / " + e.getClass().getSimpleName());
        }
    }

    private void chooseImport() {
        Intent i = new Intent(Intent.ACTION_OPEN_DOCUMENT);
        i.setType("application/json");
        i.addCategory(Intent.CATEGORY_OPENABLE);
        startActivityForResult(i, IMPORT_JSON);
    }

    private void chooseExport() {
        Intent i = new Intent(Intent.ACTION_CREATE_DOCUMENT);
        i.setType("application/json");
        i.putExtra(Intent.EXTRA_TITLE, "PIGA-Local-Vault-Export.json");
        i.addCategory(Intent.CATEGORY_OPENABLE);
        startActivityForResult(i, EXPORT_JSON);
    }

    private byte[] readBounded(InputStream in, int limit) throws Exception {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        byte[] buffer = new byte[8192];
        int read;
        while ((read = in.read(buffer)) != -1) {
            if (out.size() + read > limit) throw new IllegalArgumentException("File exceeds 5 MB limit");
            out.write(buffer, 0, read);
        }
        return out.toByteArray();
    }

    @Override protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (resultCode != RESULT_OK || data == null || data.getData() == null) return;
        try {
            if (requestCode == IMPORT_JSON) {
                try (InputStream in = getContentResolver().openInputStream(data.getData())) {
                    if (in == null) throw new IllegalStateException("No readable document");
                    String json = new String(readBounded(in, 5 * 1024 * 1024), StandardCharsets.UTF_8).trim();
                    JSONArray entries;
                    if (json.startsWith("[")) entries = new JSONArray(json);
                    else entries = new JSONObject(json).getJSONArray("records");
                    int imported = store.importRecords(entries);
                    refresh();
                    notice("Import abgeschlossen: " + imported + " neue Datensätze. Daten nur lokal gespeichert.");
                }
            } else if (requestCode == EXPORT_JSON) {
                JSONObject snapshot = new JSONObject();
                snapshot.put("schema", "piga.local-vault.export.v1");
                snapshot.put("records", store.exportRecords());
                try (OutputStream out = getContentResolver().openOutputStream(data.getData(), "wt")) {
                    if (out == null) throw new IllegalStateException("No writable document");
                    out.write(snapshot.toString(2).getBytes(StandardCharsets.UTF_8));
                    out.flush();
                }
                notice("Export erstellt. Achtung: JSON-Datei ist unverschlüsselt.");
            }
        } catch (Exception e) {
            notice("Vorgang nicht durchgeführt: " + e.getClass().getSimpleName() + ": " + e.getMessage());
        }
    }

    private void notice(String message) {
        new AlertDialog.Builder(this).setMessage(message).setPositiveButton("OK", null).show();
    }

    @Override protected void onDestroy() {
        if (store != null) store.close();
        super.onDestroy();
    }
}
