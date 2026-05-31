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
import perfisIcon from "../assets/perfis.svg";
import definicoesIcon from "../assets/direcao.svg";
// Importar o ícone do módulo médico, se o do treinador não existir usamos o de staff como fallback
import deptMedicoIcon from "../assets/departamento-medico.svg";

const QUICK_ICONS = {
    "Modalidades do Clube": modalidadesIcon,
    "Atletas": atletasIcon,
    "Staff": staffIcon,
    "Transferências": transferenciasIcon,
    "Eventos": eventosIcon,
    "Perfis": perfisIcon,
    "Definições do Clube": definicoesIcon,
    "Módulo Clínico": deptMedicoIcon,
    "Módulo Treinador": staffIcon, // Placeholder até criarem o ícone svg próprio
};

export default function ClubeHomePage() {
    const { clubeId } = useParams();
    const navigate = useNavigate();
    const { logout, isAdmin, isSuperAdmin, isDepartamentoMedico, isTreinador, canManageClube } = useAuth();

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
            ...(isSuperAdmin ? [{ label: "Clubes", to: "/clubes" }] : []),
            ...(isSuperAdmin ? [{ label: "Coletividades", to: "/coletividades" }] : []),
            ...(isAdmin ? [{ label: "Perfis", to: "/admin/users" }] : []),
            ...(isAdmin || isDepartamentoMedico ? [{ label: "Módulo Clínico", to: `/clubes/${clubeId}/medico` }] : []),
            ...(isAdmin || isTreinador ? [{ label: "Módulo Treinador", to: `/clubes/${clubeId}/treinador` }] : []),
            { label: "Transferências", to: `/clubes/${clubeId}/transferencias` },
            ...(canManageClube(Number(clubeId)) ? [{ label: "Definições do Clube", to: `/clubes/${clubeId}/editar` }] : []),
            {
                label: "Logout",
                onClick: () => {
                    logout();
                    navigate("/login", { replace: true });
                },
            },
        ],
        [clubeId, isAdmin, isSuperAdmin, isDepartamentoMedico, isTreinador, canManageClube, logout, navigate]
    );

    const quickLinks = [
        { label: "Modalidades do Clube", to: `/clubes/${clubeId}/modalidades` },
        { label: "Atletas", to: `/clubes/${clubeId}/atletas` },
        { label: "Staff", to: `/clubes/${clubeId}/staff` },
        ...(isAdmin || isDepartamentoMedico ? [{ label: "Módulo Clínico", to: `/clubes/${clubeId}/medico` }] : []),
        ...(isAdmin || isTreinador ? [{ label: "Módulo Treinador", to: `/clubes/${clubeId}/treinador` }] : []),
        { label: "Eventos", to: `/clubes/${clubeId}/eventos` },
        { label: "Transferências", to: `/clubes/${clubeId}/transferencias` },
        ...(isAdmin ? [{ label: "Perfis", to: "/admin/users" }] : []),
        ...(canManageClube(Number(clubeId)) ? [{ label: "Definições do Clube", to: `/clubes/${clubeId}/editar` }] : []),
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
                logoSrc="/LOGO_GCDC04.png"
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