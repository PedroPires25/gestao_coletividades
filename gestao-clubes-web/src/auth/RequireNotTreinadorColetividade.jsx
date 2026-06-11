import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";

/**
 * Guard que bloqueia utilizadores com perfil TREINADOR_COLETIVIDADE
 * de aceder a páginas de gestão geral (admin/secretariado).
 * Redireciona para o módulo de treinador da sua coletividade.
 */
export default function RequireNotTreinadorColetividade({ children }) {
    const { isTreinadorColetividade, coletividadeId } = useAuth();
    const location = useLocation();

    if (isTreinadorColetividade && coletividadeId) {
        return (
            <Navigate
                to={`/coletividades/${coletividadeId}/treinador`}
                replace
                state={{ from: location.pathname }}
            />
        );
    }

    return children;
}
