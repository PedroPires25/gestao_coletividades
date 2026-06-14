import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import {
    apiRegister,
    getRegisterContext,
    getModalidadesDoClube,
    getAtividadesDaColetividade,
    getAtividades
} from "../api";
import PasswordChecklist from "../components/PasswordChecklist";
import ConfirmPasswordStatus from "../components/ConfirmPasswordStatus";
import { useTheme } from "../theme/ThemeContext";
import { evaluatePassword } from "../utils/passwordStrength";
import { useAppLogo } from "../hooks/useAppLogo";

const EyeOpenIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2.062 12.349a12.24 12.24 0 0 1 19.876 0" />
        <circle cx="12" cy="12" r="3" />
    </svg>
);

const EyeClosedIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
    opacity: 0.8,
    display: "flex",
    color: "#333333",
    zIndex: 2,
    padding: "4px",
    transition: "opacity 0.2s ease",
};

const PERFIS_CLUBE = ["ATLETA", "TREINADOR_PRINCIPAL", "DEPARTAMENTO_MEDICO"];
const PERFIS_COLETIVIDADE = ["UTENTE"];
const PERFIS_MISTOS = ["ADMINISTRADOR", "STAFF", "SECRETARIO", "PROFESSOR", "TREINADOR_COLETIVIDADE", "USER"];

const PERFIL_LABELS = {
    ADMINISTRADOR: "Administrador",
    USER: "Utilizador",
    ATLETA: "Atleta",
    UTENTE: "Inscrito (Coletividade)",
    STAFF: "Staff",
    PROFESSOR: "Professor (Coletividade/Clube)",
    TREINADOR_COLETIVIDADE: "Treinador da Coletividade",
    TREINADOR_PRINCIPAL: "Treinador Principal",
    DEPARTAMENTO_MEDICO: "Departamento Médico",
    SECRETARIO: "Secretário",
};

export default function LoginPage() {
    const { login, loginConfirm } = useAuth();
    const { theme, setTheme } = useTheme();
    const navigate = useNavigate();
    const logoSrc = useAppLogo();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [erro, setErro] = useState("");
    const [loading, setLoading] = useState(false);

    // Seleção de conta quando o mesmo email existe em múltiplas estruturas
    const [contasPendentes, setContasPendentes] = useState(null);
    const [loadingConta, setLoadingConta] = useState(false);
    const [erroSelecao, setErroSelecao] = useState("");

    const [open, setOpen] = useState(false);
    const [rEmail, setREmail] = useState("");
    const [rPass, setRPass] = useState("");
    const [rPass2, setRPass2] = useState("");
    const [rPerfil, setRPerfil] = useState("USER");
    const [rEstruturaTipo, setREstruturaTipo] = useState("");
    const [rClubeId, setRClubeId] = useState("");
    const [rModalidadeId, setRModalidadeId] = useState("");
    const [rColetividadeId, setRColetividadeId] = useState("");
    const [rAtividadeIds, setRAtividadeIds] = useState([]);
    const [profiles, setProfiles] = useState([
        "ADMINISTRADOR",
        "USER",
        "ATLETA",
        "UTENTE",
        "STAFF",
        "PROFESSOR",
        "TREINADOR_PRINCIPAL",
        "DEPARTAMENTO_MEDICO",
        "SECRETARIO",
    ]);

    const [clubes, setClubes] = useState([]);
    const [coletividades, setColetividades] = useState([]);
    const [modalidades, setModalidades] = useState([]);
    const [atividades, setAtividades] = useState([]);
    const [registerBaseDataLoaded, setRegisterBaseDataLoaded] = useState(false);
    const [registerBaseDataLoading, setRegisterBaseDataLoading] = useState(false);
    const [registerBaseDataError, setRegisterBaseDataError] = useState("");

    const [showRPass, setShowRPass] = useState(false);
    const [showRPass2, setShowRPass2] = useState(false);
    const [rErro, setRErro] = useState("");
    const [rOk, setROk] = useState("");
    const [rLoading, setRLoading] = useState(false);

    // ── consentimentos ──
    const [consentGeral, setConsentGeral] = useState(false);
    const [consentDados, setConsentDados] = useState(false);
    const [triedSubmit, setTriedSubmit] = useState(false);

    const [successToast, setSuccessToast] = useState("");

    const registerPasswordState = evaluatePassword(rPass);

    useEffect(() => {
        if (!open || registerBaseDataLoaded || registerBaseDataLoading) {
            return undefined;
        }

        let ignore = false;

        async function loadBaseData() {
            setRegisterBaseDataLoading(true);
            setRegisterBaseDataError("");
            try {
                const context = await getRegisterContext();

                if (ignore) return;

                if (Array.isArray(context?.profiles) && context.profiles.length > 0) {
                    setProfiles(context.profiles.filter((p) => p !== "SUPER_ADMIN"));
                }

                setClubes(Array.isArray(context?.clubes) ? context.clubes : []);
                setColetividades(Array.isArray(context?.coletividades) ? context.coletividades : []);
                setRegisterBaseDataLoaded(true);
            } catch (e) {
                if (!ignore) {
                    setClubes([]);
                    setColetividades([]);
                    setRegisterBaseDataError(e.message || "Não foi possível carregar os dados do registo.");
                    setRegisterBaseDataLoaded(true);
                }
            } finally {
                if (!ignore) {
                    setRegisterBaseDataLoading(false);
                }
            }
        }

        loadBaseData();
        return () => {
            ignore = true;
        };
    }, [open, registerBaseDataLoaded]); // registerBaseDataLoading is an internal guard, not an external trigger

    useEffect(() => {
        if (PERFIS_CLUBE.includes(rPerfil)) {
            void Promise.resolve().then(() => {
                setREstruturaTipo("CLUBE");
                setRColetividadeId("");
                setRAtividadeIds([]);
            });
        } else if (PERFIS_COLETIVIDADE.includes(rPerfil)) {
            void Promise.resolve().then(() => {
                setREstruturaTipo("COLETIVIDADE");
                setRClubeId("");
                setRModalidadeId("");
            });
        } else if (PERFIS_MISTOS.includes(rPerfil)) {
            if (!["CLUBE", "COLETIVIDADE"].includes(rEstruturaTipo)) {
                void Promise.resolve().then(() => setREstruturaTipo("CLUBE"));
            }
        } else {
            void Promise.resolve().then(() => {
                setREstruturaTipo("");
                setRClubeId("");
                setRModalidadeId("");
                setRColetividadeId("");
                setRAtividadeIds([]);
            });
        }
    }, [rPerfil, rEstruturaTipo]);

    useEffect(() => {
        let ignore = false;

        async function loadModalidades() {
            if (!rClubeId) {
                setModalidades([]);
                setRModalidadeId("");
                return;
            }

            try {
                const data = await getModalidadesDoClube(rClubeId, { apenasAtivas: true });
                if (!ignore) {
                    setModalidades(Array.isArray(data) ? data : []);
                }
            } catch {
                if (!ignore) {
                    setModalidades([]);
                }
            }
        }

        loadModalidades();
        return () => {
            ignore = true;
        };
    }, [rClubeId]);

    useEffect(() => {
        let ignore = false;

        async function loadAtividades() {
            if (!rColetividadeId) {
                setAtividades([]);
                setRAtividadeIds([]);
                return;
            }

            try {
                const data = await getAtividadesDaColetividade(rColetividadeId);
                if (!ignore) {
                    setAtividades(Array.isArray(data) ? data : []);
                }
            } catch {
                try {
                    const fallback = await getAtividades();
                    if (!ignore) {
                        setAtividades(Array.isArray(fallback) ? fallback : []);
                    }
                } catch {
                    if (!ignore) {
                        setAtividades([]);
                    }
                }
            }
        }

        loadAtividades();
        return () => {
            ignore = true;
        };
    }, [rColetividadeId]);

    function resetRegisterContextByEstrutura(tipo) {
        setREstruturaTipo(tipo);
        if (tipo === "CLUBE") {
            setRColetividadeId("");
            setRAtividadeIds([]);
            setAtividades([]);
        } else if (tipo === "COLETIVIDADE") {
            setRClubeId("");
            setRModalidadeId("");
            setModalidades([]);
        }
    }

    function closeRegisterModal() {
        setOpen(false);
        setRegisterBaseDataLoaded(false);
        setRegisterBaseDataLoading(false);
        setRegisterBaseDataError("");
        setConsentGeral(false);
        setConsentDados(false);
        setTriedSubmit(false);
    }

    async function onSubmit(e) {
        e.preventDefault();
        setErro("");
        setLoading(true);

        try {
            const response = await login(email.trim(), password);

            // Múltiplas contas: mostrar seletor
            if (response?.requiresSelection) {
                setContasPendentes(response.contas);
                return;
            }

            // Verificar se está pendente de aprovação
            if (response?.user?.estadoRegisto !== "APROVADO") {
                navigate("/pending-approval", { replace: true });
                return;
            }

            const redirectUrl = response?.redirectUrl || "/menu";
            navigate(redirectUrl, { replace: true });
        } catch (e) {
            setErro(e.message || "Credenciais inválidas.");
        } finally {
            setLoading(false);
        }
    }

    async function onSelecionarConta(userId) {
        setErroSelecao("");
        setLoadingConta(true);
        try {
            const response = await loginConfirm(userId, email.trim(), password);

            if (response?.user?.estadoRegisto !== "APROVADO") {
                navigate("/pending-approval", { replace: true });
                return;
            }

            setContasPendentes(null);
            const redirectUrl = response?.redirectUrl || "/menu";
            navigate(redirectUrl, { replace: true });
        } catch (e) {
            setErroSelecao(e.message || "Erro ao entrar nesta conta.");
        } finally {
            setLoadingConta(false);
        }
    }

    const needsClube = useMemo(() => {
        return PERFIS_CLUBE.includes(rPerfil) || (PERFIS_MISTOS.includes(rPerfil) && rEstruturaTipo === "CLUBE");
    }, [rPerfil, rEstruturaTipo]);

    const needsColetividade = useMemo(() => {
        return PERFIS_COLETIVIDADE.includes(rPerfil) || (PERFIS_MISTOS.includes(rPerfil) && rEstruturaTipo === "COLETIVIDADE");
    }, [rPerfil, rEstruturaTipo]);

    async function onRegister() {
        setRErro("");
        setROk("");
        setTriedSubmit(true);

        const precisaConsentDados = rPerfil !== "USER";
        if (!consentGeral || (precisaConsentDados && !consentDados)) {
            return;
        }

        if (!rEmail.trim()) {
            setRErro("O email é obrigatório.");
            return;
        }

        if (!rPerfil) {
            setRErro("Seleciona um perfil.");
            return;
        }

        if (registerBaseDataError) {
            setRErro(registerBaseDataError);
            return;
        }

        if (!registerPasswordState.isValid) {
            setRErro("A palavra-passe não cumpre todos os critérios de segurança.");
            return;
        }

        if (rPass !== rPass2) {
            setRErro("As passwords não coincidem.");
            return;
        }

        if (PERFIS_CLUBE.includes(rPerfil)) {
            if (clubes.length === 0) {
                setRErro("Nenhum clube disponível.");
                return;
            }
            if (!rClubeId) {
                setRErro("Seleciona um clube.");
                return;
            }
            if ((rPerfil === "ATLETA" || rPerfil === "TREINADOR_PRINCIPAL") && !rModalidadeId) {
                setRErro("Seleciona uma modalidade.");
                return;
            }
        }

        if (PERFIS_COLETIVIDADE.includes(rPerfil)) {
            if (coletividades.length === 0) {
                setRErro("Nenhuma coletividade disponível.");
                return;
            }
            if (!rColetividadeId) {
                setRErro("Seleciona uma coletividade.");
                return;
            }
            if (rAtividadeIds.length === 0) {
                setRErro("Selecione pelo menos uma atividade.");
                return;
            }
        }

        if (PERFIS_MISTOS.includes(rPerfil)) {
            if (!rEstruturaTipo) {
                setRErro("Seleciona CLUBE ou COLETIVIDADE.");
                return;
            }
            if (rPerfil === "TREINADOR_COLETIVIDADE" && rEstruturaTipo === "CLUBE") {
                setRErro("O perfil Treinador da Coletividade só pode ser associado a uma Coletividade.");
                return;
            }
            if (rEstruturaTipo === "CLUBE" && clubes.length === 0) {
                setRErro("Nenhum clube disponível.");
                return;
            }
            if (rEstruturaTipo === "CLUBE" && !rClubeId) {
                setRErro("Seleciona um clube.");
                return;
            }
            if (rEstruturaTipo === "COLETIVIDADE" && coletividades.length === 0) {
                setRErro("Nenhuma coletividade disponível.");
                return;
            }
            if (rEstruturaTipo === "COLETIVIDADE" && !rColetividadeId) {
                setRErro("Seleciona uma coletividade.");
                return;
            }
        }

        const payload = {
            email: rEmail.trim(),
            password: rPass,
            confirmPassword: rPass2,
            perfil: rPerfil,
            estruturaTipo: rEstruturaTipo || null,
            clubeId: rClubeId ? Number(rClubeId) : null,
            modalidadeId: rModalidadeId ? Number(rModalidadeId) : null,
            coletividadeId: rColetividadeId ? Number(rColetividadeId) : null,
            atividadeIds: rAtividadeIds,
        };

        setRLoading(true);
        try {
            const mensagem = await apiRegister(payload);
            const successMsg = typeof mensagem === "string" && mensagem.trim()
                ? mensagem
                : "Utilizador criado com sucesso.";
            closeRegisterModal();
            setSuccessToast(successMsg);
            setTimeout(() => setSuccessToast(""), 3000);
        } catch (e) {
            setRErro(e.message || "Erro ao criar utilizador.");
        } finally {
            setRLoading(false);
        }
    }

    const perfilPrecisaAprovacao = rPerfil !== "USER";

    const fieldErrStyle = (isEmpty) =>
        triedSubmit && isEmpty
            ? { borderColor: "#e05252", boxShadow: "0 0 0 3px rgba(224, 82, 82, 0.18)" }
            : undefined;

    function handleAtividadeChange(atividadeId) {
        setRAtividadeIds(prev =>
            prev.includes(atividadeId)
                ? prev.filter(id => id !== atividadeId)
                : [...prev, atividadeId]
        );
    }

    return (
        <div className="login-page">
            <a href="/" className="login-brand" aria-label="Gestão de Coletividades">
                <img
                    src={logoSrc}
                    alt="Gestão de Clubes Desportivos e Coletividades"
                    className="login-logo-fixed"
                />
            </a>

            <div className="login-theme-floating">
                <label className="login-theme-floating-wrap" htmlFor="themeSelect">
                    <span className="login-theme-floating-label">Visualização</span>
                    <select
                        id="themeSelect"
                        className="login-theme-floating-select"
                        value={theme}
                        onChange={(e) => setTheme(e.target.value)}
                    >
                        <option value="theme-normal">Normal</option>
                        <option value="theme-light">White</option>
                        <option value="theme-dark">Black</option>
                    </select>
                </label>
            </div>

            <div className="login-shell">
                <div className="login-card fade-in">
                    <div className="login-card-top">
                        <span className="login-kicker">Plataforma de gestão</span>
                        <h1 className="login-title">Área Reservada</h1>
                        <p className="login-sub">Entra com as tuas credenciais.</p>
                    </div>

                    {erro && <div className="alert error">{erro}</div>}

                    <form className="row" onSubmit={onSubmit}>
                        <input
                            className="input"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            autoComplete="username"
                        />

                        <div style={{ position: "relative" }}>
                            <input
                                className="input"
                                type={showPassword ? "text" : "password"}
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                autoComplete="current-password"
                                style={{ paddingRight: "45px" }}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                style={eyeButtonStyle}
                            >
                                {showPassword ? <EyeOpenIcon /> : <EyeClosedIcon />}
                            </button>
                        </div>

                        <div className="login-meta-row">
                            <Link className="login-forgot-link" to="/forgot-password">
                                Esqueci-me da palavra-passe
                            </Link>
                        </div>

                        <div className="actions login-actions">
                            <button className="btn btn-primary" type="submit" disabled={loading}>
                                {loading ? "A entrar..." : "Entrar"}
                            </button>
                            <button type="button" className="btn" onClick={() => setOpen(true)}>
                                Criar utilizador
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {successToast && (
                <div
                    role="status"
                    aria-live="polite"
                    style={{
                        position: "fixed",
                        top: 28,
                        left: "50%",
                        transform: "translateX(-50%)",
                        background: "#1e7d3a",
                        color: "#fff",
                        padding: "14px 22px",
                        borderRadius: 10,
                        boxShadow: "0 8px 28px rgba(0,0,0,0.35)",
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        zIndex: 2000,
                        maxWidth: "90vw",
                        fontSize: 14,
                        fontWeight: 500,
                        animation: "fadeInDown 0.25s ease"
                    }}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span>{successToast}</span>
                </div>
            )}

            {contasPendentes && (
                <div className="modal-backdrop" onMouseDown={() => setContasPendentes(null)}>
                    <div className="modal scale-in" onMouseDown={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Selecionar conta</h3>
                            <button
                                className="btn modal-close"
                                type="button"
                                onClick={() => { setContasPendentes(null); setErroSelecao(""); }}
                            >
                                ×
                            </button>
                        </div>
                        <div className="modal-body">
                            <p style={{ marginBottom: 16, color: "var(--text-secondary, #666)" }}>
                                O email <strong>{email}</strong> está associado a várias contas. Seleciona a que pretendes usar:
                            </p>
                            {erroSelecao && <div className="alert error">{erroSelecao}</div>}
                            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                {contasPendentes.map((conta) => (
                                    <button
                                        key={conta.userId}
                                        className="btn"
                                        disabled={loadingConta}
                                        onClick={() => onSelecionarConta(conta.userId)}
                                        style={{
                                            textAlign: "left",
                                            padding: "12px 16px",
                                            display: "flex",
                                            flexDirection: "column",
                                            gap: 2,
                                        }}
                                    >
                                        <span style={{ fontWeight: 600 }}>{conta.estruturaNome}</span>
                                        <span style={{ fontSize: 12, opacity: 0.75 }}>
                                            {conta.estruturaTipo === "CLUBE" ? "🏟 Clube" : conta.estruturaTipo === "COLETIVIDADE" ? "🏛 Coletividade" : "⚙ Sistema"}
                                            {" · "}{conta.role}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {open && (
                <div className="modal-backdrop" onMouseDown={closeRegisterModal}>
                    <div className="modal scale-in" onMouseDown={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Novo Utilizador</h3>
                            <button className="btn modal-close" onClick={closeRegisterModal} type="button">
                                ×
                            </button>
                        </div>

                        <div className="modal-body">
                        {rErro && <div className="alert error">{rErro}</div>}
                        {rOk && <div className="alert ok">{rOk}</div>}
                        {registerBaseDataLoading && <div className="hint">A carregar dados do registo...</div>}
                        {!registerBaseDataLoading && registerBaseDataError && (
                            <div className="hint" style={{ color: "#e05252" }}>
                                {registerBaseDataError}
                            </div>
                        )}

                        <div className="row">
                            <input
                                className="input"
                                placeholder="Email"
                                value={rEmail}
                                onChange={(e) => setREmail(e.target.value)}
                                style={fieldErrStyle(!rEmail.trim())}
                            />

                            <select
                                className="input"
                                value={rPerfil}
                                onChange={(e) => setRPerfil(e.target.value)}
                            >
                                {profiles.map((p) => (
                                    <option key={p} value={p}>
                                        {PERFIL_LABELS[p] || p}
                                    </option>
                                ))}
                            </select>

                            {PERFIS_MISTOS.includes(rPerfil) && (
                                <select
                                    className="input"
                                    value={rEstruturaTipo}
                                    onChange={(e) => resetRegisterContextByEstrutura(e.target.value)}
                                    style={fieldErrStyle(!rEstruturaTipo)}
                                >
                                    <option value="">Selecionar estrutura</option>
                                    <option value="CLUBE">CLUBE</option>
                                    <option value="COLETIVIDADE">COLETIVIDADE</option>
                                </select>
                            )}

                            {needsClube && (
                                <select
                                    className="input"
                                    value={rClubeId}
                                    onChange={(e) => setRClubeId(e.target.value)}
                                    style={fieldErrStyle(!rClubeId)}
                                    disabled={registerBaseDataLoading || clubes.length === 0}
                                >
                                    <option value="">
                                        {registerBaseDataLoading
                                            ? "A carregar clubes..."
                                            : clubes.length === 0
                                                ? "Nenhum clube disponível"
                                                : "Selecionar clube"}
                                    </option>
                                    {clubes.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.nome}
                                        </option>
                                    ))}
                                </select>
                            )}

                            {needsClube && rPerfil !== "USER" && (
                                <select
                                    className="input"
                                    value={rModalidadeId}
                                    onChange={(e) => setRModalidadeId(e.target.value)}
                                    style={fieldErrStyle(
                                        (rPerfil === "ATLETA" || rPerfil === "TREINADOR_PRINCIPAL") && !rModalidadeId
                                    )}
                                >
                                    <option value="">Selecionar modalidade</option>
                                    {modalidades.map((m) => (
                                        <option
                                            key={m.modalidade?.id}
                                            value={m.modalidade?.id}
                                        >
                                            {m.modalidade?.nome}
                                        </option>
                                    ))}
                                </select>
                            )}

                            {needsColetividade && (
                                <select
                                    className="input"
                                    value={rColetividadeId}
                                    onChange={(e) => setRColetividadeId(e.target.value)}
                                    style={fieldErrStyle(!rColetividadeId)}
                                    disabled={registerBaseDataLoading || coletividades.length === 0}
                                >
                                    <option value="">
                                        {registerBaseDataLoading
                                            ? "A carregar coletividades..."
                                            : coletividades.length === 0
                                                ? "Nenhuma coletividade disponível"
                                                : "Selecionar coletividade"}
                                    </option>
                                    {coletividades.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.nome}
                                        </option>
                                    ))}
                                </select>
                            )}

                            {needsColetividade && rPerfil !== "USER" && (
                                <div>
                                    <label>Atividades</label>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        {atividades.map((a) => (
                                            <label key={a.atividade?.id ?? a.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <input
                                                    type="checkbox"
                                                    checked={rAtividadeIds.includes(a.atividade?.id ?? a.atividadeId ?? a.id)}
                                                    onChange={() => handleAtividadeChange(a.atividade?.id ?? a.atividadeId ?? a.id)}
                                                />
                                                {a.atividade?.nome ?? a.nome ?? `Atividade ${a.atividadeId ?? a.id}`}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {perfilPrecisaAprovacao && (
                                <div className="hint">
                                    Este perfil fica pendente até aprovação da entidade responsável.
                                </div>
                            )}

                            <div style={{ position: "relative" }}>
                                <input
                                    className="input"
                                    type={showRPass ? "text" : "password"}
                                    placeholder="Password"
                                    value={rPass}
                                    onChange={(e) => setRPass(e.target.value)}
                                    style={{ paddingRight: "45px", ...(fieldErrStyle(!registerPasswordState.isValid) || {}) }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowRPass(!showRPass)}
                                    style={eyeButtonStyle}
                                >
                                    {showRPass ? <EyeOpenIcon /> : <EyeClosedIcon />}
                                </button>
                            </div>

                            <PasswordChecklist password={rPass} />

                            <div style={{ position: "relative" }}>
                                <input
                                    className="input"
                                    type={showRPass2 ? "text" : "password"}
                                    placeholder="Confirmar password"
                                    value={rPass2}
                                    onChange={(e) => setRPass2(e.target.value)}
                                    style={{ paddingRight: "45px", ...(fieldErrStyle(!rPass2 || rPass !== rPass2) || {}) }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowRPass2(!showRPass2)}
                                    style={eyeButtonStyle}
                                >
                                    {showRPass2 ? <EyeOpenIcon /> : <EyeClosedIcon />}
                                </button>
                            </div>

                            <ConfirmPasswordStatus
                                password={rPass}
                                confirmPassword={rPass2}
                            />

                            {/* ── CONSENTIMENTOS ── */}
                            <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>
                                {/* Consentimento Geral — OBRIGATÓRIO */}
                                <label style={{
                                    display: "flex",
                                    gap: 10,
                                    alignItems: "flex-start",
                                    cursor: "pointer",
                                    fontSize: 13,
                                    padding: triedSubmit && !consentGeral ? "8px 10px" : 0,
                                    border: triedSubmit && !consentGeral ? "1px solid #e05252" : "1px solid transparent",
                                    borderRadius: 6,
                                    background: triedSubmit && !consentGeral ? "rgba(224, 82, 82, 0.08)" : "transparent",
                                    color: triedSubmit && !consentGeral ? "#e05252" : "inherit",
                                    transition: "all 0.15s ease"
                                }}>
                                    <input
                                        type="checkbox"
                                        checked={consentGeral}
                                        onChange={(e) => setConsentGeral(e.target.checked)}
                                        style={{ marginTop: 2, flexShrink: 0, accentColor: triedSubmit && !consentGeral ? "#e05252" : undefined }}
                                    />
                                    <span>
                                        Declaro que li e aceito os{" "}
                                        <a href="/politica-privacidade" target="_blank" rel="noopener noreferrer"
                                           style={{ color: "#4da6ff" }}>
                                            Termos e Condições e a Política de Privacidade
                                        </a>{" "}
                                        da plataforma. <span style={{ color: "#e05252" }}>*</span>
                                    </span>
                                </label>

                                {/* Consentimento Dados — OBRIGATÓRIO em todos os perfis exceto USER */}
                                {rPerfil !== "USER" && (
                                    <label style={{
                                        display: "flex",
                                        gap: 10,
                                        alignItems: "flex-start",
                                        cursor: "pointer",
                                        fontSize: 13,
                                        padding: triedSubmit && !consentDados ? "8px 10px" : 0,
                                        border: triedSubmit && !consentDados ? "1px solid #e05252" : "1px solid transparent",
                                        borderRadius: 6,
                                        background: triedSubmit && !consentDados ? "rgba(224, 82, 82, 0.08)" : "transparent",
                                        color: triedSubmit && !consentDados ? "#e05252" : "inherit",
                                        transition: "all 0.15s ease"
                                    }}>
                                        <input
                                            type="checkbox"
                                            checked={consentDados}
                                            onChange={(e) => setConsentDados(e.target.checked)}
                                            style={{ marginTop: 2, flexShrink: 0, accentColor: triedSubmit && !consentDados ? "#e05252" : undefined }}
                                        />
                                        <span>
                                            Autorizo a recolha e tratamento dos meus dados pessoais (ou, caso se aplique,
                                            do menor sob minha responsabilidade), incluindo informação médica necessária
                                            às atividades desportivas e culturais. <span style={{ color: "#e05252" }}>*</span>
                                        </span>
                                    </label>
                                )}

                                <p style={{ fontSize: 11, color: "#888", margin: 0 }}>
                                    <span style={{ color: "#e05252" }}>*</span> Campo obrigatório
                                </p>
                            </div>
                        </div>
                        </div>

                        <div className="modal-footer">
                            <button className="btn" type="button" onClick={closeRegisterModal}>
                                Cancelar
                            </button>
                            <button
                                className="btn btn-primary"
                                type="button"
                                disabled={rLoading}
                                onClick={onRegister}
                            >
                                {rLoading ? "A criar..." : "Registar"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}