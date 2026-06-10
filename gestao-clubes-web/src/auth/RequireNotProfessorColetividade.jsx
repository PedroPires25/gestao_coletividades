import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";

/**
 * Guard que bloqueia utilizadores com perfil PROFESSOR de coletividade
 * de aceder a páginas de gestão geral (admin/secretariado).
 * Redireciona para o módulo de professor da sua coletividade.
 */
export default function RequireNotProfessorColetividade({ children }) {
    const { isProfessorColetividade, coletividadeId } = useAuth();
    const location = useLocation();

    if (isProfessorColetividade && coletividadeId) {
        return (
            <Navigate
                to={`/coletividades/${coletividadeId}/professor`}
                replace
                state={{ from: location.pathname }}
            />
        );
    }

    return children;
}
