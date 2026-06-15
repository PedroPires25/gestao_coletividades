import { useNavigate } from "react-router-dom";

/**
 * Sino de notificações — aparece apenas quando count > 0.
 * Animação de balanço suave. Badge vermelho com contagem.
 * O fetch é gerido pelo SideMenu (estado partilhado).
 */
export default function NotificacoesBell({ count = 0 }) {
    const navigate = useNavigate();

    if (count <= 0) return null;

    return (
        <button
            className="notif-bell-btn"
            type="button"
            aria-label={`${count} aprovação${count !== 1 ? "ões" : ""} pendente${count !== 1 ? "s" : ""}`}
            onClick={() => navigate("/admin/users/pending")}
            title={`${count} registo${count !== 1 ? "s" : ""} pendente${count !== 1 ? "s" : ""} por aprovar`}
        >
            <span className="notif-bell-icon" aria-hidden="true">🔔</span>
            <span className="notif-bell-badge" aria-hidden="true">
                {count > 99 ? "99+" : count}
            </span>
        </button>
    );
}
