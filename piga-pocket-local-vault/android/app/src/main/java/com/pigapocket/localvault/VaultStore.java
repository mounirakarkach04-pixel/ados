package com.pigapocket.localvault;

import android.content.ContentValues;
import android.content.Context;
import android.database.Cursor;
import android.database.sqlite.SQLiteDatabase;
import android.database.sqlite.SQLiteOpenHelper;
import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyProperties;

import org.json.JSONArray;
import org.json.JSONObject;

import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.KeyStore;
import java.security.SecureRandom;
import java.util.UUID;
import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;

final class VaultStore extends SQLiteOpenHelper {
    private static final String DB_NAME = "piga_local_vault_companion_v1.db";
    private static final String KEY_ALIAS = "piga_local_vault_companion_aes_v1";
    private static final int MAX_RECORDS_PER_IMPORT = 1000;
    private static final int MAX_RECORD_BYTES = 32768;

    VaultStore(Context context) {
        super(context.getApplicationContext(), DB_NAME, null, 1);
    }

    @Override public void onCreate(SQLiteDatabase db) {
        db.execSQL("CREATE TABLE records (id TEXT PRIMARY KEY NOT NULL, encrypted_payload BLOB NOT NULL, imported_at_ms INTEGER NOT NULL)");
        db.execSQL("CREATE TABLE state (k TEXT PRIMARY KEY NOT NULL, v TEXT NOT NULL)");
    }

    @Override public void onUpgrade(SQLiteDatabase db, int oldVersion, int newVersion) {
        // Unknown migration must stop rather than destroy user data.
        throw new IllegalStateException("Data migration requires owner-controlled review");
    }

    synchronized long count() {
        try (Cursor c = getReadableDatabase().rawQuery("SELECT COUNT(*) FROM records", null)) {
            return c.moveToFirst() ? c.getLong(0) : 0;
        }
    }

    private SecretKey key() throws Exception {
        KeyStore ks = KeyStore.getInstance("AndroidKeyStore");
        ks.load(null);
        SecretKey prior = (SecretKey) ks.getKey(KEY_ALIAS, null);
        if (prior != null) return prior;
        KeyGenerator gen = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, "AndroidKeyStore");
        gen.init(new KeyGenParameterSpec.Builder(KEY_ALIAS, KeyProperties.PURPOSE_ENCRYPT | KeyProperties.PURPOSE_DECRYPT)
                .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
                .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
                .setKeySize(256).build());
        return gen.generateKey();
    }

    private byte[] seal(String id, byte[] plaintext) throws Exception {
        Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
        cipher.init(Cipher.ENCRYPT_MODE, key());
        cipher.updateAAD(id.getBytes(StandardCharsets.UTF_8));
        byte[] nonce = cipher.getIV();
        byte[] data = cipher.doFinal(plaintext);
        return ByteBuffer.allocate(1 + nonce.length + data.length)
                .put((byte) nonce.length).put(nonce).put(data).array();
    }

    private byte[] unseal(String id, byte[] combined) throws Exception {
        ByteBuffer b = ByteBuffer.wrap(combined);
        int n = b.get() & 0xff;
        if (n != 12 || b.remaining() < n + 16) throw new SecurityException("Invalid encrypted record");
        byte[] nonce = new byte[n];
        b.get(nonce);
        byte[] data = new byte[b.remaining()];
        b.get(data);
        Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
        cipher.init(Cipher.DECRYPT_MODE, key(), new GCMParameterSpec(128, nonce));
        cipher.updateAAD(id.getBytes(StandardCharsets.UTF_8));
        return cipher.doFinal(data);
    }

    synchronized int importRecords(JSONArray incoming) throws Exception {
        if (incoming.length() > MAX_RECORDS_PER_IMPORT) throw new IllegalArgumentException("Maximum 1000 records per import");
        SQLiteDatabase db = getWritableDatabase();
        int written = 0;
        db.beginTransaction();
        try {
            for (int i = 0; i < incoming.length(); i++) {
                JSONObject raw = incoming.getJSONObject(i);
                String id = raw.optString("id", "").trim();
                if (!id.matches("[A-Za-z0-9._:-]{3,160}")) id = UUID.randomUUID().toString();
                // DATA ONLY: no Gate-2 authority, remote command or execution capability.
                String json = raw.toString();
                byte[] plain = json.getBytes(StandardCharsets.UTF_8);
                if (plain.length > MAX_RECORD_BYTES) throw new IllegalArgumentException("Record exceeds 32 KB");
                ContentValues row = new ContentValues();
                row.put("id", id);
                row.put("encrypted_payload", seal(id, plain));
                row.put("imported_at_ms", System.currentTimeMillis());
                long n = db.insertWithOnConflict("records", null, row, SQLiteDatabase.CONFLICT_IGNORE);
                if (n != -1) written++;
            }
            db.setTransactionSuccessful();
        } finally {
            db.endTransaction();
        }
        return written;
    }

    synchronized JSONArray exportRecords() throws Exception {
        JSONArray records = new JSONArray();
        try (Cursor c = getReadableDatabase().rawQuery("SELECT id,encrypted_payload FROM records ORDER BY id LIMIT 20001", null)) {
            while (c.moveToNext()) {
                if (records.length() >= 20000) throw new IllegalStateException("Too many records to export in one file");
                String id = c.getString(0);
                byte[] decrypted = unseal(id, c.getBlob(1));
                records.put(new JSONObject(new String(decrypted, StandardCharsets.UTF_8)));
            }
        }
        return records;
    }
}
