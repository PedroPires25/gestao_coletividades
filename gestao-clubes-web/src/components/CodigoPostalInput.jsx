import { validateCodigoPostal, formatCodigoPostal } from "../utils/validation";

/**
 * Input controlado para Código Postal português no formato XXXX-XXX.
 * - Aplica máscara automática ao digitar
 * - Insere hífen automaticamente após os 4 primeiros dígitos
 * - Bloqueia letras e símbolos inválidos
 */
export default function CodigoPostalInput({
    value,
    onChange,
    className = "input",
    id,
    name = "codigoPostal",
    required,
    disabled,
}) {
    const error = validateCodigoPostal(value);
    const showError = value && value.length > 0 && error;

    function handleChange(e) {
        const masked = formatCodigoPostal(e.target.value);
        if (onChange) onChange({ target: { name, value: masked } });
    }

    function handleKeyDown(e) {
        const allowed = ["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab", "Home", "End"];
        if (allowed.includes(e.key)) return;
        if (!/^\d$/.test(e.key)) e.preventDefault();
    }

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 4, width: "100%" }}>
            <input
                id={id}
                name={name}
                className={`${className}${showError ? " input-error" : ""}`}
                placeholder="Código Postal (XXXX-XXX)"
                value={value}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                maxLength={8}
                inputMode="numeric"
                required={required}
                disabled={disabled}
                autoComplete="postal-code"
            />
            {showError && (
                <span className="field-error">{error}</span>
            )}
        </div>
    );
}
