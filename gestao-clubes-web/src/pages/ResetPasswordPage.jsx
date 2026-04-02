import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import PasswordChecklist from "../components/PasswordChecklist";
import ConfirmPasswordStatus from "../components/ConfirmPasswordStatus";
import { evaluatePassword } from "../utils/passwordStrength";
import { extractApiErrorMessage } from "../utils/apiError";

const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:8080").replace(/\/$/, "") + "/api";

const EyeOpenIcon = () => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="lucide lucide-eye"
    >
        <path d="M2.062 12.349a12.24 12.24 0 0 1 19.876 0" />
        <circle cx="12" cy="12" r="3" />
    </svg>
);

const EyeClosedIcon = () => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="lucide lucide-eye-off"
    >
        <path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.527 12.234 12.234 0 0 1-1.604 2.887" />
        <path d="M16.637 16.637A12.241 12.241 0 0 1 2.062 12.349a12.235 12.235 0 0 1 2.162-3.805" />
        <path d="M1 1l22 22" />
        <circle cx="12" cy="12" r="3" />
    </svg>
);

const eyeButtonStyle = {
    position: "absolute",
    right: "12px",
    top: "50%",
    transform: "translateY(-50%)",
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "#333333",
    opacity: 0.6,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "4px",
    zIndex: 2
};

export default function ResetPasswordPage() {
    const [params] = useSearchParams();
    const token = useMemo(() => params.get("token") || "", [params]);

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [loading, setLoading] = useState(false);
    const [validating, setValidating] = useState(true);
    const [tokenValido, setTokenValido] = useState(false);
    const [erro, setErro] = useState("");

    const passwordState = evaluatePassword(password);

    useEffect(() => {
        async function validar() {
            if (!token) {
                setErro("Token em falta no link.");
                setTokenValido(false);
                setValidating(false);
                return;
            }

            try {
                const res = await fetch(
                    `${API_URL}/auth/reset-password/validate?token=${encodeURIComponent(token)}`
                );

                const data = await res.json().catch(() => null);

                if (!res.ok || !data?.valid) {
                    setTokenValido(false);
                    setErro(data?.message || "O link de recuperação é inválido ou já expirou.");
                } else {
                    setTokenValido(true);
                }
            } catch {
                setErro("Erro ao conectar com o servidor para validar o link.");
                setTokenValido(false);
            } finally {
                setValidating(false);
            }
        }

        validar();
    }, [token]);

    async function onSubmit(e) {
        e.preventDefault();
        setErro("");

        if (!passwordState.isValid) {
            setErro("A palavra-passe deve ter entre 8 e 15 caracteres e incluir maiúsculas, minúsculas, números e carateres especiais.");
            return;
        }

        if (password !== confirmPassword) {
            setErro("As palavras-passe não coincidem.");
            return;
        }

        setLoading(true);

        try {
            const res = await fetch(`${API_URL}/auth/reset-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    token,
                    newPassword: password,
                    confirmPassword
                }),
            });

            if (res.ok) {
                window.location.href = "/reset-password/success";
                return;
            }

            throw new Error(
                await extractApiErrorMessage(
                    res,
                    "Ocorreu um erro ao atualizar a palavra-passe."
                )
            );
        } catch (e) {
            setErro(e.message || "Ocorreu um erro ao atualizar a palavra-passe.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="login-page">
            <div className="login-shell">
                <div className="login-card fade-in">
                    <div className="login-card-top">
                        <span className="login-kicker">Nova Palavra-passe</span>
                        <h1 className="login-title">Redefinir acesso</h1>
                        <p className="login-sub">Escolhe uma nova palavra-passe segura.</p>
                    </div>

                    {validating ? (
                        <p className="login-sub" style={{ textAlign: "center" }}>
                            A validar o teu link...
                        </p>
                    ) : (
                        <>
                            {erro && <div className="alert error">{erro}</div>}

                            {tokenValido && (
                                <form className="row" onSubmit={onSubmit}>
                                    <div style={{ position: "relative", marginBottom: "15px" }}>
                                        <input
                                            className="input"
                                            type={showPassword ? "text" : "password"}
                                            placeholder="Nova palavra-passe"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            autoComplete="new-password"
                                            required
                                            style={{ paddingRight: "45px" }}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            style={eyeButtonStyle}
                                            aria-label={showPassword ? "Ocultar palavra-passe" : "Mostrar palavra-passe"}
                                        >
                                            {showPassword ? <EyeOpenIcon /> : <EyeClosedIcon />}
                                        </button>
                                    </div>

                                    <PasswordChecklist password={password} />

                                    <div style={{ position: "relative", marginBottom: "15px" }}>
                                        <input
                                            className="input"
                                            type={showConfirmPassword ? "text" : "password"}
                                            placeholder="Confirmar nova palavra-passe"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            autoComplete="new-password"
                                            required
                                            style={{ paddingRight: "45px" }}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            style={eyeButtonStyle}
                                            aria-label={showConfirmPassword ? "Ocultar confirmação" : "Mostrar confirmação"}
                                        >
                                            {showConfirmPassword ? <EyeOpenIcon /> : <EyeClosedIcon />}
                                        </button>
                                    </div>

                                    <ConfirmPasswordStatus
                                        password={password}
                                        confirmPassword={confirmPassword}
                                    />

                                    <div className="actions login-actions">
                                        <button
                                            className="btn btn-primary"
                                            type="submit"
                                            disabled={
                                                loading ||
                                                !passwordState.isValid ||
                                                password !== confirmPassword
                                            }
                                        >
                                            {loading ? "A guardar..." : "Guardar palavra-passe"}
                                        </button>

                                        <Link className="btn" to="/login">
                                            Voltar ao login
                                        </Link>
                                    </div>
                                </form>
                            )}

                            {!tokenValido && !validating && (
                                <div style={{ marginTop: "20px", textAlign: "center" }}>
                                    <p className="login-sub" style={{ marginBottom: "15px" }}>
                                        Podes pedir um novo link na página de recuperação.
                                    </p>
                                    <Link className="btn btn-primary" to="/forgot-password">
                                        Pedir novo link
                                    </Link>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}