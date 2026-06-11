import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";

export default function RequireAdmin({ children }) {
    const { isAuthenticated, isAdmin, redirectPath } = useAuth();
    const location = useLocation();

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (!isAdmin) {
        // Redireciona para a página inicial correta em vez de /menu
        return <Navigate to={redirectPath || "/"} replace />;
    }

    return children;
}