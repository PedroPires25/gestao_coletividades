import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import SideMenu from "../components/SideMenu";
import { getClubeById } from "../api";
import { useAuth } from "../auth/AuthContext";
import { getUploadUrl } from "../api";
import defaultLogo from "../assets/default-logo.svg";

import modalidadesIcon from "../assets/modalidades.svg";
import atletasIcon from "../assets/atletas.svg";
import staffIcon from "../assets/staff.svg";
import transferenciasIcon from "../assets/transferencias.svg";
import eventosIcon from "../assets/eventos.svg";

const QUICK_ICONS = {
    "Modalidades do Clube": modalidadesIcon,
    "Atletas": atletasIcon,
    "Staff": staffIcon,
    "Transferências": transferenciasIcon,
    "Eventos": eventosIcon,
};

export default function ClubeHomePage() {
    const { clubeId } = useParams();
    const navigate = useNavigate();
    const { logout, isAdmin } = useAuth();

    const [clube, setClube] = useState(null);
    const [erro, setErro] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let active = true;

        async function load() {
            setErro("");
            setLoading(true);

            if (!clubeId || clubeId === "undefined") {
                if (active) {
                    setErro("ID do clube inválido.");
                    setLoading(false);
                }
                return;
            }

            try {
                const data = await getClubeById(clubeId);
                if (active) setClube(data);
            } catch (e) {
                if (active) setErro(e.message || "Não foi possível carregar o clube.");
            } finally {
                if (active) setLoading(false);
            }
        }

        load();

        return () => {
            active = false;
        };
    }, [clubeId]);

    const subtitle = loading ? "A carregar..." : clube?.nome || `Clube #${clubeId}`;

    const menuItems = useMemo(
        () => [
            { label: "Home", to: "/menu" },
            { label: "Clubes", to: "/clubes" },
            { label: "Coletividades", to: "/coletividades" },
            ...(isAdmin ? [{ label: "Perfis", to: "/admin/users" }] : []),
            { label: "Transferências", to: `/clubes/${clubeId}/transferencias` },
            {
                label: "Logout",
                onClick: () => {
                    logout();
                    navigate("/login", { replace: true });
                },
            },
        ],
        [clubeId, isAdmin, logout, navigate]
    );

    const quickLinks = [
        { label: "Modalidades do Clube", to: `/clubes/${clubeId}/modalidades` },
        { label: "Atletas", to: `/clubes/${clubeId}/atletas` },
        { label: "Staff", to: `/clubes/${clubeId}/staff` },
        { label: "Eventos", to: `/clubes/${clubeId}/eventos` },
        { label: "Transferências", to: `/clubes/${clubeId}/transferencias` },
    ];

    const colorClasses = [
        "icon-turquoise",
        "icon-orange",
        "icon-red",
        "icon-green",
        "icon-purple",
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
                <div className="page-title" style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <img
                        src={clube?.logoPath ? getUploadUrl(clube.logoPath) : defaultLogo}
                        alt="Logo"
                        style={{ width: 56, height: 56, objectFit: "cover", borderRadius: 10, border: "1px solid var(--border)" }}
                    />
                    <div>
                        <h1>{subtitle}</h1>
                        <div className="hint">
                            Usa os atalhos abaixo para navegar nas secções do clube.
                        </div>
                    </div>
                </div>

                {erro ? <div className="alert error">{erro}</div> : null}

                <div className="card card-quick-links">
                    <h2>Acessos rápidos</h2>
                    <p className="subtle">
                        Escolhe a área do clube que pretendes consultar.
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
                                        <img src={QUICK_ICONS[item.label]} alt={item.label} />
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