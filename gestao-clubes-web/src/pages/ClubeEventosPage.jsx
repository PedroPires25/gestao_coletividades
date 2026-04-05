import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import SideMenu from "../components/SideMenu";
import MapPicker from "../components/MapPicker";
import MiniMap from "../components/MiniMap";
import { useAuth } from "../auth/AuthContext";
import { getClubeById } from "../api";
import { getEventosPorClube, listarAtletasEvento } from "../services/eventos";
import eventosIcon from "../assets/eventos.svg";

function formatDataHora(val) {
    if (!val) return "-";
    const d = new Date(String(val).replace(" ", "T"));
    if (Number.isNaN(d.getTime())) return val;
    const p = (n) => String(n).padStart(2, "0");
    return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

export default function ClubeEventosPage() {
    const { clubeId } = useParams();
    const navigate = useNavigate();
    const { logout, modalidadeId } = useAuth(); // modalidadeId = clube_modalidade.id

    const [clube, setClube] = useState(null);
    const [eventos, setEventos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [erro, setErro] = useState(null);
    const [expandedId, setExpandedId] = useState(null);
    const [convocadosMap, setConvocadosMap] = useState({});
    const [loadingConvId, setLoadingConvId] = useState(null);
    const [viewingMap, setViewingMap] = useState(null);

    const carregar = useCallback(async () => {
        if (!clubeId) return;
        setErro(null);
        setLoading(true);
        try {
            const [clubeData, eventosData] = await Promise.all([
                getClubeById(parseInt(clubeId)),
                getEventosPorClube(clubeId),
            ]);
            setClube(clubeData);
            setEventos(Array.isArray(eventosData) ? eventosData : []);
        } catch (err) {
            setErro("Erro ao carregar dados: " + (err.message || err));
        } finally {
            setLoading(false);
        }
    }, [clubeId]);

    useEffect(() => { carregar(); }, [carregar]);

    async function toggleConvocados(eventoId) {
        if (expandedId === eventoId) { setExpandedId(null); return; }
        setExpandedId(eventoId);
        if (convocadosMap[eventoId]) return;
        setLoadingConvId(eventoId);
        try {
            const dados = await listarAtletasEvento(eventoId);
            setConvocadosMap((prev) => ({ ...prev, [eventoId]: Array.isArray(dados) ? dados : [] }));
        } catch {
            setConvocadosMap((prev) => ({ ...prev, [eventoId]: [] }));
        } finally {
            setLoadingConvId(null);
        }
    }

    const menuItems = [
        { label: "Voltar ao Clube", onClick: () => navigate(`/clubes/${clubeId}`) },
        { label: "Logout", onClick: () => { logout(); navigate("/login", { replace: true }); } },
    ];

    if (loading) {
        return (
            <div>
                <SideMenu title={clube?.nome || "Clube"} subtitle="Eventos do Clube" logoHref="/menu" logoSrc="/logo.png" items={menuItems} />
                <div className="container" style={{ paddingTop: 24 }}>
                    <p>A carregar...</p>
                </div>
            </div>
        );
    }

    return (
        <>
            <SideMenu
                title={clube?.nome || "Clube"}
                subtitle="Eventos do Clube"
                logoHref="/menu"
                logoSrc="/logo.png"
                items={menuItems}
            />

            <div className="container" style={{ paddingTop: 24 }}>
                <div className="page-title page-title-with-icon">
                    <div className="page-title-main-wrap">
                        <span className="page-title-icon-circle">
                            <img src={eventosIcon} alt="Eventos" className="page-title-icon" />
                        </span>
                        <div className="page-title-texts">
                            <h1>Eventos do Clube</h1>
                        </div>
                    </div>
                    <div className="hint">{clube?.nome || ""}</div>
                </div>

                {erro && <div className="alert error">{erro}</div>}

                <div className="stack-sections">
                    <section className="card">
                        <div className="modalidades-toolbar">
                            <div className="toolbar-title-group">
                                <h2>Eventos</h2>
                                <span className="toolbar-count">{eventos.length}</span>
                            </div>
                        </div>

                        {modalidadeId && (
                            <p className="subtle">
                                Os eventos marcados com ⭐ são da tua modalidade — tens acesso à lista de convocados.
                            </p>
                        )}

                        {eventos.length === 0 ? (
                            <p className="subtle">Não existem eventos registados para este clube.</p>
                        ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                                {eventos.map((evento) => {
                                    const isMinhaModalidade =
                                        modalidadeId != null &&
                                        evento.clubeModalidadeId != null &&
                                        Number(evento.clubeModalidadeId) === Number(modalidadeId);

                                    const isExpanded = expandedId === evento.id;
                                    const convocados = convocadosMap[evento.id] ?? null;

                                    return (
                                        <div
                                            key={evento.id}
                                            style={{
                                                position: "relative",
                                                background: isMinhaModalidade
                                                    ? "rgba(40,199,111,0.10)"
                                                    : "var(--bg-input)",
                                                border: isMinhaModalidade
                                                    ? "1px solid var(--ok)"
                                                    : "1px solid var(--border)",
                                                borderLeft: isMinhaModalidade ? "4px solid var(--ok)" : "1px solid var(--border)",
                                                borderRadius: 12,
                                                padding: "16px 20px",
                                                color: "var(--text)",
                                            }}
                                        >
                                            {evento.latitude && evento.longitude && (
                                                <div style={{ position: "absolute", top: 16, right: 20, zIndex: 1 }}>
                                                    <MiniMap
                                                        latitude={evento.latitude}
                                                        longitude={evento.longitude}
                                                        onClick={() => setViewingMap(evento)}
                                                    />
                                                </div>
                                            )}
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
                                                <div style={{ flex: 1, minWidth: 0, paddingRight: evento.latitude && evento.longitude ? 140 : 0 }}>
                                                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8, alignItems: "center" }}>
                                                        {isMinhaModalidade ? (
                                                            <span className="toolbar-count" style={{ color: "var(--ok)", borderColor: "var(--ok)" }}>
                                                                ⭐ {evento.modalidadeNome || "A tua modalidade"}
                                                            </span>
                                                        ) : (
                                                            <span className="toolbar-count" style={{ opacity: 0.6 }}>
                                                                {evento.modalidadeNome || "Outra modalidade"}
                                                            </span>
                                                        )}
                                                        {isMinhaModalidade && (
                                                            <button
                                                                type="button"
                                                                className={isExpanded ? "btn btn-primary btn-sm" : "btn btn-secondary btn-sm"}
                                                                onClick={() => toggleConvocados(evento.id)}
                                                                style={{ whiteSpace: "nowrap", fontSize: 12, padding: "6px 10px", borderRadius: 999 }}
                                                            >
                                                                {isExpanded ? "▲ Fechar" : "▼ Convocados"}
                                                            </button>
                                                        )}
                                                    </div>

                                                    <h3 style={{ margin: "0 0 6px", fontSize: "1rem", color: "var(--text)" }}>
                                                        {evento.titulo}
                                                    </h3>

                                                    {evento.descricao && (
                                                        <p className="subtle" style={{ margin: "0 0 6px" }}>
                                                            {evento.descricao}
                                                        </p>
                                                    )}

                                                    <div style={{ display: "flex", gap: 18, flexWrap: "wrap", fontSize: "0.875rem", color: "var(--muted)" }}>
                                                        <span>📅 {formatDataHora(evento.dataHora)}</span>
                                                        {evento.local && <span>📍 {evento.local}</span>}
                                                    </div>

                                                    {evento.observacoes && (
                                                        <p className="subtle" style={{ marginTop: 6, fontStyle: "italic" }}>
                                                            {evento.observacoes}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            {isMinhaModalidade && isExpanded && (
                                                <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--border)" }}>
                                                    <h4 style={{ margin: "0 0 10px", fontSize: "0.9rem", color: "var(--ok)" }}>
                                                        👥 Lista de Convocados
                                                    </h4>
                                                    {loadingConvId === evento.id ? (
                                                        <p className="subtle">A carregar...</p>
                                                    ) : !convocados || convocados.length === 0 ? (
                                                        <p className="subtle">Sem convocados registados.</p>
                                                    ) : (
                                                        <ul style={{
                                                            listStyle: "none", padding: 0, margin: 0,
                                                            display: "grid",
                                                            gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
                                                            gap: 6,
                                                        }}>
                                                            {convocados.map((c) => (
                                                                <li key={c.id} style={{
                                                                    padding: "6px 10px",
                                                                    background: "var(--bg-card-soft)",
                                                                    borderRadius: 6,
                                                                    border: "1px solid var(--border)",
                                                                    fontSize: "0.87rem",
                                                                    color: "var(--text)",
                                                                }}>
                                                                    <span style={{ fontWeight: 600 }}>{c.nome}</span>
                                                                    {c.escalao && (
                                                                        <span className="subtle" style={{ display: "block", fontSize: "0.78rem" }}>
                                                                            {c.escalao}
                                                                        </span>
                                                                    )}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </section>
                </div>
            </div>

            {viewingMap && (
                <div className="modal-overlay" onClick={() => setViewingMap(null)}>
                    <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: 600 }}>
                        <div className="modal-header">
                            <h3>📍 {viewingMap.titulo} — {viewingMap.local}</h3>
                            <button className="modal-close" onClick={() => setViewingMap(null)}>✕</button>
                        </div>
                        <div className="modal-body">
                            <MapPicker
                                latitude={viewingMap.latitude}
                                longitude={viewingMap.longitude}
                                readOnly
                            />
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
