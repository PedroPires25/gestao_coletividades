import SideMenu from "../components/SideMenu";
import { useAuth } from "../auth/AuthContext";

export default function TransferenciasPage() {
  const { isSuperAdmin } = useAuth();

  const items = [
    { label: "Menu", to: "/menu" },
    ...(isSuperAdmin ? [{ label: "Clubes", to: "/clubes" }] : []),
    { label: "Transferências", to: "/transferencias" },
    { label: "Logout", to: "#", disabled: false},
  ];

  return (
      <>
        <SideMenu
            title="Gestão de Coletividades"
            subtitle="Transferências"
            logoHref="/menu"
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