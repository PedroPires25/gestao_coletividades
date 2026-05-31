import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import SideMenu from "../components/SideMenu";
import { useAuth } from "../auth/AuthContext";
import { getClubeById } from "../api";
import { getStaffByDepartamento } from "../services/staff";
import staffIcon from "../assets/staff.svg"; // Usar o mesmo ícone do SideMenu

const MODULOS = [
    {
        id: "sessoes",
        titulo: "Sessões de Treino",
        descricao: "Registo de treinos, presenças e observações",
        emoji: "📅",
        path: (clubeId) => `/clubes/${clubeId}/treinador/sessoes`,
    },
    {
        id: "assiduidade",
        titulo: "Consultar Assiduidade",
        descricao: "Percentagens de presenças dos atletas por período",
        emoji: "📊",
        path: (clubeId) => `/clubes/${clubeId}/treinador/assiduidade`,
    },
    {
        id: "planos",
        titulo: "Planos de Treino",
        descricao: "Criar e enviar planos de treino individuais",
        emoji: "📋",
        path: (clubeId) => `/clubes/${clubeId}/treinador/planos`,
    },
    {
        id: "eventos",
        titulo: "Gestão de Eventos",
        descricao: "Criar e gerir eventos e convocatórias do clube",
        emoji: "🎉",
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
                logoHref="/menu"
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
                            onClick={() => navigate(`/clubes/${clubeId}/staff/departamento/treinador`)}
                        >
                            Equipa Técnica
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
                                gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                                gap: 16,
                            }}
                        >
                            {MODULOS.map((mod) => (
                                <button
                                    key={mod.id}
                                    type="button"
                                    onClick={() => navigate(mod.path(clubeId))}
                                    style={{
                                        display: "flex",
                                        flexDirection: "column",
                                        alignItems: "flex-start",
                                        gap: 8,
                                        padding: "20px 20px",
                                        borderRadius: 14,
                                        background: "var(--color-card-bg, #1e2130)",
                                        border: "1px solid rgba(255,255,255,0.08)",
                                        cursor: "pointer",
                                        textAlign: "left",
                                        transition: "border-color 0.15s, box-shadow 0.15s",
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.borderColor = "rgba(99,102,241,0.5)";
                                        e.currentTarget.style.boxShadow = "0 0 0 2px rgba(99,102,241,0.15)";
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
                                        e.currentTarget.style.boxShadow = "none";
                                    }}
                                >
                                    <span style={{ fontSize: "2rem" }}>{mod.emoji}</span>
                                    <span
                                        style={{
                                            fontWeight: 700,
                                            fontSize: "1rem",
                                            color: "var(--color-text, #fff)",
                                        }}
                                    >
                                        {mod.titulo}
                                    </span>
                                    <span
                                        style={{
                                            fontSize: "0.82rem",
                                            color: "var(--color-text-muted, #aaa)",
                                            lineHeight: 1.4,
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
        </>
    );
}