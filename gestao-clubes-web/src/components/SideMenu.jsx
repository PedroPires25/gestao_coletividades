import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { useTheme } from "../theme/ThemeContext";

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
                                     logoHref = "/menu",
                                     logoSrc = "/logo.png",
                                     items = [],
                                     showBurger = true,
                                     eventoBadge = null,
                                 }) {
    const [open, setOpen] = useState(false);
    const { theme, setTheme } = useTheme();

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
                        title="Voltar"
                        onClick={closeMenu}
                    >
                        <img src={logoSrc} alt="Logo" />
                    </Link>
                </div>
            </header>

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
                            {items.map((it, index) => {
                                const colorClass = MENU_ICON_COLORS[index % MENU_ICON_COLORS.length];
                                const icon = getIcon(it.label);

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
                                        <span className="drawer-link-text">{it.label}</span>
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