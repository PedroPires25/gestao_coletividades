export default function ConfirmPasswordStatus({ password, confirmPassword }) {
    if (!confirmPassword) return null;

    const match = password === confirmPassword;

    return (
        <div
            style={{
                marginTop: "8px",
                marginBottom: "12px",
                fontSize: "0.92rem",
                fontWeight: 500,
            }}
        >
            {match ? "✅ As palavras-passe coincidem." : "❌ As palavras-passe não coincidem."}
        </div>
    );
}