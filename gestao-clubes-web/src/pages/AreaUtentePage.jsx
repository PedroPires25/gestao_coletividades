import { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import SideMenu from "../components/SideMenu";
import { getMinhasAtividades, getEventosColetividade } from "../api";
import { Link, useNavigate } from "react-router-dom";
import { getAtividadeIcon } from "../assets/atividade-icons";

export default function AreaUtentePage() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [atividades, setAtividades] = useState([]);
    const [eventos, setEventos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const menuItems = [
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
                const [atividadesData, eventosData] = await Promise.all([
                    getMinhasAtividades(),
                    getEventosColetividade(user.coletividadeId),
                ]);
                setAtividades(atividadesData || []);
                setEventos(eventosData || []);
            } catch (err) {
                setError(err.message || "Erro ao carregar dados.");
            } finally {
                setLoading(false);
            }
        }
        if (user?.coletividadeId) {
            fetchData();
        }
    }, [user]);

    return (
        <>
            <SideMenu
                title="A minha área"
                subtitle={user?.nomeColetividade || ""}
                logoHref="/menu"
                items={menuItems}
            />
            <div className="container" style={{ paddingTop: 24 }}>
                <div className="page-title">
                    <h1>A minha área</h1>
                </div>

                {error && <div className="alert error">{error}</div>}

                {loading ? (
                    <p>A carregar...</p>
                ) : (
                    <>
                        <section className="card">
                            <h2>As minhas atividades</h2>
                            <div className="grid">
                                {atividades.map((atividade) => {
                                    const nome = atividade.nome || "Atividade";
                                    return (
                                    <div key={atividade.id} className="card">
                                        <span className="modalidade-figura-circle" style={{ width: 82, height: 82, marginBottom: 12 }}>
                                            <span className="menu-style-icon" style={{ width: 52, height: 52 }}>
                                                <img className="atividade-generated-icon" src={getAtividadeIcon(nome)} alt={nome} />
                                            </span>
                                        </span>
                                        <h3>{nome}</h3>
                                        <p>{atividade.descricao}</p>
                                        <p><strong>Professor:</strong> {atividade.professor}</p>
                                        <p><strong>Horário:</strong> {atividade.horario}</p>
                                        <p><strong>Local:</strong> {atividade.local}</p>
                                        <p><strong>Estado:</strong> {atividade.estado}</p>
                                        <Link to={`/minha-area/coletividade/${user.coletividadeId}/atividades/${atividade.id}`} className="btn">
                                            Ver detalhes
                                        </Link>
                                    </div>
                                    );
                                })}
                            </div>
                        </section>

                        <section className="card">
                            <h2>Eventos da coletividade</h2>
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