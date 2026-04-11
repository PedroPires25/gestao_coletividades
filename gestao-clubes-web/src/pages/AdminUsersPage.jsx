import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import SideMenu from "../components/SideMenu";
import { useAuth } from "../auth/AuthContext";

import utilizadoresAprovarIcon from "../assets/utilizadores-por-aprovar.svg";
import utilizadoresAutorizadosIcon from "../assets/utilizadores-autorizados.svg";

const QUICK_ICONS = {
    "Utilizadores por Aprovar": utilizadoresAprovarIcon,
    "Utilizadores Autorizados": utilizadoresAutorizadosIcon,
};

export default function AdminUsersPage() {
    const { logout, isAdmin, isSuperAdmin } = useAuth();
    const navigate = useNavigate();

    const menuItems = useMemo(
        () => [
            { label: "Home", to: "/menu" },
            { label: "Clubes", to: "/clubes" },
            { label: "Coletividades", to: "/coletividades" },
            {
                label: "Logout",
                onClick: () => {
                    logout();
                    navigate("/login", { replace: true });
                },
            },
        ],
        [isAdmin, logout, navigate]
    );

    const quickLinks = [
        {
            label: "Utilizadores por Aprovar",
            to: "/admin/users/pending",
            description: isSuperAdmin
                ? "Aprovar pedidos pendentes de administradores de clube ou coletividade."
                : "Aprovar, rejeitar e completar a afetação dos pedidos pendentes da tua estrutura.",
        },
        ...(isSuperAdmin ? [{
            label: "Utilizadores Autorizados",
            to: "/admin/users/approved",
            description: "Editar perfil, privilégios e afetação dos utilizadores já aprovados.",
        }] : []),
    ];

    const colorClasses = [
        "icon-orange",
        "icon-green",
    ];

    return (
        <>
            <SideMenu
                title="Gestão de Coletividades"
                subtitle="Gestão de Perfis"
                logoHref="/menu"
                logoSrc="/logo.png"
                items={menuItems}
            />

            <div className="container" style={{ paddingTop: 24 }}>
                <div className="page-title">
                    <h1>Gestão de Perfis</h1>
                    <div className="hint">
                        Escolhe a área de gestão de utilizadores que pretendes consultar.
                    </div>
                </div>

                <div className="card card-quick-links">
                    <h2>Acessos rápidos</h2>
                    <p className="subtle">
                        {isSuperAdmin
                            ? "Seleciona uma das áreas abaixo para gerir os pedidos pendentes ou os utilizadores autorizados."
                            : "Seleciona a área abaixo para gerir os pedidos pendentes da tua estrutura."}
                    </p>

                    <div className="icon-links-row">
                        {quickLinks.map((item, index) => (
                            <Link
                                key={item.to}
                                to={item.to}
                                className={`icon-link-card ${colorClasses[index % colorClasses.length]}`}
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
