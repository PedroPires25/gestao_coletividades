import { useMemo, useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import SideMenu from "../components/SideMenu";
import { useAuth } from "../auth/AuthContext";
import { getClubeById, getUploadUrl } from "../api";
import { exportToPdf, printPdf } from "../utils/export";

const API_BASE = `${(import.meta.env.VITE_API_URL || "http://localhost:10000").replace(/\/$/, "")}/api`;
const LS_KEY = "gc_user";

function getStoredToken() {
    try {
        const raw = localStorage.getItem(LS_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        return parsed?.token ?? null;
    } catch {
        return null;
    }
}

async function http(path, options = {}) {
    const token = getStoredToken();
    const headers = {
        "Content-Type": "application/json",
        ...(options.headers || {}),
    };
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
    if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `Erro HTTP ${res.status}`);
    }
    const ct = res.headers.get("content-type") || "";
    if (ct.includes("application/json")) return res.json();
    return res.text();
}

async function getAtletasTreinador(clubeId) {
    return http(`/clubes/${clubeId}/treinador/atletas`);
}

async function getPlanosTreino(clubeId) {
    return http(`/clubes/${clubeId}/treinador/planos`);
}

async function criarPlanoTreino(clubeId, payload) {
    return http(`/clubes/${clubeId}/treinador/planos`, {
        method: "POST",
        body: JSON.stringify(payload),
    });
}

async function atualizarPlanoTreino(clubeId, planoId, payload) {
    return http(`/clubes/${clubeId}/treinador/planos/${planoId}`, {
        method: "PUT",
        body: JSON.stringify(payload),
    });
}

async function deletarPlanoTreino(clubeId, planoId) {
    return http(`/clubes/${clubeId}/treinador/planos/${planoId}`, {
        method: "DELETE",
    });
}

function formatDate(dateString) {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return dateString;
    return date.toLocaleString("pt-PT");
}

export default function PlanoTreinoPage() {
    const { clubeId } = useParams();
    const navigate = useNavigate();
    const { logout } = useAuth();

    const [clubeInfo, setClubeInfo] = useState(null);
    const [atletasList, setAtletasList] = useState([]);
    const [planos, setPlanos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState("");
    const [erro, setErro] = useState("");

    const [planoSelecionado, setPlanoSelecionado] = useState(null);
    const [form, setForm] = useState({
        id: null,
        atletaId: "",
        conteudo: "",
        enviarEmail: true,
    });

    const menuItems = useMemo(
        () => [
            { label: "Módulo de Treinador", to: `/clubes/${clubeId}/treinador` },
            { label: "Treinos", to: `/clubes/${clubeId}/treinador/sessoes` },
            { label: "Plano de Treino", to: `/clubes/${clubeId}/treinador/planos` },
            { label: "Estatísticas", to: `/clubes/${clubeId}/treinador/assiduidade` },
            { label: "Eventos do Clube", to: `/clubes/${clubeId}/eventos` },
            {
                label: "Logout",
                onClick: () => {
                    logout();
                    navigate("/login", { replace: true });
                },
            },
        ],
        [clubeId, logout, navigate]
    );

    useEffect(() => {
        let isMounted = true;

        async function carregar() {
            if (isMounted) {
                setLoading(true);
            }
            try {
                const [clubeData, atletasData, planosData] = await Promise.all([
                    getClubeById(clubeId).catch(() => null),
                    getAtletasTreinador(clubeId).catch(() => []),
                    getPlanosTreino(clubeId).catch(() => []),
                ]);
                
                if (!isMounted) return;

                const parseArray = (d) => Array.isArray(d) ? d : (Array.isArray(d?.data) ? d.data : []);
                setClubeInfo(clubeData || null);
                setAtletasList(parseArray(atletasData));
                setPlanos(parseArray(planosData));
            } catch (err) {
                if (isMounted) {
                    console.error(err);
                    setErro("Erro ao carregar dados iniciais.");
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        }
        
        carregar();

        return () => {
            isMounted = false;
        };
    }, [clubeId]);

    async function recarregarPlanos() {
        try {
            const planosData = await getPlanosTreino(clubeId).catch(() => []);
            const parseArray = (d) => Array.isArray(d) ? d : (Array.isArray(d?.data) ? d.data : []);
            setPlanos(parseArray(planosData));
        } catch (err) {
             console.error("Erro ao recarregar planos", err);
        }
    }

    function handleSelectPlano(plano) {
        setPlanoSelecionado(plano);
        setForm({
            id: plano.id,
            atletaId: String(plano.atletaId),
            conteudo: plano.conteudo || "",
            enviarEmail: true,
        });
        setErro("");
        setMsg("");
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function handleNovoPlano() {
        setPlanoSelecionado({});
        setForm({ id: null, atletaId: "", conteudo: "", enviarEmail: true });
        setErro("");
        setMsg("");
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    async function handleDelete(id) {
        if (!window.confirm("Tem a certeza que deseja eliminar este plano de treino?")) return;
        setErro("");
        setMsg("");
        try {
            await deletarPlanoTreino(clubeId, id);
            setMsg("Plano eliminado com sucesso.");
            setPlanoSelecionado(null);
            await recarregarPlanos();
        } catch (err) {
            setErro(err.message || "Erro ao eliminar plano.");
        }
    }

    async function handleSubmit(e) {
        e.preventDefault();
        if (!form.atletaId) {
            setErro("Por favor, selecione um atleta.");
            return;
        }
        if (!form.conteudo.trim()) {
            setErro("O conteúdo do plano não pode estar vazio.");
            return;
        }

        const atleta = atletasList.find(a => String(a.id) === form.atletaId);
        const confirmMsg = form.enviarEmail 
            ? `Deseja guardar e notificar ${atleta?.nome || 'o atleta'} por email?`
            : "Deseja guardar o plano sem notificar o atleta?";
        
        if (!window.confirm(confirmMsg)) return;

        setErro("");
        setMsg("");
        setSaving(true);
        try {
            const payload = {
                atletaId: Number(form.atletaId),
                conteudo: form.conteudo,
                enviarEmail: form.enviarEmail
            };

            if (form.id) {
                await atualizarPlanoTreino(clubeId, form.id, payload);
                setMsg(form.enviarEmail ? "Plano atualizado e reenviado por email com sucesso." : "Plano atualizado com sucesso.");
            } else {
                await criarPlanoTreino(clubeId, payload);
                setMsg(form.enviarEmail ? "Plano criado e enviado por email com sucesso." : "Plano guardado com sucesso.");
            }
            setPlanoSelecionado(null);
            await recarregarPlanos();
        } catch (err) {
            setErro(err.message || "Erro ao guardar o plano de treino.");
        } finally {
            setSaving(false);
        }
    }

    const handlePrint = () => {
        if (!planoSelecionado) return;
        const atleta = atletasList.find(a => String(a.id) === String(planoSelecionado.atletaId));
        const columns = [
            { key: 'prop', label: 'Propriedade' },
            { key: 'value', label: 'Valor' },
        ];
        const dataToExport = [
            { prop: 'Atleta', value: atleta?.nome || 'N/A' },
            { prop: 'Data', value: formatDate(planoSelecionado.dataCriacao) },
            { prop: 'Conteúdo', value: planoSelecionado.conteudo },
        ];
        printPdf({
            data: dataToExport,
            columns,
            title: "Plano de Treino Individual",
            clubName: clubeInfo?.nome,
            clubLogoUrl: getUploadUrl(clubeInfo?.logoPath),
            athletePhotoUrl: getUploadUrl(atleta?.fotoPath || atleta?.foto_path),
            summary: `Atleta: ${atleta?.nome || 'N/A'}`,
            athleteInfo: `Data: ${formatDate(planoSelecionado.dataCriacao)}`
        });
    };

    const handleExportPdf = () => {
        if (!planoSelecionado) return;
        const atleta = atletasList.find(a => String(a.id) === String(planoSelecionado.atletaId));
        const columns = [
            { key: 'prop', label: 'Propriedade' },
            { key: 'value', label: 'Valor' },
        ];
        const dataToExport = [
            { prop: 'Atleta', value: atleta?.nome || 'N/A' },
            { prop: 'Data', value: formatDate(planoSelecionado.dataCriacao) },
            { prop: 'Conteúdo', value: planoSelecionado.conteudo },
        ];
        exportToPdf({
            data: dataToExport,
            columns,
            title: "Plano de Treino Individual",
            clubName: clubeInfo?.nome,
            clubLogoUrl: getUploadUrl(clubeInfo?.logoPath),
            filename: `plano_${atleta?.nome || 'atleta'}.pdf`,
            athletePhotoUrl: getUploadUrl(atleta?.fotoPath || atleta?.foto_path),
            summary: `Atleta: ${atleta?.nome || 'N/A'}`,
            athleteInfo: `Data: ${formatDate(planoSelecionado.dataCriacao)}`
        });
    };

    return (
        <>
            <SideMenu title="Gestão de Clubes" subtitle="Planos de Treino" logoHref="/menu" logoSrc="/LOGO_GCDC04.png" items={menuItems} />

            <div className="container" style={{ paddingTop: 24 }}>
                <div className="page-title page-title-with-icon no-print">
                    <div className="page-title-main-wrap">
                        <span className="page-title-icon-circle" style={{ fontSize: "1.6rem" }}>📋</span>
                        <div className="page-title-texts">
                            <h1>Planos de Treino Individuais</h1>
                            <div className="hint">Gerir planos de treino para atletas.</div>
                        </div>
                    </div>
                     <div className="actions">
                        <button type="button" className="btn" onClick={() => navigate(`/clubes/${clubeId}/treinador`)}>Módulo de Treinador</button>
                    </div>
                </div>

                {erro && <div className="alert error no-print">{erro}</div>}
                {msg && <div className="alert ok no-print">{msg}</div>}

                <div className="stack-sections">
                    {planoSelecionado && (
                        <div className="card plano-form no-print">
                            <h2>{form.id ? "Detalhes / Editar Plano" : "Novo Plano de Treino"}</h2>
                            <form onSubmit={handleSubmit} className="row">
                                <div className="row">
                                    <label className="field-label">Selecione o Atleta *</label>
                                    <select 
                                        className="input" 
                                        value={form.atletaId} 
                                        onChange={e => setForm({...form, atletaId: e.target.value})} 
                                        required
                                        disabled={!!form.id}
                                    >
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
                                        value={form.conteudo} 
                                        onChange={e => setForm({...form, conteudo: e.target.value})} 
                                        placeholder="Escreva o plano de treino aqui..."
                                        required
                                    />
                                </div>
                                <div className="row">
                                    <label className="filter-checkbox" style={{marginTop: 10, cursor: 'pointer'}}>
                                        <input 
                                            type="checkbox" 
                                            checked={form.enviarEmail} 
                                            onChange={e => setForm({...form, enviarEmail: e.target.checked})} 
                                        />
                                        <span>
                                            {form.id ? "Reenviar" : "Enviar"} notificação por email para o atleta?
                                        </span>
                                    </label>
                                </div>
                                <div className="actions" style={{ marginTop: 16, justifyContent: 'space-between' }}>
                                    <div>
                                        <button type="submit" className="btn btn-primary" disabled={saving}>
                                            {saving ? "A processar..." : "Guardar Alterações"}
                                        </button>
                                        <button type="button" className="btn btn-secondary" onClick={() => setPlanoSelecionado(null)}>
                                            Fechar
                                        </button>
                                    </div>
                                    {form.id && (
                                        <div>
                                            <button type="button" className="btn" onClick={handleExportPdf}>Exportar PDF</button>
                                            <button type="button" className="btn" onClick={handlePrint}>Imprimir</button>
                                        </div>
                                    )}
                                </div>
                            </form>
                        </div>
                    )}

                    <div className="card">
                        <div className="modalidades-toolbar">
                            <div className="toolbar-title-group">
                                <h2>Histórico de Planos</h2>
                                <span className="toolbar-count">{planos.length} registo(s)</span>
                            </div>
                            {!planoSelecionado && (
                                <div className="actions no-print">
                                    <button className="btn btn-primary" onClick={handleNovoPlano}>+ Novo Plano</button>
                                </div>
                            )}
                        </div>

                        {loading ? (
                            <p className="subtle">A carregar...</p>
                        ) : planos.length === 0 ? (
                            <p className="subtle">Ainda não foram criados planos de treino.</p>
                        ) : (
                            <div className="table-wrap">
                                <table className="dashboard-table clickable">
                                    <thead>
                                        <tr>
                                            <th>Atleta</th>
                                            <th>Data</th>
                                            <th>Conteúdo (Excerto)</th>
                                            <th className="no-print">Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {planos.map((row) => (
                                            <tr key={row.id} onClick={() => handleSelectPlano(row)} title="Clique para ver detalhes">
                                                <td className="font-weight-bold">{row.nomeAtleta}</td>
                                                <td>{formatDate(row.dataCriacao)}</td>
                                                <td className="cell-muted" style={{ maxWidth: 400, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                    {row.conteudo || "-"}
                                                </td>
                                                <td className="no-print">
                                                    <div className="table-actions">
                                                        <button className="btn btn-sm" onClick={(e) => { e.stopPropagation(); handleSelectPlano(row); }}>Editar</button>
                                                        <button className="btn btn-sm btn-danger" onClick={(e) => { e.stopPropagation(); handleDelete(row.id); }}>Eliminar</button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}