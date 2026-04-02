package com.gestaoclubes.api.util;

import org.mindrot.jbcrypt.BCrypt;

public class PasswordUtil {

    public static boolean isHashValido(String hash) {
        if (hash == null) return false;
        return hash.startsWith("$2a$") || hash.startsWith("$2b$") || hash.startsWith("$2y$");
    }

    public static String hashPassword(String plainPassword) {
        if (plainPassword == null || plainPassword.isEmpty()) {
            throw new IllegalArgumentException("Password vazia.");
        }
        return BCrypt.hashpw(plainPassword, BCrypt.gensalt(10));
    }

    public static boolean verificarPassword(String plainPassword, String storedHash) {
        if (plainPassword == null || storedHash == null) return false;
        if (!isHashValido(storedHash)) return false;

        try {
            return BCrypt.checkpw(plainPassword, storedHash);
        } catch (Exception e) {
            return false;
        }
    }
}