import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import SideMenu from "../components/SideMenu";
import { useAuth } from "../auth/AuthContext";
import { getClubeById } from "../api";
import { getModalidadesByClube } from "../services/atletas";
import { listarEventos, listarAtletasEvento } from "../services/eventos";
import eventosIcon from "../assets/eventos.svg";

function formatDataHora(val) {
    if (!val) return "-";
    const d = new Date(String(val).replace(" ", "T"));
    if (Number.isNaN(d.getTime())) return val;
    const p = (n) => String(n).padStart(2, "0");
    return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

export default function ModalidadeEventosPage() {
    const { clubeId, clubeModalidadeId } = useParams();
    const { logout, role } = useAuth();
    const navigate = useNavigate();

    const [clube, setClube] = useState(null);
    const [modalidade, setModalidade] = useState(null);
    const [eventos, setEventos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [erro, setErro] = useState("");

    // Convocados expanded per event
    const [expandedId, setExpandedId] = useState(null);
    const [convocadosMap, setConvocadosMap] = useState({});
    const [loadingConv, setLoadingConv] = useState(false);

    const carregar = useCallback(async () => {
        if (!clubeId || !clubeModalidadeId) return;
        setErro("");
        setLoading(true);
        try {
            const [clubeData, modalidadesData, eventosData] = await Promise.all([
                getClubeById(parseInt(clubeId)),
                getModalidadesByClube(parseInt(clubeId)),
                listarEventos(parseInt(clubeId), parseInt(clubeModalidadeId)),
            ]);
            setClube(clubeData);
            setModalidade(
                (Array.isArray(modalidadesData) ? modalidadesData : []).find(
                    (m) => String(m.id) === String(clubeModalidadeId)
                ) || null
            );
            setEventos(Array.isArray(eventosData) ? eventosData : []);
        } catch (e) {
            setErro(e.message || "Erro ao carregar dados.");
        } finally {
            setLoading(false);
        }
    }, [clubeId, clubeModalidadeId]);

    useEffect(() => { carregar(); }, [carregar]);

    async function toggleConvocados(eventoId) {
        if (expandedId === eventoId) {
            setExpandedId(null);
            return;
        }
        setExpandedId(eventoId);
        if (convocadosMap[eventoId]) return;
        setLoadingConv(true);
        try {
            const dados = await listarAtletasEvento(eventoId);
            setConvocadosMap((prev) => ({ ...prev, [eventoId]: Array.isArray(dados) ? dados : [] }));
        } catch {
            setConvocadosMap((prev) => ({ ...prev, [eventoId]: [] }));
        } finally {
            setLoadingConv(false);
        }
    }

    const nomeModalidade =
        modalidade?.modalidade?.nome ||
        modalidade?.nome ||
        modalidade?.nomeModalidade ||
        "Modalidade";

    const menuItems = [
        {
            label: "Logout",
            onClick: () => { logout(); navigate("/login", { replace: true }); },
        },
    ];

    return (
        <>
            <SideMenu
                title={clube?.nome || "Clube"}
                subtitle={nomeModalidade}
                logoHref={`/clubes/${clubeId}/clube-modalidade/${clubeModalidadeId}/modalidade`}
                logoSrc="/logo.png"
                items={menuItems}
            />

            <div className="container" style={{ paddingTop: 24 }}>
                {/* Header */}
                <div className="page-title page-title-with-icon" style={{ marginBottom: "1.5rem" }}>
                    <div className="page-title-main-wrap">
                        <span className="page-title-icon-circle">
                            <img src={eventosIcon} alt="Eventos" className="page-title-icon" />
                        </span>
                        <div className="page-title-texts">
                            <h1>{nomeModalidade}</h1>
                            {clube && <p style={{ margin: 0, opacity: 0.7 }}>{clube.nome}</p>}
                        </div>
                    </div>
                </div>

                {erro && <div className="alert alert-danger">{erro}</div>}

                {loading ? (
                    <p className="loading-text">A carregar eventos...</p>
                ) : eventos.length === 0 ? (
                    <div className="card" style={{ padding: "2rem", textAlign: "center", opacity: 0.7 }}>
                        <p>Não existem eventos registados para esta modalidade.</p>
                    </div>
                ) : (
                    <div className="eventos-list">
                        {eventos.map((evento) => {
                            const isExpanded = expandedId === evento.id;
                            const convocados = convocadosMap[evento.id] || [];

                            return (
                                <div key={evento.id} className="card" style={{ marginBottom: "1rem", padding: "1.25rem" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", flexWrap: "wrap" }}>
                                        <div style={{ flex: 1 }}>
                                            <h3 style={{ margin: "0 0 0.5rem" }}>{evento.titulo}</h3>
                                            {evento.descricao && (
                                                <p style={{ margin: "0 0 0.5rem", opacity: 0.85 }}>{evento.descricao}</p>
                                            )}
                                            <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap", fontSize: "0.9rem", opacity: 0.8 }}>
                                                <span>📅 {formatDataHora(evento.dataHora)}</span>
                                                {evento.local && <span>📍 {evento.local}</span>}
                                                <span>👥 {evento.totalAtletas ?? 0} convocados</span>
                                            </div>
                                            {evento.observacoes && (
                                                <p style={{ margin: "0.5rem 0 0", fontSize: "0.85rem", opacity: 0.7 }}>
                                                    <em>{evento.observacoes}</em>
                                                </p>
                                            )}
                                        </div>

                                        <button
                                            type="button"
                                            className="btn btn-secondary btn-sm"
                                            onClick={() => toggleConvocados(evento.id)}
                                            style={{ whiteSpace: "nowrap" }}
                                        >
                                            {isExpanded ? "▲ Fechar" : "▼ Convocados"}
                                        </button>
                                    </div>

                                    {/* Convocados list */}
                                    {isExpanded && (
                                        <div style={{
                                            marginTop: "1rem",
                                            borderTop: "1px solid var(--border-color, #444)",
                                            paddingTop: "1rem",
                                        }}>
                                            <h4 style={{ margin: "0 0 0.75rem", fontSize: "0.95rem" }}>Lista de Convocados</h4>
                                            {loadingConv && !convocados.length ? (
                                                <p style={{ opacity: 0.6 }}>A carregar...</p>
                                            ) : convocados.length === 0 ? (
                                                <p style={{ opacity: 0.6 }}>Sem convocados registados.</p>
                                            ) : (
                                                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "0.4rem" }}>
                                                    {convocados.map((c) => (
                                                        <li key={c.id} style={{
                                                            padding: "0.4rem 0.6rem",
                                                            background: "var(--card-bg-alt, rgba(255,255,255,0.05))",
                                                            borderRadius: "4px",
                                                            fontSize: "0.9rem",
                                                        }}>
                                                            {c.nome}
                                                            {c.escalao && (
                                                                <span style={{ opacity: 0.6, fontSize: "0.8rem", marginLeft: "0.4rem" }}>
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
            </div>
        </>
    );
}
