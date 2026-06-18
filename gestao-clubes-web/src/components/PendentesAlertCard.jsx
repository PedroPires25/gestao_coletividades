import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { getPendingUsersCount } from "../api";

/**
 * Card de alerta de aprovações pendentes para as home pages.
 * Usa getPendingUsersCount (conta utilizadores pendentes reais no DB).
 * Só aparece para ADMINISTRADOR e SUPER_ADMIN com pendentes.
 */
export default function PendentesAlertCard() {
    const { user, isSuperAdmin } = useAuth();
    const navigate = useNavigate();

    // Qualquer ADMINISTRADOR aprovado ou SUPER_ADMIN
    const canSee = user?.role === "SUPER_ADMIN" || user?.role === "ADMINISTRADOR";

    const [count, setCount] = useState(0);
    const isMounted = useRef(true);

    const fetchPendentes = useCallback(() => {
        if (!canSee) return;
        getPendingUsersCount()
            .then(data => {
                if (!isMounted.current) return;
                setCount(Number(data?.count ?? 0));
            })
            .catch(() => {});
    }, [canSee]);

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

    if (!canSee || count <= 0) return null;

    const texto = isSuperAdmin
        ? (count === 1
            ? "Existe 1 administrador a aguardar a sua aprovação."
            : `Existem ${count} administradores a aguardar a sua aprovação.`)
        : (count === 1
            ? "Existe 1 utilizador a aguardar a sua aprovação."
            : `Existem ${count} utilizadores a aguardar a sua aprovação.`);

    return (
        <div
            className="pendentes-alert-card pendentes-alert-card--visible"
            onClick={() => navigate("/admin/users/pending")}
            role="button"
            tabIndex={0}
            onKeyDown={e => e.key === "Enter" && navigate("/admin/users/pending")}
            aria-label={texto}
        >
            <span className="pendentes-alert-icon" aria-hidden="true">🔔</span>

            <div className="pendentes-alert-content">
                <span className="pendentes-alert-label">Aprovação pendente</span>
                <span className="pendentes-alert-text">{texto}</span>
            </div>

            <span className="pendentes-alert-count" aria-hidden="true">
                {count > 99 ? "99+" : count}
            </span>

            <span className="pendentes-alert-cta" aria-hidden="true">
                Ver agora →
            </span>
        </div>
    );
}
