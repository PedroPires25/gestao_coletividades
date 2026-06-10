import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import SideMenu from "../components/SideMenu";
import { useAuth } from "../auth/AuthContext";
import { getColetividadeById } from "../api";
import { getAtividadesByColetividade } from "../services/coletividadeAtividades";
import { getEventosColetividade } from "../services/eventosColetividade";
import eventosIcon from "../assets/eventos.svg";
import atletasIcon from "../assets/atletas.svg";

function formatDateOnly(value) {
    if (!value) return "-";
    const raw = String(value).trim();
    const date = raw.includes("T") ? raw.split("T")[0] : raw.slice(0, 10);
    const [year, month, day] = date.split("-");
    return year && month && day ? `${day}/${month}/${year}` : date;
}

function badgeEstado(estado) {
    const cores = {
        Aberto: { bg: "#22c55e20", color: "#15803d", border: "#22c55e" },
        Fechado: { bg: "#94a3b820", color: "#cbd5e1", border: "#94a3b8" },
        Cancelado: { bg: "#ef444420", color: "#fca5a5", border: "#ef4444" },
        "Concluído": { bg: "#3b82f620", color: "#93c5fd", border: "#3b82f6" },
    };
    const c = cores[estado] || { bg: "#88888820", color: "#ffffff", border: "#888888" };
    return (
        <span style={{
            padding: "3px 10px",
            borderRadius: 999,
            fontSize: "0.78rem",
            fontWeight: 700,
            background: c.bg,
            color: c.color,
            border: `1px solid ${c.border}`,
        }}>
            {estado || "-"}
        </span>
    );
}

export default function ColetividadeModuloTreinadorPage() {
    const { id: coletividadeId } = useParams();
    const navigate = useNavigate();
    const { logout, atividadeId: authAtividadeId, nome } = useAuth();

    const [coletividade, setColetividade] = useState(null);
    const [atividadeAtiva, setAtividadeAtiva] = useState(null);
    const [eventos, setEventos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [erro, setErro] = useState("");

    const menuItems = useMemo(() => [
        {
            label: "Módulo Treinador",
            to: `/coletividades/${coletividadeId}/treinador`,
        },
        {
            label: "Eventos",
            to: `/coletividades/${coletividadeId}/eventos`,
        },
        {
            label: "Logout",
            onClick: () => {
                logout();
                navigate("/login", { replace: true });
            },
        },
    ], [coletividadeId, logout, navigate]);

    useEffect(() => {
        let active = true;
        (async () => {
            try {
                const [coletividadeData, atividadesData, eventosData] = await Promise.all([
                    getColetividadeById(coletividadeId),
                    getAtividadesByColetividade(coletividadeId, { apenasAtivas: true }),
                    getEventosColetividade(coletividadeId, {
                        coletividadeAtividadeId: authAtividadeId || undefined,
                    }),
                ]);
                if (active) {
                    setColetividade(coletividadeData || null);
                    const atividades = Array.isArray(atividadesData) ? atividadesData : [];
                    const atividade = atividades.find(
                        (a) => String(a.id) === String(authAtividadeId)
                    );
                    setAtividadeAtiva(atividade || null);
                    setEventos(Array.isArray(eventosData) ? eventosData : []);
                    setLoading(false);
                }
            } catch (e) {
                if (active) {
                    setErro(e.message || "Não foi possível carregar os dados.");
                    setLoading(false);
                }
            }
        })();
        return () => { active = false; };
    }, [coletividadeId, authAtividadeId]);

    const eventosProximos = useMemo(() =>
        eventos
            .filter((e) => e.estado === "Aberto")
            .slice(0, 5),
        [eventos]
    );

    return (
        <>
            <SideMenu
                title="Módulo Treinador"
                subtitle={coletividade?.nome || "Coletividade"}
                logoHref={`/coletividades/${coletividadeId}/treinador`}
                logoSrc="/LOGO_GCDC04.png"
                items={menuItems}
            />

            <div className="container" style={{ paddingTop: 24 }}>
                <div className="page-title">
                    <div>
                        <h1>Módulo Treinador da Coletividade</h1>
                        <div className="hint">{coletividade?.nome || ""}</div>
                    </div>
                </div>

                {erro && <div className="alert error">{erro}</div>}

                {loading ? (
                    <p className="subtle">A carregar...</p>
                ) : (
                    <div className="stack-sections">

                        {/* Atividade atribuída */}
                        <section className="card">
                            <div className="modalidades-toolbar">
                                <div className="toolbar-title-group">
                                    <img src={atletasIcon} alt="" style={{ width: 22, opacity: 0.7 }} />
                                    <h2>A sua atividade</h2>
                                </div>
                            </div>
                            {atividadeAtiva ? (
                                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                    <div style={{ fontWeight: 600, fontSize: "1.05rem" }}>
                                        {atividadeAtiva.atividade?.nome || `Atividade #${authAtividadeId}`}
                                    </div>
                                    {atividadeAtiva.descricao && (
                                        <div className="subtle">{atividadeAtiva.descricao}</div>
                                    )}
                                    {nome && (
                                        <div className="subtle">Treinador responsável: <strong>{nome}</strong></div>
                                    )}
                                </div>
                            ) : (
                                <p className="subtle">
                                    {authAtividadeId
                                        ? `Atividade #${authAtividadeId} — detalhes não disponíveis.`
                                        : "Nenhuma atividade atribuída ao seu perfil."}
                                </p>
                            )}
                        </section>

                        {/* Eventos da atividade */}
                        <section className="card">
                            <div className="modalidades-toolbar">
                                <div className="toolbar-title-group">
                                    <img src={eventosIcon} alt="" style={{ width: 22, opacity: 0.7 }} />
                                    <h2>Eventos da sua atividade</h2>
                                    <span className="toolbar-count">{eventos.length} evento(s)</span>
                                </div>
                                <button
                                    type="button"
                                    className="btn btn-primary"
                                    onClick={() => navigate(`/coletividades/${coletividadeId}/eventos`)}
                                >
                                    Gerir eventos
                                </button>
                            </div>

                            {eventos.length === 0 ? (
                                <p className="subtle">Sem eventos registados para a sua atividade.</p>
                            ) : (
                                <>
                                    {eventosProximos.length > 0 && (
                                        <div style={{ marginBottom: 12 }}>
                                            <p className="subtle" style={{ marginBottom: 8 }}>
                                                Próximos eventos abertos:
                                            </p>
                                            <div className="table-wrap">
                                                <table className="dashboard-table">
                                                    <thead>
                                                    <tr>
                                                        <th>Título</th>
                                                        <th>Data</th>
                                                        <th>Local</th>
                                                        <th>Estado</th>
                                                    </tr>
                                                    </thead>
                                                    <tbody>
                                                    {eventosProximos.map((evento) => (
                                                        <tr key={evento.id}>
                                                            <td>{evento.titulo || "-"}</td>
                                                            <td>{formatDateOnly(evento.dataEvento)}</td>
                                                            <td>{evento.localEvento || "-"}</td>
                                                            <td>{badgeEstado(evento.estado)}</td>
                                                        </tr>
                                                    ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}
                                    <button
                                        type="button"
                                        className="btn"
                                        onClick={() => navigate(`/coletividades/${coletividadeId}/eventos`)}
                                    >
                                        Ver todos os eventos ({eventos.length})
                                    </button>
                                </>
                            )}
                        </section>

                    </div>
                )}
            </div>
        </>
    );
}
