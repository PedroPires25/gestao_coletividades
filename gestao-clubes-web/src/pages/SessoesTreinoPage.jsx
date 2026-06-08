import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import SideMenu from "../components/SideMenu";
import { useAuth } from "../auth/AuthContext";
import { getClubeById, getUploadUrl } from "../api";
import { getSessoesTreino, createSessaoTreino, getAtletasTreinador } from "../services/treinador";
import { exportToCsv, exportToPdf, printPdf } from "../utils/export";

function fmt(val) {
    if (!val) return "-";
    return String(val).includes("T") ? String(val).split("T")[0] : String(val).slice(0, 10);
}

const EMPTY_FORM = {
    dataTreino: new Date().toISOString().slice(0, 10),
    horaTreino: "",
    observacoes: "",
    presencas: {}, // { [atletaId]: true/false }
};

export default function SessoesTreinoPage() {
    const { clubeId } = useParams();
    const navigate = useNavigate();
    const { logout } = useAuth();

    const [clube, setClube] = useState(null);
    const [sessoes, setSessoes] = useState([]); 
    const [atletasList, setAtletasList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [erro, setErro] = useState("");
    const [msg, setMsg] = useState("");

    const [showForm, setShowForm] = useState(false);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState(EMPTY_FORM);

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
        async function carregar() {
            setLoading(true);
            try {
                const [clubeData, atletasData, sessoesData] = await Promise.all([
                    getClubeById(clubeId),
                    getAtletasTreinador(clubeId).catch(() => []),
                    getSessoesTreino(clubeId).catch(() => []),
                ]);
                setClube(clubeData || null);
                const parseArray = (d) => Array.isArray(d) ? d : (Array.isArray(d?.data) ? d.data : []);
                
                setAtletasList(parseArray(atletasData));
                setSessoes(parseArray(sessoesData));
            } catch (e) {
                setErro(e.message || "Erro ao carregar.");
            } finally {
                setLoading(false);
            }
        }
        carregar();
    }, [clubeId]);

    function handleFormChange(e) {
        const { name, value } = e.target;
        setForm((p) => ({ ...p, [name]: value }));
    }

    function handlePresencaChange(atletaId) {
        setForm((prevForm) => ({
            ...prevForm,
            presencas: {
                ...prevForm.presencas,
                [atletaId]: !prevForm.presencas[atletaId],
            },
        }));
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setErro(""); setMsg(""); setSaving(true);
        try {
            await createSessaoTreino(clubeId, {
                ...form,
            });
            setMsg("Sessão de treino registada com sucesso.");
            setForm(EMPTY_FORM);
            setShowForm(false);
            
            // Recarregar sessões
            const sessoesAtualizadas = await getSessoesTreino(clubeId);
            setSessoes(Array.isArray(sessoesAtualizadas) ? sessoesAtualizadas : (Array.isArray(sessoesAtualizadas?.data) ? sessoesAtualizadas.data : []));
        } catch (e2) {
            setErro(e2.message || "Erro ao guardar sessão.");
        } finally {
            setSaving(false);
        }
    }

    const prepareExportData = () => {
        const columns = [
            { key: 'dataTreino', label: 'Data' },
            { key: 'horaTreino', label: 'Hora' },
            { key: 'observacoes', label: 'Observações' },
            { key: 'numeroPresencas', label: 'Nº Presenças' },
        ];
        const dataToExport = sessoes.map(s => ({
            ...s,
            dataTreino: fmt(s.data_treino || s.dataTreino),
            horaTreino: s.hora_treino || s.horaTreino || "-",
            numeroPresencas: s.numero_presencas || s.numeroPresencas || 0,
        }));
        return { columns, dataToExport };
    };

    const handleExportCsv = () => {
        const { columns, dataToExport } = prepareExportData();
        exportToCsv(dataToExport, columns, `sessoes_treino_${clube?.nome || clubeId}.csv`);
    };

    const handleExportPdf = () => {
        const { columns, dataToExport } = prepareExportData();
        exportToPdf({
            data: dataToExport,
            columns,
            title: "Histórico de Treinos",
            clubName: clube?.nome,
            clubLogoUrl: getUploadUrl(clube?.logoPath),
            filename: `sessoes_treino_${clube?.nome || clubeId}.pdf`,
        });
    };

    const handlePrint = () => {
        const { columns, dataToExport } = prepareExportData();
        printPdf({
            data: dataToExport,
            columns,
            title: "Histórico de Treinos",
            clubName: clube?.nome,
            clubLogoUrl: getUploadUrl(clube?.logoPath),
        });
    };

    return (
        <>
            <SideMenu title="Gestão de Clubes" subtitle="Treinos" logoHref="/menu" logoSrc="/LOGO_GCDC04.png" items={menuItems} />

            <div className="container" style={{ paddingTop: 24 }}>
                <div className="page-title page-title-with-icon no-print">
                    <div className="page-title-main-wrap">
                        <span className="page-title-icon-circle" style={{ fontSize: "1.6rem" }}>📅</span>
                        <div className="page-title-texts">
                            <h1>Sessões de Treino</h1>
                            {clube && <div className="hint">{clube.nome}</div>}
                        </div>
                    </div>
                    <div className="actions">
                        <button type="button" className="btn" onClick={() => navigate(`/clubes/${clubeId}/treinador`)}>Módulo de Treinador</button>
                    </div>
                </div>

                {erro && <div className="alert error no-print">{erro}</div>}
                {msg && <div className="alert ok no-print">{msg}</div>}

                <div className="stack-sections">
                    <div className="card">
                        <div className="modalidades-toolbar">
                            <div className="toolbar-title-group">
                                <h2>Histórico de Treinos</h2>
                                <span className="toolbar-count">{sessoes.length} registo(s)</span>
                            </div>
                            <div className="actions no-print">
                                <button className="btn" onClick={handleExportPdf}>Exportar PDF</button>
                                <button className="btn" onClick={handleExportCsv}>Exportar CSV</button>
                                <button className="btn" onClick={handlePrint}>Imprimir</button>
                            </div>
                        </div>
                        {loading ? (
                            <p className="subtle">A carregar...</p>
                        ) : sessoes.length === 0 ? (
                            <p className="subtle">Ainda não foram registadas sessões de treino.</p>
                        ) : (
                            <div className="table-wrap">
                                <table className="dashboard-table">
                                    <thead>
                                        <tr>
                                            <th>Data</th>
                                            <th>Hora</th>
                                            <th>Observações</th>
                                            <th>Presenças (Nº)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {sessoes.map((row) => (
                                            <tr key={row.id}>
                                                <td>{fmt(row.data_treino || row.dataTreino)}</td>
                                                <td>{row.hora_treino || row.horaTreino || "-"}</td>
                                                <td className="cell-muted" style={{ maxWidth: 250, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                    {row.observacoes || "-"}
                                                </td>
                                                <td>{row.numero_presencas || row.numeroPresencas || 0}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    <div className="card no-print">
                        <div className="modalidades-toolbar">
                            <div className="toolbar-title-group"><h2>Registar Sessão de Treino</h2></div>
                            <button type="button" className="btn" onClick={() => setShowForm((p) => !p)}>
                                {showForm ? "Fechar" : "Nova Sessão"}
                            </button>
                        </div>
                        {showForm && (
                            <div className="form-scroll">
                                <form onSubmit={handleSubmit} className="row">
                                    <div className="row2">
                                        <div className="row">
                                            <label className="field-label">Data do Treino *</label>
                                            <input className="input" name="dataTreino" type="date" value={form.dataTreino} onChange={handleFormChange} required />
                                        </div>
                                        <div className="row">
                                            <label className="field-label">Hora</label>
                                            <input className="input" name="horaTreino" type="time" value={form.horaTreino} onChange={handleFormChange} />
                                        </div>
                                    </div>
                                    <div className="row">
                                        <label className="field-label">Observações</label>
                                        <textarea className="input" name="observacoes" value={form.observacoes} onChange={handleFormChange} rows={4} placeholder="Notas sobre o treino, exercícios, etc..." />
                                    </div>

                                    <div className="row">
                                        <label className="field-label" style={{ marginBottom: 8 }}>Registo de Presenças</label>
                                        <div className="presencas-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
                                            {atletasList.length > 0 ? atletasList.map(atleta => (
                                                <label key={atleta.id} className="filter-checkbox" style={{ gap: 8, cursor: "pointer" }}>
                                                    <input
                                                        type="checkbox"
                                                        checked={!!form.presencas[atleta.id]}
                                                        onChange={() => handlePresencaChange(atleta.id)}
                                                    />
                                                    <span>{atleta.nome}</span>
                                                </label>
                                            )) : <p className="subtle">Sem atletas para listar.</p>}
                                        </div>
                                    </div>

                                    <div className="actions" style={{ marginTop: 8 }}>
                                        <button type="submit" className="btn btn-primary" disabled={saving}>
                                            {saving ? "A guardar..." : "Guardar Sessão"}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}