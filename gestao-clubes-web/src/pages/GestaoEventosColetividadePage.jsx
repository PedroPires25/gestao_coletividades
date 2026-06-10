import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import SideMenu from "../components/SideMenu";
import { useAuth } from "../auth/AuthContext";
import { getColetividadeById } from "../api";
import { getAtividadesByColetividade } from "../services/coletividadeAtividades";
import {
    atualizarEventoColetividade,
    cancelarInscricaoEvento,
    criarEventoColetividade,
    eliminarEventoColetividade,
    getEventosColetividade,
    getInscricoesEvento,
    inscreverEmEvento,
} from "../services/eventosColetividade";
import eventosIcon from "../assets/eventos.svg";

const ESTADOS_EVENTO = ["Aberto", "Fechado", "Cancelado", "Concluído"];
const FORM_INICIAL = {
    titulo: "",
    descricao: "",
    dataEvento: new Date().toISOString().slice(0, 10),
    horaInicio: "",
    horaFim: "",
    localEvento: "",
    responsavel: "",
    coletividadeAtividadeId: "",
    maxParticipantes: "",
    permiteInscricao: false,
    estado: "Aberto",
};

function formatDateOnly(value) {
    if (!value) return "-";
    const raw = String(value).trim();
    const date = raw.includes("T") ? raw.split("T")[0] : raw.slice(0, 10);
    const [year, month, day] = date.split("-");
    return year && month && day ? `${day}/${month}/${year}` : date;
}

function formatHoraIntervalo(evento) {
    const inicio = evento.horaInicio ? String(evento.horaInicio).slice(0, 5) : "";
    const fim = evento.horaFim ? String(evento.horaFim).slice(0, 5) : "";
    if (inicio && fim) return `${inicio} - ${fim}`;
    return inicio || fim || "-";
}

function badgeEstado(estado) {
    const cores = {
        Aberto: { bg: "#22c55e20", color: "#15803d", border: "#22c55e" },
        Fechado: { bg: "#94a3b820", color: "#cbd5e1", border: "#94a3b8" },
        Cancelado: { bg: "#ef444420", color: "#fca5a5", border: "#ef4444" },
        "Concluído": { bg: "#3b82f620", color: "#93c5fd", border: "#3b82f6" },
        Confirmado: { bg: "#22c55e20", color: "#86efac", border: "#22c55e" },
        "Lista de espera": { bg: "#f59e0b20", color: "#fcd34d", border: "#f59e0b" },
    };
    const c = cores[estado] || { bg: "#88888820", color: "#ffffff", border: "#888888" };
    return (
        <span
            style={{
                padding: "4px 10px",
                borderRadius: 999,
                fontSize: "0.78rem",
                fontWeight: 700,
                background: c.bg,
                color: c.color,
                border: `1px solid ${c.border}`,
            }}
        >
            {estado}
        </span>
    );
}

function menuItemsBase({ coletividadeId, isAdmin, isSuperAdmin, logout, navigate }) {
    return [
        { label: "Home", to: "/menu" },
        ...(isSuperAdmin ? [{ label: "Clubes", to: "/clubes" }] : []),
        ...(isSuperAdmin ? [{ label: "Coletividades", to: "/coletividades" }] : []),
        ...(isAdmin ? [{ label: "Perfis", to: "/admin/users" }] : []),
        { label: "Atividades", to: `/coletividades/${coletividadeId}/atividades` },
        { label: "Inscritos", to: `/coletividades/${coletividadeId}/utentes` },
        { label: "Staff", to: `/coletividades/${coletividadeId}/staff` },
        { label: "Eventos", to: `/coletividades/${coletividadeId}/eventos` },
        {
            label: "Logout",
            onClick: () => {
                logout();
                navigate("/login", { replace: true });
            },
        },
    ];
}

function payloadFrom(source) {
    return {
        titulo: source.titulo.trim(),
        descricao: source.descricao.trim() || null,
        dataEvento: source.dataEvento,
        horaInicio: source.horaInicio || null,
        horaFim: source.horaFim || null,
        localEvento: source.localEvento.trim() || null,
        responsavel: source.responsavel.trim() || null,
        coletividadeAtividadeId: source.coletividadeAtividadeId ? Number(source.coletividadeAtividadeId) : null,
        maxParticipantes: source.maxParticipantes !== "" ? Number(source.maxParticipantes) : null,
        permiteInscricao: Boolean(source.permiteInscricao),
        estado: source.estado,
    };
}

export default function GestaoEventosColetividadePage() {
    const { id: coletividadeId } = useParams();
    const navigate = useNavigate();
    const {
        logout,
        isAdmin,
        isSuperAdmin,
        isSecretario,
        isProfessorOuTreinadorColetividade,
        coletividadeId: authColetividadeId,
        atividadeId: authAtividadeId,
        canManageColetividade,
        nome,
    } = useAuth();

    const podeGerir =
        canManageColetividade(Number(coletividadeId)) ||
        (isSecretario && Number(authColetividadeId) === Number(coletividadeId)) ||
        isProfessorOuTreinadorColetividade;

    // Professor/Treinador only manages events for their own activity
    function podeManejarEvento(evento) {
        if (!podeGerir) return false;
        if (isProfessorOuTreinadorColetividade) {
            return String(evento.coletividadeAtividadeId) === String(authAtividadeId);
        }
        return true;
    }

    const [coletividade, setColetividade] = useState(null);
    const [atividades, setAtividades] = useState([]);
    const [eventos, setEventos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [erro, setErro] = useState("");
    const [msg, setMsg] = useState("");
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState(() => ({
        ...FORM_INICIAL,
        coletividadeAtividadeId: isProfessorOuTreinadorColetividade && authAtividadeId ? String(authAtividadeId) : "",
    }));
    const [editOpen, setEditOpen] = useState(false);
    const [editForm, setEditForm] = useState(FORM_INICIAL);
    const [filtros, setFiltros] = useState({
        estado: "",
        coletividadeAtividadeId: isProfessorOuTreinadorColetividade && authAtividadeId ? String(authAtividadeId) : "",
    });
    const [expanded, setExpanded] = useState({});
    const [inscricoesMap, setInscricoesMap] = useState({});
    const [loadingInscricoes, setLoadingInscricoes] = useState({});
    const [inscricaoForms, setInscricaoForms] = useState({});

    const menuItems = useMemo(
        () => menuItemsBase({ coletividadeId, isAdmin, isSuperAdmin, logout, navigate }),
        [coletividadeId, isAdmin, isSuperAdmin, logout, navigate]
    );

    const carregarEventos = useCallback(async () => {
        setLoading(true);
        setErro("");
        try {
            const data = await getEventosColetividade(coletividadeId, {
                estado: filtros.estado || undefined,
                coletividadeAtividadeId: filtros.coletividadeAtividadeId || undefined,
            });
            setEventos(Array.isArray(data) ? data : []);
        } catch (e) {
            setErro(e.message || "Não foi possível carregar os eventos.");
        } finally {
            setLoading(false);
        }
    }, [coletividadeId, filtros.coletividadeAtividadeId, filtros.estado]);

    useEffect(() => {
        let active = true;
        (async () => {
            try {
                const [coletividadeData, atividadesData] = await Promise.all([
                    getColetividadeById(coletividadeId),
                    getAtividadesByColetividade(coletividadeId, { apenasAtivas: false }),
                ]);
                if (active) {
                    setColetividade(coletividadeData || null);
                    setAtividades(Array.isArray(atividadesData) ? atividadesData : []);
                }
            } catch (e) {
                if (active) setErro(e.message || "Não foi possível carregar a coletividade.");
            }
        })();
        return () => { active = false; };
    }, [coletividadeId]);

    useEffect(() => {
        let active = true;
        (async () => {
            try {
                const data = await getEventosColetividade(coletividadeId, {
                    estado: filtros.estado || undefined,
                    coletividadeAtividadeId: filtros.coletividadeAtividadeId || undefined,
                });
                if (active) {
                    setErro("");
                    setEventos(Array.isArray(data) ? data : []);
                    setLoading(false);
                }
            } catch (e) {
                if (active) {
                    setErro(e.message || "Não foi possível carregar os eventos.");
                    setLoading(false);
                }
            }
        })();
        return () => { active = false; };
    }, [coletividadeId, filtros.coletividadeAtividadeId, filtros.estado]);

    const eventosComInscricao = useMemo(
        () => eventos.filter((evento) => evento.permiteInscricao),
        [eventos]
    );

    function onFormChange(e) {
        const { name, value, type, checked } = e.target;
        setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
    }

    function onEditChange(e) {
        const { name, value, type, checked } = e.target;
        setEditForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
    }

    function onFiltroChange(e) {
        const { name, value } = e.target;
        setFiltros((prev) => ({ ...prev, [name]: value }));
    }

    async function submeterCriacao(e) {
        e.preventDefault();
        if (!form.titulo.trim() || !form.dataEvento) {
            setErro("Preenche o título e a data do evento.");
            return;
        }
        setSaving(true);
        setErro("");
        setMsg("");
        try {
            await criarEventoColetividade(coletividadeId, payloadFrom(form));
            setMsg("Evento criado com sucesso.");
            setForm({ ...FORM_INICIAL });
            setShowForm(false);
            await carregarEventos();
        } catch (e) {
            setErro(e.message || "Não foi possível criar o evento.");
        } finally {
            setSaving(false);
        }
    }

    function abrirEditar(evento) {
        setEditForm({
            id: evento.id,
            titulo: evento.titulo || "",
            descricao: evento.descricao || "",
            dataEvento: evento.dataEvento ? String(evento.dataEvento).slice(0, 10) : "",
            horaInicio: evento.horaInicio ? String(evento.horaInicio).slice(0, 5) : "",
            horaFim: evento.horaFim ? String(evento.horaFim).slice(0, 5) : "",
            localEvento: evento.localEvento || "",
            responsavel: evento.responsavel || "",
            coletividadeAtividadeId: evento.coletividadeAtividadeId ? String(evento.coletividadeAtividadeId) : "",
            maxParticipantes: evento.maxParticipantes ?? "",
            permiteInscricao: Boolean(evento.permiteInscricao),
            estado: evento.estado || "Aberto",
        });
        setEditOpen(true);
    }

    async function guardarEdicao() {
        if (!editForm.titulo?.trim() || !editForm.dataEvento) {
            setErro("Preenche o título e a data do evento.");
            return;
        }
        setSaving(true);
        setErro("");
        setMsg("");
        try {
            await atualizarEventoColetividade(coletividadeId, editForm.id, payloadFrom(editForm));
            setMsg("Evento atualizado com sucesso.");
            setEditOpen(false);
            await carregarEventos();
        } catch (e) {
            setErro(e.message || "Não foi possível atualizar o evento.");
        } finally {
            setSaving(false);
        }
    }

    async function apagarEvento(evento) {
        if (!window.confirm(`Eliminar o evento "${evento.titulo}"?`)) return;
        setSaving(true);
        setErro("");
        setMsg("");
        try {
            await eliminarEventoColetividade(coletividadeId, evento.id);
            setMsg("Evento eliminado com sucesso.");
            await carregarEventos();
        } catch (e) {
            setErro(e.message || "Não foi possível eliminar o evento.");
        } finally {
            setSaving(false);
        }
    }

    async function carregarInscricoes(eventoId) {
        setLoadingInscricoes((prev) => ({ ...prev, [eventoId]: true }));
        try {
            const data = await getInscricoesEvento(coletividadeId, eventoId);
            setInscricoesMap((prev) => ({ ...prev, [eventoId]: Array.isArray(data) ? data : [] }));
        } catch (e) {
            setErro(e.message || "Não foi possível carregar as inscrições.");
        } finally {
            setLoadingInscricoes((prev) => ({ ...prev, [eventoId]: false }));
        }
    }

    async function toggleInscricoes(evento) {
        const abrir = !expanded[evento.id];
        setExpanded((prev) => ({ ...prev, [evento.id]: abrir }));
        if (abrir && !inscricoesMap[evento.id]) {
            await carregarInscricoes(evento.id);
        }
    }

    async function submeterInscricao(evento) {
        const nomeParticipante = (inscricaoForms[evento.id]?.nomeParticipante || nome || "").trim();
        if (!nomeParticipante) {
            setErro("Indica o nome do participante.");
            return;
        }
        setSaving(true);
        setErro("");
        setMsg("");
        try {
            await inscreverEmEvento(coletividadeId, evento.id, { nomeParticipante });
            setMsg("Inscrição registada com sucesso.");
            setInscricaoForms((prev) => ({ ...prev, [evento.id]: { nomeParticipante: nome || "" } }));
            await Promise.all([carregarInscricoes(evento.id), carregarEventos()]);
        } catch (e) {
            setErro(e.message || "Não foi possível efetuar a inscrição.");
        } finally {
            setSaving(false);
        }
    }

    async function cancelarInscricao(eventoId, inscricaoId) {
        if (!window.confirm("Cancelar esta inscrição?")) return;
        setSaving(true);
        setErro("");
        setMsg("");
        try {
            await cancelarInscricaoEvento(coletividadeId, eventoId, inscricaoId);
            setMsg("Inscrição cancelada com sucesso.");
            await Promise.all([carregarInscricoes(eventoId), carregarEventos()]);
        } catch (e) {
            setErro(e.message || "Não foi possível cancelar a inscrição.");
        } finally {
            setSaving(false);
        }
    }

    function vagasTexto(evento) {
        if (evento.maxParticipantes == null || evento.maxParticipantes === "") return "Sem limite";
        const restantes = Math.max(
            Number(evento.maxParticipantes) - Number(evento.participantesConfirmados || 0),
            0
        );
        return `${restantes} restante(s)`;
    }

    return (
        <>
            <SideMenu
                title="Gestão de Coletividades"
                subtitle={coletividade?.nome || "Coletividade"}
                logoHref="/menu"
                logoSrc="/LOGO_GCDC04.png"
                items={menuItems}
            />

            <div className="container" style={{ paddingTop: 24 }}>
                <div className="page-title page-title-with-icon">
                    <div className="page-title-main-wrap">
                        <span className="page-title-icon-circle">
                            <img src={eventosIcon} alt="Eventos" className="page-title-icon" />
                        </span>
                        <div className="page-title-texts">
                            <h1>Eventos da Coletividade</h1>
                        </div>
                    </div>
                </div>

                {erro && <div className="alert error">{erro}</div>}
                {msg && <div className="alert ok">{msg}</div>}

                <div className="stack-sections">
                    <section className="card">
                        <div className="modalidades-toolbar">
                            <div className="toolbar-title-group">
                                <h2>Gerir Eventos</h2>
                                <span className="toolbar-count">{eventos.length} evento(s)</span>
                            </div>
                            {podeGerir && (
                                <button
                                    type="button"
                                    className="btn btn-primary"
                                    onClick={() => setShowForm((prev) => !prev)}
                                >
                                    {showForm ? "Fechar formulário" : "Novo evento"}
                                </button>
                            )}
                        </div>

                        <div className="row" style={{ marginBottom: 16 }}>
                            <div className="row2">
                                <select className="input" name="estado" value={filtros.estado} onChange={onFiltroChange}>
                                    <option value="">Todos os estados</option>
                                    {ESTADOS_EVENTO.map((estado) => (
                                        <option key={estado} value={estado}>{estado}</option>
                                    ))}
                                </select>
                                <select
                                    className="input"
                                    name="coletividadeAtividadeId"
                                    value={filtros.coletividadeAtividadeId}
                                    onChange={isProfessorOuTreinadorColetividade ? undefined : onFiltroChange}
                                    disabled={isProfessorOuTreinadorColetividade}
                                    title={isProfessorOuTreinadorColetividade ? "Filtrado pela sua atividade" : undefined}
                                >
                                    <option value="">Todas as atividades</option>
                                    {atividades.map((atividade) => (
                                        <option key={atividade.id} value={atividade.id}>
                                            {atividade?.atividade?.nome || "Atividade"}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {showForm && podeGerir && (
                            <div className="card" style={{ marginBottom: 18 }}>
                                <h3 style={{ marginTop: 0 }}>Criar evento</h3>
                                <div className="form-scroll">
                                    <form className="row" onSubmit={submeterCriacao}>
                                        <input className="input" name="titulo" placeholder="Título *" value={form.titulo} onChange={onFormChange} />
                                        <textarea className="input" rows={3} name="descricao" placeholder="Descrição" value={form.descricao} onChange={onFormChange} />
                                        <div className="row2">
                                            <input className="input" type="date" name="dataEvento" value={form.dataEvento} onChange={onFormChange} />
                                            <select className="input" name="estado" value={form.estado} onChange={onFormChange}>
                                                {ESTADOS_EVENTO.map((estado) => (
                                                    <option key={estado} value={estado}>{estado}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="row2">
                                            <input className="input" type="time" name="horaInicio" value={form.horaInicio} onChange={onFormChange} />
                                            <input className="input" type="time" name="horaFim" value={form.horaFim} onChange={onFormChange} />
                                        </div>
                                        <div className="row2">
                                            <input className="input" name="localEvento" placeholder="Local" value={form.localEvento} onChange={onFormChange} />
                                            <input className="input" name="responsavel" placeholder="Responsável" value={form.responsavel} onChange={onFormChange} />
                                        </div>
                                        <div className="row2">
                                            <select
                                               className="input"
                                               name="coletividadeAtividadeId"
                                               value={form.coletividadeAtividadeId}
                                               onChange={isProfessorOuTreinadorColetividade ? undefined : onFormChange}
                                               disabled={isProfessorOuTreinadorColetividade}
                                               title={isProfessorOuTreinadorColetividade ? "Restrito à sua atividade" : undefined}
                                            >
                                               <option value="">Sem atividade específica</option>
                                               {atividades.map((atividade) => (
                                                   <option key={atividade.id} value={atividade.id}>
                                                       {atividade?.atividade?.nome || "Atividade"}
                                                   </option>
                                               ))}
                                            </select>
                                            <input className="input" type="number" min="0" name="maxParticipantes" placeholder="Máx. participantes" value={form.maxParticipantes} onChange={onFormChange} />
                                        </div>
                                        <label className="checkbox-inline">
                                            <input type="checkbox" name="permiteInscricao" checked={form.permiteInscricao} onChange={onFormChange} />
                                            <span>Permite inscrição</span>
                                        </label>
                                        <div className="actions">
                                            <button className="btn btn-primary" type="submit" disabled={saving}>
                                                {saving ? "A guardar..." : "Guardar evento"}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}

                        {loading ? (
                            <p className="subtle">A carregar eventos...</p>
                        ) : eventos.length === 0 ? (
                            <p className="subtle">Sem eventos registados.</p>
                        ) : (
                            <div className="table-wrap">
                                <table className="dashboard-table">
                                    <thead>
                                    <tr>
                                        <th>Título</th>
                                        <th>Data</th>
                                        <th>Hora</th>
                                        <th>Local</th>
                                        <th>Atividade</th>
                                        <th>Responsável</th>
                                        <th>Vagas</th>
                                        <th>Estado</th>
                                        <th>Ações</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {eventos.map((evento) => (
                                        <tr key={evento.id}>
                                            <td>{evento.titulo || "-"}</td>
                                            <td>{formatDateOnly(evento.dataEvento)}</td>
                                            <td>{formatHoraIntervalo(evento)}</td>
                                            <td>{evento.localEvento || "-"}</td>
                                            <td>{evento.atividadeNome || "-"}</td>
                                            <td>{evento.responsavel || "-"}</td>
                                            <td>{evento.maxParticipantes ? `${evento.participantesConfirmados || 0}/${evento.maxParticipantes}` : "Sem limite"}</td>
                                            <td>{badgeEstado(evento.estado)}</td>
                                            <td>
                                                <div className="table-actions">
                                                    {evento.permiteInscricao && (
                                                        <button type="button" className="btn" onClick={() => toggleInscricoes(evento)}>
                                                            {expanded[evento.id] ? "Ocultar inscrições" : "Ver inscrições"}
                                                        </button>
                                                    )}
                                                {podeManejarEvento(evento) && (
                                                        <>
                                                            <button type="button" className="btn" onClick={() => abrirEditar(evento)}>Editar</button>
                                                            <button type="button" className="btn btn-danger" onClick={() => apagarEvento(evento)}>Eliminar</button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </section>

                    <section className="card">
                        <div className="modalidades-toolbar">
                            <div className="toolbar-title-group">
                                <h2>Inscrições</h2>
                                <span className="toolbar-count">{eventosComInscricao.length} evento(s) com inscrição</span>
                            </div>
                        </div>

                        {eventosComInscricao.length === 0 ? (
                            <p className="subtle">Ainda não existem eventos com inscrições ativas.</p>
                        ) : (
                            <div className="stack-sections">
                                {eventosComInscricao.map((evento) => {
                                    const inscricoes = inscricoesMap[evento.id] || [];
                                    return (
                                        <div key={evento.id} className="card" style={{ margin: 0 }}>
                                            <div className="modalidades-toolbar">
                                                <div className="toolbar-title-group">
                                                    <h3 style={{ margin: 0 }}>{evento.titulo}</h3>
                                                    <span className="toolbar-count">{evento.participantesConfirmados || 0} inscrição(ões)</span>
                                                </div>
                                                <button type="button" className="btn" onClick={() => toggleInscricoes(evento)}>
                                                    {expanded[evento.id] ? "Fechar" : "Ver inscrições"}
                                                </button>
                                            </div>
                                            <p className="subtle" style={{ marginTop: 0 }}>
                                                {formatDateOnly(evento.dataEvento)} · {vagasTexto(evento)}
                                            </p>

                                            {expanded[evento.id] && (
                                                <>
                                                    <div className="row" style={{ marginBottom: 16 }}>
                                                        <div className="row2">
                                                            <input
                                                                className="input"
                                                                placeholder="Nome do participante"
                                                                value={inscricaoForms[evento.id]?.nomeParticipante ?? nome ?? ""}
                                                                onChange={(e) =>
                                                                    setInscricaoForms((prev) => ({
                                                                        ...prev,
                                                                        [evento.id]: { nomeParticipante: e.target.value },
                                                                    }))
                                                                }
                                                            />
                                                            <button
                                                                type="button"
                                                                className="btn btn-primary"
                                                                disabled={saving || evento.estado !== "Aberto"}
                                                                onClick={() => submeterInscricao(evento)}
                                                            >
                                                                Inscrever
                                                            </button>
                                                        </div>
                                                        <div>{badgeEstado(evento.estado)}</div>
                                                    </div>

                                                    {loadingInscricoes[evento.id] ? (
                                                        <p className="subtle">A carregar inscrições...</p>
                                                    ) : inscricoes.length === 0 ? (
                                                        <p className="subtle">Sem inscrições registadas.</p>
                                                    ) : (
                                                        <div className="table-wrap">
                                                            <table className="dashboard-table">
                                                                <thead>
                                                                <tr>
                                                                    <th>Participante</th>
                                                                    <th>Estado</th>
                                                                    <th>Data</th>
                                                                    <th>Contacto</th>
                                                                    <th>Ações</th>
                                                                </tr>
                                                                </thead>
                                                                <tbody>
                                                                {inscricoes.map((inscricao) => (
                                                                    <tr key={inscricao.id}>
                                                                        <td>{inscricao.participanteNome || inscricao.nomeParticipante || "-"}</td>
                                                                        <td>{badgeEstado(inscricao.estado)}</td>
                                                                        <td>{formatDateOnly(inscricao.dataInscricao)}</td>
                                                                        <td>{inscricao.email || inscricao.telefone || "-"}</td>
                                                                        <td>
                                                                            <div className="table-actions">
                                                                                {inscricao.estado !== "Cancelado" && (
                                                                                    <button
                                                                                        type="button"
                                                                                        className="btn btn-danger"
                                                                                        onClick={() => cancelarInscricao(evento.id, inscricao.id)}
                                                                                    >
                                                                                        Cancelar inscrição
                                                                                    </button>
                                                                                )}
                                                                            </div>
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </section>
                </div>
            </div>

            {editOpen && (
                <div className="modal-backdrop" onClick={() => setEditOpen(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Editar evento</h3>
                            <button type="button" className="btn modal-close" onClick={() => setEditOpen(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            <div className="row">
                                <input className="input" name="titulo" placeholder="Título" value={editForm.titulo || ""} onChange={onEditChange} />
                                <textarea className="input" rows={3} name="descricao" placeholder="Descrição" value={editForm.descricao || ""} onChange={onEditChange} />
                                <div className="row2">
                                    <input className="input" type="date" name="dataEvento" value={editForm.dataEvento || ""} onChange={onEditChange} />
                                    <select className="input" name="estado" value={editForm.estado || "Aberto"} onChange={onEditChange}>
                                        {ESTADOS_EVENTO.map((estado) => (
                                            <option key={estado} value={estado}>{estado}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="row2">
                                    <input className="input" type="time" name="horaInicio" value={editForm.horaInicio || ""} onChange={onEditChange} />
                                    <input className="input" type="time" name="horaFim" value={editForm.horaFim || ""} onChange={onEditChange} />
                                </div>
                                <div className="row2">
                                    <input className="input" name="localEvento" placeholder="Local" value={editForm.localEvento || ""} onChange={onEditChange} />
                                    <input className="input" name="responsavel" placeholder="Responsável" value={editForm.responsavel || ""} onChange={onEditChange} />
                                </div>
                                <div className="row2">
                                    <select
                                        className="input"
                                        name="coletividadeAtividadeId"
                                        value={editForm.coletividadeAtividadeId || ""}
                                        onChange={isProfessorOuTreinadorColetividade ? undefined : onEditChange}
                                        disabled={isProfessorOuTreinadorColetividade}
                                        title={isProfessorOuTreinadorColetividade ? "Restrito à sua atividade" : undefined}
                                    >
                                        <option value="">Sem atividade específica</option>
                                        {atividades.map((atividade) => (
                                            <option key={atividade.id} value={atividade.id}>
                                                {atividade?.atividade?.nome || "Atividade"}
                                            </option>
                                        ))}
                                    </select>
                                    <input className="input" type="number" min="0" name="maxParticipantes" placeholder="Máx. participantes" value={editForm.maxParticipantes ?? ""} onChange={onEditChange} />
                                </div>
                                <label className="checkbox-inline">
                                    <input type="checkbox" name="permiteInscricao" checked={Boolean(editForm.permiteInscricao)} onChange={onEditChange} />
                                    <span>Permite inscrição</span>
                                </label>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn" onClick={() => setEditOpen(false)}>Cancelar</button>
                            <button type="button" className="btn btn-primary" disabled={saving} onClick={guardarEdicao}>
                                {saving ? "A guardar..." : "Guardar"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
