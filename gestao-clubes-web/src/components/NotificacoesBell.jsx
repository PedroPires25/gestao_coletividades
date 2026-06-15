import { useNavigate } from "react-router-dom";

/**
 * Sino de notificações — mostra apenas o badge com contagem.
 * O fetch é gerido pelo SideMenu (estado partilhado).
 * Ao clicar, navega para os Registos Pendentes.
 */
export default function NotificacoesBell({ count = 0 }) {
    const navigate = useNavigate();

    return (
        <button
            className="notif-bell-btn"
            type="button"
            aria-label={`Notificações${count > 0 ? ` (${count} pendentes)` : ""}`}
            onClick={() => navigate("/admin/users/pending")}
        >
            <span className="notif-bell-icon">🔔</span>
            {count > 0 && (
                <span className="notif-bell-badge">{count > 99 ? "99+" : count}</span>
            )}
        </button>
    );
}
