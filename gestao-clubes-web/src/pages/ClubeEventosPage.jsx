import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import SideMenu from "../components/SideMenu";
import { useAuth } from "../auth/AuthContext";
import { getClubeById } from "../api";
import { getEventosPorClube } from "../services/eventos";

import eventosIcon from "../assets/eventos.svg";
import defaultIcon from "../assets/default.svg";

export default function ClubeEventosPage() {
    const { clubeId } = useParams();
    const navigate = useNavigate();
    const { logout, user } = useAuth();

    const [clube, setClube] = useState(null);
    const [eventos, setEventos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [erro, setErro] = useState(null);
    const [eventoSelecionado, setEventoSelecionado] = useState(null);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        carregarDados();
    }, [clubeId]);

    async function carregarDados() {
        try {
            setLoading(true);
            setErro(null);

            const clubeData = await getClubeById(clubeId);
            setClube(clubeData);

            const eventosData = await getEventosPorClube(clubeId);
            setEventos(eventosData || []);
        } catch (err) {
            console.error(err);
            setErro("Erro ao carregar dados: " + err.message);
        } finally {
            setLoading(false);
        }
    }

    function abrirDetalhes(evento) {
        setEventoSelecionado(evento);
        setShowModal(true);
    }

    function fecharModal() {
        setShowModal(false);
        setEventoSelecionado(null);
    }

    function formatarData(dataHora) {
        if (!dataHora) return "";
        try {
            const data = new Date(dataHora);
            return data.toLocaleString("pt-PT", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
            });
        } catch {
            return dataHora;
        }
    }

    function verificarAcessoCompleto(evento) {
        if (!user || !user.modalidadeId) {
            return false;
        }

        if (evento.eventoModalidadeId && evento.eventoModalidadeId === user.modalidadeId) {
            return true;
        }

        return evento.temAcessoCompleto === true;
    }

    function isEventoDaMinhaModalidade(evento) {
        return verificarAcessoCompleto(evento);
    }

    if (loading) {
        return (
            <div style={{ display: "flex", height: "100vh" }}>
                <SideMenu />
                <div style={{ flex: 1, padding: "20px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <p>Carregando eventos...</p>
                </div>
            </div>
        );
    }

    return (
        <div style={{ display: "flex", height: "100vh" }}>
            <SideMenu title={`${clube?.nome || "Clube"}`} />
            <div style={{ flex: 1, padding: "20px", overflowY: "auto" }}>
                <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
                        <div>
                            <h1 style={{ margin: "0 0 8px 0" }}>Eventos</h1>
                            {clube && <p style={{ margin: 0, color: "#666", fontSize: "16px" }}>Clube: {clube.nome}</p>}
                        </div>
                        <button
                            onClick={() => navigate(`/clubes/${clubeId}`)}
                            style={{
                                padding: "8px 16px",
                                backgroundColor: "#228be6",
                                color: "white",
                                border: "none",
                                borderRadius: "4px",
                                cursor: "pointer",
                                marginRight: "8px",
                            }}
                        >
                            Voltar ao Clube
                        </button>
                    </div>

                    {erro && (
                        <div style={{ padding: "12px", backgroundColor: "#ffe0e0", color: "#c92a2a", borderRadius: "4px", marginBottom: "20px" }}>
                            {erro}
                        </div>
                    )}

                    {eventos.length === 0 ? (
                        <div style={{ padding: "20px", backgroundColor: "#f5f5f5", borderRadius: "4px", textAlign: "center" }}>
                            <p>Nenhum evento encontrado para este clube</p>
                        </div>
                    ) : (
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "20px" }}>
                            {eventos.map((evento) => {
                                const isMeuEvento = isEventoDaMinhaModalidade(evento);
                                const modalidade = evento.clubeModalidade?.modalidade?.nome || "Sem modalidade";

                                return (
                                    <div
                                        key={evento.id}
                                        onClick={() => abrirDetalhes(evento)}
                                        style={{
                                            border: isMeuEvento ? "3px solid #51cf66" : "1px solid #ddd",
                                            borderRadius: "8px",
                                            padding: "16px",
                                            cursor: "pointer",
                                            backgroundColor: isMeuEvento ? "#f1fdf4" : "#fff",
                                            boxShadow: isMeuEvento ? "0 2px 8px rgba(81, 207, 102, 0.2)" : "0 2px 4px rgba(0,0,0,0.1)",
                                            transition: "all 0.3s ease",
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.boxShadow = isMeuEvento
                                                ? "0 4px 12px rgba(81, 207, 102, 0.3)"
                                                : "0 4px 8px rgba(0,0,0,0.15)";
                                            e.currentTarget.style.transform = "translateY(-2px)";
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.boxShadow = isMeuEvento
                                                ? "0 2px 8px rgba(81, 207, 102, 0.2)"
                                                : "0 2px 4px rgba(0,0,0,0.1)";
                                            e.currentTarget.style.transform = "translateY(0)";
                                        }}
                                    >
                                        <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", marginBottom: "12px" }}>
                                            <img
                                                src={eventosIcon || defaultIcon}
                                                alt="Evento"
                                                style={{ width: "40px", height: "40px" }}
                                            />
                                            <div style={{ flex: 1 }}>
                                                <h3 style={{ margin: "0 0 4px 0", fontSize: "16px" }}>{evento.titulo}</h3>
                                                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                                                    <span
                                                        style={{
                                                            display: "inline-block",
                                                            backgroundColor: "#868e96",
                                                            color: "white",
                                                            padding: "2px 8px",
                                                            borderRadius: "4px",
                                                            fontSize: "12px",
                                                        }}
                                                    >
                                                        {modalidade}
                                                    </span>
                                                    {isMeuEvento && (
                                                        <span
                                                            style={{
                                                                display: "inline-block",
                                                                backgroundColor: "#51cf66",
                                                                color: "white",
                                                                padding: "2px 8px",
                                                                borderRadius: "4px",
                                                                fontSize: "12px",
                                                                fontWeight: "bold",
                                                            }}
                                                        >
                                                            ⭐ Minha Modalidade
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <p style={{ margin: "8px 0", fontSize: "14px", color: "#666" }}>
                                            <strong>📅 Data:</strong> {formatarData(evento.dataHora)}
                                        </p>

                                        {evento.local && (
                                            <p style={{ margin: "8px 0", fontSize: "14px", color: "#666" }}>
                                                <strong>📍 Local:</strong> {evento.local}
                                            </p>
                                        )}

                                        {evento.descricao && (
                                            <p style={{ margin: "8px 0", fontSize: "14px", color: "#666" }}>
                                                <strong>ℹ️ Descrição:</strong> {evento.descricao.substring(0, 80)}
                                                {evento.descricao.length > 80 ? "..." : ""}
                                            </p>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Modal de Detalhes */}
                {showModal && eventoSelecionado && (
                    <div
                        style={{
                            position: "fixed",
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: "rgba(0,0,0,0.5)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            zIndex: 1000,
                        }}
                        onClick={fecharModal}
                    >
                        <div
                            style={{
                                backgroundColor: "white",
                                padding: "24px",
                                borderRadius: "8px",
                                maxWidth: "600px",
                                width: "90%",
                                maxHeight: "80vh",
                                overflowY: "auto",
                            }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                                <h2 style={{ margin: 0 }}>{eventoSelecionado.titulo}</h2>
                                <button
                                    onClick={fecharModal}
                                    style={{
                                        backgroundColor: "transparent",
                                        border: "none",
                                        fontSize: "24px",
                                        cursor: "pointer",
                                    }}
                                >
                                    ✕
                                </button>
                            </div>

                            <div style={{ marginBottom: "16px" }}>
                                {isEventoDaMinhaModalidade(eventoSelecionado) && (
                                    <span
                                        style={{
                                            display: "inline-block",
                                            backgroundColor: "#51cf66",
                                            color: "white",
                                            padding: "4px 12px",
                                            borderRadius: "4px",
                                            fontSize: "14px",
                                            marginRight: "8px",
                                            fontWeight: "bold",
                                        }}
                                    >
                                        ⭐ Acesso Completo
                                    </span>
                                )}
                                <span
                                    style={{
                                        display: "inline-block",
                                        backgroundColor: "#868e96",
                                        color: "white",
                                        padding: "4px 12px",
                                        borderRadius: "4px",
                                        fontSize: "14px",
                                        marginRight: "8px",
                                    }}
                                >
                                    {eventoSelecionado.clubeModalidade?.modalidade?.nome || "Sem modalidade"}
                                </span>
                                <span
                                    style={{
                                        display: "inline-block",
                                        backgroundColor: "#5c7cfa",
                                        color: "white",
                                        padding: "4px 12px",
                                        borderRadius: "4px",
                                        fontSize: "14px",
                                    }}
                                >
                                    {eventoSelecionado.tipo || "MODALIDADE"}
                                </span>
                            </div>

                            <div style={{ marginBottom: "12px" }}>
                                <strong>📅 Data e Hora:</strong>
                                <p style={{ margin: "4px 0", color: "#666" }}>{formatarData(eventoSelecionado.dataHora)}</p>
                            </div>

                            {eventoSelecionado.local && (
                                <div style={{ marginBottom: "12px" }}>
                                    <strong>📍 Local:</strong>
                                    <p style={{ margin: "4px 0", color: "#666" }}>{eventoSelecionado.local}</p>
                                </div>
                            )}

                            {eventoSelecionado.descricao && (
                                <div style={{ marginBottom: "12px" }}>
                                    <strong>ℹ️ Descrição:</strong>
                                    <p style={{ margin: "4px 0", color: "#666" }}>{eventoSelecionado.descricao}</p>
                                </div>
                            )}

                            {eventoSelecionado.observacoes && (
                                <div style={{ marginBottom: "12px" }}>
                                    <strong>📝 Observações:</strong>
                                    <p style={{ margin: "4px 0", color: "#666" }}>{eventoSelecionado.observacoes}</p>
                                </div>
                            )}

                            {isEventoDaMinhaModalidade(eventoSelecionado) && (
                                <div style={{ marginTop: "20px", paddingTop: "20px", borderTop: "1px solid #ddd" }}>
                                    <h3 style={{ margin: "0 0 12px 0" }}>👥 Convocatórias</h3>
                                    <p style={{ color: "#666", fontSize: "14px" }}>
                                        Aqui aparecerão as convocatórias deste evento (quando disponíveis)
                                    </p>
                                </div>
                            )}

                            {!isEventoDaMinhaModalidade(eventoSelecionado) && (
                                <div
                                    style={{
                                        marginTop: "20px",
                                        padding: "12px",
                                        backgroundColor: "#fff3bf",
                                        borderRadius: "4px",
                                        color: "#856404",
                                        fontSize: "14px",
                                    }}
                                >
                                    🔒 Este evento é de outra modalidade. Apenas informações básicas são visíveis.
                                </div>
                            )}

                            <div style={{ marginTop: "20px", display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                                <button
                                    onClick={fecharModal}
                                    style={{
                                        padding: "8px 16px",
                                        backgroundColor: "#f1f3f5",
                                        border: "1px solid #ddd",
                                        borderRadius: "4px",
                                        cursor: "pointer",
                                    }}
                                >
                                    Fechar
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
