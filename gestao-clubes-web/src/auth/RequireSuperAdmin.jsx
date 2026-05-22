import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";

export default function RequireSuperAdmin({ children }) {
    const { isAuthenticated, isSuperAdmin, isScopedAdmin, clubeId, coletividadeId } = useAuth();
    const location = useLocation();

    if (!isAuthenticated) {
        return <Navigate to="/login" replace state={{ from: location.pathname }} />;
    }

    if (!isSuperAdmin) {
        // Redireciona o admin de clube/coletividade para a sua área interna
        if (isScopedAdmin && clubeId) {
            return <Navigate to={`/clubes/${clubeId}`} replace />;
        }
        if (isScopedAdmin && coletividadeId) {
            return <Navigate to={`/coletividades/${coletividadeId}`} replace />;
        }
        return <Navigate to="/acesso-negado" replace />;
    }

    return children;
}
