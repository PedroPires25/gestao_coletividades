import { useState } from "react";
import { Link, useNavigate } from "react-router-dom"; // 1. Adicionado useNavigate aqui

const API_URL = "http://localhost:8080/api";

export default function ForgotPasswordPage() {
    const navigate = useNavigate(); // 2. Inicializado o hook de navegação
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [erro, setErro] = useState("");
    // 3. Removido o estado 'ok' pois já não vamos mostrar a caixa verde aqui

    async function onSubmit(e) {
        e.preventDefault();
        setErro("");
        setLoading(true);

        try {
            const res = await fetch(`${API_URL}/auth/forgot-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: email.trim() }),
            });

            // 4. Se a resposta for positiva, saltamos logo para a página de sucesso
            if (res.ok) {
                window.location.href = "/recuperar-password/confirmar";
                return;
            }

            // Se chegou aqui, houve um erro
            const text = await res.text();
            throw new Error(text || "Não foi possível iniciar a recuperação.");

        } catch (e) {
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
                    {/* 5. A div do 'ok' foi removida para garantir que não aparece a caixa verde */}

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