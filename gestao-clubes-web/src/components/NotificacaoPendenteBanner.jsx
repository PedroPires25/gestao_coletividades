import { useNavigate } from "react-router-dom";

/**
 * Barra de alerta glassmorphism que aparece abaixo do header quando há registos pendentes.
 * Recebe `count` e `mensagem` geridos pelo SideMenu (fetch único partilhado).
 * Desaparece automaticamente quando count volta a 0 (após aprovação/rejeição).
 */
export default function NotificacaoPendenteBanner({ count, mensagem }) {
    const navigate = useNavigate();

    if (!count || count <= 0) return null;

    const texto = count === 1
        ? (mensagem || "Tem 1 registo pendente por aprovar.")
        : `Tem ${count} registos pendentes por aprovar.`;

    return (
        <div className="notif-banner" role="alert" aria-live="polite">
            <span className="notif-banner-icon" aria-hidden="true">⏳</span>
            <span className="notif-banner-text">{texto}</span>
            <button
                className="notif-banner-btn"
                type="button"
                onClick={() => navigate("/admin/users/pending")}
            >
                Ver pendentes
            </button>
        </div>
    );
}
