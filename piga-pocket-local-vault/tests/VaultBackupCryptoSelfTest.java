package com.pigapocket.localvault;

import java.nio.charset.StandardCharsets;
import java.util.Arrays;

/** Standalone host-JDK tests, no Android SDK/JUnit dependency. */
public final class VaultBackupCryptoSelfTest {
    private static int checks;
    private interface Operation { void run() throws Exception; }
    private static void check(boolean condition, String why) {
        checks++;
        if (!condition) throw new AssertionError(why);
    }
    private static void mustFail(Operation run, String why) throws Exception {
        checks++;
        try {
            run.run();
            throw new AssertionError("Accepted invalid " + why);
        } catch (AssertionError error) {
            throw error;
        } catch (Exception expected) {
            // Fail-closed behavior is required.
        }
    }
    public static void main(String[] args) throws Exception {
        char[] pass = "An-owner-controlled-passphrase-2026".toCharArray();
        byte[] sample = ("{\"schema\":\"piga.local-vault.export.v1\","
                + "\"records\":[{\"id\":\"capability-1\"}]}").getBytes(StandardCharsets.UTF_8);
        byte[] a = VaultBackupCrypto.encrypt(sample, pass);
        byte[] b = VaultBackupCrypto.encrypt(sample, pass);
        check(!Arrays.equals(a, b), "Fresh independent salt/nonce required");
        check(Arrays.equals(sample, VaultBackupCrypto.decrypt(a, pass)), "Backup roundtrip");
        check(a.length == sample.length + 56, "Authenticated envelope layout");
        mustFail(() -> VaultBackupCrypto.decrypt(a, "Another-secret-password-2026".toCharArray()), "wrong passphrase");
        byte[] badMagic = a.clone(); badMagic[4] ^= 1;
        mustFail(() -> VaultBackupCrypto.decrypt(badMagic, pass), "magic");
        byte[] badRounds = a.clone(); badRounds[8] ^= 1;
        mustFail(() -> VaultBackupCrypto.decrypt(badRounds, pass), "KDF rounds");
        byte[] badNonce = a.clone(); badNonce[32] ^= 1;
        mustFail(() -> VaultBackupCrypto.decrypt(badNonce, pass), "authenticated nonce");
        byte[] badTag = a.clone(); badTag[badTag.length - 1] ^= 1;
        mustFail(() -> VaultBackupCrypto.decrypt(badTag, pass), "authentication tag");
        mustFail(() -> VaultBackupCrypto.decrypt(Arrays.copyOf(a, 50), pass), "truncated backup");
        mustFail(() -> VaultBackupCrypto.encrypt(sample, "weak".toCharArray()), "weak passphrase");
        mustFail(() -> VaultBackupCrypto.encrypt(new byte[0], pass), "empty backup");
        mustFail(() -> VaultBackupCrypto.encrypt(
                new byte[VaultBackupCrypto.MAX_PLAINTEXT_BYTES + 1], pass), "oversized backup");
        System.out.println("PASS " + checks + "/12 VaultBackupCrypto host-JDK security checks");
    }
}
