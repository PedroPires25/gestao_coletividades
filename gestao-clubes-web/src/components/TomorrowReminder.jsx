import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import * as eventosService from "../services/eventos";

const REMINDER_KEY = "gc-tomorrow-reminder-dismissed";

const PUBLIC_PREFIXES = [
    "/login",
    "/forgot-password",
    "/reset-password",
    "/recuperar-password",
    "/pending-approval",
    "/politica-privacidade",
    "/acesso-negado",
    "/",
];

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
    const { pathname } = useLocation();

    const isPublicPage =
        pathname === "/" ||
        PUBLIC_PREFIXES.some((p) => p !== "/" && pathname.startsWith(p));

    const [dismissedByUser, setDismissedByUser] = useState(
        () => sessionStorage.getItem(REMINDER_KEY) === "1"
    );
    const dismissed = dismissedByUser || !isAuthenticated;
    const [eventos, setEventos] = useState([]);
    const [idx, setIdx] = useState(0);

    useEffect(() => {
        if (!isAuthenticated) {
            sessionStorage.removeItem(REMINDER_KEY);
        }
    }, [isAuthenticated]);

    useEffect(() => {
        if (!isAuthenticated || isSuperAdmin || !clubeId || dismissed || isPublicPage) {
            return;
        }

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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAuthenticated, isSuperAdmin, clubeId, isPublicPage]);
    const eventosAmanha = useMemo(
        () => eventos.filter((e) => isTomorrow(e.dataHora)),
        [eventos]
    );

    if (isPublicPage || !isAuthenticated || isSuperAdmin || dismissed || eventosAmanha.length === 0) {
        return null;
    }

    const total = eventosAmanha.length;
    const safeIdx = Math.min(idx, total - 1);
    const evento = eventosAmanha[safeIdx];

    function dismiss() {
        sessionStorage.setItem(REMINDER_KEY, "1");
        setDismissedByUser(true);
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
