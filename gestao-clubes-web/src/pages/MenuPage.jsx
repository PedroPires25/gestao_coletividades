import { Link, useNavigate } from "react-router-dom";
import SideMenu from "../components/SideMenu";
import { useAuth } from "../auth/AuthContext";

import clubesIcon from "../assets/clubes.svg";
import coletividadesIcon from "../assets/coletividades.svg";
import perfisIcon from "../assets/perfis.svg";
import logoutIcon from "../assets/logout.svg";

const MENU_ACTIONS = {
    Clubes: clubesIcon,
    Coletividades: coletividadesIcon,
    Perfis: perfisIcon,
    Logout: logoutIcon,
};

export default function MenuPage() {
    const { logout, isAdmin } = useAuth();
    const navigate = useNavigate();

    const items = [
        { label: "Home", to: "/menu" },
        { label: "Clubes", to: "/clubes" },
        { label: "Coletividades", to: "/coletividades" },
        ...(isAdmin ? [{ label: "Perfis", to: "/admin/users" }] : []),
        {
            label: "Logout",
            onClick: () => {
                logout();
                navigate("/login", { replace: true });
            },
        },
    ];

    return (
        <>
            <SideMenu
                title="Gestão de Coletividades"
                subtitle="Menu"
                logoHref="/menu"
                logoSrc="/logo.png"
                items={items}
                showBurger={false}
            />

            <div className="menu-center-wrapper">
                <div className="quick-actions-row">
                    <Link to="/clubes" className="quick-action quick-action-cyan">
                        <span className="quick-action-circle">
                            <span className="quick-action-icon">
                                <img src={MENU_ACTIONS.Clubes} alt="Clubes" />
                            </span>
                        </span>
                        <span className="quick-action-label">Clubes</span>
                    </Link>

                    <Link to="/coletividades" className="quick-action quick-action-orange">
                        <span className="quick-action-circle">
                            <span className="quick-action-icon">
                                <img src={MENU_ACTIONS.Coletividades} alt="Coletividades" />
                            </span>
                        </span>
                        <span className="quick-action-label">Coletividades</span>
                    </Link>

                    {isAdmin && (
                        <Link to="/admin/users" className="quick-action quick-action-red">
                            <span className="quick-action-circle">
                                <span className="quick-action-icon">
                                    <img src={MENU_ACTIONS.Perfis} alt="Perfis" />
                                </span>
                            </span>
                            <span className="quick-action-label">Perfis</span>
                        </Link>
                    )}

                    <button
                        className="quick-action quick-action-green quick-action-button"
                        type="button"
                        onClick={() => {
                            logout();
                            navigate("/login", { replace: true });
                        }}
                    >
                        <span className="quick-action-circle">
                            <span className="quick-action-icon">
                                <img src={MENU_ACTIONS.Logout} alt="Logout" />
                            </span>
                        </span>
                        <span className="quick-action-label">Logout</span>
                    </button>
                </div>
            </div>
        </>
    );
}