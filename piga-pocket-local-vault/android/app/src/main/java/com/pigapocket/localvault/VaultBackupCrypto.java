package com.pigapocket.localvault;

import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Arrays;
import javax.crypto.Cipher;
import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.PBEKeySpec;
import javax.crypto.spec.SecretKeySpec;

/**
 * Versioned, passphrase-protected offline backup format for the independent
 * PIGA Local Vault companion. Does not use or export AndroidKeyStore secrets.
 * Format: magic(8), PBKDF2 rounds(4 BE), salt(16), GCM nonce(12), ciphertext+tag.
 * Entire header is AES-GCM authenticated additional data.
 */
public final class VaultBackupCrypto {
    private static final byte[] MAGIC = "PIGAEB01".getBytes(StandardCharsets.US_ASCII);
    private static final int ROUNDS = 310000;
    private static final int SALT_LENGTH = 16;
    private static final int NONCE_LENGTH = 12;
    private static final int HEADER_LENGTH = 8 + 4 + SALT_LENGTH + NONCE_LENGTH;
    private static final int TAG_LENGTH = 16;
    public static final int MAX_PLAINTEXT_BYTES = 10 * 1024 * 1024;
    public static final int MAX_BACKUP_BYTES = HEADER_LENGTH + MAX_PLAINTEXT_BYTES + TAG_LENGTH;

    private VaultBackupCrypto() {}

    public static byte[] encrypt(byte[] plaintext, char[] password) throws Exception {
        if (plaintext == null || plaintext.length == 0 ||
                plaintext.length > MAX_PLAINTEXT_BYTES) {
            throw new IllegalArgumentException("Backup data size invalid");
        }
        requirePassword(password);
        SecureRandom random = new SecureRandom();
        byte[] salt = new byte[SALT_LENGTH];
        byte[] nonce = new byte[NONCE_LENGTH];
        random.nextBytes(salt);
        random.nextBytes(nonce);
        byte[] header = ByteBuffer.allocate(HEADER_LENGTH)
                .put(MAGIC).putInt(ROUNDS).put(salt).put(nonce).array();
        byte[] rawKey = derive(password, salt);
        try {
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.ENCRYPT_MODE,
                    new SecretKeySpec(rawKey, "AES"), new GCMParameterSpec(128, nonce));
            cipher.updateAAD(header);
            byte[] sealed = cipher.doFinal(plaintext);
            return ByteBuffer.allocate(header.length + sealed.length)
                    .put(header).put(sealed).array();
        } finally {
            Arrays.fill(rawKey, (byte) 0);
            Arrays.fill(salt, (byte) 0);
            Arrays.fill(nonce, (byte) 0);
        }
    }

    public static byte[] decrypt(byte[] backup, char[] password) throws Exception {
        if (backup == null || backup.length < HEADER_LENGTH + TAG_LENGTH ||
                backup.length > MAX_BACKUP_BYTES) {
            throw new SecurityException("Invalid encrypted backup size");
        }
        requirePassword(password);
        ByteBuffer src = ByteBuffer.wrap(backup);
        byte[] magic = new byte[MAGIC.length];
        src.get(magic);
        if (!MessageDigest.isEqual(magic, MAGIC)) {
            throw new SecurityException("Unsupported encrypted backup header");
        }
        int rounds = src.getInt();
        if (rounds != ROUNDS) {
            throw new SecurityException("Unsupported backup KDF parameters");
        }
        byte[] salt = new byte[SALT_LENGTH];
        byte[] nonce = new byte[NONCE_LENGTH];
        src.get(salt);
        src.get(nonce);
        byte[] header = Arrays.copyOf(backup, HEADER_LENGTH);
        byte[] cipherBytes = Arrays.copyOfRange(backup, HEADER_LENGTH, backup.length);
        byte[] rawKey = derive(password, salt);
        try {
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.DECRYPT_MODE,
                    new SecretKeySpec(rawKey, "AES"), new GCMParameterSpec(128, nonce));
            cipher.updateAAD(header);
            byte[] plaintext = cipher.doFinal(cipherBytes);
            if (plaintext.length == 0 || plaintext.length > MAX_PLAINTEXT_BYTES) {
                Arrays.fill(plaintext, (byte) 0);
                throw new SecurityException("Invalid backup plaintext size");
            }
            return plaintext;
        } finally {
            Arrays.fill(rawKey, (byte) 0);
            Arrays.fill(salt, (byte) 0);
            Arrays.fill(nonce, (byte) 0);
            Arrays.fill(cipherBytes, (byte) 0);
        }
    }

    private static byte[] derive(char[] password, byte[] salt) throws Exception {
        PBEKeySpec spec = new PBEKeySpec(password, salt, ROUNDS, 256);
        try {
            return SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256")
                    .generateSecret(spec).getEncoded();
        } finally {
            spec.clearPassword();
        }
    }

    private static void requirePassword(char[] password) {
        if (password == null || password.length < 12 || password.length > 256) {
            throw new IllegalArgumentException("Passphrase must contain 12 to 256 characters");
        }
    }
}
