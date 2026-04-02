package com.gestaoclubes.api.util;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;

public class PasswordPolicyUtil {

    private static final Pattern PASSWORD_PATTERN =
            Pattern.compile("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z\\d]).{8,15}$");

    private PasswordPolicyUtil() {
    }

    public static boolean isValid(String password) {
        return password != null && PASSWORD_PATTERN.matcher(password).matches();
    }

    public static List<String> getValidationErrors(String password) {
        List<String> errors = new ArrayList<>();

        if (password == null || password.isBlank()) {
            errors.add("A palavra-passe é obrigatória.");
            return errors;
        }

        if (password.length() < 8 || password.length() > 15) {
            errors.add("A palavra-passe deve ter entre 8 e 15 caracteres.");
        }
        if (!password.matches(".*[a-z].*")) {
            errors.add("Deve conter pelo menos uma letra minúscula.");
        }
        if (!password.matches(".*[A-Z].*")) {
            errors.add("Deve conter pelo menos uma letra maiúscula.");
        }
        if (!password.matches(".*\\d.*")) {
            errors.add("Deve conter pelo menos um número.");
        }
        if (!password.matches(".*[^A-Za-z\\d].*")) {
            errors.add("Deve conter pelo menos um caráter especial.");
        }

        return errors;
    }
}