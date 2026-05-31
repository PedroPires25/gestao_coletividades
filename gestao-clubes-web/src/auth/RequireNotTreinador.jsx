import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";

/**
 * Guard que bloqueia utilizadores com perfil TREINADOR_PRINCIPAL de aceder
 * a páginas não autorizadas (ex: Módulo Médico, Admin, Gestão de Clubes, etc).
 * Redireciona para o módulo de treinador do seu clube, ou para acesso negado.
 */
export default function RequireNotTreinador({ children }) {
    const { isTreinador, clubeId } = useAuth();
    const location = useLocation();

    if (isTreinador) {
        if (clubeId) {
            return <Navigate to={`/clubes/${clubeId}/treinador`} replace state={{ from: location.pathname }} />;
        }
        return <Navigate to="/acesso-negado" replace />;
    }

    return children;
}