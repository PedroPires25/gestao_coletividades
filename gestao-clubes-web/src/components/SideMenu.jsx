import { Link } from "react-router-dom";
import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { useTheme } from "../theme/ThemeContext";
import { useAuth } from "../auth/AuthContext";
import UserAvatar from "./UserAvatar";
import { useAppLogo } from "../hooks/useAppLogo";
import { getHomePathByRole } from "../utils/navigation";
import { getPendingUsersCount } from "../api";
import NotificacoesBell from "./NotificacoesBell";
import NotificacaoPendenteBanner from "./NotificacaoPendenteBanner";

import homeIcon from "../assets/home.svg";
import clubesIcon from "../assets/clubes.svg";
import coletividadesIcon from "../assets/coletividades.svg";
import perfisIcon from "../assets/perfis.svg";
import logoutIcon from "../assets/logout.svg";
import modalidadesIcon from "../assets/modalidades.svg";
import atletasIcon from "../assets/atletas.svg";
import staffIcon from "../assets/staff.svg";
import transferenciasIcon from "../assets/transferencias.svg";
import utilizadoresAprovarIcon from "../assets/utilizadores-por-aprovar.svg";
import utilizadoresAutorizadosIcon from "../assets/utilizadores-autorizados.svg";
import eventosIcon from "../assets/eventos.svg";
import departamentoMedicoIcon from "../assets/departamento-medico.svg";
import direcaoIcon from "../assets/direcao.svg";

// Ícones do Módulo de Treinador
import treinoIcon from "../assets/treino.svg";
import planoTreinoIcon from "../assets/plano-treino.svg";
import estatisticasIcon from "../assets/estatisticas.svg";
import convocatoriasIcon from "../assets/convocatorias.svg";


const MENU_ICONS = {
    Home: homeIcon,
    Clubes: clubesIcon,
    Coletividades: coletividadesIcon,
    Perfis: perfisIcon,
    Logout: logoutIcon,
    "Modalidades do Clube": modalidadesIcon,
    Atletas: atletasIcon,
    Staff: staffIcon,
    Transferências: transferenciasIcon,
    utilizadoresAprovar: utilizadoresAprovarIcon,
    utilizadoresAutorizados: utilizadoresAutorizadosIcon,
    Eventos: eventosIcon,
    "Módulo Clínico": departamentoMedicoIcon,
    "Módulo de Treinador": staffIcon,
    "Eventos do Clube": eventosIcon,
    "Voltar ao Clube": clubesIcon,
    "Voltar": homeIcon,
    "Direção": direcaoIcon,
    "Treinos": treinoIcon,
    "Plano de Treino": planoTreinoIcon,
    "Estatísticas": estatisticasIcon,
    "Convocatórias": convocatoriasIcon,
};

const MENU_ICON_COLORS = [
    "menu-icon-cyan",
    "menu-icon-orange",
    "menu-icon-red",
    "menu-icon-green",
    "menu-icon-purple",
];

function getIcon(label) {
    return MENU_ICONS[label] || null;
}

export default function SideMenu({
                                     title = "Gestão de Coletividades",
                                     subtitle = "",
                                     items = [],
                                     showBurger = true,
                                     eventoBadge = null,
                                 }) {
    const [open, setOpen] = useState(false);
    const { theme, setTheme } = useTheme();
    const { user, isAdmin, isSecretario } = useAuth();
    const logoSrc = useAppLogo();

    const [pendingCount, setPendingCount] = useState(0);

    // ── Notificações (bell + banner) ────────────────────────────────────────
    // Usa getPendingUsersCount (conta utilizadores pendentes reais no DB).
    // canReceiveNotifications: qualquer ADMINISTRADOR aprovado ou SUPER_ADMIN.
    // Não depende de privilegiosAtivos da sessão (pode estar desatualizado em
    // sessões antigas) — o backend valida as permissões reais.
    const canReceiveNotifications =
        user?.role === "SUPER_ADMIN" || user?.role === "ADMINISTRADOR";

    const [notifCount, setNotifCount] = useState(0);
    const prevNotifCountRef = useRef(-1);   // -1 = primeira carga
    const soundPlayedRef    = useRef(false); // som toca uma vez por visita

    function tocarSomNotificacao() {
        if (soundPlayedRef.current) return;
        soundPlayedRef.current = true;
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const t = ctx.currentTime;
            [0, 0.22].forEach((offset) => {
                const osc  = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.type = "sine";
                osc.frequency.value = 880;
                gain.gain.setValueAtTime(0, t + offset);
                gain.gain.linearRampToValueAtTime(0.15, t + offset + 0.02);
                gain.gain.exponentialRampToValueAtTime(0.001, t + offset + 0.18);
                osc.start(t + offset);
                osc.stop(t + offset + 0.2);
            });
        } catch { /* bloqueado pelo browser — ignorado */ }
    }

    const fetchPendingCount = useCallback(() => {
        if (!canReceiveNotifications) return;
        getPendingUsersCount()
            .then(data => {
                const n = Number(data?.count ?? 0);
                setNotifCount(n);
                // Também actualiza o drawer badge
                setPendingCount(n);

                if (prevNotifCountRef.current === -1) {
                    if (n > 0) tocarSomNotificacao();
                } else if (n > prevNotifCountRef.current) {
                    soundPlayedRef.current = false; // permite novo som para novas notificações
                    tocarSomNotificacao();
                }
                prevNotifCountRef.current = n;
            })
            .catch(() => {});
    }, [canReceiveNotifications]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (!canReceiveNotifications) {
            // Secretário: usar contagem separada (sem sino/som)
            if (!isSecretario) return;
            let cancelled = false;
            function fetchSec() {
                getPendingUsersCount()
                    .then(d => { if (!cancelled) setPendingCount(Number(d?.count ?? 0)); })
                    .catch(() => {});
            }
            fetchSec();
            const iv = setInterval(fetchSec, 60_000);
            return () => { cancelled = true; clearInterval(iv); };
        }

        fetchPendingCount();
        const interval = setInterval(fetchPendingCount, 30_000);
        window.addEventListener("notificacoes-refresh", fetchPendingCount);
        return () => {
            clearInterval(interval);
            window.removeEventListener("notificacoes-refresh", fetchPendingCount);
        };
    }, [canReceiveNotifications, isSecretario, fetchPendingCount]);
    // ────────────────────────────────────────────────────────────────────────

    // Determinar o link do logo com base no perfil
    const logoHref = useMemo(() => getHomePathByRole(user), [user]);

    function closeMenu() {
        setOpen(false);
    }

    useEffect(() => {
        if (!open) return;

        function handleKeyDown(e) {
            if (e.key === "Escape") setOpen(false);
        }

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [open]);

    return (
        <>
            <header className="appbar appbar-logo-only">
                {showBurger ? (
                    <button
                        className="burger"
                        onClick={() => setOpen((v) => !v)}
                        aria-label="Abrir menu"
                        type="button"
                    >
                        <span />
                        <span />
                        <span />
                    </button>
                ) : (
                    <div className="burger-placeholder" aria-hidden="true" />
                )}

                <div className="appbar-center-logo-wrap">
                    <Link
                        to={logoHref}
                        className="appbar-logo appbar-logo-centered"
                        title="Voltar à página inicial"
                        onClick={closeMenu}
                    >
                        <img src={logoSrc} alt="Logo" />
                    </Link>
                </div>

                <div className="appbar-right-actions">
                    {/* Sino de notificações — só aparece quando há pendentes */}
                    {canReceiveNotifications && <NotificacoesBell count={notifCount} />}
                    <UserAvatar />
                </div>
            </header>

            {/* Banner de alerta abaixo do header — só para admins com pendentes */}
            {canReceiveNotifications && (
                <NotificacaoPendenteBanner count={notifCount} />
            )}

            {showBurger && (
                <>
                    <aside className={`drawer ${open ? "open" : ""}`} role="dialog" aria-modal="true">
                        <div className="drawer-header">
                            <div>
                                <div className="drawer-title">
                                    {title}
                                    {eventoBadge && (
                                        <span className="badge badge-events" title="Eventos convocados">
                                            {eventoBadge}
                                        </span>
                                    )}
                                </div>
                                {subtitle ? <div className="drawer-sub">{subtitle}</div> : null}
                            </div>

                            <button className="btn drawer-close" onClick={closeMenu} type="button">
                                ×
                            </button>
                        </div>

                        <div className="theme-switcher-card compact-theme-box">
                            <div className="theme-switcher-title">Visualização</div>

                            <div className="theme-inline-options" role="radiogroup" aria-label="Escolha do tema">
                                <label className="theme-inline-option">
                                    <input
                                        type="radio"
                                        name="drawer-theme"
                                        checked={theme === "theme-normal"}
                                        onChange={() => setTheme("theme-normal")}
                                    />
                                    <span>Normal</span>
                                </label>

                                <label className="theme-inline-option">
                                    <input
                                        type="radio"
                                        name="drawer-theme"
                                        checked={theme === "theme-light"}
                                        onChange={() => setTheme("theme-light")}
                                    />
                                    <span>White</span>
                                </label>

                                <label className="theme-inline-option">
                                    <input
                                        type="radio"
                                        name="drawer-theme"
                                        checked={theme === "theme-dark"}
                                        onChange={() => setTheme("theme-dark")}
                                    />
                                    <span>Black</span>
                                </label>
                            </div>
                        </div>

                        <nav className="drawer-nav">
                            {pendingCount > 0 && (isAdmin || isSecretario) && (
                                <Link
                                    to="/admin/users/pending"
                                    className="drawer-pending-alert"
                                    onClick={closeMenu}
                                >
                                    <span className="drawer-pending-alert-icon">⚠️</span>
                                    <span>
                                        {pendingCount === 1
                                            ? "1 utilizador aguarda aprovação"
                                            : `${pendingCount} utilizadores aguardam aprovação`}
                                    </span>
                                    <span className="drawer-pending-alert-badge">{pendingCount}</span>
                                </Link>
                            )}
                            {items.map((it, index) => {
                                const colorClass = MENU_ICON_COLORS[index % MENU_ICON_COLORS.length];
                                const icon = getIcon(it.label);
                                const isPendingItem = it.to === "/admin/users/pending";

                                const content = (
                                    <>
                                        <span className={`drawer-link-icon ${colorClass}`}>
                                            {icon ? (
                                                <img
                                                    src={icon}
                                                    alt={it.label}
                                                    className="drawer-link-symbol"
                                                />
                                            ) : null}
                                        </span>
                                        <span className="drawer-link-text">
                                            {it.label === "utilizadoresAprovar" ? "Utilizadores por Aprovar" : it.label}
                                            {isPendingItem && pendingCount > 0 && (
                                                <span className="drawer-link-badge">{pendingCount}</span>
                                            )}
                                        </span>
                                    </>
                                );

                                if (it.disabled) {
                                    return (
                                        <button key={it.label} className="drawer-link" disabled type="button">
                                            {content}
                                        </button>
                                    );
                                }

                                if (it.onClick) {
                                    return (
                                        <button
                                            key={it.label}
                                            className="drawer-link"
                                            type="button"
                                            onClick={() => {
                                                it.onClick();
                                                closeMenu();
                                            }}
                                        >
                                            {content}
                                        </button>
                                    );
                                }

                                return (
                                    <Link
                                        key={it.label}
                                        className="drawer-link"
                                        to={it.to}
                                        onClick={closeMenu}
                                    >
                                        {content}
                                    </Link>
                                );
                            })}
                        </nav>
                    </aside>

                    {open && <div className="drawer-backdrop" onClick={closeMenu} />}
                </>
            )}
        </>
    );
}