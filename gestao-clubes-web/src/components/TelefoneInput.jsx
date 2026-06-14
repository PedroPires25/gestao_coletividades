import { useState } from "react";
import { validateTelefone, telefoneKeyFilter } from "../utils/validation";

const INDICATIVOS = [
    { code: "+351", label: "🇵🇹 +351", country: "Portugal" },
    { code: "+34", label: "🇪🇸 +34", country: "Espanha" },
    { code: "+33", label: "🇫🇷 +33", country: "França" },
    { code: "+44", label: "🇬🇧 +44", country: "Reino Unido" },
    { code: "+49", label: "🇩🇪 +49", country: "Alemanha" },
    { code: "+39", label: "🇮🇹 +39", country: "Itália" },
    { code: "+31", label: "🇳🇱 +31", country: "Países Baixos" },
    { code: "+32", label: "🇧🇪 +32", country: "Bélgica" },
    { code: "+41", label: "🇨🇭 +41", country: "Suíça" },
    { code: "+1", label: "🇺🇸 +1", country: "EUA/Canadá" },
    { code: "+55", label: "🇧🇷 +55", country: "Brasil" },
    { code: "+244", label: "🇦🇴 +244", country: "Angola" },
    { code: "+258", label: "🇲🇿 +258", country: "Moçambique" },
    { code: "+238", label: "🇨🇻 +238", country: "Cabo Verde" },
    { code: "+239", label: "🇸🇹 +239", country: "São Tomé" },
    { code: "+245", label: "🇬🇼 +245", country: "Guiné-Bissau" },
    { code: "+853", label: "🇲🇴 +853", country: "Macau" },
    { code: "+670", label: "🇹🇱 +670", country: "Timor-Leste" },
];

/**
 * Extrai indicativo e número nacional de um valor já guardado.
 * Exemplos: "+351912345678" → { indicativo: "+351", nacional: "912345678" }
 *           "+351 912345678" → { indicativo: "+351", nacional: "912345678" }
 *           "912345678" → { indicativo: "+351", nacional: "912345678" }
 */
function parsePhoneValue(value) {
    if (!value || value.trim() === "") return { indicativo: "+351", nacional: "" };
    const v = value.trim();
    if (v.startsWith("+")) {
        for (const ind of INDICATIVOS.slice().sort((a, b) => b.code.length - a.code.length)) {
            if (v.startsWith(ind.code)) {
                const rest = v.slice(ind.code.length).trim();
                return { indicativo: ind.code, nacional: rest };
            }
        }
        // indicativo desconhecido - tentar separar
        const match = v.match(/^(\+\d{1,4})\s?(\d*)$/);
        if (match) return { indicativo: match[1], nacional: match[2] };
        return { indicativo: "+351", nacional: v.replace(/\D/g, "") };
    }
    return { indicativo: "+351", nacional: v.replace(/\D/g, "").slice(0, 9) };
}

/**
 * Input de telefone com seletor de indicativo internacional.
 * Guarda o valor no formato: "+351 912345678" ou "912345678" (sem indicativo se usar sem código).
 *
 * Props:
 *   value       – valor combinado (indicativo + número) como string
 *   onChange    – callback({ target: { name, value } }) onde value é o número completo concatenado
 *   name        – nome do campo (default: "telefone")
 *   label       – label opcional exibido acima
 *   className   – classe CSS para o input numérico
 *   required    – obrigatório?
 *   disabled    – desativado?
 */
export default function TelefoneInput({
    value,
    onChange,
    name = "telefone",
    className = "input",
    required,
    disabled,
}) {
    const parsed = parsePhoneValue(value);
    const [indicativo, setIndicativo] = useState(parsed.indicativo);
    const [nacional, setNacional] = useState(parsed.nacional);

    const fullValue = nacional.trim() ? `${indicativo} ${nacional.trim()}` : "";
    const error = validateTelefone(fullValue);
    const showError = nacional.length > 0 && error;

    function handleIndicativoChange(e) {
        const newInd = e.target.value;
        setIndicativo(newInd);
        const combined = nacional.trim() ? `${newInd} ${nacional.trim()}` : "";
        if (onChange) onChange({ target: { name, value: combined } });
    }

    function handleNacionalChange(e) {
        const clean = e.target.value.replace(/\D/g, "").slice(0, 9);
        setNacional(clean);
        const combined = clean ? `${indicativo} ${clean}` : "";
        if (onChange) onChange({ target: { name, value: combined } });
    }

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 4, width: "100%" }}>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <select
                    value={indicativo}
                    onChange={handleIndicativoChange}
                    disabled={disabled}
                    style={{
                        width: "auto",
                        flexShrink: 0,
                        height: 40,
                        borderRadius: 8,
                        border: "1px solid var(--border, #ccc)",
                        padding: "0 8px",
                        background: "var(--bg-input, var(--bg-card, #fff))",
                        color: "var(--text, #222)",
                        fontSize: "0.92rem",
                        minWidth: 110,
                        maxWidth: 140,
                        boxSizing: "border-box",
                        cursor: disabled ? "not-allowed" : "pointer",
                    }}
                    aria-label="Indicativo internacional"
                >
                    {INDICATIVOS.map((ind) => (
                        <option key={ind.code} value={ind.code}>
                            {ind.label}
                        </option>
                    ))}
                </select>
                <input
                    name={name}
                    className={`${className}${showError ? " input-error" : ""}`}
                    placeholder="912345678"
                    value={nacional}
                    onChange={handleNacionalChange}
                    onKeyDown={telefoneKeyFilter}
                    maxLength={9}
                    inputMode="numeric"
                    required={required}
                    disabled={disabled}
                    autoComplete="tel-national"
                    style={{ flex: 1 }}
                />
            </div>
            {showError && (
                <span className="field-error">{error}</span>
            )}
        </div>
    );
}
