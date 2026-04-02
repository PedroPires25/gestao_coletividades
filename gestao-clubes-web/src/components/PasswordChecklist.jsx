import { evaluatePassword } from "../utils/passwordStrength";

export default function PasswordChecklist({ password }) {
    const result = evaluatePassword(password);
    const width = `${(result.passed / 5) * 100}%`;

    const barColor =
        result.strength === "Forte"
            ? "#198754"
            : result.strength === "Normal"
                ? "#f0ad4e"
                : "#dc3545";

    const wrapStyle = {
        marginTop: "10px",
        marginBottom: "12px",
        padding: "12px",
        borderRadius: "12px",
        background: "rgba(255,255,255,0.06)",
    };

    const itemStyle = {
        display: "flex",
        alignItems: "center",
        gap: "8px",
        fontSize: "0.92rem",
        marginBottom: "6px",
    };

    const helpTextStyle = {
        marginTop: "8px",
        fontSize: "0.9rem",
        opacity: 0.95,
        fontWeight: 500,
    };

    function missingText() {
        if (password.length === 0) {
            return "Introduz uma palavra-passe para veres os critérios.";
        }
        if (result.isValid) {
            return "A palavra-passe cumpre todos os critérios obrigatórios.";
        }
        if (result.missing === 1) {
            return "Falta 1 critério para a palavra-passe ser válida.";
        }
        return `Faltam ${result.missing} critérios para a palavra-passe ser válida.`;
    }

    return (
        <div style={wrapStyle}>
            <div
                style={{
                    height: "10px",
                    width: "100%",
                    background: "#d9d9d9",
                    borderRadius: "999px",
                    overflow: "hidden",
                    marginBottom: "10px",
                }}
            >
                <div
                    style={{
                        height: "100%",
                        width,
                        background: barColor,
                        transition: "all 0.25s ease",
                    }}
                />
            </div>

            <div style={{ fontWeight: 600, marginBottom: "10px" }}>
                Palavra-passe: {result.strength}
            </div>

            <div style={itemStyle}>{result.checks.length ? "✅" : "❌"} 8 a 15 caracteres</div>
            <div style={itemStyle}>{result.checks.uppercase ? "✅" : "❌"} Pelo menos uma maiúscula</div>
            <div style={itemStyle}>{result.checks.lowercase ? "✅" : "❌"} Pelo menos uma minúscula</div>
            <div style={itemStyle}>{result.checks.number ? "✅" : "❌"} Pelo menos um número</div>
            <div style={itemStyle}>{result.checks.special ? "✅" : "❌"} Pelo menos um caráter especial</div>

            <div style={helpTextStyle}>
                {missingText()}
            </div>
        </div>
    );
}