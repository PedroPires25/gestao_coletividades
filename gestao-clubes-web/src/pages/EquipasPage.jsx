import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import SideMenu from "../components/SideMenu";
import { useAuth } from "../auth/AuthContext";

export default function EquipasPage() {
    const { clubeId } = useParams();
    const navigate = useNavigate();
    const { logout } = useAuth();

    const menuItems = useMemo(() => [
        { label: "Módulo de Treinador", to: `/clubes/${clubeId}/treinador` },
        { label: "Logout", onClick: () => { logout(); navigate("/login", { replace: true }); } },
    ], [clubeId, logout, navigate]);

    return (
        <>
            <SideMenu title="Gestão de Clubes" subtitle="Equipas" logoHref="/menu" logoSrc="/LOGO_GCDC04.png" items={menuItems} />

            <div className="container" style={{ paddingTop: 24 }}>
                <div className="page-title page-title-with-icon">
                    <div className="page-title-main-wrap">
                        <span className="page-title-icon-circle" style={{ fontSize: "1.6rem" }}>🛡️</span>
                        <div className="page-title-texts">
                            <h1>Gestão de Equipas</h1>
                            <div className="hint">Funcionalidade em desenvolvimento.</div>
                        </div>
                    </div>
                     <div className="actions">
                        <button type="button" className="btn" onClick={() => navigate(`/clubes/${clubeId}/treinador`)}>Módulo de Treinador</button>
                    </div>
                </div>
            </div>
        </>
    );
}