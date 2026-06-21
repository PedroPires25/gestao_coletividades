import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import SideMenu from "../components/SideMenu";
import { useAuth } from "../auth/AuthContext";
import { getClubeById, getUploadUrl } from "../api";
import { getEscaloes } from "../services/atletas";
import {
    getAtletasTesouraria,
    getTaxasMensalidade, upsertTaxaMensalidade,
    getTaxasInscricao, upsertTaxaInscricao,
    getPagamentos, criarPagamento, atualizarPagamento,
    getDividas, getRecebimentos,
    getInscricoes, criarInscricao, atualizarInscricao,
    enviarAvisos,
    getTaxasSeguro, upsertTaxaSeguro,
    getSeguros, criarSeguro, atualizarSeguro,
} from "../services/tesouraria";
import { exportToCsv, exportToPdf, printPdf } from "../utils/export";
import tesourariaIcon from "../assets/tesouraria.svg";

const MESES = [
    { v: 1, l: "Janeiro" }, { v: 2, l: "Fevereiro" }, { v: 3, l: "Março" },
    { v: 4, l: "Abril" }, { v: 5, l: "Maio" }, { v: 6, l: "Junho" },
    { v: 7, l: "Julho" }, { v: 8, l: "Agosto" }, { v: 9, l: "Setembro" },
    { v: 10, l: "Outubro" }, { v: 11, l: "Novembro" }, { v: 12, l: "Dezembro" },
];
const METODOS = ["Dinheiro", "Transferência bancária", "MB Way", "Cartão", "Outro"];
const ESTADOS_PAG = ["Pago", "Parcial", "Em dívida"];
const ESTADOS_INS = ["Pago", "Em dívida", "Isento"];

const ANO_ATUAL = new Date().getFullYear();
const MES_ATUAL = new Date().getMonth() + 1;

// Época atual: começa em Agosto — se mês >= 8, é ano/ano+1; senão, ano-1/ano
const EPOCA_ATUAL = MES_ATUAL >= 8
    ? `${ANO_ATUAL}/${ANO_ATUAL + 1}`
    : `${ANO_ATUAL - 1}/${ANO_ATUAL}`;

// Gera lista de épocas: próxima + atual + 3 anteriores
function gerarEpocas() {
    const [anoInicio] = EPOCA_ATUAL.split("/").map(Number);
    const epocas = [];
    for (let i = 1; i >= -3; i--) {
        const a = anoInicio + i;
        epocas.push(`${a}/${a + 1}`);
    }
    return epocas;
}
const EPOCAS = gerarEpocas();

function nomeMes(m) { return MESES.find((x) => x.v === Number(m))?.l || m; }

function EstadoBadge({ estado }) {
    const cores = {
        "Pago": { bg: "#22c55e20", color: "#15803d", border: "#22c55e" },
        "Parcial": { bg: "#f59e0b20", color: "#b45309", border: "#f59e0b" },
        "Em d\u00edvida": { bg: "#ef444420", color: "#b91c1c", border: "#ef4444" },
        "Isento": { bg: "#6366f120", color: "#4338ca", border: "#6366f1" },
    };
    const c = cores[estado] || { bg: "#88888820", color: "#444", border: "#888" };
    return (
        <span style={{ padding: "2px 10px", borderRadius: 20, fontSize: "0.78rem", fontWeight: 600,
            background: c.bg, color: c.color, border: `1px solid ${c.border}` }}>
            {estado}
        </span>
    );
}

const TABS = ["Mensalidades", "Inscrições", "Pagamentos", "Dívidas", "Recebimentos", "Avisos", "Seguros"];

export default function TesourariaPage() {
    const { clubeId } = useParams();
    const navigate = useNavigate();
    const { logout, isAdmin, isScopedAdmin, isSecretario } = useAuth();

    const [tab, setTab] = useState(0);
    const [clube, setClube] = useState(null);
    const [escaloes, setEscaloes] = useState([]);
    const [atletas, setAtletas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [erro, setErro] = useState("");
    const [msg, setMsg] = useState("");

    // ---- MENSALIDADES ----
    const [epocaMens, setEpocaMens] = useState(EPOCA_ATUAL);
    const [editMens, setEditMens] = useState({});
    const [savingMens, setSavingMens] = useState(false);

    // ---- INSCRIÇÕES CONFIG ----
    const [epocaIns, setEpocaIns] = useState(EPOCA_ATUAL);
    const [editIns, setEditIns] = useState({});
    const [savingIns, setSavingIns] = useState(false);

    // ---- PAGAMENTOS ----
    const [pagamentos, setPagamentos] = useState([]);
    const [filtroPag, setFiltroPag] = useState({ atletaId: "", escalaoId: "", mes: "", ano: ANO_ATUAL, estado: "" });
    const [showFormPag, setShowFormPag] = useState(false);
    const [formPag, setFormPag] = useState({ atletaId: "", escalaoId: "", mes: MES_ATUAL, ano: ANO_ATUAL, valorDevido: "", valorPago: "0", dataPagamento: "", metodoPagamento: "", estado: "Em dívida", observacoes: "" });
    const [savingPag, setSavingPag] = useState(false);
    const [editPagId, setEditPagId] = useState(null);
    const [editFormPag, setEditFormPag] = useState({});

    // ---- DÍVIDAS ----
    const [dividas, setDividas] = useState([]);
    const [filtroDiv, setFiltroDiv] = useState({ escalaoId: "", mes: "", ano: "", atletaId: "" });

    // ---- RECEBIMENTOS ----
    const [recebimentos, setRecebimentos] = useState([]);
    const [filtroRec, setFiltroRec] = useState({ mes: MES_ATUAL, ano: ANO_ATUAL });

    // ---- INSCRIÇÕES ATLETAS ----
    const [inscricoes, setInscricoes] = useState([]);
    const [filtroInsc, setFiltroInsc] = useState({ epoca: EPOCA_ATUAL, estado: "", atletaId: "" });
    const [showFormInsc, setShowFormInsc] = useState(false);
    const [formInsc, setFormInsc] = useState({ atletaId: "", epoca: EPOCA_ATUAL, valorInscricao: "", estado: "Em dívida", dataPagamento: "", metodoPagamento: "", observacoes: "" });
    const [savingInsc, setSavingInsc] = useState(false);
    const [editInscId, setEditInscId] = useState(null);
    const [editFormInsc, setEditFormInsc] = useState({});

    // ---- AVISOS ----
    const [avisoMes, setAvisoMes] = useState(MES_ATUAL);
    const [avisoAno, setAvisoAno] = useState(ANO_ATUAL);
    const [avisoValor, setAvisoValor] = useState("");
    const [avisoAtletas, setAvisoAtletas] = useState([]);
    const [avisoSelecionados, setAvisoSelecionados] = useState([]);
    const [enviandoAviso, setEnviandoAviso] = useState(false);

    // ---- SEGUROS CONFIG ----
    const [epocaSeg, setEpocaSeg] = useState(EPOCA_ATUAL);
    const [editSeg, setEditSeg] = useState({});
    const [savingSeg, setSavingSeg] = useState(false);

    // ---- SEGUROS ATLETAS ----
    const [seguros, setSeguros] = useState([]);
    const [filtroSeg, setFiltroSeg] = useState({ epoca: EPOCA_ATUAL, estado: "", atletaId: "", escalaoId: "" });
    const [showFormSeg, setShowFormSeg] = useState(false);
    const [formSeg, setFormSeg] = useState({ atletaId: "", escalaoId: "", epoca: EPOCA_ATUAL, valorDevido: "", valorPago: "0", estado: "Em dívida", dataPagamento: "", metodoPagamento: "", observacoes: "" });
    const [savingSegForm, setSavingSegForm] = useState(false);
    const [editSegId, setEditSegId] = useState(null);
    const [editFormSeg, setEditFormSeg] = useState({});

    const menuItems = useMemo(() => [
        { label: "Clube", to: `/clubes/${clubeId}` },
        { label: "Logout", onClick: () => { logout(); navigate("/login", { replace: true }); } },
    ], [clubeId, logout, navigate]);

    useEffect(() => {
        if (!isAdmin && !isScopedAdmin && !isSecretario) {
            navigate("/acesso-negado", { replace: true });
            return;
        }
        async function carregar() {
            setLoading(true);
            try {
                const [clubeData, escData, atlData] = await Promise.all([
                    getClubeById(clubeId),
                    getEscaloes(),
                    getAtletasTesouraria(clubeId),
                ]);
                setClube(clubeData || null);
                setEscaloes(Array.isArray(escData) ? escData : []);
                setAtletas(Array.isArray(atlData) ? atlData : []);
            } catch (e) {
                setErro(e.message || "Erro ao carregar.");
            } finally {
                setLoading(false);
            }
        }
        carregar();
    }, [clubeId, isAdmin, isScopedAdmin, isSecretario, navigate]);

    // Carregar dados de cada aba ao mudar
    useEffect(() => {
        if (loading) return;
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setErro("");
        if (tab === 0) carregarTaxasMens();
        else if (tab === 1) { carregarTaxasIns(); carregarInscricoes(); }
        else if (tab === 2) carregarPagamentos();
        else if (tab === 3) carregarDividas();
        else if (tab === 4) carregarRecebimentos();
        else if (tab === 5) carregarDividasParaAvisos();
        else if (tab === 6) { carregarTaxasSeg(); carregarSeguros(); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tab, loading]);

    async function carregarTaxasMens() {
        try {
            const data = await getTaxasMensalidade(clubeId, epocaMens);
            const arr = Array.isArray(data) ? data : [];
            const map = {};
            arr.forEach((r) => { map[r.escalaoId] = r.valorMensal; });
            // Preencher escalões sem configuração com 0
            escaloes.forEach((e) => { if (!(e.id in map)) map[e.id] = ""; });
            setEditMens(map);
        } catch (e) { setErro(e.message); }
    }

    async function carregarTaxasIns() {
        try {
            const data = await getTaxasInscricao(clubeId, epocaIns);
            const arr = Array.isArray(data) ? data : [];
            const map = {};
            arr.forEach((r) => { map[r.escalaoId] = r.valorInscricao; });
            escaloes.forEach((e) => { if (!(e.id in map)) map[e.id] = ""; });
            setEditIns(map);
        } catch (e) { setErro(e.message); }
    }

    async function carregarPagamentos() {
        try {
            const data = await getPagamentos(clubeId, {
                atletaId: filtroPag.atletaId || undefined,
                escalaoId: filtroPag.escalaoId || undefined,
                mes: filtroPag.mes || undefined,
                ano: filtroPag.ano || undefined,
                estado: filtroPag.estado || undefined,
            });
            setPagamentos(Array.isArray(data) ? data : []);
        } catch (e) { setErro(e.message); }
    }

    async function carregarDividas() {
        try {
            const data = await getDividas(clubeId, {
                escalaoId: filtroDiv.escalaoId || undefined,
                mes: filtroDiv.mes || undefined,
                ano: filtroDiv.ano || undefined,
                atletaId: filtroDiv.atletaId || undefined,
            });
            setDividas(Array.isArray(data) ? data : []);
        } catch (e) { setErro(e.message); }
    }

    async function carregarRecebimentos() {
        try {
            const data = await getRecebimentos(clubeId, {
                mes: filtroRec.mes || undefined,
                ano: filtroRec.ano || undefined,
            });
            setRecebimentos(Array.isArray(data) ? data : []);
        } catch (e) { setErro(e.message); }
    }

    async function carregarInscricoes() {
        try {
            const data = await getInscricoes(clubeId, {
                epoca: filtroInsc.epoca || undefined,
                estado: filtroInsc.estado || undefined,
                atletaId: filtroInsc.atletaId || undefined,
            });
            setInscricoes(Array.isArray(data) ? data : []);
        } catch (e) { setErro(e.message); }
    }

    async function carregarDividasParaAvisos() {
        try {
            const data = await getDividas(clubeId, {});
            setAvisoAtletas(Array.isArray(data) ? data : []);
        } catch (e) { setErro(e.message); }
    }

    async function carregarTaxasSeg() {
        try {
            const data = await getTaxasSeguro(clubeId, epocaSeg);
            const arr = Array.isArray(data) ? data : [];
            const map = {};
            arr.forEach((r) => { map[r.escalaoId] = r.valorSeguro; });
            escaloes.forEach((e) => { if (!(e.id in map)) map[e.id] = ""; });
            setEditSeg(map);
        } catch (e) { setErro(e.message); }
    }

    async function carregarSeguros() {
        try {
            const data = await getSeguros(clubeId, {
                epoca: filtroSeg.epoca || undefined,
                estado: filtroSeg.estado || undefined,
                atletaId: filtroSeg.atletaId || undefined,
                escalaoId: filtroSeg.escalaoId || undefined,
            });
            setSeguros(Array.isArray(data) ? data : []);
        } catch (e) { setErro(e.message); }
    }

    // ==========================================
    // GUARDAR TAXAS MENSALIDADES
    // ==========================================
    async function guardarTaxasMens() {
        setSavingMens(true);
        setErro(""); setMsg("");
        try {
            for (const e of escaloes) {
                const val = parseFloat(editMens[e.id]);
                if (isNaN(val) || val < 0) continue;
                await upsertTaxaMensalidade(clubeId, { escalaoId: e.id, epoca: epocaMens, valorMensal: val });
            }
            setMsg("Mensalidades guardadas com sucesso.");
            await carregarTaxasMens();
        } catch (ex) { setErro(ex.message); }
        finally { setSavingMens(false); }
    }

    async function guardarTaxasIns() {
        setSavingIns(true);
        setErro(""); setMsg("");
        try {
            for (const e of escaloes) {
                const val = parseFloat(editIns[e.id]);
                if (isNaN(val) || val < 0) continue;
                await upsertTaxaInscricao(clubeId, { escalaoId: e.id, epoca: epocaIns, valorInscricao: val });
            }
            setMsg("Taxas de inscrição guardadas com sucesso.");
            await carregarTaxasIns();
        } catch (ex) { setErro(ex.message); }
        finally { setSavingIns(false); }
    }

    // ==========================================
    // PAGAMENTOS CRUD
    // ==========================================
    async function submeterPagamento(e) {
        e.preventDefault();
        if (!formPag.atletaId) { setErro("Selecione um atleta."); return; }
        setSavingPag(true); setErro(""); setMsg("");
        try {
            await criarPagamento(clubeId, {
                atletaId: Number(formPag.atletaId),
                escalaoId: formPag.escalaoId ? Number(formPag.escalaoId) : null,
                mes: Number(formPag.mes), ano: Number(formPag.ano),
                valorDevido: parseFloat(formPag.valorDevido) || 0,
                valorPago: parseFloat(formPag.valorPago) || 0,
                dataPagamento: formPag.dataPagamento || null,
                metodoPagamento: formPag.metodoPagamento || null,
                estado: formPag.estado,
                observacoes: formPag.observacoes || null,
            });
            setMsg("Pagamento registado.");
            setShowFormPag(false);
            setFormPag({ atletaId: "", escalaoId: "", mes: MES_ATUAL, ano: ANO_ATUAL, valorDevido: "", valorPago: "0", dataPagamento: "", metodoPagamento: "", estado: "Em dívida", observacoes: "" });
            await carregarPagamentos();
        } catch (ex) { setErro(ex.message); }
        finally { setSavingPag(false); }
    }

    async function guardarEditPagamento() {
        if (!editPagId) return;
        setErro(""); setMsg("");
        try {
            await atualizarPagamento(clubeId, editPagId, {
                valorDevido: parseFloat(editFormPag.valorDevido) || 0,
                valorPago: parseFloat(editFormPag.valorPago) || 0,
                dataPagamento: editFormPag.dataPagamento || null,
                metodoPagamento: editFormPag.metodoPagamento || null,
                estado: editFormPag.estado,
                observacoes: editFormPag.observacoes || null,
            });
            setMsg("Pagamento atualizado.");
            setEditPagId(null);
            await carregarPagamentos();
        } catch (ex) { setErro(ex.message); }
    }

    // ==========================================
    // INSCRIÇÕES CRUD
    // ==========================================
    async function submeterInscricao(e) {
        e.preventDefault();
        if (!formInsc.atletaId) { setErro("Selecione um atleta."); return; }
        setSavingInsc(true); setErro(""); setMsg("");
        try {
            await criarInscricao(clubeId, {
                atletaId: Number(formInsc.atletaId),
                epoca: formInsc.epoca,
                valorInscricao: parseFloat(formInsc.valorInscricao) || 0,
                estado: formInsc.estado,
                dataPagamento: formInsc.dataPagamento || null,
                metodoPagamento: formInsc.metodoPagamento || null,
                observacoes: formInsc.observacoes || null,
            });
            setMsg("Inscrição registada.");
            setShowFormInsc(false);
            setFormInsc({ atletaId: "", epoca: EPOCA_ATUAL, valorInscricao: "", estado: "Em dívida", dataPagamento: "", metodoPagamento: "", observacoes: "" });
            await carregarInscricoes();
        } catch (ex) { setErro(ex.message); }
        finally { setSavingInsc(false); }
    }

    async function guardarEditInscricao() {
        if (!editInscId) return;
        setErro(""); setMsg("");
        try {
            await atualizarInscricao(clubeId, editInscId, {
                valorInscricao: parseFloat(editFormInsc.valorInscricao) || 0,
                estado: editFormInsc.estado,
                dataPagamento: editFormInsc.dataPagamento || null,
                metodoPagamento: editFormInsc.metodoPagamento || null,
                observacoes: editFormInsc.observacoes || null,
            });
            setMsg("Inscrição atualizada.");
            setEditInscId(null);
            await carregarInscricoes();
        } catch (ex) { setErro(ex.message); }
    }

    // ==========================================
    // SEGUROS CRUD
    // ==========================================
    async function guardarTaxasSeg() {
        setSavingSeg(true);
        setErro(""); setMsg("");
        try {
            for (const e of escaloes) {
                const val = parseFloat(editSeg[e.id]);
                if (isNaN(val) || val < 0) continue;
                await upsertTaxaSeguro(clubeId, { escalaoId: e.id, epoca: epocaSeg, valorSeguro: val });
            }
            setMsg("Valores de seguro guardados com sucesso.");
            await carregarTaxasSeg();
        } catch (ex) { setErro(ex.message); }
        finally { setSavingSeg(false); }
    }

    async function submeterSeguro(e) {
        e.preventDefault();
        if (!formSeg.atletaId) { setErro("Selecione um atleta."); return; }
        setSavingSegForm(true); setErro(""); setMsg("");
        try {
            await criarSeguro(clubeId, {
                atletaId: Number(formSeg.atletaId),
                escalaoId: formSeg.escalaoId ? Number(formSeg.escalaoId) : null,
                epoca: formSeg.epoca,
                valorDevido: parseFloat(formSeg.valorDevido) || 0,
                valorPago: parseFloat(formSeg.valorPago) || 0,
                estado: formSeg.estado,
                dataPagamento: formSeg.dataPagamento || null,
                metodoPagamento: formSeg.metodoPagamento || null,
                observacoes: formSeg.observacoes || null,
            });
            setMsg("Seguro registado.");
            setShowFormSeg(false);
            setFormSeg({ atletaId: "", escalaoId: "", epoca: EPOCA_ATUAL, valorDevido: "", valorPago: "0", estado: "Em dívida", dataPagamento: "", metodoPagamento: "", observacoes: "" });
            await carregarSeguros();
        } catch (ex) { setErro(ex.message); }
        finally { setSavingSegForm(false); }
    }

    async function guardarEditSeguro() {
        if (!editSegId) return;
        setErro(""); setMsg("");
        try {
            await atualizarSeguro(clubeId, editSegId, {
                valorDevido: parseFloat(editFormSeg.valorDevido) || 0,
                valorPago: parseFloat(editFormSeg.valorPago) || 0,
                estado: editFormSeg.estado,
                dataPagamento: editFormSeg.dataPagamento || null,
                metodoPagamento: editFormSeg.metodoPagamento || null,
                observacoes: editFormSeg.observacoes || null,
            });
            setMsg("Seguro atualizado.");
            setEditSegId(null);
            await carregarSeguros();
        } catch (ex) { setErro(ex.message); }
    }

    // ==========================================
    // ENVIAR AVISOS
    // ==========================================
    async function submeterAvisos() {
        if (avisoSelecionados.length === 0) { setErro("Selecione pelo menos um atleta."); return; }
        setEnviandoAviso(true); setErro(""); setMsg("");
        try {
            const res = await enviarAvisos(clubeId, {
                atletaIds: avisoSelecionados,
                nomeClube: clube?.nome || "Clube",
                mes: Number(avisoMes), ano: Number(avisoAno),
                valorEmDivida: parseFloat(avisoValor) || 0,
            });
            if (res?.enviados > 0) setMsg(`${res.enviados} aviso(s) enviado(s) com sucesso.`);
            if (res?.erros?.length > 0) setErro("Erros: " + res.erros.join("; "));
            setAvisoSelecionados([]);
        } catch (ex) { setErro(ex.message); }
        finally { setEnviandoAviso(false); }
    }

    // ==========================================
    // EXPORTAÇÃO
    // ==========================================
    function getDadosExportacaoTesouraria() {
        const nomeClube = clube?.nome || `clube_${clubeId}`;
        switch (tab) {
            case 0: // Mensalidades
                return {
                    data: escaloes.map(e => ({ escalao: e.nome, valor: editMens[e.id] || "0.00" })),
                    cols: [{ key: "escalao", label: "Escalão" }, { key: "valor", label: "Valor Mensal (€)" }],
                    title: `Mensalidades por Escalão (${epocaMens})`,
                    filename: `Tesouraria_Mensalidades_${epocaMens.replace("/", "-")}_${nomeClube}`
                };
            case 1: // Inscrições
                return {
                    data: inscricoes,
                    cols: [
                        { key: "atletaNome", label: "Atleta" }, { key: "epoca", label: "Época" },
                        { key: "valorInscricao", label: "Valor €" }, { key: "estado", label: "Estado" },
                        { key: "dataPagamento", label: "Data" }, { key: "metodoPagamento", label: "Método" },
                    ],
                    title: "Inscrições de Atletas",
                    filename: `Tesouraria_Inscricoes_${filtroInsc.epoca.replace("/", "-")}_${nomeClube}`
                };
            case 2: // Pagamentos
                return {
                    data: pagamentos.map(p => ({ ...p, mes: nomeMes(p.mes) })),
                    cols: [
                        { key: "atletaNome", label: "Atleta" }, { key: "escalaoNome", label: "Escalão" },
                        { key: "mes", label: "Mês" }, { key: "ano", label: "Ano" },
                        { key: "valorDevido", label: "Valor Devido (€)" }, { key: "valorPago", label: "Valor Pago (€)" },
                        { key: "valorDivida", label: "Dívida (€)" }, { key: "estado", label: "Estado" },
                        { key: "dataPagamento", label: "Data Pagamento" }, { key: "metodoPagamento", label: "Método" },
                    ],
                    title: "Pagamentos de Mensalidades",
                    filename: `Tesouraria_Pagamentos_${filtroPag.ano}-${filtroPag.mes}_${nomeClube}`
                };
            case 3: // Dívidas
                return {
                    data: dividas.map(d => ({ ...d, mes: nomeMes(d.mes) })),
                    cols: [
                        { key: "atletaNome", label: "Atleta" }, { key: "escalaoNome", label: "Escalão" },
                        { key: "mes", label: "Mês" }, { key: "ano", label: "Ano" },
                        { key: "valorDevido", label: "Devido €" }, { key: "valorPago", label: "Pago €" },
                        { key: "valorDivida", label: "Dívida €" }, { key: "estado", label: "Estado" },
                    ],
                    title: "Mensalidades em Dívida",
                    filename: `Tesouraria_Dividas_${filtroDiv.ano}-${filtroDiv.mes}_${nomeClube}`
                };
            case 4: // Recebimentos
                return {
                    data: recebimentos,
                    cols: [
                        { key: "escalaoNome", label: "Escalão" }, { key: "numAtletas", label: "Nº Atletas" },
                        { key: "totalPrevisto", label: "Total Previsto €" }, { key: "totalRecebido", label: "Total Recebido €" },
                        { key: "totalDivida", label: "Total Dívida €" }, { key: "percentagemCobranca", label: "Cobrança %" },
                    ],
                    title: "Recebimentos por Escalão",
                    filename: `Tesouraria_Recebimentos_${filtroRec.ano}-${filtroRec.mes}_${nomeClube}`
                };
            case 5: // Avisos
                return {
                    data: avisoAtletas.filter(a => avisoSelecionados.includes(a.atletaId)),
                    cols: [
                        { key: "atletaNome", label: "Atleta" }, { key: "mes", label: "Mês" },
                        { key: "ano", label: "Ano" }, { key: "valorDivida", label: "Dívida (€)" }
                    ],
                    title: "Avisos de Pagamento",
                    filename: `Tesouraria_Avisos_${avisoAno}-${avisoMes}_${nomeClube}`
                };
            case 6: // Seguros
                return {
                    data: seguros,
                    cols: [
                        { key: "atletaNome", label: "Atleta" }, { key: "escalaoNome", label: "Escalão" },
                        { key: "epoca", label: "Época" },
                        { key: "valorDevido", label: "Valor Devido (€)" }, { key: "valorPago", label: "Valor Pago (€)" },
                        { key: "valorDivida", label: "Dívida (€)" }, { key: "estado", label: "Estado" },
                        { key: "dataPagamento", label: "Data Pagamento" }, { key: "metodoPagamento", label: "Método" },
                    ],
                    title: "Seguros de Atletas",
                    filename: `Tesouraria_Seguros_${filtroSeg.epoca.replace("/", "-")}_${nomeClube}`
                };
            default:
                return null;
        }
    }

    function handleExport(format) {
        const exportData = getDadosExportacaoTesouraria();
        if (!exportData || exportData.data.length === 0) {
            setErro("Não existem dados para exportar.");
            return;
        }

        const { data, cols, title, filename } = exportData;
        
        if (format === 'csv') {
            exportToCsv(data, cols, `${filename}.csv`);
        } else if (format === 'pdf') {
            exportToPdf({
                data,
                columns: cols,
                title,
                clubName: clube?.nome,
                clubLogoUrl: getUploadUrl(clube?.logoPath),
                filename: `${filename}.pdf`,
                generatedText: "Documento emitido em"
            });
        } else if (format === 'print') {
            printPdf({
                data,
                columns: cols,
                title,
                clubName: clube?.nome,
                clubLogoUrl: getUploadUrl(clube?.logoPath),
                generatedText: "Documento emitido em"
            });
        }
    }

    // ==========================================
    // RENDER
    // ==========================================
    return (
        <>
            <SideMenu title="Gestão de Clubes" subtitle={clube?.nome || "Clube"} logoHref="/menu" logoSrc="/LOGO_GCDC04.png" items={menuItems} />
            <div className="container" style={{ paddingTop: 24 }}>
                <div className="page-title page-title-with-icon">
                    <div className="page-title-main-wrap">
                        <span className="page-title-icon-circle" style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 42, height: 42, borderRadius: "50%", background: "var(--color-primary, #6366f1)" }}>
                                <img src={tesourariaIcon} alt="Tesouraria" style={{ width: 26, height: 26 }} />
                            </span>
                        <div className="page-title-texts">
                            <h1>Tesouraria</h1>
                            {clube && <div className="hint">{clube.nome}</div>}
                        </div>
                    </div>
                    <div className="actions">
                        <button type="button" className="btn" onClick={() => navigate(`/clubes/${clubeId}`)}>← Clube</button>
                    </div>
                </div>

                {erro && <div className="alert error">{erro}</div>}
                {msg && <div className="alert ok">{msg}</div>}

                {loading ? <p className="subtle">A carregar...</p> : (
                    <>
                        {/* TABS */}
                        <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 20 }}>
                            {TABS.map((t, i) => (
                                <button key={t} type="button"
                                    className={`btn${tab === i ? " btn-primary" : ""}`}
                                    style={{ borderRadius: 20 }}
                                    onClick={() => { setTab(i); setErro(""); setMsg(""); }}>
                                    {t}
                                </button>
                            ))}
                        </div>

                        {/* TAB 0 — MENSALIDADES POR ESCALÃO */}
                        {tab === 0 && (
                            <div className="stack-sections">
                                <div className="card">
                                    <div className="modalidades-toolbar">
                                        <div className="toolbar-title-group"><h2>Mensalidades por Escalão</h2></div>
                                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                            <label style={{ fontSize: "0.85rem" }}>Época:</label>
                                            <select className="input" style={{ width: "auto" }} value={epocaMens} onChange={(e) => setEpocaMens(e.target.value)}>
                                                {EPOCAS.map((ep) => <option key={ep} value={ep}>{ep}</option>)}
                                            </select>
                                            <button type="button" className="btn btn-sm" onClick={carregarTaxasMens}>Carregar</button>
                                            <button type="button" className="btn btn-sm" onClick={() => handleExport('csv')}>CSV</button>
                                            <button type="button" className="btn btn-sm" onClick={() => handleExport('pdf')}>PDF</button>
                                            <button type="button" className="btn btn-sm" onClick={() => handleExport('print')}>Imprimir</button>
                                        </div>
                                    </div>
                                    <p className="cell-muted" style={{ marginBottom: 12, fontSize: "0.85rem" }}>
                                        Defina o valor mensal por escalão para a época selecionada.
                                    </p>
                                    <div className="table-wrap">
                                        <table className="dashboard-table">
                                            <thead><tr><th>Escalão</th><th>Valor Mensal (€)</th></tr></thead>
                                            <tbody>
                                                {escaloes.map((e) => (
                                                    <tr key={e.id}>
                                                        <td>{e.nome}</td>
                                                        <td>
                                                            <input type="number" min="0" step="0.01" className="input"
                                                                style={{ width: 120, padding: "4px 8px" }}
                                                                value={editMens[e.id] ?? ""}
                                                                onChange={(ev) => setEditMens((p) => ({ ...p, [e.id]: ev.target.value }))}
                                                                placeholder="0.00" />
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="actions" style={{ marginTop: 12 }}>
                                        <button type="button" className="btn btn-primary" disabled={savingMens} onClick={guardarTaxasMens}>
                                            {savingMens ? "A guardar..." : "Guardar mensalidades"}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TAB 1 — INSCRIÇÕES CONFIG */}
                        {tab === 1 && (
                            <div className="stack-sections">
                                <div className="card">
                                    <div className="modalidades-toolbar">
                                        <div className="toolbar-title-group"><h2>Valores de Inscrição por Escalão</h2></div>
                                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                            <label style={{ fontSize: "0.85rem" }}>Época:</label>
                                            <select className="input" style={{ width: "auto" }} value={epocaIns} onChange={(e) => setEpocaIns(e.target.value)}>
                                                {EPOCAS.map((ep) => <option key={ep} value={ep}>{ep}</option>)}
                                            </select>
                                            <button type="button" className="btn btn-sm" onClick={carregarTaxasIns}>Carregar</button>
                                        </div>
                                    </div>
                                    <p className="cell-muted" style={{ marginBottom: 12, fontSize: "0.85rem" }}>
                                        O valor de inscrição é cobrado uma única vez por atleta.
                                    </p>
                                    <div className="table-wrap">
                                        <table className="dashboard-table">
                                            <thead><tr><th>Escalão</th><th>Valor Inscrição (€)</th></tr></thead>
                                            <tbody>
                                                {escaloes.map((e) => (
                                                    <tr key={e.id}>
                                                        <td>{e.nome}</td>
                                                        <td>
                                                            <input type="number" min="0" step="0.01" className="input"
                                                                style={{ width: 120, padding: "4px 8px" }}
                                                                value={editIns[e.id] ?? ""}
                                                                onChange={(ev) => setEditIns((p) => ({ ...p, [e.id]: ev.target.value }))}
                                                                placeholder="0.00" />
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="actions" style={{ marginTop: 12 }}>
                                        <button type="button" className="btn btn-primary" disabled={savingIns} onClick={guardarTaxasIns}>
                                            {savingIns ? "A guardar..." : "Guardar taxas de inscrição"}
                                        </button>
                                    </div>
                                </div>

                                {/* Inscrições dos atletas */}
                                <div className="card">
                                    <div className="modalidades-toolbar">
                                        <div className="toolbar-title-group">
                                            <h2>Inscrições dos Atletas</h2>
                                            <span className="toolbar-count">{inscricoes.length}</span>
                                        </div>
                                        <div style={{ display: "flex", gap: 6 }}>
                                            <button type="button" className="btn btn-sm" onClick={() => handleExport('csv')}>CSV</button>
                                            <button type="button" className="btn btn-sm" onClick={() => handleExport('pdf')}>PDF</button>
                                            <button type="button" className="btn btn-sm" onClick={() => handleExport('print')}>Imprimir</button>
                                            <button type="button" className="btn" onClick={() => { setShowFormInsc((p) => !p); setEditInscId(null); }}>
                                                {showFormInsc ? "Fechar" : "Registar inscrição"}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Filtros */}
                                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
                                        <select className="input" style={{ width: "auto" }} value={filtroInsc.epoca} onChange={(e) => setFiltroInsc((p) => ({ ...p, epoca: e.target.value }))}>
                                            <option value="">Todas as épocas</option>
                                            {EPOCAS.map((ep) => <option key={ep} value={ep}>{ep}</option>)}
                                        </select>
                                        <select className="input" style={{ width: "auto" }} value={filtroInsc.estado} onChange={(e) => setFiltroInsc((p) => ({ ...p, estado: e.target.value }))}>
                                            <option value="">Todos os estados</option>
                                            {ESTADOS_INS.map((s) => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                        <select className="input" style={{ width: "auto" }} value={filtroInsc.atletaId} onChange={(e) => setFiltroInsc((p) => ({ ...p, atletaId: e.target.value }))}>
                                            <option value="">Todos os atletas</option>
                                            {atletas.map((a) => <option key={a.id} value={a.id}>{a.nome}</option>)}
                                        </select>
                                        <button type="button" className="btn btn-sm" onClick={carregarInscricoes}>Filtrar</button>
                                    </div>

                                    {showFormInsc && (
                                        <form onSubmit={submeterInscricao} className="row" style={{ marginBottom: 16 }}>
                                            <div className="row2">
                                                <div className="row">
                                                    <label className="field-label">Atleta *</label>
                                                    <select className="input" required value={formInsc.atletaId} onChange={(e) => setFormInsc((p) => ({ ...p, atletaId: e.target.value }))}>
                                                        <option value="">Selecionar</option>
                                                        {atletas.map((a) => <option key={a.id} value={a.id}>{a.nome}</option>)}
                                                    </select>
                                                </div>
                                                <div className="row">
                                                    <label className="field-label">Época *</label>
                                                    <select className="input" value={formInsc.epoca} onChange={(e) => setFormInsc((p) => ({ ...p, epoca: e.target.value }))}>
                                                        {EPOCAS.map((ep) => <option key={ep} value={ep}>{ep}</option>)}
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="row2">
                                                <div className="row">
                                                    <label className="field-label">Valor Inscrição (€)</label>
                                                    <input type="number" min="0" step="0.01" className="input" value={formInsc.valorInscricao} onChange={(e) => setFormInsc((p) => ({ ...p, valorInscricao: e.target.value }))} placeholder="0.00" />
                                                </div>
                                                <div className="row">
                                                    <label className="field-label">Estado</label>
                                                    <select className="input" value={formInsc.estado} onChange={(e) => setFormInsc((p) => ({ ...p, estado: e.target.value }))}>
                                                        {ESTADOS_INS.map((s) => <option key={s} value={s}>{s}</option>)}
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="row2">
                                                <div className="row">
                                                    <label className="field-label">Data Pagamento</label>
                                                    <input type="date" className="input" value={formInsc.dataPagamento} onChange={(e) => setFormInsc((p) => ({ ...p, dataPagamento: e.target.value }))} />
                                                </div>
                                                <div className="row">
                                                    <label className="field-label">{"M\u00e9todo"}</label>
                                                    <select className="input" value={formInsc.metodoPagamento} onChange={(e) => setFormInsc((p) => ({ ...p, metodoPagamento: e.target.value }))}>
                                                        <option value="">—</option>
                                                        {METODOS.map((m) => <option key={m} value={m}>{m}</option>)}
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="row">
                                                <label className="field-label">Observações</label>
                                                <textarea className="input" rows={2} value={formInsc.observacoes} onChange={(e) => setFormInsc((p) => ({ ...p, observacoes: e.target.value }))} />
                                            </div>
                                            <div className="actions" style={{ marginTop: 8 }}>
                                                <button type="submit" className="btn btn-primary" disabled={savingInsc}>{savingInsc ? "A guardar..." : "Guardar"}</button>
                                            </div>
                                        </form>
                                    )}

                                    <div className="table-wrap">
                                        <table className="dashboard-table">
                                            <thead><tr><th>Atleta</th><th>Época</th><th>Valor €</th><th>Estado</th><th>Data</th><th>{"M\u00e9todo"}</th><th>Ações</th></tr></thead>
                                            <tbody>
                                                {inscricoes.length === 0 ? (
                                                    <tr><td colSpan={7} className="cell-muted">Sem inscrições.</td></tr>
                                                ) : inscricoes.map((r) => (
                                                    <tr key={r.id}>
                                                        <td>{r.atletaNome}</td>
                                                        <td>{r.epoca}</td>
                                                        <td>{Number(r.valorInscricao).toFixed(2)}</td>
                                                        <td><EstadoBadge estado={r.estado} /></td>
                                                        <td className="cell-muted">{r.dataPagamento || "—"}</td>
                                                        <td className="cell-muted">{r.metodoPagamento || "—"}</td>
                                                        <td>
                                                            <button type="button" className="btn" onClick={() => { setEditInscId(r.id); setEditFormInsc({ valorInscricao: r.valorInscricao, estado: r.estado, dataPagamento: r.dataPagamento || "", metodoPagamento: r.metodoPagamento || "", observacoes: r.observacoes || "" }); }}>Editar</button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TAB 2 — PAGAMENTOS */}
                        {tab === 2 && (
                            <div className="stack-sections">
                                <div className="card">
                                    <div className="modalidades-toolbar">
                                        <div className="toolbar-title-group">
                                            <h2>Pagamentos de Mensalidades</h2>
                                            <span className="toolbar-count">{pagamentos.length}</span>
                                        </div>
                                        <div style={{ display: "flex", gap: 6 }}>
                                            <button type="button" className="btn btn-sm" onClick={() => handleExport('csv')}>CSV</button>
                                            <button type="button" className="btn btn-sm" onClick={() => handleExport('pdf')}>PDF</button>
                                            <button type="button" className="btn btn-sm" onClick={() => handleExport('print')}>Imprimir</button>
                                            <button type="button" className="btn" onClick={() => setShowFormPag((p) => !p)}>
                                                {showFormPag ? "Fechar" : "Registar pagamento"}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Filtros */}
                                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
                                        <select className="input" style={{ width: "auto" }} value={filtroPag.atletaId} onChange={(e) => setFiltroPag((p) => ({ ...p, atletaId: e.target.value }))}>
                                            <option value="">Todos atletas</option>
                                            {atletas.map((a) => <option key={a.id} value={a.id}>{a.nome}</option>)}
                                        </select>
                                        <select className="input" style={{ width: "auto" }} value={filtroPag.escalaoId} onChange={(e) => setFiltroPag((p) => ({ ...p, escalaoId: e.target.value }))}>
                                            <option value="">Todos escalões</option>
                                            {escaloes.map((e) => <option key={e.id} value={e.id}>{e.nome}</option>)}
                                        </select>
                                        <select className="input" style={{ width: "auto" }} value={filtroPag.mes} onChange={(e) => setFiltroPag((p) => ({ ...p, mes: e.target.value }))}>
                                            <option value="">Todos meses</option>
                                            {MESES.map((m) => <option key={m.v} value={m.v}>{m.l}</option>)}
                                        </select>
                                        <input type="number" className="input" style={{ width: 90 }} placeholder="Ano" value={filtroPag.ano} onChange={(e) => setFiltroPag((p) => ({ ...p, ano: e.target.value }))} />
                                        <select className="input" style={{ width: "auto" }} value={filtroPag.estado} onChange={(e) => setFiltroPag((p) => ({ ...p, estado: e.target.value }))}>
                                            <option value="">Todos estados</option>
                                            {ESTADOS_PAG.map((s) => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                        <button type="button" className="btn btn-sm" onClick={carregarPagamentos}>Filtrar</button>
                                    </div>

                                    {showFormPag && (
                                        <form onSubmit={submeterPagamento} className="row" style={{ marginBottom: 16 }}>
                                            <div className="row2">
                                                <div className="row">
                                                    <label className="field-label">Atleta *</label>
                                                    <select className="input" required value={formPag.atletaId} onChange={(e) => setFormPag((p) => ({ ...p, atletaId: e.target.value }))}>
                                                        <option value="">Selecionar</option>
                                                        {atletas.map((a) => <option key={a.id} value={a.id}>{a.nome}</option>)}
                                                    </select>
                                                </div>
                                                <div className="row">
                                                    <label className="field-label">Escalão</label>
                                                    <select className="input" value={formPag.escalaoId} onChange={(e) => setFormPag((p) => ({ ...p, escalaoId: e.target.value }))}>
                                                        <option value="">—</option>
                                                        {escaloes.map((e) => <option key={e.id} value={e.id}>{e.nome}</option>)}
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="row2">
                                                <div className="row">
                                                    <label className="field-label">Mês *</label>
                                                    <select className="input" value={formPag.mes} onChange={(e) => setFormPag((p) => ({ ...p, mes: e.target.value }))}>
                                                        {MESES.map((m) => <option key={m.v} value={m.v}>{m.l}</option>)}
                                                    </select>
                                                </div>
                                                <div className="row">
                                                    <label className="field-label">Ano *</label>
                                                    <input type="number" className="input" value={formPag.ano} onChange={(e) => setFormPag((p) => ({ ...p, ano: e.target.value }))} min={2020} />
                                                </div>
                                            </div>
                                            <div className="row2">
                                                <div className="row">
                                                    <label className="field-label">Valor Devido (€)</label>
                                                    <input type="number" min="0" step="0.01" className="input" value={formPag.valorDevido} onChange={(e) => setFormPag((p) => ({ ...p, valorDevido: e.target.value }))} placeholder="0.00" />
                                                </div>
                                                <div className="row">
                                                    <label className="field-label">Valor Pago (€)</label>
                                                    <input type="number" min="0" step="0.01" className="input" value={formPag.valorPago} onChange={(e) => setFormPag((p) => ({ ...p, valorPago: e.target.value }))} placeholder="0.00" />
                                                </div>
                                            </div>
                                            <div className="row2">
                                                <div className="row">
                                                    <label className="field-label">Estado</label>
                                                    <select className="input" value={formPag.estado} onChange={(e) => setFormPag((p) => ({ ...p, estado: e.target.value }))}>
                                                        {ESTADOS_PAG.map((s) => <option key={s} value={s}>{s}</option>)}
                                                    </select>
                                                </div>
                                                <div className="row">
                                                    <label className="field-label">{"M\u00e9todo"}</label>
                                                    <select className="input" value={formPag.metodoPagamento} onChange={(e) => setFormPag((p) => ({ ...p, metodoPagamento: e.target.value }))}>
                                                        <option value="">—</option>
                                                        {METODOS.map((m) => <option key={m} value={m}>{m}</option>)}
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="row2">
                                                <div className="row">
                                                    <label className="field-label">Data Pagamento</label>
                                                    <input type="date" className="input" value={formPag.dataPagamento} onChange={(e) => setFormPag((p) => ({ ...p, dataPagamento: e.target.value }))} />
                                                </div>
                                                <div className="row">
                                                    <label className="field-label">Observações</label>
                                                    <input type="text" className="input" value={formPag.observacoes} onChange={(e) => setFormPag((p) => ({ ...p, observacoes: e.target.value }))} />
                                                </div>
                                            </div>
                                            <div className="actions" style={{ marginTop: 8 }}>
                                                <button type="submit" className="btn btn-primary" disabled={savingPag}>{savingPag ? "A guardar..." : "Guardar"}</button>
                                            </div>
                                        </form>
                                    )}

                                    <div className="table-wrap">
                                        <table className="dashboard-table">
                                            <thead><tr><th>Atleta</th><th>Escalão</th><th>Mês/Ano</th><th>Devido €</th><th>Pago €</th><th>Dívida €</th><th>Estado</th><th>{"M\u00e9todo"}</th><th>Ações</th></tr></thead>
                                            <tbody>
                                                {pagamentos.length === 0 ? (
                                                    <tr><td colSpan={9} className="cell-muted">Sem pagamentos.</td></tr>
                                                ) : pagamentos.map((r) => (
                                                    <tr key={r.id}>
                                                        <td>{r.atletaNome}</td>
                                                        <td className="cell-muted">{r.escalaoNome || "—"}</td>
                                                        <td>{nomeMes(r.mes)} {r.ano}</td>
                                                        <td>{Number(r.valorDevido).toFixed(2)}</td>
                                                        <td>{Number(r.valorPago).toFixed(2)}</td>
                                                        <td style={{ color: r.valorDivida > 0 ? "#ef4444" : undefined }}>{Number(r.valorDivida).toFixed(2)}</td>
                                                        <td><EstadoBadge estado={r.estado} /></td>
                                                        <td className="cell-muted">{r.metodoPagamento || "—"}</td>
                                                        <td>
                                                            <button type="button" className="btn" onClick={() => { setEditPagId(r.id); setEditFormPag({ valorDevido: r.valorDevido, valorPago: r.valorPago, dataPagamento: r.dataPagamento || "", metodoPagamento: r.metodoPagamento || "", estado: r.estado, observacoes: r.observacoes || "" }); }}>Editar</button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TAB 3 — DÍVIDAS */}
                        {tab === 3 && (
                            <div className="stack-sections">
                                <div className="card">
                                    <div className="modalidades-toolbar">
                                        <div className="toolbar-title-group">
                                            <h2>Mensalidades em Dívida</h2>
                                            <span className="toolbar-count">{dividas.length}</span>
                                        </div>
                                        <div style={{ display: "flex", gap: 6 }}>
                                            <button type="button" className="btn btn-sm" onClick={() => handleExport('csv')}>CSV</button>
                                            <button type="button" className="btn btn-sm" onClick={() => handleExport('pdf')}>PDF</button>
                                            <button type="button" className="btn btn-sm" onClick={() => handleExport('print')}>Imprimir</button>
                                        </div>
                                    </div>
                                    {/* Filtros */}
                                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
                                        <select className="input" style={{ width: "auto" }} value={filtroDiv.escalaoId} onChange={(e) => setFiltroDiv((p) => ({ ...p, escalaoId: e.target.value }))}>
                                            <option value="">Todos escalões</option>
                                            {escaloes.map((e) => <option key={e.id} value={e.id}>{e.nome}</option>)}
                                        </select>
                                        <select className="input" style={{ width: "auto" }} value={filtroDiv.mes} onChange={(e) => setFiltroDiv((p) => ({ ...p, mes: e.target.value }))}>
                                            <option value="">Todos meses</option>
                                            {MESES.map((m) => <option key={m.v} value={m.v}>{m.l}</option>)}
                                        </select>
                                        <input type="number" className="input" style={{ width: 90 }} placeholder="Ano" value={filtroDiv.ano} onChange={(e) => setFiltroDiv((p) => ({ ...p, ano: e.target.value }))} />
                                        <select className="input" style={{ width: "auto" }} value={filtroDiv.atletaId} onChange={(e) => setFiltroDiv((p) => ({ ...p, atletaId: e.target.value }))}>
                                            <option value="">Todos atletas</option>
                                            {atletas.map((a) => <option key={a.id} value={a.id}>{a.nome}</option>)}
                                        </select>
                                        <button type="button" className="btn btn-sm" onClick={carregarDividas}>Filtrar</button>
                                    </div>
                                    {dividas.length > 0 && (
                                        <div style={{ marginBottom: 10, padding: "8px 12px", background: "#ef444415", border: "1px solid #ef4444", borderRadius: 8, fontSize: "0.9rem", color: "#b91c1c" }}>
                                            <strong>Total em dívida:</strong> {dividas.reduce((s, r) => s + Number(r.valorDivida), 0).toFixed(2)} €
                                        </div>
                                    )}
                                    <div className="table-wrap">
                                        <table className="dashboard-table">
                                            <thead><tr><th>Atleta</th><th>Escalão</th><th>Mês/Ano</th><th>Devido €</th><th>Pago €</th><th>Dívida €</th><th>Estado</th></tr></thead>
                                            <tbody>
                                                {dividas.length === 0 ? (
                                                    <tr><td colSpan={7} className="cell-muted">Sem dívidas.</td></tr>
                                                ) : dividas.map((r) => (
                                                    <tr key={r.id}>
                                                        <td>{r.atletaNome}</td>
                                                        <td className="cell-muted">{r.escalaoNome || "—"}</td>
                                                        <td>{nomeMes(r.mes)} {r.ano}</td>
                                                        <td>{Number(r.valorDevido).toFixed(2)}</td>
                                                        <td>{Number(r.valorPago).toFixed(2)}</td>
                                                        <td style={{ color: "#ef4444", fontWeight: 600 }}>{Number(r.valorDivida).toFixed(2)}</td>
                                                        <td><EstadoBadge estado={r.estado} /></td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TAB 4 — RECEBIMENTOS */}
                        {tab === 4 && (
                            <div className="stack-sections">
                                <div className="card">
                                    <div className="modalidades-toolbar">
                                        <div className="toolbar-title-group"><h2>Recebimentos por Escalão</h2></div>
                                        <div style={{ display: "flex", gap: 6 }}>
                                            <button type="button" className="btn btn-sm" onClick={() => handleExport('csv')}>CSV</button>
                                            <button type="button" className="btn btn-sm" onClick={() => handleExport('pdf')}>PDF</button>
                                            <button type="button" className="btn btn-sm" onClick={() => handleExport('print')}>Imprimir</button>
                                        </div>
                                    </div>
                                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
                                        <select className="input" style={{ width: "auto" }} value={filtroRec.mes} onChange={(e) => setFiltroRec((p) => ({ ...p, mes: e.target.value }))}>
                                            <option value="">Todos os meses</option>
                                            {MESES.map((m) => <option key={m.v} value={m.v}>{m.l}</option>)}
                                        </select>
                                        <input type="number" className="input" style={{ width: 90 }} placeholder="Ano" value={filtroRec.ano} onChange={(e) => setFiltroRec((p) => ({ ...p, ano: e.target.value }))} />
                                        <button type="button" className="btn btn-sm" onClick={carregarRecebimentos}>Filtrar</button>
                                    </div>
                                    {recebimentos.length > 0 && (
                                        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
                                            {[
                                                { label: "Total Previsto", val: recebimentos.reduce((s, r) => s + r.totalPrevisto, 0).toFixed(2) + " €", color: "#6366f1" },
                                                { label: "Total Recebido", val: recebimentos.reduce((s, r) => s + r.totalRecebido, 0).toFixed(2) + " €", color: "#22c55e" },
                                                { label: "Total em Dívida", val: recebimentos.reduce((s, r) => s + r.totalDivida, 0).toFixed(2) + " €", color: "#ef4444" },
                                            ].map(({ label, val, color }) => (
                                                <div key={label} style={{ padding: "8px 16px", borderRadius: 8, background: color + "15", border: `1px solid ${color}`, minWidth: 140 }}>
                                                    <div style={{ fontSize: "0.75rem", color, fontWeight: 600 }}>{label}</div>
                                                    <div style={{ fontSize: "1.1rem", fontWeight: 700, color }}>{val}</div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    <div className="table-wrap">
                                        <table className="dashboard-table">
                                            <thead><tr><th>Escalão</th><th>Atletas</th><th>Previsto €</th><th>Recebido €</th><th>Dívida €</th><th>Cobrança %</th></tr></thead>
                                            <tbody>
                                                {recebimentos.length === 0 ? (
                                                    <tr><td colSpan={6} className="cell-muted">Sem dados.</td></tr>
                                                ) : recebimentos.map((r) => (
                                                    <tr key={r.escalaoId}>
                                                        <td>{r.escalaoNome}</td>
                                                        <td>{r.numAtletas}</td>
                                                        <td>{Number(r.totalPrevisto).toFixed(2)}</td>
                                                        <td style={{ color: "#22c55e", fontWeight: 600 }}>{Number(r.totalRecebido).toFixed(2)}</td>
                                                        <td style={{ color: r.totalDivida > 0 ? "#ef4444" : undefined }}>{Number(r.totalDivida).toFixed(2)}</td>
                                                        <td>
                                                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                                                <div style={{ flex: 1, height: 6, borderRadius: 3, background: "#88888830" }}>
                                                                    <div style={{ width: `${Math.min(r.percentagemCobranca, 100)}%`, height: "100%", borderRadius: 3, background: r.percentagemCobranca >= 80 ? "#22c55e" : r.percentagemCobranca >= 50 ? "#f59e0b" : "#ef4444" }} />
                                                                </div>
                                                                <span style={{ fontSize: "0.8rem", fontWeight: 600 }}>{r.percentagemCobranca}%</span>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TAB 5 — AVISOS */}
                        {tab === 5 && (
                            <div className="stack-sections">
                                <div className="card">
                                    <div className="modalidades-toolbar">
                                        <div className="toolbar-title-group"><h2>Avisos de Pagamento</h2></div>
                                        <div style={{ display: "flex", gap: 6 }}>
                                            <button type="button" className="btn btn-sm" onClick={() => handleExport('csv')}>CSV</button>
                                            <button type="button" className="btn btn-sm" onClick={() => handleExport('pdf')}>PDF</button>
                                            <button type="button" className="btn btn-sm" onClick={() => handleExport('print')}>Imprimir</button>
                                        </div>
                                    </div>
                                    <p className="cell-muted" style={{ marginBottom: 16, fontSize: "0.85rem" }}>
                                        Envie um aviso de pagamento por email aos atletas com mensalidades em dívida.
                                    </p>
                                    <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
                                        <div className="row" style={{ minWidth: 160 }}>
                                            <label className="field-label">Mês</label>
                                            <select className="input" value={avisoMes} onChange={(e) => setAvisoMes(e.target.value)}>
                                                {MESES.map((m) => <option key={m.v} value={m.v}>{m.l}</option>)}
                                            </select>
                                        </div>
                                        <div className="row" style={{ minWidth: 100 }}>
                                            <label className="field-label">Ano</label>
                                            <input type="number" className="input" value={avisoAno} onChange={(e) => setAvisoAno(e.target.value)} min={2020} />
                                        </div>
                                        <div className="row" style={{ minWidth: 160 }}>
                                            <label className="field-label">Valor em dívida (€)</label>
                                            <input type="number" min="0" step="0.01" className="input" value={avisoValor} onChange={(e) => setAvisoValor(e.target.value)} placeholder="ex: 30.00" />
                                        </div>
                                    </div>

                                    <h3 style={{ marginBottom: 8, fontSize: "0.95rem" }}>Atletas com dívidas</h3>
                                    {avisoAtletas.length === 0 ? (
                                        <p className="cell-muted">Sem atletas com dívidas.</p>
                                    ) : (
                                        <>
                                            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                                                <button type="button" className="btn btn-sm" onClick={() => setAvisoSelecionados(avisoAtletas.map((a) => a.atletaId))}>Selecionar todos</button>
                                                <button type="button" className="btn btn-sm" onClick={() => setAvisoSelecionados([])}>Limpar seleção</button>
                                            </div>
                                            <div style={{ maxHeight: 280, overflowY: "auto", border: "1px solid var(--color-border, #e5e7eb)", borderRadius: 8 }}>
                                                {avisoAtletas.map((a) => (
                                                    <label key={a.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", cursor: "pointer", borderBottom: "1px solid var(--color-border, #e5e7eb15)" }}>
                                                        <input type="checkbox"
                                                            checked={avisoSelecionados.includes(a.atletaId)}
                                                            onChange={(e) => {
                                                                if (e.target.checked) setAvisoSelecionados((p) => [...p, a.atletaId]);
                                                                else setAvisoSelecionados((p) => p.filter((x) => x !== a.atletaId));
                                                            }} />
                                                        <span style={{ flex: 1 }}>{a.atletaNome}</span>
                                                        <span className="cell-muted" style={{ fontSize: "0.8rem" }}>{nomeMes(a.mes)} {a.ano}</span>
                                                        <span style={{ color: "#ef4444", fontWeight: 600, fontSize: "0.85rem" }}>{Number(a.valorDivida).toFixed(2)} €</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </>
                                    )}

                                    <div className="actions" style={{ marginTop: 16 }}>
                                        <button type="button" className="btn btn-primary" disabled={enviandoAviso || avisoSelecionados.length === 0} onClick={submeterAvisos}>
                                            {enviandoAviso ? "A enviar..." : `Enviar aviso de pagamento (${avisoSelecionados.length} atleta(s))`}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                        {/* TAB 6 — SEGUROS */}
                        {tab === 6 && (
                            <div className="stack-sections">
                                {/* Configuração de valores por escalão */}
                                <div className="card">
                                    <div className="modalidades-toolbar">
                                        <div className="toolbar-title-group"><h2>Valores de Seguro por Escalão</h2></div>
                                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                            <label style={{ fontSize: "0.85rem" }}>Época:</label>
                                            <select className="input" style={{ width: "auto" }} value={epocaSeg} onChange={(e) => setEpocaSeg(e.target.value)}>
                                                {EPOCAS.map((ep) => <option key={ep} value={ep}>{ep}</option>)}
                                            </select>
                                            <button type="button" className="btn btn-sm" onClick={carregarTaxasSeg}>Carregar</button>
                                        </div>
                                    </div>
                                    <p className="cell-muted" style={{ marginBottom: 12, fontSize: "0.85rem" }}>
                                        O seguro é pago uma única vez por atleta por época. Defina o valor por escalão.
                                    </p>
                                    <div className="table-wrap">
                                        <table className="dashboard-table">
                                            <thead><tr><th>Escalão</th><th>Valor Seguro (€)</th></tr></thead>
                                            <tbody>
                                                {escaloes.map((e) => (
                                                    <tr key={e.id}>
                                                        <td>{e.nome}</td>
                                                        <td>
                                                            <input type="number" min="0" step="0.01" className="input"
                                                                style={{ width: 120, padding: "4px 8px" }}
                                                                value={editSeg[e.id] ?? ""}
                                                                onChange={(ev) => setEditSeg((p) => ({ ...p, [e.id]: ev.target.value }))}
                                                                placeholder="0.00" />
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="actions" style={{ marginTop: 12 }}>
                                        <button type="button" className="btn btn-primary" disabled={savingSeg} onClick={guardarTaxasSeg}>
                                            {savingSeg ? "A guardar..." : "Guardar valores de seguro"}
                                        </button>
                                    </div>
                                </div>

                                {/* Registos de seguro por atleta */}
                                <div className="card">
                                    <div className="modalidades-toolbar">
                                        <div className="toolbar-title-group">
                                            <h2>Seguros dos Atletas</h2>
                                            <span className="toolbar-count">{seguros.length}</span>
                                        </div>
                                        <div style={{ display: "flex", gap: 6 }}>
                                            <button type="button" className="btn btn-sm" onClick={() => handleExport('csv')}>CSV</button>
                                            <button type="button" className="btn btn-sm" onClick={() => handleExport('pdf')}>PDF</button>
                                            <button type="button" className="btn btn-sm" onClick={() => handleExport('print')}>Imprimir</button>
                                            <button type="button" className="btn" onClick={() => { setShowFormSeg((p) => !p); setEditSegId(null); }}>
                                                {showFormSeg ? "Fechar" : "Registar seguro"}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Filtros */}
                                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
                                        <select className="input" style={{ width: "auto" }} value={filtroSeg.epoca} onChange={(e) => setFiltroSeg((p) => ({ ...p, epoca: e.target.value }))}>
                                            <option value="">Todas as épocas</option>
                                            {EPOCAS.map((ep) => <option key={ep} value={ep}>{ep}</option>)}
                                        </select>
                                        <select className="input" style={{ width: "auto" }} value={filtroSeg.escalaoId} onChange={(e) => setFiltroSeg((p) => ({ ...p, escalaoId: e.target.value }))}>
                                            <option value="">Todos os escalões</option>
                                            {escaloes.map((e) => <option key={e.id} value={e.id}>{e.nome}</option>)}
                                        </select>
                                        <select className="input" style={{ width: "auto" }} value={filtroSeg.estado} onChange={(e) => setFiltroSeg((p) => ({ ...p, estado: e.target.value }))}>
                                            <option value="">Todos os estados</option>
                                            {ESTADOS_INS.map((s) => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                        <select className="input" style={{ width: "auto" }} value={filtroSeg.atletaId} onChange={(e) => setFiltroSeg((p) => ({ ...p, atletaId: e.target.value }))}>
                                            <option value="">Todos os atletas</option>
                                            {atletas.map((a) => <option key={a.id} value={a.id}>{a.nome}</option>)}
                                        </select>
                                        <button type="button" className="btn btn-sm" onClick={carregarSeguros}>Filtrar</button>
                                    </div>

                                    {/* Formulário de registo */}
                                    {showFormSeg && (
                                        <form onSubmit={submeterSeguro} className="row" style={{ marginBottom: 16 }}>
                                            <div className="row2">
                                                <div className="row">
                                                    <label className="field-label">Atleta *</label>
                                                    <select className="input" required value={formSeg.atletaId} onChange={(e) => setFormSeg((p) => ({ ...p, atletaId: e.target.value }))}>
                                                        <option value="">Selecionar</option>
                                                        {atletas.map((a) => <option key={a.id} value={a.id}>{a.nome}</option>)}
                                                    </select>
                                                </div>
                                                <div className="row">
                                                    <label className="field-label">Escalão</label>
                                                    <select className="input" value={formSeg.escalaoId} onChange={(e) => setFormSeg((p) => ({ ...p, escalaoId: e.target.value }))}>
                                                        <option value="">—</option>
                                                        {escaloes.map((e) => <option key={e.id} value={e.id}>{e.nome}</option>)}
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="row2">
                                                <div className="row">
                                                    <label className="field-label">Época *</label>
                                                    <select className="input" value={formSeg.epoca} onChange={(e) => setFormSeg((p) => ({ ...p, epoca: e.target.value }))}>
                                                        {EPOCAS.map((ep) => <option key={ep} value={ep}>{ep}</option>)}
                                                    </select>
                                                </div>
                                                <div className="row">
                                                    <label className="field-label">Estado</label>
                                                    <select className="input" value={formSeg.estado} onChange={(e) => setFormSeg((p) => ({ ...p, estado: e.target.value }))}>
                                                        {ESTADOS_INS.map((s) => <option key={s} value={s}>{s}</option>)}
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="row2">
                                                <div className="row">
                                                    <label className="field-label">Valor Devido (€)</label>
                                                    <input type="number" min="0" step="0.01" className="input" value={formSeg.valorDevido} onChange={(e) => setFormSeg((p) => ({ ...p, valorDevido: e.target.value }))} placeholder="0.00" />
                                                </div>
                                                <div className="row">
                                                    <label className="field-label">Valor Pago (€)</label>
                                                    <input type="number" min="0" step="0.01" className="input" value={formSeg.valorPago} onChange={(e) => setFormSeg((p) => ({ ...p, valorPago: e.target.value }))} placeholder="0.00" />
                                                </div>
                                            </div>
                                            <div className="row2">
                                                <div className="row">
                                                    <label className="field-label">Data de Pagamento</label>
                                                    <input type="date" className="input" value={formSeg.dataPagamento} onChange={(e) => setFormSeg((p) => ({ ...p, dataPagamento: e.target.value }))} />
                                                </div>
                                                <div className="row">
                                                    <label className="field-label">{"M\u00e9todo"}</label>
                                                    <select className="input" value={formSeg.metodoPagamento} onChange={(e) => setFormSeg((p) => ({ ...p, metodoPagamento: e.target.value }))}>
                                                        <option value="">—</option>
                                                        {METODOS.map((m) => <option key={m} value={m}>{m}</option>)}
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="row">
                                                <label className="field-label">Observações</label>
                                                <textarea className="input" rows={2} value={formSeg.observacoes} onChange={(e) => setFormSeg((p) => ({ ...p, observacoes: e.target.value }))} />
                                            </div>
                                            <div className="actions" style={{ marginTop: 8 }}>
                                                <button type="submit" className="btn btn-primary" disabled={savingSegForm}>{savingSegForm ? "A guardar..." : "Guardar"}</button>
                                            </div>
                                        </form>
                                    )}

                                    {/* Estatísticas rápidas */}
                                    {seguros.length > 0 && (
                                        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
                                            {[
                                                { label: "Pagos", val: seguros.filter((s) => s.estado === "Pago").length, color: "#22c55e" },
                                                { label: "Em dívida", val: seguros.filter((s) => s.estado === "Em dívida").length, color: "#ef4444" },
                                                { label: "Isentos", val: seguros.filter((s) => s.estado === "Isento").length, color: "#6366f1" },
                                                { label: "Total recebido", val: seguros.reduce((s, r) => s + Number(r.valorPago), 0).toFixed(2) + " €", color: "#22c55e" },
                                                { label: "Total em dívida", val: seguros.reduce((s, r) => s + Number(r.valorDivida), 0).toFixed(2) + " €", color: "#ef4444" },
                                            ].map(({ label, val, color }) => (
                                                <div key={label} style={{ padding: "8px 16px", borderRadius: 8, background: color + "15", border: `1px solid ${color}`, minWidth: 120 }}>
                                                    <div style={{ fontSize: "0.75rem", color, fontWeight: 600 }}>{label}</div>
                                                    <div style={{ fontSize: "1.1rem", fontWeight: 700, color }}>{val}</div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Tabela */}
                                    <div className="table-wrap">
                                        <table className="dashboard-table">
                                            <thead>
                                                <tr>
                                                    <th>Atleta</th>
                                                    <th>Escalão</th>
                                                    <th>Época</th>
                                                    <th>Devido €</th>
                                                    <th>Pago €</th>
                                                    <th>Dívida €</th>
                                                    <th>Estado</th>
                                                    <th>Data</th>
                                                    <th>{"M\u00e9todo"}</th>
                                                    <th>Ações</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {seguros.length === 0 ? (
                                                    <tr><td colSpan={10} className="cell-muted">Sem seguros registados.</td></tr>
                                                ) : seguros.map((r) => (
                                                    <tr key={r.id}>
                                                        <td>{r.atletaNome}</td>
                                                        <td className="cell-muted">{r.escalaoNome || "—"}</td>
                                                        <td>{r.epoca}</td>
                                                        <td>{Number(r.valorDevido).toFixed(2)}</td>
                                                        <td>{Number(r.valorPago).toFixed(2)}</td>
                                                        <td style={{ color: r.valorDivida > 0 ? "#ef4444" : undefined }}>{Number(r.valorDivida).toFixed(2)}</td>
                                                        <td><EstadoBadge estado={r.estado} /></td>
                                                        <td className="cell-muted">{r.dataPagamento || "—"}</td>
                                                        <td className="cell-muted">{r.metodoPagamento || "—"}</td>
                                                        <td>
                                                            <button type="button" className="btn" onClick={() => {
                                                                setEditSegId(r.id);
                                                                setEditFormSeg({ valorDevido: r.valorDevido, valorPago: r.valorPago, estado: r.estado, dataPagamento: r.dataPagamento || "", metodoPagamento: r.metodoPagamento || "", observacoes: r.observacoes || "" });
                                                            }}>Editar</button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* MODAL EDITAR PAGAMENTO */}
            {editPagId && (
                <div className="modal-overlay" onClick={() => setEditPagId(null)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Editar Pagamento</h2>
                            <button type="button" className="btn-close" onClick={() => setEditPagId(null)}>✕</button>
                        </div>
                        <div className="modal-body">
                            <div className="row2">
                                <div className="row">
                                    <label className="field-label">Valor Devido €</label>
                                    <input type="number" min="0" step="0.01" className="input" value={editFormPag.valorDevido} onChange={(e) => setEditFormPag((p) => ({ ...p, valorDevido: e.target.value }))} />
                                </div>
                                <div className="row">
                                    <label className="field-label">Valor Pago €</label>
                                    <input type="number" min="0" step="0.01" className="input" value={editFormPag.valorPago} onChange={(e) => setEditFormPag((p) => ({ ...p, valorPago: e.target.value }))} />
                                </div>
                            </div>
                            <div className="row2">
                                <div className="row">
                                    <label className="field-label">Estado</label>
                                    <select className="input" value={editFormPag.estado} onChange={(e) => setEditFormPag((p) => ({ ...p, estado: e.target.value }))}>
                                        {ESTADOS_PAG.map((s) => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                                <div className="row">
                                    <label className="field-label">{"M\u00e9todo"}</label>
                                    <select className="input" value={editFormPag.metodoPagamento} onChange={(e) => setEditFormPag((p) => ({ ...p, metodoPagamento: e.target.value }))}>
                                        <option value="">—</option>
                                        {METODOS.map((m) => <option key={m} value={m}>{m}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="row">
                                <label className="field-label">Data Pagamento</label>
                                <input type="date" className="input" value={editFormPag.dataPagamento} onChange={(e) => setEditFormPag((p) => ({ ...p, dataPagamento: e.target.value }))} />
                            </div>
                            <div className="row">
                                <label className="field-label">Observações</label>
                                <textarea className="input" rows={2} value={editFormPag.observacoes} onChange={(e) => setEditFormPag((p) => ({ ...p, observacoes: e.target.value }))} />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn" onClick={() => setEditPagId(null)}>Cancelar</button>
                            <button type="button" className="btn btn-primary" onClick={guardarEditPagamento}>Guardar</button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL EDITAR INSCRIÇÃO */}
            {editInscId && (
                <div className="modal-overlay" onClick={() => setEditInscId(null)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Editar Inscrição</h2>
                            <button type="button" className="btn-close" onClick={() => setEditInscId(null)}>✕</button>
                        </div>
                        <div className="modal-body">
                            <div className="row2">
                                <div className="row">
                                    <label className="field-label">Valor Inscrição €</label>
                                    <input type="number" min="0" step="0.01" className="input" value={editFormInsc.valorInscricao} onChange={(e) => setEditFormInsc((p) => ({ ...p, valorInscricao: e.target.value }))} />
                                </div>
                                <div className="row">
                                    <label className="field-label">Estado</label>
                                    <select className="input" value={editFormInsc.estado} onChange={(e) => setEditFormInsc((p) => ({ ...p, estado: e.target.value }))}>
                                        {ESTADOS_INS.map((s) => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="row2">
                                <div className="row">
                                    <label className="field-label">Data Pagamento</label>
                                    <input type="date" className="input" value={editFormInsc.dataPagamento} onChange={(e) => setEditFormInsc((p) => ({ ...p, dataPagamento: e.target.value }))} />
                                </div>
                                <div className="row">
                                    <label className="field-label">{"M\u00e9todo"}</label>
                                    <select className="input" value={editFormInsc.metodoPagamento} onChange={(e) => setEditFormInsc((p) => ({ ...p, metodoPagamento: e.target.value }))}>
                                        <option value="">—</option>
                                        {METODOS.map((m) => <option key={m} value={m}>{m}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="row">
                                <label className="field-label">Observações</label>
                                <textarea className="input" rows={2} value={editFormInsc.observacoes} onChange={(e) => setEditFormInsc((p) => ({ ...p, observacoes: e.target.value }))} />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn" onClick={() => setEditInscId(null)}>Cancelar</button>
                            <button type="button" className="btn btn-primary" onClick={guardarEditInscricao}>Guardar</button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL EDITAR SEGURO */}
            {editSegId && (
                <div className="modal-overlay" onClick={() => setEditSegId(null)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Editar Seguro</h2>
                            <button type="button" className="btn-close" onClick={() => setEditSegId(null)}>✕</button>
                        </div>
                        <div className="modal-body">
                            <div className="row2">
                                <div className="row">
                                    <label className="field-label">Valor Devido €</label>
                                    <input type="number" min="0" step="0.01" className="input" value={editFormSeg.valorDevido} onChange={(e) => setEditFormSeg((p) => ({ ...p, valorDevido: e.target.value }))} />
                                </div>
                                <div className="row">
                                    <label className="field-label">Valor Pago €</label>
                                    <input type="number" min="0" step="0.01" className="input" value={editFormSeg.valorPago} onChange={(e) => setEditFormSeg((p) => ({ ...p, valorPago: e.target.value }))} />
                                </div>
                            </div>
                            <div className="row2">
                                <div className="row">
                                    <label className="field-label">Estado</label>
                                    <select className="input" value={editFormSeg.estado} onChange={(e) => setEditFormSeg((p) => ({ ...p, estado: e.target.value }))}>
                                        {ESTADOS_INS.map((s) => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                                <div className="row">
                                    <label className="field-label">{"M\u00e9todo"}</label>
                                    <select className="input" value={editFormSeg.metodoPagamento} onChange={(e) => setEditFormSeg((p) => ({ ...p, metodoPagamento: e.target.value }))}>
                                        <option value="">—</option>
                                        {METODOS.map((m) => <option key={m} value={m}>{m}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="row">
                                <label className="field-label">Data de Pagamento</label>
                                <input type="date" className="input" value={editFormSeg.dataPagamento} onChange={(e) => setEditFormSeg((p) => ({ ...p, dataPagamento: e.target.value }))} />
                            </div>
                            <div className="row">
                                <label className="field-label">Observações</label>
                                <textarea className="input" rows={2} value={editFormSeg.observacoes} onChange={(e) => setEditFormSeg((p) => ({ ...p, observacoes: e.target.value }))} />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn" onClick={() => setEditSegId(null)}>Cancelar</button>
                            <button type="button" className="btn btn-primary" onClick={guardarEditSeguro}>Guardar</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}