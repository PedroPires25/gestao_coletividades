import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import SideMenu from "../components/SideMenu";
import { useAuth } from "../auth/AuthContext";
import { getClubeById } from "../api";
import { getStaffByDepartamento } from "../services/staff";

// Importar os ícones corretos
import staffIcon from "../assets/staff.svg";
import treinoIcon from "../assets/treino.svg";
import planoTreinoIcon from "../assets/plano-treino.svg";
import estatisticasIcon from "../assets/estatisticas.svg";
import convocatoriasIcon from "../assets/convocatorias.svg";

const MODULOS = [
    {
        id: "treinos",
        titulo: "Treinos",
        descricao: "Gestão de sessões de treino e planeamento.",
        icon: treinoIcon,
        colorClass: "icon-blue",
        path: (clubeId) => `/clubes/${clubeId}/treinador/sessoes`,
    },
    {
        id: "plano_treino",
        titulo: "Plano de Treino",
        descricao: "Criar e enviar planos de treino individuais.",
        icon: planoTreinoIcon,
        colorClass: "icon-orange",
        path: (clubeId) => `/clubes/${clubeId}/treinador/planos`,
    },
    {
        id: "estatisticas",
        titulo: "Estatísticas",
        descricao: "Indicadores de desempenho desportivo.",
        icon: estatisticasIcon,
        colorClass: "icon-cyan",
        path: (clubeId) => `/clubes/${clubeId}/treinador/assiduidade`,
    },
    {
        id: "convocatorias",
        titulo: "Convocatórias",
        descricao: "Convocação de atletas para jogos e eventos.",
        icon: convocatoriasIcon,
        colorClass: "icon-red",
        path: (clubeId) => `/clubes/${clubeId}/eventos`,
    },
];

export default function ClubeModuloTreinadorPage() {
    const { clubeId } = useParams();
    const navigate = useNavigate();
    const { logout } = useAuth();

    const [clube, setClube] = useState(null);
    const [staffCount, setStaffCount] = useState(null);
    const [loading, setLoading] = useState(true);

    const menuItems = useMemo(
        () => [
            { label: "Módulo de Treinador", to: `/clubes/${clubeId}/treinador` },
            { label: "Treinos", to: `/clubes/${clubeId}/treinador/sessoes` },
            { label: "Plano de Treino", to: `/clubes/${clubeId}/treinador/planos` },
            { label: "Estatísticas", to: `/clubes/${clubeId}/treinador/assiduidade` },
            { label: "Eventos do Clube", to: `/clubes/${clubeId}/eventos` },
            {
                label: "Logout",
                onClick: () => {
                    logout();
                    navigate("/login", { replace: true });
                },
            },
        ],
        [clubeId, logout, navigate]
    );

    useEffect(() => {
        async function carregar() {
            try {
                const [clubeData, staffData] = await Promise.all([
                    getClubeById(clubeId),
                    getStaffByDepartamento(clubeId, "treinador"),
                ]);
                setClube(clubeData || null);
                setStaffCount(Array.isArray(staffData) ? staffData.length : 0);
            } catch {
                // continue without staff count
            } finally {
                setLoading(false);
            }
        }
        carregar();
    }, [clubeId]);

    return (
        <>
            <SideMenu
                title="Gestão de Clubes"
                subtitle={clube?.nome || "Clube"}
                logoHref={`/clubes/${clubeId}/treinador`}
                logoSrc="/LOGO_GCDC04.png"
                items={menuItems}
            />

            <div className="container" style={{ paddingTop: 24 }}>
                <div className="page-title page-title-with-icon">
                    <div className="page-title-main-wrap">
                        <span className="page-title-icon-circle">
                            <img src={staffIcon} alt="Módulo de Treinador" className="page-title-icon" />
                        </span>
                        <div className="page-title-texts">
                            <h1>Módulo de Treinador</h1>
                            {clube && <div className="hint">{clube.nome}</div>}
                        </div>
                    </div>
                    <div className="actions">
                        <button
                            type="button"
                            className="btn"
                            onClick={() => navigate(`/clubes/${clubeId}/eventos`)}
                        >
                            Eventos do Clube
                        </button>
                        <button
                            type="button"
                            className="btn"
                            onClick={() => { logout(); navigate("/login", { replace: true }); }}
                        >
                            Logout
                        </button>
                    </div>
                </div>

                {loading ? (
                    <p className="subtle">A carregar...</p>
                ) : (
                    <>
                        {staffCount !== null && (
                            <div
                                style={{
                                    display: "flex",
                                    gap: 12,
                                    marginBottom: 24,
                                    padding: "12px 16px",
                                    borderRadius: 10,
                                    background: "rgba(99,102,241,0.10)",
                                    border: "1px solid rgba(99,102,241,0.22)",
                                    alignItems: "center",
                                    fontSize: "0.93rem",
                                    color: "var(--color-text-muted, #aaa)",
                                }}
                            >
                                <span style={{ fontSize: "1.2rem" }}>👥</span>
                                <span>
                                    <strong style={{ color: "var(--color-text, #fff)" }}>{staffCount}</strong> membro(s) na equipa técnica
                                </span>
                            </div>
                        )}

                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                                gap: 16,
                            }}
                        >
                            {MODULOS.map((mod) => (
                                <button
                                    key={mod.id}
                                    type="button"
                                    onClick={() => navigate(mod.path(clubeId))}
                                    className={`modulo-card-btn ${mod.colorClass}`}
                                    style={{
                                        display: "flex",
                                        flexDirection: "column",
                                        alignItems: "flex-start",
                                        gap: 12,
                                        padding: "24px 20px",
                                        borderRadius: 14,
                                        background: "var(--color-card-bg, #1e2130)",
                                        border: "1px solid rgba(255,255,255,0.08)",
                                        cursor: "pointer",
                                        textAlign: "left",
                                        transition: "all 0.2s ease-in-out",
                                        position: "relative",
                                        overflow: "hidden",
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = "translateY(-4px)";
                                        e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.2)";
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = "translateY(0)";
                                        e.currentTarget.style.boxShadow = "none";
                                    }}
                                >
                                    <div
                                        className="modulo-icon-wrapper"
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            width: 56,
                                            height: 56,
                                            borderRadius: "50%",
                                            marginBottom: 4,
                                        }}
                                    >
                                        <img src={mod.icon} alt={mod.titulo} style={{ width: 28, height: 28 }} />
                                    </div>
                                    <span
                                        style={{
                                            fontWeight: 700,
                                            fontSize: "1.1rem",
                                            color: "var(--color-text, #fff)",
                                        }}
                                    >
                                        {mod.titulo}
                                    </span>
                                    <span
                                        style={{
                                            fontSize: "0.85rem",
                                            color: "var(--color-text-muted, #aaa)",
                                            lineHeight: 1.5,
                                        }}
                                    >
                                        {mod.descricao}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </>
                )}
            </div>

            <style>{`
                .modulo-card-btn {
                    backdrop-filter: blur(10px);
                }
                
                .modulo-card-btn.icon-blue .modulo-icon-wrapper {
                    background: rgba(59, 130, 246, 0.15);
                    border: 1px solid rgba(59, 130, 246, 0.4);
                    color: #3b82f6;
                }
                .modulo-card-btn.icon-blue:hover { border-color: rgba(59, 130, 246, 0.6); }

                .modulo-card-btn.icon-green .modulo-icon-wrapper {
                    background: rgba(34, 197, 94, 0.15);
                    border: 1px solid rgba(34, 197, 94, 0.4);
                    color: #22c55e;
                }
                .modulo-card-btn.icon-green:hover { border-color: rgba(34, 197, 94, 0.6); }

                .modulo-card-btn.icon-purple .modulo-icon-wrapper {
                    background: rgba(168, 85, 247, 0.15);
                    border: 1px solid rgba(168, 85, 247, 0.4);
                    color: #a855f7;
                }
                .modulo-card-btn.icon-purple:hover { border-color: rgba(168, 85, 247, 0.6); }

                .modulo-card-btn.icon-orange .modulo-icon-wrapper {
                    background: rgba(249, 115, 22, 0.15);
                    border: 1px solid rgba(249, 115, 22, 0.4);
                    color: #f97316;
                }
                .modulo-card-btn.icon-orange:hover { border-color: rgba(249, 115, 22, 0.6); }

                .modulo-card-btn.icon-red .modulo-icon-wrapper {
                    background: rgba(239, 68, 68, 0.15);
                    border: 1px solid rgba(239, 68, 68, 0.4);
                    color: #ef4444;
                }
                .modulo-card-btn.icon-red:hover { border-color: rgba(239, 68, 68, 0.6); }

                .modulo-card-btn.icon-cyan .modulo-icon-wrapper {
                    background: rgba(6, 182, 212, 0.15);
                    border: 1px solid rgba(6, 182, 212, 0.4);
                    color: #06b6d4;
                }
                .modulo-card-btn.icon-cyan:hover { border-color: rgba(6, 182, 212, 0.6); }

                .modulo-card-btn.icon-yellow .modulo-icon-wrapper {
                    background: rgba(234, 179, 8, 0.15);
                    border: 1px solid rgba(234, 179, 8, 0.4);
                    color: #eab308;
                }
                .modulo-card-btn.icon-yellow:hover { border-color: rgba(234, 179, 8, 0.6); }
            `}</style>
        </>
    );
}