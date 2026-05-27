import { useEffect, useMemo, useRef, useState } from "react";

const AUTO_ADVANCE_MS = 30000;

function formatDataHora(val) {
    if (!val) return "-";
    const d = new Date(String(val).replace(" ", "T"));
    if (Number.isNaN(d.getTime())) return val;
    const p = (n) => String(n).padStart(2, "0");
    return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

function isTomorrow(val) {
    if (!val) return false;
    const d = new Date(String(val).replace(" ", "T"));
    if (Number.isNaN(d.getTime())) return false;
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return (
        d.getFullYear() === tomorrow.getFullYear() &&
        d.getMonth() === tomorrow.getMonth() &&
        d.getDate() === tomorrow.getDate()
    );
}

/**
 * EventCarousel — carrossel horizontal de eventos com avanço automático.
 *
 * Props:
 *   eventos            {Array}    Lista de eventos a apresentar.
 *   activeModalidadeId {number?}  ID de clube_modalidade do utilizador (para destaque ⭐).
 *   onVerConvocados    {Function?} Callback(evento) — chamado ao clicar "Convocados".
 *                                  Só aparece se activeModalidadeId coincidir com o evento.
 *   onVerMapa          {Function?} Callback(evento) — chamado ao clicar "Ver Mapa".
 *                                  Só aparece quando o evento tem latitude/longitude.
 *   emptyMessage       {string?}  Mensagem quando não há eventos.
 *   showModalidade     {boolean?} Mostrar badge de modalidade/atividade (padrão: true).
 *   showAtletas        {boolean?} Mostrar contagem de atletas (padrão: true).
 */
export default function EventCarousel({
    eventos = [],
    activeModalidadeId = null,
    onVerConvocados = null,
    onVerMapa = null,
    emptyMessage = "Não existem eventos disponíveis de momento.",
    showModalidade = true,
    showAtletas = true,
}) {
    const sorted = useMemo(() => {
        if (!Array.isArray(eventos) || eventos.length === 0) return [];
        return [...eventos].sort((a, b) => {
            const aDate = a.dataHora ? new Date(String(a.dataHora).replace(" ", "T")) : new Date(0);
            const bDate = b.dataHora ? new Date(String(b.dataHora).replace(" ", "T")) : new Date(0);
            return aDate - bDate;
        });
    }, [eventos]);

    const [activeIdx, setActiveIdx] = useState(0);
    const [detalhes, setDetalhes] = useState(null); // evento being viewed in detail modal
    const carouselRef = useRef(null);
    const cardRefs = useRef([]);

    const safeIdx = sorted.length > 0 ? Math.min(activeIdx, sorted.length - 1) : 0;

    useEffect(() => {
        if (sorted.length <= 1) return;
        const interval = setInterval(() => {
            setActiveIdx((prev) => (prev + 1) % sorted.length);
        }, AUTO_ADVANCE_MS);
        return () => clearInterval(interval);
    }, [sorted.length]);

    useEffect(() => {
        const card = cardRefs.current[safeIdx];
        if (card) {
            card.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "start" });
        }
    }, [safeIdx]);

    // Close detail modal on Escape
    useEffect(() => {
        if (!detalhes) return;
        function onKey(e) { if (e.key === "Escape") setDetalhes(null); }
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [detalhes]);

    if (sorted.length === 0) {
        return <p className="subtle">{emptyMessage}</p>;
    }

    return (
        <>
            <div className="event-carousel-wrap">
                <div className="event-carousel" ref={carouselRef} aria-label="Carrossel de eventos">
                    {sorted.map((evento, i) => {
                        const isMinhaModalidade =
                            activeModalidadeId != null &&
                            evento.clubeModalidadeId != null &&
                            Number(evento.clubeModalidadeId) === Number(activeModalidadeId);

                        const totalPessoas =
                            evento.totalAtletas != null
                                ? evento.totalAtletas
                                : evento.totalConvocados != null
                                ? evento.totalConvocados
                                : null;

                        const hasMap = evento.latitude != null && evento.longitude != null;
                        const modLabel = evento.modalidadeNome || evento.atividadeNome || null;
                        const amanha = isTomorrow(evento.dataHora);

                        return (
                            <article
                                key={evento.id}
                                ref={(el) => { cardRefs.current[i] = el; }}
                                className={`event-carousel-card card${isMinhaModalidade ? " event-card-highlight" : ""}${amanha ? " event-card-tomorrow" : ""}`}
                                role="button"
                                tabIndex={0}
                                onClick={() => setDetalhes(evento)}
                                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setDetalhes(evento); }}
                                aria-label={`Ver detalhes: ${evento.titulo}`}
                                style={{ cursor: "pointer" }}
                            >
                                {/* Tomorrow badge */}
                                {amanha && (
                                    <div className="event-card-tomorrow-badge">🔔 AMANHÃ</div>
                                )}

                                {/* Modalidade badge */}
                                {showModalidade && (
                                    <div className="event-card-badge">
                                        {isMinhaModalidade ? (
                                            <span className="toolbar-count event-card-badge-mine">
                                                ⭐ {modLabel || "Evento geral"}
                                            </span>
                                        ) : (
                                            <span className="toolbar-count event-card-badge-other">
                                                {modLabel || "Evento geral"}
                                            </span>
                                        )}
                                        {evento.tipo && (
                                            <span className={`badge ${evento.tipo === "MODALIDADE" ? "badge-cyan" : "badge-orange"}`}>
                                                {evento.tipo === "MODALIDADE" ? "Modalidade" : "Atividade"}
                                            </span>
                                        )}
                                    </div>
                                )}

                                <h3 className="event-card-title">{evento.titulo}</h3>

                                {evento.descricao && (
                                    <p className="event-card-desc subtle">{evento.descricao}</p>
                                )}

                                <div className="event-card-meta">
                                    <span>📅 {formatDataHora(evento.dataHora)}</span>
                                    {evento.dataHoraFim && (
                                        <span>🏁 {formatDataHora(evento.dataHoraFim)}</span>
                                    )}
                                    {evento.local && <span>📍 {evento.local}</span>}
                                    {showAtletas && totalPessoas != null && (
                                        <span>👥 {totalPessoas}</span>
                                    )}
                                </div>

                                {/* Quick actions (stop propagation so card click doesn't also open detail) */}
                                {(onVerConvocados || (onVerMapa && hasMap)) && (
                                    <div className="event-card-actions" onClick={(e) => e.stopPropagation()}>
                                        {onVerConvocados && isMinhaModalidade && (
                                            <button
                                                type="button"
                                                className="btn btn-secondary btn-sm"
                                                onClick={() => onVerConvocados(evento)}
                                            >
                                                👥 Convocados
                                            </button>
                                        )}
                                        {onVerMapa && hasMap && (
                                            <button
                                                type="button"
                                                className="btn btn-secondary btn-sm"
                                                onClick={() => onVerMapa(evento)}
                                            >
                                                📍 Ver Mapa
                                            </button>
                                        )}
                                    </div>
                                )}

                                <span className="event-card-hint-click">Clica para ver detalhes →</span>
                            </article>
                        );
                    })}
                </div>

                {sorted.length > 1 && (
                    <div className="event-carousel-dots" aria-hidden="true">
                        {sorted.map((_, i) => (
                            <button
                                key={i}
                                type="button"
                                className={`event-carousel-dot${i === safeIdx ? " active" : ""}`}
                                onClick={() => setActiveIdx(i)}
                                aria-label={`Evento ${i + 1}`}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Detail modal */}
            {detalhes && (() => {
                const ev = detalhes;
                const isMinhaModalidade =
                    activeModalidadeId != null &&
                    ev.clubeModalidadeId != null &&
                    Number(ev.clubeModalidadeId) === Number(activeModalidadeId);
                const hasMap = ev.latitude != null && ev.longitude != null;
                const modLabel = ev.modalidadeNome || ev.atividadeNome || null;
                const amanha = isTomorrow(ev.dataHora);
                return (
                    <div className="modal-overlay" onClick={() => setDetalhes(null)}>
                        <div
                            className="modal-box event-detail-modal"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="modal-header">
                                <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                                    <h3 style={{ margin: 0 }}>{ev.titulo}</h3>
                                    {amanha && (
                                        <span className="event-card-tomorrow-badge" style={{ position: "static", margin: 0 }}>
                                            🔔 AMANHÃ
                                        </span>
                                    )}
                                </div>
                                <button className="modal-close" onClick={() => setDetalhes(null)}>✕</button>
                            </div>
                            <div className="modal-body event-detail-body">
                                {/* Badges */}
                                <div className="event-card-badge" style={{ marginBottom: 8 }}>
                                    {isMinhaModalidade ? (
                                        <span className="toolbar-count event-card-badge-mine">
                                            ⭐ {modLabel || "Evento geral"}
                                        </span>
                                    ) : (
                                        <span className="toolbar-count">{modLabel || "Evento geral"}</span>
                                    )}
                                    {ev.tipo && (
                                        <span className={`badge ${ev.tipo === "MODALIDADE" ? "badge-cyan" : "badge-orange"}`}>
                                            {ev.tipo === "MODALIDADE" ? "Modalidade" : "Atividade"}
                                        </span>
                                    )}
                                    {ev.clubeNome && (
                                        <span className="toolbar-count" style={{ opacity: 0.7 }}>
                                            🏛 {ev.clubeNome}
                                        </span>
                                    )}
                                </div>

                                {/* Description */}
                                {ev.descricao && (
                                    <p style={{ margin: "0 0 12px", lineHeight: 1.6 }}>{ev.descricao}</p>
                                )}

                                {/* Key info */}
                                <div className="event-detail-info-grid">
                                    <div className="event-detail-info-row">
                                        <span className="event-detail-info-label">📅 Data/hora início</span>
                                        <span>{formatDataHora(ev.dataHora)}</span>
                                    </div>
                                    {ev.dataHoraFim && (
                                        <div className="event-detail-info-row">
                                            <span className="event-detail-info-label">🏁 Data/hora fim</span>
                                            <span>{formatDataHora(ev.dataHoraFim)}</span>
                                        </div>
                                    )}
                                    {ev.local && (
                                        <div className="event-detail-info-row">
                                            <span className="event-detail-info-label">📍 Local</span>
                                            <span>{ev.local}</span>
                                        </div>
                                    )}
                                    {modLabel && (
                                        <div className="event-detail-info-row">
                                            <span className="event-detail-info-label">🏅 Modalidade</span>
                                            <span>{modLabel}</span>
                                        </div>
                                    )}
                                    {ev.clubeNome && (
                                        <div className="event-detail-info-row">
                                            <span className="event-detail-info-label">🏛 Clube</span>
                                            <span>{ev.clubeNome}</span>
                                        </div>
                                    )}
                                </div>

                                {ev.observacoes && (
                                    <p className="subtle" style={{ marginTop: 12, fontStyle: "italic", lineHeight: 1.6 }}>
                                        ℹ️ {ev.observacoes}
                                    </p>
                                )}

                                {/* Action buttons */}
                                {(onVerConvocados || (onVerMapa && hasMap)) && (
                                    <div className="event-card-actions" style={{ marginTop: 16, paddingTop: 12, borderTop: "1px solid var(--border)" }}>
                                        {onVerConvocados && isMinhaModalidade && (
                                            <button
                                                type="button"
                                                className="btn btn-secondary"
                                                onClick={() => { setDetalhes(null); onVerConvocados(ev); }}
                                            >
                                                👥 Ver Convocados
                                            </button>
                                        )}
                                        {onVerMapa && hasMap && (
                                            <button
                                                type="button"
                                                className="btn btn-secondary"
                                                onClick={() => { setDetalhes(null); onVerMapa(ev); }}
                                            >
                                                📍 Ver no Mapa
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })()}
        </>
    );
}
