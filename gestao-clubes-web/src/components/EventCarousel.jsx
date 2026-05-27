import { useEffect, useMemo, useRef, useState } from "react";

const AUTO_ADVANCE_MS = 30000;

function formatDataHora(val) {
    if (!val) return "-";
    const d = new Date(String(val).replace(" ", "T"));
    if (Number.isNaN(d.getTime())) return val;
    const p = (n) => String(n).padStart(2, "0");
    return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
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
    const carouselRef = useRef(null);
    const cardRefs = useRef([]);

    // Clamp index so it never goes out of bounds when the event list changes
    const safeIdx = sorted.length > 0 ? Math.min(activeIdx, sorted.length - 1) : 0;

    // Auto-advance every 30 seconds
    useEffect(() => {
        if (sorted.length <= 1) return;
        const interval = setInterval(() => {
            setActiveIdx((prev) => (prev + 1) % sorted.length);
        }, AUTO_ADVANCE_MS);
        return () => clearInterval(interval);
    }, [sorted.length]);

    // Scroll to active card on index change
    useEffect(() => {
        const card = cardRefs.current[safeIdx];
        if (card) {
            card.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "start" });
        }
    }, [safeIdx]);

    if (sorted.length === 0) {
        return <p className="subtle">{emptyMessage}</p>;
    }

    return (
        <div className="event-carousel-wrap">
            <div
                className="event-carousel"
                ref={carouselRef}
                aria-label="Carrossel de eventos"
            >
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
                    const modLabel =
                        evento.modalidadeNome || evento.atividadeNome || null;
                    const assocLabel =
                        evento.clubeNome
                            ? `${evento.clubeNome}${modLabel ? ` — ${modLabel}` : ""}`
                            : modLabel;

                    return (
                        <article
                            key={evento.id}
                            ref={(el) => { cardRefs.current[i] = el; }}
                            className={`event-carousel-card card${isMinhaModalidade ? " event-card-highlight" : ""}`}
                        >
                            {/* Modalidade / atividade badge */}
                            {showModalidade && assocLabel && (
                                <div className="event-card-badge">
                                    {isMinhaModalidade ? (
                                        <span className="toolbar-count event-card-badge-mine">
                                            ⭐ {assocLabel}
                                        </span>
                                    ) : (
                                        <span className="toolbar-count event-card-badge-other">
                                            {assocLabel}
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

                            {evento.observacoes && (
                                <p className="event-card-obs subtle">{evento.observacoes}</p>
                            )}

                            {/* Action buttons */}
                            {(onVerConvocados || (onVerMapa && hasMap)) && (
                                <div className="event-card-actions">
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
                        </article>
                    );
                })}
            </div>

            {/* Dot indicators */}
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
    );
}
