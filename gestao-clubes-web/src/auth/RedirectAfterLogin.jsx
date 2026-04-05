import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";

export default function RedirectAfterLogin({ children }) {
    const { isAuthenticated, redirectUrl, estadoRegisto } = useAuth();
    const location = useLocation();
    const [shouldRedirect, setShouldRedirect] = useState(false);

    useEffect(() => {
        // Dar tempo ao AuthContext atualizar
        setShouldRedirect(true);
    }, [isAuthenticated, redirectUrl, estadoRegisto]);

    // Se não autenticado, ir para login
    if (!isAuthenticated) {
        return <Navigate to="/login" replace state={{ from: location.pathname }} />;
    }

    // Se não aprovado, ir para página de pendência
    if (estadoRegisto !== "APROVADO") {
        return <Navigate to="/pending-approval" replace />;
    }

    // Se tem redirectUrl e está numa rota raiz (não específica), redirecionar
    if (shouldRedirect && redirectUrl && isValidRedirectUrl(redirectUrl)) {
        // Verificar se já está na rota correta
        if (location.pathname !== redirectUrl && location.pathname === "/") {
            return <Navigate to={redirectUrl} replace />;
        }
    }

    return children;
}

function isValidRedirectUrl(url) {
    // URLs válidas começam com /
    return url && url.startsWith("/") && url.length > 1;
}
