package com.gestaoclubes.api.util;

/**
 * Validações de campos obrigatórios: NIF, telefone e código postal.
 */
public class ValidationUtil {

    private static final java.util.regex.Pattern NIF_PATTERN =
            java.util.regex.Pattern.compile("^\\d{9}$");

    // Aceita: 9 dígitos nacionais, ou indicativo internacional + 9 dígitos (ex: +351912345678 ou +351 912345678)
    private static final java.util.regex.Pattern TELEFONE_PATTERN =
            java.util.regex.Pattern.compile("^(\\+\\d{1,4}\\s?)?\\d{9}$");

    private static final java.util.regex.Pattern CODIGO_POSTAL_PATTERN =
            java.util.regex.Pattern.compile("^\\d{4}-\\d{3}$");

    private ValidationUtil() {}

    /**
     * Valida NIF: exatamente 9 dígitos, sem letras, espaços ou símbolos.
     * Se o valor for nulo ou vazio, a validação é ignorada (campo opcional).
     */
    public static void validateNif(String nif) {
        if (nif == null || nif.isBlank()) return;
        String cleaned = nif.trim();
        if (!NIF_PATTERN.matcher(cleaned).matches()) {
            throw new IllegalArgumentException("O NIF deve conter exatamente 9 números.");
        }
    }

    /**
     * Valida número de telefone: 9 dígitos nacionais, com indicativo internacional opcional.
     * Permite espaço entre indicativo e número. Não permite letras ou outros símbolos.
     * Se o valor for nulo ou vazio, a validação é ignorada (campo opcional).
     */
    public static void validateTelefone(String telefone) {
        if (telefone == null || telefone.isBlank()) return;
        String cleaned = telefone.trim();
        if (!TELEFONE_PATTERN.matcher(cleaned).matches()) {
            throw new IllegalArgumentException("O número de telefone deve conter 9 números (ex: 912345678 ou +351 912345678).");
        }
    }

    /**
     * Valida código postal português: formato XXXX-XXX.
     * Se o valor for nulo ou vazio, a validação é ignorada (campo opcional).
     */
    public static void validateCodigoPostal(String codigoPostal) {
        if (codigoPostal == null || codigoPostal.isBlank()) return;
        String cleaned = codigoPostal.trim();
        if (!CODIGO_POSTAL_PATTERN.matcher(cleaned).matches()) {
            throw new IllegalArgumentException("O código postal deve estar no formato XXXX-XXX (ex: 1000-123).");
        }
    }
}
