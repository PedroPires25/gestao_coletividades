import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { getHomePathByRole } from "../utils/navigation";

export default function AcessoNegadoPage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const homePath = useMemo(() => getHomePathByRole(user), [user]);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (homePath) {
                navigate(homePath, { replace: true });
            }
        }, 3000);

        return () => clearTimeout(timer);
    }, [homePath, navigate]);

    return (
        <div className="login-page">
            <div className="login-shell">
                <div className="login-card fade-in">
                    <div className="login-card-top">
                        <h1 className="login-title">🚫 Acesso Negado</h1>
                        <p className="login-sub">
                            Não tem permissão para aceder a esta página.
                            <br />
                            A ser redirecionado para a sua página inicial em 3 segundos...
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}