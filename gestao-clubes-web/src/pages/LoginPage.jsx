import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import {
    apiRegister,
    getRegisterProfiles,
    getClubes,
    getColetividades,
    getModalidadesDoClube,
    getAtividadesDaColetividade,
    getAtividades
} from "../api";
import PasswordChecklist from "../components/PasswordChecklist";
import ConfirmPasswordStatus from "../components/ConfirmPasswordStatus";
import { useTheme } from "../theme/ThemeContext";
import { evaluatePassword } from "../utils/passwordStrength";

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
const PERFIS_MISTOS = ["ADMINISTRADOR", "STAFF", "SECRETARIO", "PROFESSOR", "USER"];

export default function LoginPage() {
    const { login } = useAuth();
    const { theme, setTheme } = useTheme();
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [erro, setErro] = useState("");
    const [loading, setLoading] = useState(false);

    const [open, setOpen] = useState(false);
    const [rEmail, setREmail] = useState("");
    const [rPass, setRPass] = useState("");
    const [rPass2, setRPass2] = useState("");
    const [rPerfil, setRPerfil] = useState("USER");
    const [rEstruturaTipo, setREstruturaTipo] = useState("");
    const [rClubeId, setRClubeId] = useState("");
    const [rModalidadeId, setRModalidadeId] = useState("");
    const [rColetividadeId, setRColetividadeId] = useState("");
    const [rAtividadeId, setRAtividadeId] = useState("");
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

    const [showRPass, setShowRPass] = useState(false);
    const [showRPass2, setShowRPass2] = useState(false);
    const [rErro, setRErro] = useState("");
    const [rOk, setROk] = useState("");
    const [rLoading, setRLoading] = useState(false);

    const registerPasswordState = evaluatePassword(rPass);

    useEffect(() => {
        let ignore = false;

        async function loadBaseData() {
            try {
                const [profilesData, clubesData, coletividadesData] = await Promise.all([
                    getRegisterProfiles(),
                    getClubes().catch(() => []),
                    getColetividades().catch(() => []),
                ]);

                if (ignore) return;

                if (Array.isArray(profilesData) && profilesData.length > 0) {
                    setProfiles(profilesData.filter((p) => p !== "SUPER_ADMIN"));
                }

                setClubes(Array.isArray(clubesData) ? clubesData : []);
                setColetividades(Array.isArray(coletividadesData) ? coletividadesData : []);
            } catch {
                // sem ação
            }
        }

        loadBaseData();
        return () => {
            ignore = true;
        };
    }, []);

    useEffect(() => {
        if (PERFIS_CLUBE.includes(rPerfil)) {
            setREstruturaTipo("CLUBE");
            setRColetividadeId("");
            setRAtividadeId("");
        } else if (PERFIS_COLETIVIDADE.includes(rPerfil)) {
            setREstruturaTipo("COLETIVIDADE");
            setRClubeId("");
            setRModalidadeId("");
        } else if (PERFIS_MISTOS.includes(rPerfil)) {
            if (!["CLUBE", "COLETIVIDADE"].includes(rEstruturaTipo)) {
                setREstruturaTipo("CLUBE");
            }
        } else {
            setREstruturaTipo("");
            setRClubeId("");
            setRModalidadeId("");
            setRColetividadeId("");
            setRAtividadeId("");
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
                setRAtividadeId("");
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
            setRAtividadeId("");
            setAtividades([]);
        } else if (tipo === "COLETIVIDADE") {
            setRClubeId("");
            setRModalidadeId("");
            setModalidades([]);
        }
    }

    async function onSubmit(e) {
        e.preventDefault();
        setErro("");
        setLoading(true);

        try {
            const response = await login(email.trim(), password);

            // Verificar se está pendente de aprovação
            if (response?.user?.estadoRegisto !== "APROVADO") {
                navigate("/pending-approval", { replace: true });
                return;
            }

            // Usar redirectUrl calculado no AuthContext
            const redirectUrl = response?.redirectUrl || "/menu";
            navigate(redirectUrl, { replace: true });
        } catch (e) {
            setErro(e.message || "Credenciais inválidas.");
        } finally {
            setLoading(false);
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

        if (!rEmail.trim()) {
            setRErro("O email é obrigatório.");
            return;
        }

        if (!rPerfil) {
            setRErro("Seleciona um perfil.");
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
            if (!rColetividadeId) {
                setRErro("Seleciona uma coletividade.");
                return;
            }
        }

        if (PERFIS_MISTOS.includes(rPerfil)) {
            if (!rEstruturaTipo) {
                setRErro("Seleciona CLUBE ou COLETIVIDADE.");
                return;
            }
            if (rEstruturaTipo === "CLUBE" && !rClubeId) {
                setRErro("Seleciona um clube.");
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
            atividadeId: rAtividadeId ? Number(rAtividadeId) : null,
        };

        setRLoading(true);
        try {
            const mensagem = await apiRegister(payload);
            setROk(typeof mensagem === "string" ? mensagem : "Utilizador criado com sucesso.");
        } catch (e) {
            setRErro(e.message || "Erro ao criar utilizador.");
        } finally {
            setRLoading(false);
        }
    }

    const perfilPrecisaAprovacao = rPerfil !== "USER";

    return (
        <div className="login-page">
            <a href="/" className="login-brand" aria-label="Gestão de Coletividades">
                <img
                    src="/logo.png"
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

            {open && (
                <div className="modal-backdrop" onMouseDown={() => setOpen(false)}>
                    <div className="modal scale-in" onMouseDown={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Novo Utilizador</h3>
                            <button className="btn modal-close" onClick={() => setOpen(false)} type="button">
                                ×
                            </button>
                        </div>

                        {rErro && <div className="alert error">{rErro}</div>}
                        {rOk && <div className="alert ok">{rOk}</div>}

                        <div className="row">
                            <input
                                className="input"
                                placeholder="Email"
                                value={rEmail}
                                onChange={(e) => setREmail(e.target.value)}
                            />

                            <select
                                className="input"
                                value={rPerfil}
                                onChange={(e) => setRPerfil(e.target.value)}
                            >
                                {profiles.map((p) => (
                                    <option key={p} value={p}>
                                        {p}
                                    </option>
                                ))}
                            </select>

                            {PERFIS_MISTOS.includes(rPerfil) && (
                                <select
                                    className="input"
                                    value={rEstruturaTipo}
                                    onChange={(e) => resetRegisterContextByEstrutura(e.target.value)}
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
                                >
                                    <option value="">Selecionar clube</option>
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
                                >
                                    <option value="">Selecionar coletividade</option>
                                    {coletividades.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.nome}
                                        </option>
                                    ))}
                                </select>
                            )}

                            {needsColetividade && rPerfil !== "USER" && (
                                <select
                                    className="input"
                                    value={rAtividadeId}
                                    onChange={(e) => setRAtividadeId(e.target.value)}
                                >
                                    <option value="">Selecionar atividade</option>
                                    {atividades.map((a) => (
                                        <option
                                            key={a.atividade?.id ?? a.id}
                                            value={a.atividade?.id ?? a.atividadeId ?? a.id}
                                        >
                                            {a.atividade?.nome ?? a.nome ?? `Atividade ${a.atividadeId ?? a.id}`}
                                        </option>
                                    ))}
                                </select>
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
                                    style={{ paddingRight: "45px" }}
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
                                    style={{ paddingRight: "45px" }}
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
                        </div>

                        <div className="modal-footer">
                            <button className="btn" type="button" onClick={() => setOpen(false)}>
                                Cancelar
                            </button>
                            <button
                                className="btn btn-primary"
                                type="button"
                                disabled={rLoading || !registerPasswordState.isValid || rPass !== rPass2}
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
