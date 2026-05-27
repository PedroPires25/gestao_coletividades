import { Link, useNavigate } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";
import SideMenu from "../components/SideMenu";
import { useAuth } from "../auth/AuthContext";
import * as eventosService from "../services/eventos";

import clubesIcon from "../assets/clubes.svg";
import coletividadesIcon from "../assets/coletividades.svg";
import perfisIcon from "../assets/perfis.svg";
import eventosIcon from "../assets/eventos.svg";
import logoutIcon from "../assets/logout.svg";

const MENU_ACTIONS = {
    Clubes: clubesIcon,
    Coletividades: coletividadesIcon,
    Perfis: perfisIcon,
    Logout: logoutIcon,
};

export default function MenuPage() {
    const { logout, isAdmin, isSuperAdmin, role, clubeId } = useAuth();
    const navigate = useNavigate();
    const [meusEventos, setMeusEventos] = useState([]);
    const [loading, setLoading] = useState(true);
    const canOpenGestaoEventos =
        isAdmin ||
        role === "SECRETARIO" ||
        role === "TREINADOR_PRINCIPAL" ||
        role === "PROFESSOR";

    const carregarMeusEventos = useCallback(async () => {
        try {
            setLoading(true);
            const eventos = await eventosService.listarMeusEventos(clubeId);
            setMeusEventos(eventos || []);
        } catch {
            console.log("Sem eventos convocados ou não é atleta");
            setMeusEventos([]);
        } finally {
            setLoading(false);
        }
    }, [clubeId]);

    useEffect(() => {
        if (clubeId) {
            carregarMeusEventos();
        }
    }, [clubeId, carregarMeusEventos]);

    function formatarDataHora(timestamp) {
        if (!timestamp) return "";
        const data = new Date(timestamp);
        const dia = String(data.getDate()).padStart(2, "0");
        const mes = String(data.getMonth() + 1).padStart(2, "0");
        const ano = data.getFullYear();
        const hora = String(data.getHours()).padStart(2, "0");
        const minuto = String(data.getMinutes()).padStart(2, "0");
        return `${dia}/${mes}/${ano} ${hora}:${minuto}`;
    }

    const items = [
        { label: "Home", to: "/menu" },
        ...(isSuperAdmin ? [{ label: "Clubes", to: "/clubes" }] : []),
        ...(isSuperAdmin ? [{ label: "Coletividades", to: "/coletividades" }] : []),
        ...(isAdmin ? [{ label: "Perfis", to: "/admin/users" }] : []),
        ...(canOpenGestaoEventos ? [{ label: "Eventos", to: "/gestao/eventos" }] : []),
        {
            label: "Logout",
            onClick: () => {
                logout();
                navigate("/login", { replace: true });
            },
        },
    ];

    const quickActions = [
        ...(isSuperAdmin
            ? [
                  {
                      label: "Clubes",
                      to: "/clubes",
                      icon: MENU_ACTIONS.Clubes,
                      colorClass: "quick-action-cyan",
                  },
                  {
                      label: "Coletividades",
                      to: "/coletividades",
                      icon: MENU_ACTIONS.Coletividades,
                      colorClass: "quick-action-orange",
                  },
              ]
            : []),
        ...(isAdmin
            ? [
                  {
                      label: "Perfis",
                      to: "/admin/users",
                      icon: MENU_ACTIONS.Perfis,
                      colorClass: "quick-action-red",
                  },
              ]
            : []),
        ...(canOpenGestaoEventos
            ? [
                  {
                      label: "Eventos",
                      to: "/gestao/eventos",
                      icon: eventosIcon,
                      colorClass: "quick-action-purple",
                  },
              ]
            : []),
        {
            label: "Logout",
            icon: MENU_ACTIONS.Logout,
            colorClass: "quick-action-green",
            onClick: () => {
                logout();
                navigate("/login", { replace: true });
            },
        },
    ];

    return (
        <>
            <SideMenu
                title="Gestão de Coletividades"
                subtitle="Menu"
                logoHref="/menu"
                logoSrc="/LOGO_GCDC04.png"
                items={items}
                showBurger={false}
                eventoBadge={!loading && meusEventos.length > 0 ? `📅 ${meusEventos.length}` : null}
            />

            <main className="container menu-home" style={{ paddingTop: 24 }}>
                <section className="menu-home-section menu-home-actions-section card">
                    <div className="menu-home-section-head">
                        <div>
                            <h1 className="menu-home-title">Home</h1>
                            <p className="menu-home-subtitle">
                                Acede rapidamente às principais áreas da plataforma.
                            </p>
                        </div>
                    </div>

                    <div className="menu-home-actions-grid">
                        {quickActions.map((action) => {
                            const content = (
                                <>
                                    <span className="quick-action-circle">
                                        <span className="quick-action-icon">
                                            <img src={action.icon} alt={action.label} />
                                        </span>
                                    </span>
                                    <span className="quick-action-label">{action.label}</span>
                                </>
                            );

                            if (action.onClick) {
                                return (
                                    <button
                                        key={action.label}
                                        className={`quick-action quick-action-button ${action.colorClass}`}
                                        type="button"
                                        onClick={action.onClick}
                                    >
                                        {content}
                                    </button>
                                );
                            }

                            return (
                                <Link
                                    key={action.label}
                                    to={action.to}
                                    className={`quick-action ${action.colorClass}`}
                                >
                                    {content}
                                </Link>
                            );
                        })}
                    </div>
                </section>

                {!loading && meusEventos.length > 0 && (
                    <section className="menu-home-section menu-home-events-section card">
                        <div className="menu-home-section-head menu-home-section-head-stack">
                            <h2 className="menu-home-section-title">Meus Eventos Convocados</h2>
                            <p className="menu-home-section-subtitle">
                                Consulta rapidamente os próximos eventos convocados.
                            </p>
                        </div>

                        <div className="eventos-carousel" aria-label="Meus eventos convocados">
                            {meusEventos.map((evento) => (
                                <article key={evento.id} className="evento-card card">
                                    <div className="evento-header">
                                        <h3 className="evento-titulo">{evento.titulo}</h3>
                                        <span className="evento-atletas">👥 {evento.totalAtletas}</span>
                                    </div>
                                    <div className="evento-info">
                                        <p className="evento-datetime">
                                            <strong>📅 Data/Hora:</strong> {formatarDataHora(evento.dataHora)}
                                        </p>
                                        {evento.local && (
                                            <p className="evento-local">
                                                <strong>📍 Local:</strong> {evento.local}
                                            </p>
                                        )}
                                    </div>
                                </article>
                            ))}
                        </div>
                    </section>
                )}
            </main>
        </>
    );
}
