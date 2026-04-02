import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import SideMenu from "../components/SideMenu";
import { getColetividadeById } from "../api";
import { useAuth } from "../auth/AuthContext";

import modalidadesIcon from "../assets/modalidades.svg";
import atletasIcon from "../assets/atletas.svg";
import staffIcon from "../assets/staff.svg";

const QUICK_ICONS = {
    "Atividades": modalidadesIcon,
    "Utentes": atletasIcon,
    "Staff": staffIcon,
};

export default function ColetividadeHomePage() {
    const params = useParams();
    const coletividadeId = params.id ?? params.coletividadeId ?? null;

    const navigate = useNavigate();
    const { logout, isAdmin } = useAuth();

    const [coletividade, setColetividade] = useState(null);
    const [erro, setErro] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let active = true;

        async function load() {
            setErro("");
            setLoading(true);

            if (!coletividadeId || coletividadeId === "undefined") {
                if (active) {
                    setErro("ID da coletividade inválido.");
                    setLoading(false);
                }
                return;
            }

            try {
                const data = await getColetividadeById(coletividadeId);
                if (active) setColetividade(data);
            } catch (e) {
                if (active) setErro(e.message || "Não foi possível carregar a coletividade.");
            } finally {
                if (active) setLoading(false);
            }
        }

        load();

        return () => {
            active = false;
        };
    }, [coletividadeId]);

    const subtitle = loading
        ? "A carregar..."
        : coletividade?.nome || `Coletividade #${coletividadeId}`;

    const menuItems = useMemo(
        () => [
            { label: "Home", to: "/menu" },
            { label: "Clubes", to: "/clubes" },
            { label: "Coletividades", to: "/coletividades" },
            ...(isAdmin ? [{ label: "Perfis", to: "/admin/users" }] : []),
            { label: "Atividades", to: `/coletividades/${coletividadeId}/atividades` },
            { label: "Utentes", to: `/coletividades/${coletividadeId}/utentes` },
            { label: "Staff", to: `/coletividades/${coletividadeId}/staff` },
            {
                label: "Logout",
                onClick: () => {
                    logout();
                    navigate("/login", { replace: true });
                },
            },
        ],
        [coletividadeId, isAdmin, logout, navigate]
    );

    const quickLinks = [
        {
            label: "Atividades",
            to: `/coletividades/${coletividadeId}/atividades`,
        },
        {
            label: "Utentes",
            to: `/coletividades/${coletividadeId}/utentes`,
        },
        {
            label: "Staff",
            to: `/coletividades/${coletividadeId}/staff`,
        },
    ];

    const colorClasses = [
        "icon-turquoise",
        "icon-orange",
        "icon-red",
    ];

    return (
        <>
            <SideMenu
                title="Gestão de Coletividades"
                subtitle={subtitle}
                logoHref="/menu"
                logoSrc="/logo.png"
                items={menuItems}
            />

            <div className="container" style={{ paddingTop: 24 }}>
                <div className="page-title">
                    <h1>{subtitle}</h1>
                    <div className="hint">
                        Usa os atalhos abaixo para navegar nas secções da coletividade.
                    </div>
                </div>

                {erro ? <div className="alert error">{erro}</div> : null}

                <div className="card card-quick-links">
                    <h2>Acessos rápidos</h2>
                    <p className="subtle">
                        Escolhe a área da coletividade que pretendes consultar.
                    </p>

                    <div className="icon-links-row">
                        {quickLinks.map((item, index) => (
                            <Link
                                key={item.to}
                                to={item.to}
                                className={`icon-link-card ${colorClasses[index % colorClasses.length]}`}
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
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
}