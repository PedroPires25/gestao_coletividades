import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import SideMenu from "../components/SideMenu";
import { useAuth } from "../auth/AuthContext";
import { getAtividadeById, getEventosAtividade } from "../api";

export default function DetalheAtividadePage() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const { coletividadeId, atividadeId } = useParams();
    const [atividade, setAtividade] = useState(null);
    const [eventos, setEventos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const menuItems = [
        { label: "Voltar", to: `/minha-area/coletividade/${coletividadeId}` },
        {
            label: "Logout",
            onClick: () => {
                logout();
                navigate("/login", { replace: true });
            },
        },
    ];

    useEffect(() => {
        async function fetchData() {
            try {
                setLoading(true);
                const [atividadeData, eventosData] = await Promise.all([
                    getAtividadeById(atividadeId),
                    getEventosAtividade(coletividadeId, atividadeId),
                ]);
                setAtividade(atividadeData);
                setEventos(eventosData || []);
            } catch (err) {
                setError(err.message || "Erro ao carregar dados.");
            } finally {
                setLoading(false);
            }
        }
        if (coletividadeId && atividadeId) {
            fetchData();
        }
    }, [coletividadeId, atividadeId]);

    return (
        <>
            <SideMenu
                title={atividade?.nome || "Atividade"}
                subtitle={user?.nomeColetividade || ""}
                logoHref="/menu"
                items={menuItems}
            />
            <div className="container" style={{ paddingTop: 24 }}>
                <div className="page-title">
                    <h1>{atividade?.nome}</h1>
                    <p>{atividade?.descricao}</p>
                </div>

                {error && <div className="alert error">{error}</div>}

                {loading ? (
                    <p>A carregar...</p>
                ) : (
                    <>
                        <section className="card">
                            <h2>Detalhes da Atividade</h2>
                            <p><strong>Professor:</strong> {atividade?.professor || 'N/A'}</p>
                            <p><strong>Horário:</strong> {atividade?.horario || 'N/A'}</p>
                            <p><strong>Local:</strong> {atividade?.local || 'N/A'}</p>
                        </section>

                        <section className="card">
                            <h2>Eventos da Atividade</h2>
                            <div className="grid">
                                {eventos.map((evento) => (
                                    <div key={evento.id} className="card">
                                        <h3>{evento.titulo}</h3>
                                        <p>{evento.descricao}</p>
                                        <p><strong>Data:</strong> {new Date(evento.data).toLocaleDateString()}</p>
                                        <p><strong>Local:</strong> {evento.local}</p>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </>
                )}
            </div>
        </>
    );
}