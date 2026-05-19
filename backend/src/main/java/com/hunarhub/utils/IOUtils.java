package com.hunarhub.utils;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;

/**
 * Java 8-compatible IO helpers.
 */
public class IOUtils {

    /**
     * Reads all bytes from an InputStream — replacement for Java 9's InputStream.readAllBytes().
     */
    public static byte[] readAllBytes(InputStream is) throws IOException {
        ByteArrayOutputStream buffer = new ByteArrayOutputStream();
        byte[] chunk = new byte[4096];
        int read;
        while ((read = is.read(chunk)) != -1) {
            buffer.write(chunk, 0, read);
        }
        return buffer.toByteArray();
    }

    /**
     * Reads an InputStream fully as a UTF-8 String.
     */
    public static String readString(InputStream is) throws IOException {
        return new String(readAllBytes(is), StandardCharsets.UTF_8);
    }
}
