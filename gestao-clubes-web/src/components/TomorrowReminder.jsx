import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import * as eventosService from "../services/eventos";
import * as eventosColetividadeService from "../services/eventosColetividade";

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

function getEventoDateTime(evento) {
    if (evento?.dataHora) return evento.dataHora;
    if (evento?.dataEvento) {
        const hora = evento.horaInicio || "00:00";
        return `${evento.dataEvento}T${hora}`;
    }
    return null;
}

function formatHora(val) {
    if (!val) return "";
    const d = new Date(String(val).replace(" ", "T"));
    if (Number.isNaN(d.getTime())) return "";
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

// Perfis de utilizador final — redirecionados para a sua área pessoal
const USER_FACING_ROLES = new Set(["ATLETA", "UTENTE", "INSCRITO_COLETIVIDADE", "USER"]);

function getDetalhesPath(role, source, evento, userClubeId, userColetividadeId) {
    const evClubeId = evento.clubeId || userClubeId;
    const evColetividadeId = evento.coletividadeId || userColetividadeId;

    if (USER_FACING_ROLES.has(role)) {
        if (role === "UTENTE" || role === "INSCRITO_COLETIVIDADE") {
            if (evColetividadeId) return `/minha-area/coletividade/${evColetividadeId}`;
            if (evClubeId) return `/minha-area/clube/${evClubeId}`;
        } else {
            // ATLETA, USER
            if (evClubeId) return `/minha-area/clube/${evClubeId}`;
            if (evColetividadeId) return `/minha-area/coletividade/${evColetividadeId}`;
        }
    }

    // Perfis técnicos/staff/admin → página de gestão de eventos
    if (source === "coletividade" && evColetividadeId) {
        return `/coletividades/${evColetividadeId}/eventos`;
    }
    if (evClubeId) {
        return `/clubes/${evClubeId}/eventos`;
    }
    return "/eventos";
}

function normalizeEvento(evento, source, role, userClubeId, userColetividadeId) {
    const dataHora = getEventoDateTime(evento);
    return {
        ...evento,
        source,
        dataHora,
        local: evento.local || evento.localEvento || "",
        areaNome: evento.modalidadeNome || evento.atividadeNome || "",
        detalhesPath: getDetalhesPath(role, source, evento, userClubeId, userColetividadeId),
    };
}

export default function TomorrowReminder() {
    const { isAuthenticated, user, role, clubeId, coletividadeId } = useAuth();
    const { pathname } = useLocation();
    const navigate = useNavigate();

    const isPublicPage =
        pathname === "/" ||
        PUBLIC_PREFIXES.some((p) => p !== "/" && pathname.startsWith(p));

    const [dismissedByUser, setDismissedByUser] = useState(
        () => sessionStorage.getItem(getReminderKey()) === "1"
    );
    const dismissed = dismissedByUser || !isAuthenticated;
    const [eventos, setEventos] = useState([]);
    const [idx, setIdx] = useState(0);

    function getReminderKey() {
        return user?.id ? `${REMINDER_KEY}-${user.id}` : REMINDER_KEY;
    }

    useEffect(() => {
        if (!isAuthenticated) {
            sessionStorage.removeItem(REMINDER_KEY);
        }
    }, [isAuthenticated]);

    useEffect(() => {
        if (!isAuthenticated || dismissed || isPublicPage) {
            return;
        }

        let active = true;
        const requests = [];

        if (clubeId) {
            requests.push(
                eventosService
                    .listarMeusEventos(clubeId)
                    .then((data) => (Array.isArray(data) ? data.map((e) => normalizeEvento(e, "clube", role, clubeId, coletividadeId)) : []))
            );
        }

        if (coletividadeId) {
            requests.push(
                eventosColetividadeService
                    .getEventosColetividade(coletividadeId)
                    .then((data) => (Array.isArray(data) ? data.map((e) => normalizeEvento(e, "coletividade", role, clubeId, coletividadeId)) : []))
            );
        }

        if (!clubeId && !coletividadeId && role === "SUPER_ADMIN") {
            requests.push(
                eventosService
                    .listarTodosEventos()
                    .then((data) => (Array.isArray(data) ? data.map((e) => normalizeEvento(e, "global", role, clubeId, coletividadeId)) : []))
            );
            requests.push(
                eventosColetividadeService
                    .getTodosEventosColetividade()
                    .then((data) => (Array.isArray(data) ? data.map((e) => normalizeEvento(e, "coletividade", role, clubeId, coletividadeId)) : []))
            );
        }

        if (requests.length === 0) {
            Promise.resolve().then(() => {
                if (!active) return;
                setEventos([]);
                setIdx(0);
            });
            return () => {
                active = false;
            };
        }

        Promise.allSettled(requests).then((results) => {
            if (!active) return;
            const loadedEventos = [];
            results.forEach((result) => {
                if (result.status === "fulfilled") {
                    loadedEventos.push(...result.value);
                } else {
                    console.error("Erro ao carregar lembretes de eventos.", result.reason);
                }
            });
            setEventos(loadedEventos);
            setIdx(0);
        });

        return () => {
            active = false;
        };
    }, [isAuthenticated, dismissed, isPublicPage, role, clubeId, coletividadeId]);

    const eventosAmanha = useMemo(
        () => eventos.filter((e) => isTomorrow(e.dataHora)),
        [eventos]
    );

    if (isPublicPage || !isAuthenticated || dismissed || eventosAmanha.length === 0) {
        return null;
    }

    const total = eventosAmanha.length;
    const safeIdx = Math.min(idx, total - 1);
    const evento = eventosAmanha[safeIdx];

    function dismiss() {
        sessionStorage.setItem(getReminderKey(), "1");
        setDismissedByUser(true);
    }

    function viewDetails() {
        dismiss();
        navigate(evento.detalhesPath);
    }

    return (
        <div className="event-reminder-overlay" role="alertdialog" aria-label="Lembrete de evento">
            <div className="event-reminder-card">
                <div className="event-reminder-header">
                    <span className="event-reminder-title">🔔 LEMBRETE DE EVENTO</span>
                    <button
                        type="button"
                        className="event-reminder-close"
                        onClick={dismiss}
                        aria-label="Fechar lembrete"
                    >
                        ✕
                    </button>
                </div>

                <p className="event-reminder-subtitle">Tem um evento amanhã</p>
                <p className="event-reminder-event-name">{evento.titulo}</p>

                <div className="event-reminder-meta">
                    {evento.dataHora && <span>🕒 {formatHora(evento.dataHora)}</span>}
                    {evento.local && <span>📍 {evento.local}</span>}
                    {evento.areaNome && <span>🏆 {evento.areaNome}</span>}
                </div>

                {total > 1 && (
                    <div className="event-reminder-nav">
                        <button
                            type="button"
                            className="event-reminder-nav-button"
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
                            className="event-reminder-nav-button"
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
                        className="event-reminder-action event-reminder-action-primary"
                        onClick={viewDetails}
                    >
                        Ver detalhes
                    </button>
                    <button
                        type="button"
                        className="event-reminder-action event-reminder-action-secondary"
                        onClick={dismiss}
                    >
                        Fechar
                    </button>
                </div>
            </div>
        </div>
    );
}
