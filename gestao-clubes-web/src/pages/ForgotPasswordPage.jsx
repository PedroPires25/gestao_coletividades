import { useState } from "react";
import { Link } from "react-router-dom";
import { apiForgotPassword } from "../api"; // Importar a função correta

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [erro, setErro] = useState("");

    async function onSubmit(e) {
        e.preventDefault();
        setErro("");
        setLoading(true);

        try {
            await apiForgotPassword(email.trim());
            // Se a API não der erro, o pedido foi aceite.
            // Redirecionamos para a página de confirmação.
            window.location.href = "/recuperar-password/confirmar";

        } catch (e) {
            // O erro pode ser de rede ('Failed to fetch') ou da API
            setErro(e.message || "Erro ao processar o pedido.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="login-page">
            <a href="/" className="login-brand" aria-label="Gestão de Coletividades">
                <img
                    src="/logo.png"
                    alt="Gestão de Clubes Desportivos e Coletividades"
                    className="login-logo-fixed"
                />
            </a>

            <div className="login-shell">
                <div className="login-card fade-in">
                    <div className="login-card-top">
                        <span className="login-kicker">Recuperação de acesso</span>
                        <h1 className="login-title">Recuperar palavra-passe</h1>
                        <p className="login-sub">
                            Introduz o teu email para receberes um link de redefinição.
                        </p>
                    </div>

                    {erro && <div className="alert error">{erro}</div>}

                    <form className="row" onSubmit={onSubmit}>
                        <input
                            className="input"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            autoComplete="email"
                            required
                        />

                        <div className="actions login-actions">
                            <button className="btn btn-primary" type="submit" disabled={loading}>
                                {loading ? "A enviar..." : "Enviar link"}
                            </button>

                            <Link className="btn" to="/login">
                                Voltar ao login
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}