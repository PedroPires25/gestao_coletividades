import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";

/**
 * Guard que bloqueia utilizadores com perfil DEPARTAMENTO_MEDICO de aceder
 * a páginas exclusivas de Administrador/Secretário.
 * Redireciona para o módulo médico do seu clube, ou para acesso negado.
 */
export default function RequireNotMedico({ children }) {
    const { isDepartamentoMedico, clubeId } = useAuth();
    const location = useLocation();

    if (isDepartamentoMedico) {
        if (clubeId) {
            return <Navigate to={`/clubes/${clubeId}/medico`} replace state={{ from: location.pathname }} />;
        }
        return <Navigate to="/acesso-negado" replace />;
    }

    return children;
}
