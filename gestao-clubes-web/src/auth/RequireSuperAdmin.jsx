import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";

export default function RequireSuperAdmin({ children }) {
    const { isAuthenticated, isSuperAdmin } = useAuth();
    const location = useLocation();

    if (!isAuthenticated) {
        return <Navigate to="/login" replace state={{ from: location.pathname }} />;
    }

    if (!isSuperAdmin) {
        return <Navigate to="/menu" replace />;
    }

    return children;
}
