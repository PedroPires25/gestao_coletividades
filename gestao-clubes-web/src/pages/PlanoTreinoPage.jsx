import { useMemo, useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import SideMenu from "../components/SideMenu";
import { useAuth } from "../auth/AuthContext";
import { getAtletasTreinador, enviarPlanoTreino } from "../services/treinador";

export default function PlanoTreinoPage() {
    const { clubeId } = useParams();
    const navigate = useNavigate();
    const { logout } = useAuth();

    const [atletasList, setAtletasList] = useState([]);
    const [atletaId, setAtletaId] = useState("");
    const [conteudo, setConteudo] = useState("");
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState("");
    const [erro, setErro] = useState("");

    const menuItems = useMemo(() => [
        { label: "Módulo de Treinador", to: `/clubes/${clubeId}/treinador` },
        { label: "Eventos do Clube", to: `/clubes/${clubeId}/eventos` },
        { label: "Logout", onClick: () => { logout(); navigate("/login", { replace: true }); } },
    ], [clubeId, logout, navigate]);

    useEffect(() => {
        async function carregarAtletas() {
            try {
                const data = await getAtletasTreinador(clubeId);
                const parseArray = (d) => Array.isArray(d) ? d : (Array.isArray(d?.data) ? d.data : []);
                setAtletasList(parseArray(data));
            } catch (e) {
                console.error("Erro ao carregar atletas", e);
            }
        }
        carregarAtletas();
    }, [clubeId]);

    async function handleSubmit(e) {
        e.preventDefault();
        if (!atletaId) {
            setErro("Por favor, selecione um atleta.");
            return;
        }
        if (!conteudo.trim()) {
            setErro("O conteúdo do plano não pode estar vazio.");
            return;
        }

        setErro("");
        setMsg("");
        setSaving(true);
        try {
            await enviarPlanoTreino(clubeId, { atletaId: Number(atletaId), conteudo });
            setMsg("Plano de treino criado e enviado com sucesso.");
            setAtletaId("");
            setConteudo("");
        } catch (e) {
            setErro(e.message || "Erro ao enviar o plano de treino.");
        } finally {
            setSaving(false);
        }
    }

    return (
        <>
            <SideMenu title="Gestão de Clubes" subtitle="Planos de Treino" logoHref="/menu" logoSrc="/LOGO_GCDC04.png" items={menuItems} />

            <div className="container" style={{ paddingTop: 24 }}>
                <div className="page-title page-title-with-icon">
                    <div className="page-title-main-wrap">
                        <span className="page-title-icon-circle" style={{ fontSize: "1.6rem" }}>📋</span>
                        <div className="page-title-texts">
                            <h1>Planos de Treino Individuais</h1>
                            <div className="hint">Crie e envie planos de treino diretamente para o email dos atletas.</div>
                        </div>
                    </div>
                     <div className="actions">
                        <button type="button" className="btn" onClick={() => navigate(`/clubes/${clubeId}/treinador`)}>Módulo de Treinador</button>
                    </div>
                </div>

                {erro && <div className="alert error">{erro}</div>}
                {msg && <div className="alert ok">{msg}</div>}

                <div className="card">
                    <form onSubmit={handleSubmit} className="row">
                        <div className="row">
                            <label className="field-label">Selecione o Atleta *</label>
                            <select className="input" value={atletaId} onChange={e => setAtletaId(e.target.value)} required>
                                <option value="">-- Selecione --</option>
                                {atletasList.map(a => (
                                    <option key={a.id} value={a.id}>{a.nome}</option>
                                ))}
                            </select>
                        </div>
                        <div className="row">
                            <label className="field-label">Plano de Treino *</label>
                            <textarea 
                                className="input" 
                                rows={10} 
                                value={conteudo} 
                                onChange={e => setConteudo(e.target.value)} 
                                placeholder="Escreva o plano de treino aqui..."
                                required
                            />
                        </div>
                        <div className="actions" style={{ marginTop: 16 }}>
                            <button type="submit" className="btn btn-primary" disabled={saving}>
                                {saving ? "A processar..." : "Guardar e Enviar por Email"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}