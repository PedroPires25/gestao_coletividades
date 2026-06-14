import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

const AUTO_ADVANCE_MS = 30000;

function getCardsPerPage(containerWidth) {
    if (containerWidth <= 0) return 1;
    if (containerWidth <= 600) return 1;
    if (containerWidth <= 960) return 2;
    return 3;
}

export default function AtividadeCarousel({
    atividades = [],
    coletividadeId,
    emptyMessage = "Não existem atividades disponíveis de momento.",
}) {
    const [pageIdx, setPageIdx] = useState(0);
    const [cardsPerPage, setCardsPerPage] = useState(1);
    const wrapRef = useRef(null);

    useEffect(() => {
        const el = wrapRef.current;
        if (!el) return;
        const observer = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const w = entry.contentRect.width;
                const cpp = getCardsPerPage(w);
                setCardsPerPage((prev) => {
                    if (prev !== cpp) setPageIdx(0);
                    return cpp;
                });
            }
        });
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    const totalPages = atividades.length > 0 ? Math.ceil(atividades.length / cardsPerPage) : 0;
    const safePage = totalPages > 0 ? Math.min(pageIdx, totalPages - 1) : 0;

    useEffect(() => {
        if (totalPages <= 1) return;
        const interval = setInterval(() => {
            setPageIdx((prev) => (prev + 1) % totalPages);
        }, AUTO_ADVANCE_MS);
        return () => clearInterval(interval);
    }, [totalPages]);

    if (!atividades || atividades.length === 0) {
        return <p className="subtle">{emptyMessage}</p>;
    }

    const pageCards = atividades.slice(safePage * cardsPerPage, (safePage + 1) * cardsPerPage);

    return (
        <div className="event-carousel-wrap" ref={wrapRef}>
            <div
                className="event-carousel"
                style={{ gridTemplateColumns: `repeat(${cardsPerPage}, 1fr)` }}
                aria-label="Carrossel de atividades"
            >
                {pageCards.map((atividade) => {
                    return (
                        <article
                            key={atividade.id}
                            className="event-carousel-card card"
                            style={{ display: "flex", flexDirection: "column" }}
                        >
                            <div className="event-card-badge">
                                <span className="toolbar-count event-card-badge-mine">
                                    ⭐ Minha Atividade
                                </span>
                                <span className={`badge badge-orange`}>
                                    {atividade.estado || "Inscrito"}
                                </span>
                            </div>

                            <h3 className="event-card-title">{atividade.nome}</h3>

                            {atividade.descricao && (
                                <p className="event-card-desc subtle">{atividade.descricao}</p>
                            )}

                            <div className="event-card-meta" style={{ flexGrow: 1 }}>
                                <span>👥 Prof: {atividade.professor || "N/A"}</span>
                                <span>📅 Ano/Horário: {atividade.horario || "N/A"}</span>
                                {atividade.local && <span>📍 Local: {atividade.local}</span>}
                            </div>

                            <div className="event-card-actions" style={{ marginTop: 16 }}>
                                <Link
                                    to={`/minha-area/coletividade/${coletividadeId}/atividades/${atividade.coletividadeAtividadeId}`}
                                    className="btn btn-secondary btn-sm"
                                    style={{ width: "100%", textAlign: "center" }}
                                >
                                    Ver Detalhes e Eventos
                                </Link>
                            </div>
                        </article>
                    );
                })}
            </div>

            {totalPages > 1 && (
                <div className="event-carousel-dots" aria-hidden="true">
                    {Array.from({ length: totalPages }, (_, i) => (
                        <button
                            key={i}
                            type="button"
                            className={`event-carousel-dot${i === safePage ? " active" : ""}`}
                            onClick={() => setPageIdx(i)}
                            aria-label={`Página ${i + 1}`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}