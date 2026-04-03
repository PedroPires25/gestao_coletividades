import { Link, useNavigate } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";
import SideMenu from "../components/SideMenu";
import { useAuth } from "../auth/AuthContext";
import * as eventosService from "../services/eventos";

import clubesIcon from "../assets/clubes.svg";
import coletividadesIcon from "../assets/coletividades.svg";
import perfisIcon from "../assets/perfis.svg";
import logoutIcon from "../assets/logout.svg";

const MENU_ACTIONS = {
    Clubes: clubesIcon,
    Coletividades: coletividadesIcon,
    Perfis: perfisIcon,
    Logout: logoutIcon,
};

export default function MenuPage() {
    const { logout, isAdmin, clubeId } = useAuth();
    const navigate = useNavigate();
    const [meusEventos, setMeusEventos] = useState([]);
    const [loading, setLoading] = useState(true);

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
        { label: "Clubes", to: "/clubes" },
        { label: "Coletividades", to: "/coletividades" },
        ...(isAdmin ? [{ label: "Perfis", to: "/admin/users" }] : []),
        {
            label: "Logout",
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
                logoSrc="/logo.png"
                items={items}
                showBurger={false}
                eventoBadge={!loading && meusEventos.length > 0 ? `📅 ${meusEventos.length}` : null}
            />

            <div className="menu-center-wrapper">
                <div className="quick-actions-row">
                    <Link to="/clubes" className="quick-action quick-action-cyan">
                        <span className="quick-action-circle">
                            <span className="quick-action-icon">
                                <img src={MENU_ACTIONS.Clubes} alt="Clubes" />
                            </span>
                        </span>
                        <span className="quick-action-label">Clubes</span>
                    </Link>

                    <Link to="/coletividades" className="quick-action quick-action-orange">
                        <span className="quick-action-circle">
                            <span className="quick-action-icon">
                                <img src={MENU_ACTIONS.Coletividades} alt="Coletividades" />
                            </span>
                        </span>
                        <span className="quick-action-label">Coletividades</span>
                    </Link>

                    {isAdmin && (
                        <Link to="/admin/users" className="quick-action quick-action-red">
                            <span className="quick-action-circle">
                                <span className="quick-action-icon">
                                    <img src={MENU_ACTIONS.Perfis} alt="Perfis" />
                                </span>
                            </span>
                            <span className="quick-action-label">Perfis</span>
                        </Link>
                    )}

                    <button
                        className="quick-action quick-action-green quick-action-button"
                        type="button"
                        onClick={() => {
                            logout();
                            navigate("/login", { replace: true });
                        }}
                    >
                        <span className="quick-action-circle">
                            <span className="quick-action-icon">
                                <img src={MENU_ACTIONS.Logout} alt="Logout" />
                            </span>
                        </span>
                        <span className="quick-action-label">Logout</span>
                    </button>
                </div>

                {!loading && meusEventos.length > 0 && (
                    <div className="eventos-section">
                        <h2 className="page-title">📅 Meus Eventos Convocados</h2>
                        <div className="eventos-list">
                            {meusEventos.map((evento) => (
                                <div key={evento.id} className="evento-card card">
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
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}