import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import SideMenu from "../components/SideMenu";
import MapPicker from "../components/MapPicker";
import { useAuth } from "../auth/AuthContext";
import { getClubeById } from "../api";
import { getEventosPorClube, listarAtletasEvento } from "../services/eventos";
import eventosIcon from "../assets/eventos.svg";
import EventCarousel from "../components/EventCarousel";

function InscricaoBadge({ estado }) {
    const map = {
        APROVADO: { label: "Aprovado", color: "var(--ok, #22c55e)" },
        PENDENTE: { label: "Pendente", color: "#f59e0b" },
        REJEITADO: { label: "Rejeitado", color: "var(--error, #ef4444)" },
    };
    const info = map[estado] ?? { label: estado ?? "Desconhecido", color: "#6b7280" };
    return (
        <span style={{ display: "inline-block", padding: "2px 12px", borderRadius: 999, background: info.color, color: "#fff", fontWeight: 600, fontSize: "0.85rem" }}>
            {info.label}
        </span>
    );
}

export default function AreaAcessoClubePage() {
    const { clubeId } = useParams();
    const navigate = useNavigate();
    const { logout, modalidadeId, user } = useAuth();

    const [clube, setClube] = useState(null);
    const [eventos, setEventos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [erro, setErro] = useState(null);
    const [viewingMap, setViewingMap] = useState(null);
    const [viewingConvocados, setViewingConvocados] = useState(null);
    const [convocadosList, setConvocadosList] = useState([]);
    const [loadingConvocados, setLoadingConvocados] = useState(false);

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
                <SideMenu title={clube?.nome || "Clube"} subtitle="Área de Acesso" logoHref="/login" logoSrc="/LOGO_GCDC04.png" items={menuItems} />
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
                subtitle="Área de Acesso"
                logoHref={`/minha-area/clube/${clubeId}`}
                logoSrc="/LOGO_GCDC04.png"
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

                    {/* SECÇÃO 1 — Eventos */}
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

                        <EventCarousel
                            eventos={eventos}
                            activeModalidadeId={modalidadeId}
                            onVerConvocados={abrirConvocados}
                            onVerMapa={setViewingMap}
                            emptyMessage="Não existem eventos registados para este clube."
                            showModalidade={true}
                            showAtletas={false}
                        />
                    </section>

                    {/* SECÇÃO 2 — Inscrição */}
                    <section className="card">
                        <div className="modalidades-toolbar">
                            <div className="toolbar-title-group">
                                <h2>Informações de Inscrição</h2>
                            </div>
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                <span style={{ fontWeight: 500 }}>Estado do registo:</span>
                                <InscricaoBadge estado={user?.estadoRegisto} />
                            </div>
                            <div>
                                <p style={{ fontWeight: 500, marginBottom: 6 }}>Documentação necessária:</p>
                                <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }} className="subtle">
                                    <li>Documento de identificação (CC ou Passaporte)</li>
                                    <li>Declaração de autorização (menores de 18 anos)</li>
                                    <li>Certidão médica (se aplicável)</li>
                                </ul>
                            </div>
                            <p className="subtle" style={{ margin: 0, lineHeight: 1.7 }}>
                                Envia a documentação para o email do clube ou entrega pessoalmente durante o horário de funcionamento.
                                Após validação pelo secretariado, o teu estado de inscrição será atualizado.
                            </p>
                        </div>
                    </section>

                    {/* SECÇÃO 3 — Contactos */}
                    <section className="card">
                        <div className="modalidades-toolbar">
                            <div className="toolbar-title-group">
                                <h2>Contactos</h2>
                            </div>
                        </div>

                        {clube ? (
                            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                {clube.email && (
                                    <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                                        <span style={{ minWidth: 100, fontWeight: 500 }}>Email:</span>
                                        <a href={`mailto:${clube.email}`}>{clube.email}</a>
                                    </div>
                                )}
                                {clube.telefone && (
                                    <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                                        <span style={{ minWidth: 100, fontWeight: 500 }}>Telefone:</span>
                                        <a href={`tel:${clube.telefone}`}>{clube.telefone}</a>
                                    </div>
                                )}
                                {clube.morada && (
                                    <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                                        <span style={{ minWidth: 100, fontWeight: 500 }}>Morada:</span>
                                        <span>
                                            {clube.morada}
                                            {clube.codigoPostal ? `, ${clube.codigoPostal}` : ""}
                                            {clube.localidade ? ` ${clube.localidade}` : ""}
                                        </span>
                                    </div>
                                )}
                                {!clube.email && !clube.telefone && !clube.morada && (
                                    <p className="subtle">Informações de contacto não disponíveis.</p>
                                )}
                            </div>
                        ) : (
                            <p className="subtle">Dados do clube não disponíveis.</p>
                        )}
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
                                            <span className="avatar-circle-sm avatar-initials-sm">{(c.nome || "?")[0].toUpperCase()}</span>
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
