import { Link, useNavigate } from "react-router-dom";
import { useCallback, useEffect, useMemo, useState } from "react";
import SideMenu from "../components/SideMenu";
import { useAuth } from "../auth/AuthContext";
import * as eventosService from "../services/eventos";
import EventCarousel from "../components/EventCarousel";
import { getHomePathByRole } from "../utils/navigation";

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

export default function MenuPage() {
    const { user, logout, isAdmin, isSuperAdmin, role, clubeId } = useAuth();
    const navigate = useNavigate();
    const [meusEventos, setMeusEventos] = useState([]);
    const [loading, setLoading] = useState(true);
    const canOpenGestaoEventos =
        isAdmin ||
        role === "SECRETARIO" ||
        role === "TREINADOR_PRINCIPAL" ||
        role === "PROFESSOR";

    const homePath = useMemo(() => getHomePathByRole(user), [user]);

    // Redireciona se o utilizador não for Super Admin e tiver um home path diferente
    useEffect(() => {
        if (user && !isSuperAdmin && homePath !== "/menu") {
            navigate(homePath, { replace: true });
        }
    }, [user, isSuperAdmin, homePath, navigate]);

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

    const items = [
        { label: "Home", to: homePath },
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
                      icon: MENU_ICONS.Clubes,
                      colorClass: "quick-action-cyan",
                  },
                  {
                      label: "Coletividades",
                      to: "/coletividades",
                      icon: MENU_ICONS.Coletividades,
                      colorClass: "quick-action-orange",
                  },
              ]
            : []),
        ...(isAdmin
            ? [
                  {
                      label: "Perfis",
                      to: "/admin/users",
                      icon: MENU_ICONS.Perfis,
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
            icon: MENU_ICONS.Logout,
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
                logoHref={homePath}
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
                        <EventCarousel
                            eventos={meusEventos}
                            showModalidade={true}
                            showAtletas={true}
                            emptyMessage="Não tens eventos convocados de momento."
                        />
                    </section>
                )}
            </main>
        </>
    );
}