package com.hunarhub.utils;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * In-memory OTP store with 10-minute expiry.
 * Keyed by email (lowercase).
 */
public class OtpStore {

    private static final long EXPIRY_MS = 10 * 60 * 1000; // 10 minutes

    private static final Map<String, Entry> store = new ConcurrentHashMap<>();

    public static void put(String email, String otp) {
        store.put(email.toLowerCase(), new Entry(otp, System.currentTimeMillis()));
    }

    /** Returns true and removes the OTP if it matches and hasn't expired. */
    public static boolean verify(String email, String otp) {
        Entry e = store.get(email.toLowerCase());
        if (e == null) return false;
        if (System.currentTimeMillis() - e.createdAt > EXPIRY_MS) {
            store.remove(email.toLowerCase());
            return false;
        }
        if (e.otp.equals(otp)) {
            store.remove(email.toLowerCase());
            return true;
        }
        return false;
    }

    public static boolean has(String email) {
        Entry e = store.get(email.toLowerCase());
        if (e == null) return false;
        if (System.currentTimeMillis() - e.createdAt > EXPIRY_MS) {
            store.remove(email.toLowerCase());
            return false;
        }
        return true;
    }

    private static class Entry {
        final String otp;
        final long   createdAt;
        Entry(String otp, long createdAt) { this.otp = otp; this.createdAt = createdAt; }
    }
}
