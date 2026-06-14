import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import SideMenu from "../components/SideMenu";
import { useAuth } from "../auth/AuthContext";
import { getHomePathByRole } from "../utils/navigation";

import utilizadoresAprovarIcon from "../assets/utilizadores-por-aprovar.svg";
import utilizadoresAutorizadosIcon from "../assets/utilizadores-autorizados.svg";
import clubesIcon from "../assets/clubes.svg";
import coletividadesIcon from "../assets/coletividades.svg";

const QUICK_ICONS = {
    "Utilizadores por Aprovar": utilizadoresAprovarIcon,
    "Utilizadores Autorizados": utilizadoresAutorizadosIcon,
    "Criar Clube": clubesIcon,
    "Criar Coletividade": coletividadesIcon,
};

export default function AdminUsersPage() {
    const { user, logout, isSuperAdmin } = useAuth();
    const navigate = useNavigate();

    const homePath = useMemo(() => getHomePathByRole(user), [user]);

    const menuItems = useMemo(
        () => [
            { label: "Home", to: homePath },
            ...(isSuperAdmin ? [{ label: "Clubes", to: "/clubes" }] : []),
            ...(isSuperAdmin ? [{ label: "Coletividades", to: "/coletividades" }] : []),
            { label: "Perfis", to: "/admin/users" },
            {
                label: "Logout",
                onClick: () => {
                    logout();
                    navigate("/login", { replace: true });
                },
            },
        ],
        [homePath, isSuperAdmin, logout, navigate]
    );

    const quickLinks = [
        {
            label: "Utilizadores por Aprovar",
            to: "/admin/users/pending",
            description: isSuperAdmin
                ? "Aprovar pedidos pendentes de administradores de clube ou coletividade."
                : "Aprovar, rejeitar e completar a afetação dos pedidos pendentes da tua estrutura.",
        },
        {
            label: "Utilizadores Autorizados",
            to: "/admin/users/approved",
            description: isSuperAdmin
                ? "Editar perfil, privilégios e afetação dos utilizadores já aprovados."
                : "Consultar e gerir a afetação dos utilizadores aprovados da tua estrutura.",
        },
    ];

    const adminActions = isSuperAdmin ? [
        {
            label: "Criar Clube",
            to: "/clubes#criar-clube",
            description: "Abrir o formulário de criação de um novo clube.",
        },
        {
            label: "Criar Coletividade",
            to: "/coletividades#criar-coletividade",
            description: "Abrir o formulário de criação de uma nova coletividade.",
        },
    ] : [];

    const colorClasses = [
        "icon-orange",
        "icon-green",
        "icon-turquoise",
        "icon-purple",
    ];

    return (
        <>
            <SideMenu
                title="Gestão de Coletividades"
                subtitle="Gestão de Perfis"
                logoHref={homePath}
                logoSrc="/LOGO_GCDC04.png"
                items={menuItems}
            />

            <div className="container" style={{ paddingTop: 24 }}>
                <div className="page-title">
                    <h1>Gestão de Perfis</h1>
                    <div className="hint">
                        Escolhe a área de gestão que pretendes consultar.
                    </div>
                </div>

                {isSuperAdmin && (
                    <div className="card card-quick-links" style={{ marginBottom: 24 }}>
                        <h2>Ações rápidas</h2>
                        <div className="icon-links-row">
                            {adminActions.map((item, index) => (
                                <Link
                                    key={item.to}
                                    to={item.to}
                                    className={`icon-link-card ${colorClasses[index + 2]}`}
                                    title={item.label}
                                >
                                    <span className="menu-style-circle">
                                        <span className="menu-style-icon">
                                            <img
                                                src={QUICK_ICONS[item.label]}
                                                alt={item.label}
                                            />
                                        </span>
                                    </span>
                                    <span className="modalidade-figura-label">
                                        {item.label}
                                    </span>
                                    <span
                                        className="subtle"
                                        style={{
                                            textAlign: "center",
                                            display: "block",
                                            maxWidth: 260,
                                            marginTop: 8,
                                        }}
                                    >
                                        {item.description}
                                    </span>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                <div className="card card-quick-links">
                    <h2>Gestão de Utilizadores</h2>
                    <p className="subtle">
                        Seleciona uma das áreas abaixo para gerir os pedidos pendentes ou os utilizadores autorizados.
                    </p>

                    <div className="icon-links-row">
                        {quickLinks.map((item, index) => (
                            <Link
                                key={item.to}
                                to={item.to}
                                className={`icon-link-card ${colorClasses[index]}`}
                                title={item.label}
                            >
                                <span className="menu-style-circle">
                                    <span className="menu-style-icon">
                                        <img
                                            src={QUICK_ICONS[item.label]}
                                            alt={item.label}
                                        />
                                    </span>
                                </span>

                                <span className="modalidade-figura-label">
                                    {item.label}
                                </span>

                                <span
                                    className="subtle"
                                    style={{
                                        textAlign: "center",
                                        display: "block",
                                        maxWidth: 260,
                                        marginTop: 8,
                                    }}
                                >
                                    {item.description}
                                </span>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
}