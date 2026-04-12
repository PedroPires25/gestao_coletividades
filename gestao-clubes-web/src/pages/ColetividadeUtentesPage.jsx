import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import SideMenu from "../components/SideMenu";
import { useAuth } from "../auth/AuthContext";
import { getColetividadeById } from "../api";
import { getAtividadesByColetividade } from "../services/coletividadeAtividades";
import atletasIcon from "../assets/atletas.svg";
import defaultIcon from "../assets/default.svg";

const COLOR_CLASSES = ["icon-turquoise", "icon-orange", "icon-red", "icon-green", "icon-purple"];

export default function ColetividadeUtentesPage() {
    const { id: coletividadeId } = useParams();
    const navigate = useNavigate();
    const { logout, isAdmin } = useAuth();

    const [coletividade, setColetividade] = useState(null);
    const [atividades, setAtividades] = useState([]);
    const [loadingPagina, setLoadingPagina] = useState(true);
    const [erro, setErro] = useState("");

    const menuItems = useMemo(() => [
        { label: "Home", to: "/menu" },
        { label: "Clubes", to: "/clubes" },
        { label: "Coletividades", to: "/coletividades" },
        ...(isAdmin ? [{ label: "Perfis", to: "/admin/users" }] : []),
        { label: "Atividades", to: `/coletividades/${coletividadeId}/atividades` },
        { label: "Utentes", to: `/coletividades/${coletividadeId}/utentes` },
        { label: "Staff", to: `/coletividades/${coletividadeId}/staff` },
        {
            label: "Logout",
            onClick: () => {
                logout();
                navigate("/login", { replace: true });
            },
        },
    ], [coletividadeId, isAdmin, logout, navigate]);

    useEffect(() => {
        async function carregarPagina() {
            if (!coletividadeId) return;

            setErro("");
            setLoadingPagina(true);

            try {
                const [coletividadeData, atividadesData] = await Promise.all([
                    getColetividadeById(coletividadeId),
                    getAtividadesByColetividade(coletividadeId, { apenasAtivas: true }),
                ]);

                setColetividade(coletividadeData || null);
                setAtividades(Array.isArray(atividadesData) ? atividadesData : []);
            } catch (e) {
                setErro(e.message || "Não foi possível carregar a página de utentes.");
            } finally {
                setLoadingPagina(false);
            }
        }

        carregarPagina();
    }, [coletividadeId]);

    return (
        <>
            <SideMenu title="Gestão de Coletividades" subtitle={coletividade?.nome || "Coletividade"} logoHref="/menu" logoSrc="/logo.png" items={menuItems} />
            <div className="container" style={{ paddingTop: 24 }}>
                <div className="page-title page-title-with-icon">
                    <div className="page-title-main-wrap">
                        <span className="page-title-icon-circle">
                            <img src={atletasIcon} alt="Utentes" className="page-title-icon" />
                        </span>
                        <div className="page-title-texts">
                            <h1>Utentes</h1>
                        </div>
                    </div>
                    <div className="hint">{coletividade?.nome || ""}</div>
                </div>

                {erro && <div className="alert error">{erro}</div>}

                <section className="card card-quick-links">
                    <h2>Atividades</h2>
                    <p className="subtle">Clica numa atividade para abrir a listagem dos utentes dessa atividade.</p>

                    {loadingPagina ? (
                        <p className="subtle">A carregar atividades...</p>
                    ) : atividades.length === 0 ? (
                        <p className="subtle">Esta coletividade ainda não tem atividades associadas.</p>
                    ) : (
                        <div className="modalidade-figuras-grid">
                            {atividades.map((item, index) => {
                                const nome = item?.atividade?.nome || "Atividade";
                                const colorClass = COLOR_CLASSES[index % COLOR_CLASSES.length];
                                return (
                                    <Link
                                        key={item.id}
                                        to={`/coletividades/${coletividadeId}/utentes/atividades/${item.id}`}
                                        className={`modalidade-figura-btn ${colorClass}`}
                                        title={nome}
                                    >
                                        <span className="modalidade-figura-circle">
                                            <span className="menu-style-icon">
                                                <img src={defaultIcon} alt={nome} />
                                            </span>
                                        </span>
                                        <span className="modalidade-figura-label">{nome}</span>
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </section>
            </div>
        </>
    );
}
