import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { getNotificacoesPendentes } from "../api";

/**
 * Card de alerta de aprovações pendentes para as home pages.
 * Só aparece para administradores com notificações por resolver.
 */
export default function PendentesAlertCard() {
    const { isAdmin } = useAuth();
    const navigate = useNavigate();

    const [count, setCount] = useState(0);
    const [mensagem, setMensagem] = useState("");
    const isMounted = useRef(true);

    const fetchPendentes = useCallback(() => {
        if (!isAdmin) return;
        getNotificacoesPendentes()
            .then(data => {
                if (!isMounted.current) return;
                setCount(data?.count ?? 0);
                setMensagem(data?.notificacoes?.[0]?.mensagem ?? "");
            })
            .catch(() => {});
    }, [isAdmin]);

    useEffect(() => {
        isMounted.current = true;
        fetchPendentes();
        const interval = setInterval(fetchPendentes, 30_000);
        window.addEventListener("notificacoes-refresh", fetchPendentes);
        return () => {
            isMounted.current = false;
            clearInterval(interval);
            window.removeEventListener("notificacoes-refresh", fetchPendentes);
        };
    }, [fetchPendentes]);

    if (!isAdmin || count <= 0) return null;

    const texto = count === 1
        ? (mensagem || "Tem 1 registo pendente por aprovar.")
        : `Tem ${count} registos pendentes por aprovar.`;

    return (
        <div
            className="pendentes-alert-card"
            onClick={() => navigate("/admin/users/pending")}
            role="button"
            tabIndex={0}
            onKeyDown={e => e.key === "Enter" && navigate("/admin/users/pending")}
            title="Clicar para ver registos pendentes"
        >
            <span className="pendentes-alert-icon" aria-hidden="true">⚠️</span>
            <div className="pendentes-alert-content">
                <span className="pendentes-alert-title">Aprovação pendente</span>
                <span className="pendentes-alert-text">{texto}</span>
            </div>
            <span className="pendentes-alert-ver">Ver pendentes →</span>
            {count > 0 && (
                <span className="pendentes-alert-badge" aria-label={`${count} pendentes`}>
                    {count > 99 ? "99+" : count}
                </span>
            )}
        </div>
    );
}
