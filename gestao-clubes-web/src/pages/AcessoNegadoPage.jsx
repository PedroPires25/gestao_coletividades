import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function AcessoNegadoPage() {
    const navigate = useNavigate();
    const { clubeId, coletividadeId, isSuperAdmin } = useAuth();

    function voltar() {
        if (isSuperAdmin) {
            navigate("/menu");
        } else if (clubeId) {
            navigate(`/clubes/${clubeId}`);
        } else if (coletividadeId) {
            navigate(`/coletividades/${coletividadeId}`);
        } else {
            navigate("/menu");
        }
    }

    return (
        <div style={{ padding: 40, textAlign: "center" }}>
            <h1>🚫 Acesso não autorizado</h1>
            <p style={{ marginTop: 12 }}>Não tens permissões para aceder a esta página.</p>
            <button className="btn btn-primary" style={{ marginTop: 24 }} onClick={voltar}>
                Voltar
            </button>
        </div>
    );
}
