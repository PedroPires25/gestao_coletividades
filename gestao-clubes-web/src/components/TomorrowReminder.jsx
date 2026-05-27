import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import * as eventosService from "../services/eventos";

const REMINDER_KEY = "gc-tomorrow-reminder-dismissed";

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

function formatHora(val) {
    if (!val) return "";
    const d = new Date(String(val).replace(" ", "T"));
    if (Number.isNaN(d.getTime())) return "";
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export default function TomorrowReminder() {
    const { isAuthenticated, isSuperAdmin, clubeId } = useAuth();

    const [eventos, setEventos] = useState([]);
    const [dismissed, setDismissed] = useState(
        () => sessionStorage.getItem(REMINDER_KEY) === "1"
    );
    const [idx, setIdx] = useState(0);

    useEffect(() => {
        if (!isAuthenticated || isSuperAdmin || !clubeId || dismissed) return;

        let active = true;
        eventosService
            .listarMeusEventos(clubeId)
            .then((data) => {
                if (active) setEventos(Array.isArray(data) ? data : []);
            })
            .catch(() => {
                if (active) setEventos([]);
            });

        return () => {
            active = false;
        };
    }, [isAuthenticated, isSuperAdmin, clubeId, dismissed]);

    const eventosAmanha = useMemo(
        () => eventos.filter((e) => isTomorrow(e.dataHora)),
        [eventos]
    );

    if (!isAuthenticated || isSuperAdmin || dismissed || eventosAmanha.length === 0) {
        return null;
    }

    const total = eventosAmanha.length;
    const safeIdx = Math.min(idx, total - 1);
    const evento = eventosAmanha[safeIdx];

    function dismiss() {
        sessionStorage.setItem(REMINDER_KEY, "1");
        setDismissed(true);
    }

    return (
        <div className="event-reminder-overlay" role="alertdialog" aria-label="Lembrete de evento">
            <div className="event-reminder-card">
                <div className="event-reminder-header">
                    <span className="event-reminder-title">🔔 Lembrete de evento</span>
                    <button
                        type="button"
                        className="event-reminder-close"
                        onClick={dismiss}
                        aria-label="Fechar lembrete"
                    >
                        ✕
                    </button>
                </div>

                <p className="event-reminder-subtitle">Tens evento amanhã</p>
                <p className="event-reminder-event-name">{evento.titulo}</p>

                <div className="event-reminder-meta">
                    {evento.dataHora && <span>🕐 {formatHora(evento.dataHora)}</span>}
                    {evento.local && <span>📍 {evento.local}</span>}
                    {(evento.modalidadeNome || evento.atividadeNome) && (
                        <span>🏅 {evento.modalidadeNome || evento.atividadeNome}</span>
                    )}
                </div>

                {total > 1 && (
                    <div className="event-reminder-nav">
                        <button
                            type="button"
                            className="btn btn-sm btn-secondary"
                            onClick={() => setIdx((i) => Math.max(0, i - 1))}
                            disabled={safeIdx === 0}
                            aria-label="Evento anterior"
                        >
                            ‹
                        </button>
                        <span className="event-reminder-nav-count">
                            {safeIdx + 1} / {total}
                        </span>
                        <button
                            type="button"
                            className="btn btn-sm btn-secondary"
                            onClick={() => setIdx((i) => Math.min(total - 1, i + 1))}
                            disabled={safeIdx === total - 1}
                            aria-label="Evento seguinte"
                        >
                            ›
                        </button>
                    </div>
                )}

                <div className="event-reminder-actions">
                    <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={dismiss}
                    >
                        Ver detalhes
                    </button>
                    <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={dismiss}
                    >
                        Fechar
                    </button>
                </div>
            </div>
        </div>
    );
}
