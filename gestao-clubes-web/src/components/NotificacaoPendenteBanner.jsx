import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

/**
 * Barra de alerta profissional — aparece abaixo do header quando há registos pendentes.
 * Glassmorphism âmbar, fade-in suave.
 * count gerido pelo SideMenu (fetch único partilhado).
 */
export default function NotificacaoPendenteBanner({ count = 0 }) {
    const navigate = useNavigate();
    const { isSuperAdmin } = useAuth();

    if (count <= 0) return null;

    const texto = isSuperAdmin
        ? (count === 1
            ? "Existe 1 administrador a aguardar a sua aprovação."
            : `Existem ${count} administradores a aguardar a sua aprovação.`)
        : (count === 1
            ? "Existe 1 utilizador a aguardar a sua aprovação."
            : `Existem ${count} utilizadores a aguardar a sua aprovação.`);

    return (
        <div className="notif-banner" role="alert" aria-live="polite" aria-atomic="true">
            <span className="notif-banner-icon" aria-hidden="true">🔔</span>

            <div className="notif-banner-body">
                <span className="notif-banner-label">Aprovação pendente</span>
                <span className="notif-banner-text">{texto}</span>
            </div>

            <span className="notif-banner-count" aria-hidden="true">
                {count > 99 ? "99+" : count}
            </span>

            <button
                className="notif-banner-btn"
                type="button"
                onClick={() => navigate("/admin/users/pending")}
                aria-label="Ver registos pendentes"
            >
                Ver agora
            </button>
        </div>
    );
}
