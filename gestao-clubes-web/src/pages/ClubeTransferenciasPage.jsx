import {Link, useParams} from "react-router-dom";
import SideMenu from "../components/SideMenu";

export default function ClubeTransferenciasPage() {
    const { clubeId } = useParams();

    const items = [
        { label: "Menu", to: "/menu" },
        { label: "Clubes", to: "/clubes" },
        { label: "Modalidades do Clube", to: `/clubes/${clubeId}/modalidades` },
        { label: "Atletas", to: `/clubes/${clubeId}/atletas` },
        { label: "Staff", to: `/clubes/${clubeId}/staff` },
        { label: "Transferências", to: `/clubes/${clubeId}/transferencias` },
    ];

    return (
        <>
            <SideMenu title="Gestão de Coletividades" subtitle={`Transferências • Clube #${clubeId}`} items={items} />

            <div className="container" style={{ paddingTop: 24 }}>
                <div className="page-title">
                    <h1>Transferências</h1>
                    <div className="hint">Clube #{clubeId}</div>
                </div>

                <div className="card">
                    <p className="subtle">Placeholder. Aqui vais gerir transferências do clube.</p>
                    <div className="actions">
                        <Link className="btn" to={`/clubes/${clubeId}`}>← Voltar</Link>
                    </div>
                </div>
            </div>
        </>
    );
}