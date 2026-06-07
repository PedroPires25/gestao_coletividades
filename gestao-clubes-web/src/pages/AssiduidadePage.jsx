import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import SideMenu from "../components/SideMenu";
import { useAuth } from "../auth/AuthContext";
import { getAssiduidade } from "../services/treinador";
import { exportToCsv, exportToPdf, printPdf } from "../utils/export";

export default function AssiduidadePage() {
    const { clubeId } = useParams();
    const navigate = useNavigate();
    const { logout, clube } = useAuth();

    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [resultados, setResultados] = useState([]);
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

    async function handleFilter() {
        if (!startDate || !endDate) {
            setErro("Por favor, selecione a data de início e de fim.");
            return;
        }
        setErro("");
        setLoading(true);
        try {
            const data = await getAssiduidade(clubeId, startDate, endDate);
            setResultados(Array.isArray(data) ? data : []);
        } catch (e) {
            setErro(e.message || "Erro ao carregar assiduidade.");
        } finally {
            setLoading(false);
        }
    }

    const prepareExportData = () => {
        const columns = [
            { key: 'nomeAtleta', label: 'Atleta' },
            { key: 'totalTreinos', label: 'Nº de Treinos no Período' },
            { key: 'presencas', label: 'Presenças' },
            { key: 'assiduidade', label: 'Assiduidade (%)' },
        ];
        const dataToExport = resultados.map(r => ({
            ...r,
            assiduidade: r.percentagem.toFixed(1),
        }));
        return { columns, dataToExport };
    };

    const handleExportCsv = () => {
        const { columns, dataToExport } = prepareExportData();
        exportToCsv(dataToExport, columns, `assiduidade_${startDate}_a_${endDate}.csv`);
    };

    const handleExportPdf = () => {
        const { columns, dataToExport } = prepareExportData();
        exportToPdf(dataToExport, columns, `Relatório de Assiduidade (${startDate} a ${endDate})`, clube?.nome, `assiduidade_${startDate}_a_${endDate}.pdf`);
    };

    const handlePrint = () => {
        const { columns, dataToExport } = prepareExportData();
        printPdf(dataToExport, columns, `Relatório de Assiduidade (${startDate} a ${endDate})`, clube?.nome);
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
                    <div className="modalidades-toolbar">
                        <div className="toolbar-title-group">
                            <h2>Filtrar por Período</h2>
                        </div>
                        <div className="actions no-print">
                            <button className="btn" onClick={handleExportPdf} disabled={resultados.length === 0}>Exportar PDF</button>
                            <button className="btn" onClick={handleExportCsv} disabled={resultados.length === 0}>Exportar CSV</button>
                            <button className="btn" onClick={handlePrint} disabled={resultados.length === 0}>Imprimir</button>
                        </div>
                    </div>
                    <div className="row2" style={{ alignItems: "flex-end", marginBottom: 16 }}>
                        <div className="row">
                            <label className="field-label">Data de Início</label>
                            <input className="input" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
                        </div>
                        <div className="row">
                            <label className="field-label">Data de Fim</label>
                            <input className="input" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
                        </div>
                        <div className="row">
                            <button className="btn btn-primary" onClick={handleFilter} disabled={loading}>
                                {loading ? "A filtrar..." : "Filtrar"}
                            </button>
                        </div>
                    </div>

                    {loading ? (
                        <p className="subtle">A carregar resultados...</p>
                    ) : resultados.length > 0 ? (
                        <div className="table-wrap">
                            <table className="dashboard-table">
                                <thead>
                                    <tr>
                                        <th>Atleta</th>
                                        <th>Nº de Treinos no Período</th>
                                        <th>Presenças</th>
                                        <th>Assiduidade</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {resultados.map(r => (
                                        <tr key={r.atletaId}>
                                            <td>{r.nomeAtleta}</td>
                                            <td>{r.totalTreinos}</td>
                                            <td>{r.presencas}</td>
                                            <td>
                                                <strong style={{ color: r.percentagem > 80 ? 'var(--color-ok)' : 'var(--color-error)' }}>
                                                    {r.percentagem.toFixed(1)}%
                                                </strong>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="subtle">Selecione um período e clique em "Filtrar" para ver os resultados.</p>
                    )}
                </div>
            </div>
        </>
    );
}