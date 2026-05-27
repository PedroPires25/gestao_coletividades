import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import SideMenu from "../components/SideMenu";
import MapPicker from "../components/MapPicker";
import { useAuth } from "../auth/AuthContext";
import { getClubeById, getUploadUrl } from "../api";
import { getEventosPorClube, listarAtletasEvento } from "../services/eventos";
import defaultLogo from "../assets/default-logo.svg";
import EventCarousel from "../components/EventCarousel";

export default function ModalidadeEventosPage() {
    const { clubeId, clubeModalidadeId } = useParams();
    const { logout } = useAuth();
    const navigate = useNavigate();

    const [clube, setClube] = useState(null);
    const [eventos, setEventos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [erro, setErro] = useState("");
    const [viewingMap, setViewingMap] = useState(null);
    const [viewingConvocados, setViewingConvocados] = useState(null);
    const [convocadosList, setConvocadosList] = useState([]);
    const [loadingConvocados, setLoadingConvocados] = useState(false);

    const carregar = useCallback(async () => {
        if (!clubeId) return;
        setErro("");
        setLoading(true);
        try {
            const [clubeData, eventosData] = await Promise.all([
                getClubeById(parseInt(clubeId)),
                getEventosPorClube(clubeId),
            ]);
            setClube(clubeData);
            setEventos(Array.isArray(eventosData) ? eventosData : []);
        } catch (e) {
            setErro(e.message || "Erro ao carregar dados.");
        } finally {
            setLoading(false);
        }
    }, [clubeId]);

    useEffect(() => { carregar(); }, [carregar]);

    async function abrirConvocados(evento) {
        setViewingConvocados(evento);
        setConvocadosList([]);
        setLoadingConvocados(true);
        try {
            const dados = await listarAtletasEvento(evento.id);
            setConvocadosList(Array.isArray(dados) ? dados : []);
        } catch {
            setConvocadosList([]);
        } finally {
            setLoadingConvocados(false);
        }
    }

    const menuItems = [
        { label: "Logout", onClick: () => { logout(); navigate("/login", { replace: true }); } },
    ];

    if (loading) {
        return (
            <div>
                <SideMenu title={clube?.nome || "Clube"} subtitle="Eventos do Clube" logoHref={`/clubes/${clubeId}/clube-modalidade/${clubeModalidadeId}/modalidade`} logoSrc="/LOGO_GCDC04.png" items={menuItems} />
                <div className="container" style={{ paddingTop: 24 }}><p>A carregar...</p></div>
            </div>
        );
    }

    return (
        <>
            <SideMenu
                title={clube?.nome || "Clube"}
                subtitle="Eventos do Clube"
                logoHref={`/clubes/${clubeId}/clube-modalidade/${clubeModalidadeId}/modalidade`}
                logoSrc="/LOGO_GCDC04.png"
                items={menuItems}
            />

            <div className="container" style={{ paddingTop: 24 }}>
                <div className="page-title page-title-with-icon">
                    <div className="page-title-main-wrap">
                        <img
                            src={clube?.logoPath ? getUploadUrl(clube.logoPath) : defaultLogo}
                            alt="Logo"
                            style={{ width: 48, height: 48, objectFit: "cover", borderRadius: 10, border: "1px solid var(--border)" }}
                        />
                        <div className="page-title-texts">
                            <h1 style={{ fontSize: "1.35rem" }}>Eventos</h1>
                            <span style={{ fontSize: "1rem", color: "var(--text-secondary)", fontWeight: 500 }}>{clube?.nome || ""}</span>
                        </div>
                    </div>
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

                        <p className="subtle">
                            Os eventos marcados com ⭐ são da tua modalidade — tens acesso à lista de convocados.
                        </p>

                        <EventCarousel
                            eventos={eventos}
                            activeModalidadeId={parseInt(clubeModalidadeId)}
                            onVerConvocados={abrirConvocados}
                            onVerMapa={setViewingMap}
                            emptyMessage="Não existem eventos registados para este clube."
                            showModalidade={true}
                            showAtletas={false}
                        />
                    </section>
                </div>
            </div>

            {viewingConvocados && (
                <div className="modal-overlay" onClick={() => setViewingConvocados(null)}>
                    <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: 560 }}>
                        <div className="modal-header">
                            <h3>👥 Convocados — {viewingConvocados.titulo}</h3>
                            <button className="modal-close" onClick={() => setViewingConvocados(null)}>✕</button>
                        </div>
                        <div className="modal-body">
                            {loadingConvocados ? (
                                <p className="subtle">A carregar...</p>
                            ) : convocadosList.length === 0 ? (
                                <p className="subtle">Sem convocados registados.</p>
                            ) : (
                                <ul style={{
                                    listStyle: "none", padding: 0, margin: 0,
                                    display: "grid",
                                    gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
                                    gap: 8,
                                }}>
                                    {convocadosList.map((c) => (
                                        <li key={c.id} style={{
                                            padding: "8px 12px",
                                            background: "var(--bg-card-soft)",
                                            borderRadius: 8,
                                            border: "1px solid var(--border)",
                                            fontSize: "0.875rem",
                                            color: "var(--text)",
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "0.5rem",
                                        }}>
                                            {c.fotoPath ? (
                                                <img src={getUploadUrl(c.fotoPath)} alt={c.nome} className="avatar-circle-sm" />
                                            ) : (
                                                <span className="avatar-circle-sm avatar-initials-sm">{(c.nome || "?")[0].toUpperCase()}</span>
                                            )}
                                            <div>
                                                <span style={{ fontWeight: 600 }}>{c.nome}</span>
                                                {c.escalao && (
                                                    <span className="subtle" style={{ display: "block", fontSize: "0.78rem" }}>
                                                        {c.escalao}
                                                    </span>
                                                )}
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                </div>
            )}

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