import { validateNif, nifKeyFilter } from "../utils/validation";

/**
 * Input controlado para NIF (ou qualquer campo de 9 dígitos como Nº Contribuinte):
 * - Apenas aceita 9 dígitos
 * - Bloqueia letras e símbolos em tempo real
 * - Mostra mensagem de erro quando o formato é inválido
 *
 * Props:
 *   value, onChange, className, id, name, required, disabled
 *   placeholder     – placeholder personalizado (default: "NIF (9 dígitos)")
 *   errorMessage    – mensagem de erro personalizada (default: standard NIF message)
 */
export default function NifInput({
    value,
    onChange,
    className = "input",
    id,
    name = "nif",
    required,
    disabled,
    placeholder = "NIF (9 dígitos)",
    errorMessage,
}) {
    const defaultError = validateNif(value);
    const error = errorMessage && value && value.length > 0 && value.length !== 9
        ? errorMessage
        : defaultError;
    const showError = value && value.length > 0 && error;

    function handleChange(e) {
        // Remove qualquer caractere não numérico e limita a 9 dígitos
        const clean = e.target.value.replace(/\D/g, "").slice(0, 9);
        if (onChange) onChange({ target: { name, value: clean } });
    }

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 4, width: "100%" }}>
            <input
                id={id}
                name={name}
                className={`${className}${showError ? " input-error" : ""}`}
                placeholder={placeholder}
                value={value}
                onChange={handleChange}
                onKeyDown={nifKeyFilter}
                maxLength={9}
                inputMode="numeric"
                pattern="\d{9}"
                required={required}
                disabled={disabled}
                autoComplete="off"
            />
            {showError && (
                <span className="field-error">{error}</span>
            )}
        </div>
    );
}
