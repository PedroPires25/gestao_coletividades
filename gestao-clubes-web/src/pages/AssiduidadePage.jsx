import { useMemo, useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import SideMenu from "../components/SideMenu";
import { useAuth } from "../auth/AuthContext";
import { getClubeById, getAtletaById, getUploadUrl } from "../api";
import { getAssiduidade, getAtletasTreinador, getEscaloesTreinador, getAssiduidadeAtleta } from "../services/treinador";
import { exportToCsv, exportToPdf, printPdf } from "../utils/export";

function formatDate(dateString) {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString("pt-PT");
}

const MESES = [
    { value: 1, label: "Janeiro" },
    { value: 2, label: "Fevereiro" },
    { value: 3, label: "Março" },
    { value: 4, label: "Abril" },
    { value: 5, label: "Maio" },
    { value: 6, label: "Junho" },
    { value: 7, label: "Julho" },
    { value: 8, label: "Agosto" },
    { value: 9, label: "Setembro" },
    { value: 10, label: "Outubro" },
    { value: 11, label: "Novembro" },
    { value: 12, label: "Dezembro" },
];

export default function AssiduidadePage() {
    const { clubeId } = useParams();
    const navigate = useNavigate();
    const { logout } = useAuth();

    const [clubeInfo, setClubeInfo] = useState(null);

    const [view, setView] = useState('equipa');
    
    const [escaloes, setEscaloes] = useState([]);
    const [atletas, setAtletas] = useState([]);
    const [filtroEscalao, setFiltroEscalao] = useState("");
    const [filtroAtleta, setFiltroAtleta] = useState("");
    const [filtroPeriodo, setFiltroPeriodo] = useState("periodo");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [mes, setMes] = useState(new Date().getMonth() + 1);
    const [ano, setAno] = useState(new Date().getFullYear());

    const [resultadosGeral, setResultadosGeral] = useState([]);
    const [resultadosIndividual, setResultadosIndividual] = useState([]);
    const [atletaSelecionado, setAtletaSelecionado] = useState(null);

    const [loading, setLoading] = useState(false);
    const [erro, setErro] = useState("");

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
        async function carregarDropdowns() {
            try {
                const [clubeData, escaloesData, atletasData] = await Promise.all([
                    getClubeById(clubeId).catch(() => null),
                    getEscaloesTreinador(clubeId),
                    getAtletasTreinador(clubeId)
                ]);
                setClubeInfo(clubeData || null);
                setEscaloes(Array.isArray(escaloesData) ? escaloesData : (escaloesData?.data || []));
                setAtletas(Array.isArray(atletasData) ? atletasData : (atletasData?.data || []));
            } catch (err) {
                console.error(err);
                setErro("Erro ao carregar filtros.");
            }
        }
        carregarDropdowns();
    }, [clubeId]);

    function getPeriodo() {
        let start, end;
        if (filtroPeriodo === 'mes') {
            start = new Date(ano, mes - 1, 1);
            end = new Date(ano, mes, 0);
        } else if (filtroPeriodo === 'ano') {
            start = new Date(ano, 0, 1);
            end = new Date(ano, 11, 31);
        } else {
            start = new Date(startDate);
            end = new Date(endDate);
        }
        return {
            startDate: start.toISOString().slice(0, 10),
            endDate: end.toISOString().slice(0, 10)
        };
    }

    async function handleFilter() {
        setErro("");
        setLoading(true);
        const { startDate, endDate } = getPeriodo();

        if (!startDate || !endDate || startDate === 'NaN-NaN-NaN' || endDate === 'NaN-NaN-NaN') {
            setErro("Por favor, selecione um período válido.");
            setLoading(false);
            return;
        }

        try {
            if (view === 'equipa') {
                const data = await getAssiduidade(clubeId, startDate, endDate);
                setResultadosGeral(Array.isArray(data) ? data : []);
            } else if (view === 'individual') {
                if (!filtroAtleta) {
                    setErro("Por favor, selecione um atleta.");
                    setLoading(false);
                    return;
                }
                const data = await getAssiduidadeAtleta(clubeId, filtroAtleta, startDate, endDate);
                setResultadosIndividual(Array.isArray(data) ? data : []);
                const atletaFromList = atletas.find(a => String(a.id) === String(filtroAtleta));
                if (atletaFromList?.fotoPath || atletaFromList?.foto_path) {
                    setAtletaSelecionado(atletaFromList);
                } else {
                    const atletaFull = await getAtletaById(filtroAtleta).catch(() => null);
                    setAtletaSelecionado(atletaFull ?? atletaFromList ?? null);
                }
            }
        } catch (e) {
            setErro(e.message || "Erro ao carregar assiduidade.");
        } finally {
            setLoading(false);
        }
    }

    const atletasFiltrados = useMemo(() => {
        if (!filtroEscalao) return atletas;
        return atletas.filter(a => {
            const escId = String(a.escalao_id ?? a.escalaoId ?? a.escalao?.id ?? "");
            return escId === String(filtroEscalao);
        });
    }, [atletas, filtroEscalao]);

    const resultadosGeralFiltrados = useMemo(() => {
        if (!filtroEscalao) return resultadosGeral;
        const validAtletaIds = new Set(atletasFiltrados.map(a => Number(a.id)));
        return resultadosGeral.filter(r => validAtletaIds.has(Number(r.atletaId)));
    }, [resultadosGeral, atletasFiltrados, filtroEscalao]);

    const nomeEscalaoSelecionado = useMemo(() => {
        if (!filtroEscalao) return "Todos os Escalões";
        return escaloes.find(e => String(e.id) === String(filtroEscalao))?.nome || "Todos os Escalões";
    }, [escaloes, filtroEscalao]);

    const prepareExportDataIndividual = () => {
        const { startDate, endDate } = getPeriodo();
        const totalTreinos = resultadosIndividual.length;
        const presencas = resultadosIndividual.filter(r => r.presente).length;
        const percentagem = totalTreinos > 0 ? ((presencas / totalTreinos) * 100).toFixed(1) : "0.0";

        const columns = [
            { key: 'data', label: 'Data do Treino' },
            { key: 'status', label: 'Presença' },
        ];
        const dataToExport = resultadosIndividual.map(r => ({
            data: formatDate(r.dataTreino),
            status: r.presente ? 'Presente' : 'Faltou',
        }));

        const title = `Assiduidade Individual`;
        const filename = `assiduidade_${atletaSelecionado?.nome || 'individual'}_${startDate}_a_${endDate}.pdf`;
        const summary = `Atleta: ${atletaSelecionado?.nome || 'N/A'}`;
        const filters = `Período: ${startDate} a ${endDate} | Escalão: ${nomeEscalaoSelecionado} | Total de Treinos: ${totalTreinos} | Presenças: ${presencas} | Assiduidade: ${percentagem}%`;

        return { columns, dataToExport, title, filename, summary, filters, athletePhotoUrl: getUploadUrl(atletaSelecionado?.fotoPath || atletaSelecionado?.foto_path) };
    };

    const handleExportPdfIndividual = () => {
        const { columns, dataToExport, title, filename, summary, filters, athletePhotoUrl } = prepareExportDataIndividual();
        exportToPdf({
            data: dataToExport,
            columns,
            title,
            clubName: clubeInfo?.nome,
            clubLogoUrl: getUploadUrl(clubeInfo?.logoPath),
            filename,
            summary,
            filters,
            athletePhotoUrl,
        });
    };

    const handleExportCsvIndividual = () => {
        const { columns, dataToExport } = prepareExportDataIndividual();
        exportToCsv(dataToExport, columns, `assiduidade_individual_${atletaSelecionado?.nome || 'atleta'}.csv`);
    };

    const handlePrintIndividual = () => {
        const { columns, dataToExport, title, summary, filters, athletePhotoUrl } = prepareExportDataIndividual();
        printPdf({
            data: dataToExport,
            columns,
            title,
            clubName: clubeInfo?.nome,
            clubLogoUrl: getUploadUrl(clubeInfo?.logoPath),
            summary,
            filters,
            athletePhotoUrl,
        });
    };

    const prepareExportDataGeral = () => {
        const { startDate, endDate } = getPeriodo();
        const columns = [
            { key: 'nomeAtleta', label: 'Atleta' },
            { key: 'totalTreinos', label: 'Nº de Treinos' },
            { key: 'presencas', label: 'Presenças' },
            { key: 'assiduidade', label: 'Assiduidade (%)' },
        ];
        const dataToExport = resultadosGeralFiltrados.map(r => ({
            ...r,
            assiduidade: r.percentagem.toFixed(1),
        }));

        const title = "Assiduidade da Equipa";
        const filename = `assiduidade_equipa_${startDate}_a_${endDate}.pdf`;
        const filters = `Período: ${startDate} a ${endDate} | Escalão: ${nomeEscalaoSelecionado}`;

        return { columns, dataToExport, title, filename, filters };
    };

    const handleExportPdfGeral = () => {
        const { columns, dataToExport, title, filename, filters } = prepareExportDataGeral();
        exportToPdf({
            data: dataToExport,
            columns,
            title,
            clubName: clubeInfo?.nome,
            clubLogoUrl: getUploadUrl(clubeInfo?.logoPath),
            filename,
            filters,
        });
    };

    const handleExportCsvGeral = () => {
        const { columns, dataToExport } = prepareExportDataGeral();
        const { startDate, endDate } = getPeriodo();
        exportToCsv(dataToExport, columns, `assiduidade_equipa_${startDate}_a_${endDate}.csv`);
    };

    const handlePrintGeral = () => {
        const { columns, dataToExport, title, filters } = prepareExportDataGeral();
        printPdf({
            data: dataToExport,
            columns,
            title,
            clubName: clubeInfo?.nome,
            clubLogoUrl: getUploadUrl(clubeInfo?.logoPath),
            filters,
        });
    };

    return (
        <>
            <SideMenu title="Gestão de Clubes" subtitle="Estatísticas" logoHref="/menu" logoSrc="/LOGO_GCDC04.png" items={menuItems} />

            <div className="container" style={{ paddingTop: 24 }}>
                <div className="page-title page-title-with-icon no-print">
                    <div className="page-title-main-wrap">
                        <span className="page-title-icon-circle" style={{ fontSize: "1.6rem" }}>📊</span>
                        <div className="page-title-texts">
                            <h1>Consultar Assiduidade</h1>
                            <div className="hint">Filtre por período para ver a percentagem de presenças.</div>
                        </div>
                    </div>
                     <div className="actions">
                        <button type="button" className="btn" onClick={() => navigate(`/clubes/${clubeId}/treinador`)}>Módulo de Treinador</button>
                    </div>
                </div>

                {erro && <div className="alert error no-print">{erro}</div>}

                <div className="card">
                    <div className="actions" style={{ marginBottom: 20, justifyContent: 'flex-start' }}>
                        <button 
                            className={`btn ${view === 'equipa' ? 'btn-primary' : 'btn-secondary'}`} 
                            onClick={() => { setView('equipa'); setResultadosIndividual([]); }}
                        >
                            Assiduidade da Equipa
                        </button>
                        <button 
                            className={`btn ${view === 'individual' ? 'btn-primary' : 'btn-secondary'}`} 
                            onClick={() => { setView('individual'); setResultadosGeral([]); }}
                        >
                            Assiduidade Individual
                        </button>
                    </div>

                    <div className="row" style={{ flexWrap: 'wrap', gap: '16px', alignItems: 'flex-end', marginTop: '16px' }}>
                        <div className="row-item">
                            <label className="field-label">Escalão</label>
                            <select className="input" value={filtroEscalao} onChange={e => {
                                setFiltroEscalao(e.target.value);
                                setFiltroAtleta("");
                            }}>
                                <option value="">Todos os Escalões</option>
                                {escaloes.map(e => <option key={e.id} value={e.id}>{e.nome}</option>)}
                            </select>
                        </div>
                        {view === 'individual' && (
                            <div className="row-item">
                                <label className="field-label">Atleta</label>
                                <select className="input" value={filtroAtleta} onChange={e => setFiltroAtleta(e.target.value)} required={view === 'individual'}>
                                    <option value="">Selecione um Atleta...</option>
                                    {atletasFiltrados.map(a => <option key={a.id} value={a.id}>{a.nome}</option>)}
                                </select>
                            </div>
                        )}
                        <div className="row-item">
                            <label className="field-label">Período</label>
                            <select className="input" value={filtroPeriodo} onChange={e => setFiltroPeriodo(e.target.value)}>
                                <option value="periodo">Período específico</option>
                                <option value="mes">Mês</option>
                                <option value="ano">Ano</option>
                            </select>
                        </div>
                        {filtroPeriodo === 'periodo' && (
                            <>
                                <div className="row-item"><label className="field-label">Data de Início</label><input className="input" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} /></div>
                                <div className="row-item"><label className="field-label">Data de Fim</label><input className="input" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} /></div>
                            </>
                        )}
                        {filtroPeriodo === 'mes' && (
                            <>
                                <div className="row-item">
                                    <label className="field-label">Mês</label>
                                    <select className="input" value={mes} onChange={e => setMes(Number(e.target.value))}>
                                        {MESES.map(m => (
                                            <option key={m.value} value={m.value}>{m.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="row-item"><label className="field-label">Ano</label><input className="input" type="number" value={ano} onChange={e => setAno(e.target.value)} /></div>
                            </>
                        )}
                        {filtroPeriodo === 'ano' && (
                            <div className="row-item"><label className="field-label">Ano</label><input className="input" type="number" value={ano} onChange={e => setAno(e.target.value)} /></div>
                        )}
                        <div className="row-item">
                            <button className="btn btn-primary" onClick={handleFilter} disabled={loading}>{loading ? "A filtrar..." : "Filtrar"}</button>
                        </div>
                    </div>
                </div>

                {loading && <p className="subtle">A carregar resultados...</p>}

                {!loading && view === 'equipa' && resultadosGeralFiltrados.length > 0 && (
                    <div className="card">
                        <div className="modalidades-toolbar">
                            <div className="toolbar-title-group"><h2>Resultados da Equipa</h2></div>
                            <div className="actions no-print">
                                <button className="btn" onClick={handleExportPdfGeral}>Exportar PDF</button>
                                <button className="btn" onClick={handleExportCsvGeral}>Exportar CSV</button>
                                <button className="btn" onClick={handlePrintGeral}>Imprimir</button>
                            </div>
                        </div>
                        <div className="table-wrap">
                            <table className="dashboard-table">
                                <thead><tr><th>Atleta</th><th>Nº de Treinos</th><th>Presenças</th><th>Assiduidade</th></tr></thead>
                                <tbody>
                                    {resultadosGeralFiltrados.map(r => (
                                        <tr key={r.atletaId}>
                                            <td>{r.nomeAtleta}</td>
                                            <td>{r.totalTreinos}</td>
                                            <td>{r.presencas}</td>
                                            <td><strong style={{ color: r.percentagem > 80 ? 'var(--color-ok)' : 'var(--color-error)' }}>{r.percentagem.toFixed(1)}%</strong></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {!loading && view === 'individual' && resultadosIndividual.length > 0 && (
                     <div className="card">
                        <div className="modalidades-toolbar">
                            <div className="toolbar-title-group"><h2>Resultados para: {atletaSelecionado?.nome}</h2></div>
                            <div className="actions no-print">
                                <button className="btn" onClick={handleExportPdfIndividual}>Exportar PDF</button>
                                <button className="btn" onClick={handleExportCsvIndividual}>Exportar CSV</button>
                                <button className="btn" onClick={handlePrintIndividual}>Imprimir</button>
                            </div>
                        </div>
                        <div className="table-wrap">
                            <table className="dashboard-table">
                                <thead><tr><th>Data do Treino</th><th>Presença</th></tr></thead>
                                <tbody>
                                    {resultadosIndividual.map(r => (
                                        <tr key={r.id}>
                                            <td>{formatDate(r.dataTreino)}</td>
                                            <td>{r.presente ? <span style={{color: 'var(--color-ok)'}}>Presente</span> : <span style={{color: 'var(--color-error)'}}>Faltou</span>}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}