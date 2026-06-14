/**
 * Utilitários de validação de campos: NIF, telefone e código postal.
 */

/** Valida NIF: exatamente 9 dígitos numéricos. */
export function validateNif(value) {
    if (!value || value.trim() === "") return null; // campo opcional
    if (!/^\d{9}$/.test(value.trim())) {
        return "O NIF deve conter exatamente 9 números.";
    }
    return null;
}

/**
 * Valida número de telefone:
 * - 9 dígitos nacionais
 * - ou indicativo internacional (+xx) seguido de 9 dígitos, com espaço opcional
 */
export function validateTelefone(value) {
    if (!value || value.trim() === "") return null; // campo opcional
    if (!/^(\+\d{1,4}\s?)?\d{9}$/.test(value.trim())) {
        return "O número de telefone deve conter 9 números (ex: 912345678 ou +351 912345678).";
    }
    return null;
}

/** Valida código postal português no formato XXXX-XXX. */
export function validateCodigoPostal(value) {
    if (!value || value.trim() === "") return null; // campo opcional
    if (!/^\d{4}-\d{3}$/.test(value.trim())) {
        return "O código postal deve estar no formato XXXX-XXX (ex: 1000-123).";
    }
    return null;
}

/**
 * Aplica máscara automática ao código postal: XXXX-XXX
 * Apenas aceita dígitos e insere hífen automaticamente após os 4 primeiros dígitos.
 */
export function formatCodigoPostal(raw) {
    const digits = raw.replace(/\D/g, "").slice(0, 7);
    if (digits.length <= 4) return digits;
    return `${digits.slice(0, 4)}-${digits.slice(4)}`;
}

/**
 * Bloqueia a escrita de caracteres não numéricos no campo NIF.
 * Usar no handler onKeyDown ou onInput.
 */
export function nifKeyFilter(e) {
    const allowed = ["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab", "Home", "End"];
    if (allowed.includes(e.key)) return;
    if (!/^\d$/.test(e.key)) e.preventDefault();
}

/**
 * Valida Nº de Contribuinte: exatamente 9 dígitos (opcional — se vazio, é válido).
 */
export function validateNumeroContribuinte(value) {
    if (!value || value.trim() === "") return null; // campo opcional
    if (!/^\d{9}$/.test(value.trim())) {
        return "O Nº de Contribuinte deve conter exatamente 9 números.";
    }
    return null;
}

export function telefoneKeyFilter(e) {
    const allowed = ["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab", "Home", "End", "+", " "];
    if (allowed.includes(e.key)) return;
    if (!/^\d$/.test(e.key)) e.preventDefault();
}
