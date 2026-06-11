import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import SideMenu from "../components/SideMenu";
import { useAuth } from "../auth/AuthContext";
import { getHomePathByRole } from "../utils/navigation";

export default function TransferenciasPage() {
  const { user, logout, isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const homePath = useMemo(() => getHomePathByRole(user), [user]);

  const items = [
    { label: "Home", to: homePath },
    ...(isSuperAdmin ? [{ label: "Clubes", to: "/clubes" }] : []),
    { label: "Transferências", to: "/transferencias" },
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
            subtitle="Transferências"
            logoHref={homePath}
            items={items}
        />

        <div className="container" style={{ paddingTop: 28 }}>
          <div className="page-title">
            <h1>Transferências</h1>
            <div className="hint">Área global (por agora)</div>
          </div>

          <div className="card">
            <p className="subtle">
              Aqui vais gerir transferências. (Depois ligamos isto aos clubes e à API.)
            </p>
          </div>
        </div>
      </>
  );
}