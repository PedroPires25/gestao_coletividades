import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import SideMenu from "../components/SideMenu";
import TelefoneInput from "../components/TelefoneInput";
import { useAuth } from "../auth/AuthContext";
import { getColetividadeById } from "../api";
import { getAtividadesByColetividade } from "../services/coletividadeAtividades";
import {
    adicionarAtividadeInscrito,
    createUtente,
    getEstadosInscrito,
    getTodosInscritos,
    removerAtividadeInscrito,
    updateUtente,
} from "../services/utentes";
import atletasIcon from "../assets/atletas.svg";
import { validateTelefone } from "../utils/validation";
import { usePagination } from "../hooks/usePagination";
import Pagination from "../components/Pagination";

function formatDateOnly(value) {
    if (!value) return "-";
    const text = String(value).trim();
    const date = text.includes("T") ? text.split("T")[0] : text.slice(0, 10);
    const [year, month, day] = date.split("-");
    return year && month && day ? `${day}/${month}/${year}` : date;
}

function estadoBadgeClass(estado) {
    if (estado === "Ativo") return "badge active";
    return "badge inactive";
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

const FORM_INICIAL = {
    nome: "",
    dataNascimento: "",
    email: "",
    telefone: "",
    morada: "",
    estadoId: "1",
    dataInscricao: new Date().toISOString().slice(0, 10),
    dataFim: "",
    ativo: true,
    coletividadeAtividadeIds: [],
};

export default function ColetividadeUtentesPage() {
    const { id: coletividadeId } = useParams();
    const navigate = useNavigate();
    const { logout, isAdmin, isSuperAdmin, isSecretario, canManageColetividade, coletividadeId: authColetividadeId } = useAuth();
    const podeGerir = canManageColetividade(Number(coletividadeId)) ||
        (isSecretario && Number(authColetividadeId) === Number(coletividadeId));

    const [coletividade, setColetividade] = useState(null);
    const [atividades, setAtividades] = useState([]);
    const [estados, setEstados] = useState([]);
    const [inscritos, setInscritos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [erro, setErro] = useState("");
    const [msg, setMsg] = useState("");

    const [showCreateForm, setShowCreateForm] = useState(false);
    const [form, setForm] = useState(FORM_INICIAL);
    const [filtros, setFiltros] = useState({ nome: "", atividade: "", estado: "" });

    const [editOpen, setEditOpen] = useState(false);
    const [editForm, setEditForm] = useState(FORM_INICIAL);

    const [manageOpen, setManageOpen] = useState(false);
    const [manageTarget, setManageTarget] = useState(null);
    const [manageForm, setManageForm] = useState({
        coletividadeAtividadeId: "",
        dataInscricao: new Date().toISOString().slice(0, 10),
    });

    const menuItems = useMemo(() => menuItemsBase({ coletividadeId, isAdmin, isSuperAdmin, logout, navigate }), [coletividadeId, isAdmin, isSuperAdmin, logout, navigate]);

    const carregar = useCallback(async () => {
        if (!coletividadeId) return;
        setLoading(true);
        setErro("");
        setMsg("");

        try {
            const [coletividadeData, atividadesData, estadosData, inscritosData] = await Promise.all([
                getColetividadeById(coletividadeId),
                getAtividadesByColetividade(coletividadeId, { apenasAtivas: false }),
                getEstadosInscrito(),
                getTodosInscritos(coletividadeId),
            ]);

            const atividadesLista = Array.isArray(atividadesData) ? atividadesData : [];
            setColetividade(coletividadeData || null);
            setAtividades(atividadesLista);
            setEstados(Array.isArray(estadosData) ? estadosData : []);
            setInscritos(Array.isArray(inscritosData) ? inscritosData : []);
        } catch (e) {
            setErro(e.message || "Não foi possível carregar os inscritos.");
        } finally {
            setLoading(false);
        }
    }, [coletividadeId]);

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            void carregar();
        }, 0);

        return () => window.clearTimeout(timeoutId);
    }, [carregar]);

    const inscritosFiltrados = useMemo(() => {
        const nomeFiltro = filtros.nome.trim().toLowerCase();
        return inscritos.filter((item) => {
            const nomeOk = !nomeFiltro || String(item.nome || "").toLowerCase().includes(nomeFiltro);
            const atividadeOk = !filtros.atividade || (Array.isArray(item.atividades) && item.atividades.some((atividade) => String(atividade.coletividadeAtividadeId) === String(filtros.atividade)));
            const estadoOk = !filtros.estado || String(item.estadoId) === String(filtros.estado);
            return nomeOk && atividadeOk && estadoOk;
        });
    }, [filtros, inscritos]);

    const { paginated: inscritosPaginados, ...paginationProps } = usePagination(inscritosFiltrados, 25);

    const atividadesDisponiveisGestao = useMemo(() => {
        if (!manageTarget || !Array.isArray(manageTarget.atividades)) return atividades;
        const idsAtuais = new Set(manageTarget.atividades.map((atividade) => String(atividade.coletividadeAtividadeId)));
        return atividades.filter((atividade) => !idsAtuais.has(String(atividade.id)));
    }, [atividades, manageTarget]);

    function onFormChange(e) {
        const { name, value, type, checked } = e.target;
        setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
    }

    function onEditChange(e) {
        const { name, value } = e.target;
        setEditForm((prev) => ({ ...prev, [name]: value }));
    }

    function onFiltroChange(e) {
        const { name, value } = e.target;
        setFiltros((prev) => ({ ...prev, [name]: value }));
    }

    function abrirEditar(item) {
        setEditForm({
            id: item.id,
            nome: item.nome || "",
            dataNascimento: item.dataNascimento ? String(item.dataNascimento).slice(0, 10) : "",
            email: item.email || "",
            telefone: item.telefone || "",
            morada: item.morada || "",
            estadoId: String(item.estadoId || 1),
        });
        setEditOpen(true);
    }

    function abrirGerirAtividades(item) {
        const idsAtuais = new Set((item.atividades || []).map((atividade) => String(atividade.coletividadeAtividadeId)));
        const primeiraDisponivel = atividades.find((atividade) => !idsAtuais.has(String(atividade.id)));
        setManageTarget(item);
        setManageForm({
            coletividadeAtividadeId: String(primeiraDisponivel?.id || ""),
            dataInscricao: new Date().toISOString().slice(0, 10),
        });
        setManageOpen(true);
    }

    async function registarInscrito(e) {
        e.preventDefault();
        if (!form.nome.trim()) {
            setErro("Indica o nome do inscrito.");
            return;
        }
        if (!form.coletividadeAtividadeIds || form.coletividadeAtividadeIds.length === 0) {
            setErro("Seleciona pelo menos uma atividade.");
            return;
        }
        const telErr = validateTelefone(form.telefone);
        if (telErr) { setErro(telErr); return; }

        setSaving(true);
        setErro("");
        setMsg("");
        try {
            await createUtente(coletividadeId, {
                nome: form.nome.trim(),
                dataNascimento: form.dataNascimento || null,
                email: form.email.trim() || null,
                telefone: form.telefone.trim() || null,
                morada: form.morada.trim() || null,
                estadoId: Number(form.estadoId || 1),
                dataInscricao: form.dataInscricao || null,
                dataFim: form.dataFim || null,
                ativo: Boolean(form.ativo),
                atividadeIds: form.coletividadeAtividadeIds.map(Number),
            });
            setMsg("Inscrito registado com sucesso.");
            setForm(FORM_INICIAL);
            setShowCreateForm(false);
            await carregar();
        } catch (e) {
            setErro(e.message || "Não foi possível registar o inscrito.");
        } finally {
            setSaving(false);
        }
    }

    async function guardarEdicao() {
        if (!editForm.nome?.trim()) {
            setErro("Indica o nome do inscrito.");
            return;
        }
        const telErr = validateTelefone(editForm.telefone);
        if (telErr) { setErro(telErr); return; }

        setSaving(true);
        setErro("");
        setMsg("");
        try {
            await updateUtente(coletividadeId, editForm.id, {
                nome: editForm.nome.trim(),
                dataNascimento: editForm.dataNascimento || null,
                email: editForm.email?.trim() || null,
                telefone: editForm.telefone?.trim() || null,
                morada: editForm.morada?.trim() || null,
                estadoId: Number(editForm.estadoId || 1),
            });
            setMsg("Inscrito atualizado com sucesso.");
            setEditOpen(false);
            await carregar();
        } catch (e) {
            setErro(e.message || "Não foi possível atualizar o inscrito.");
        } finally {
            setSaving(false);
        }
    }

    async function adicionarAtividade() {
        if (!manageTarget?.id || !manageForm.coletividadeAtividadeId) {
            setErro("Seleciona uma atividade para associar.");
            return;
        }

        setSaving(true);
        setErro("");
        setMsg("");
        try {
            await adicionarAtividadeInscrito(coletividadeId, manageTarget.id, {
                coletividadeAtividadeId: Number(manageForm.coletividadeAtividadeId),
                dataInscricao: manageForm.dataInscricao || null,
            });
            setMsg("Atividade associada com sucesso.");
            setManageOpen(false);
            setManageTarget(null);
            await carregar();
        } catch (e) {
            setErro(e.message || "Não foi possível associar a atividade.");
        } finally {
            setSaving(false);
        }
    }

    async function removerAtividade(item, inscricaoId) {
        if (!window.confirm(`Remover ${item.nome || "este inscrito"} desta atividade?`)) return;
        setSaving(true);
        setErro("");
        setMsg("");
        try {
            await removerAtividadeInscrito(coletividadeId, item.id, inscricaoId);
            setMsg("Atividade removida com sucesso.");
            setManageOpen(false);
            setManageTarget(null);
            await carregar();
        } catch (e) {
            setErro(e.message || "Não foi possível remover a atividade.");
        } finally {
            setSaving(false);
        }
    }

    return (
        <>
            <SideMenu title="Gestão de Coletividades" subtitle={coletividade?.nome || "Coletividade"} logoHref="/menu" logoSrc="/LOGO_GCDC04.png" items={menuItems} />
            <div className="container" style={{ paddingTop: 24 }}>
                <div className="page-title page-title-with-icon">
                    <div className="page-title-main-wrap">
                        <span className="page-title-icon-circle">
                            <img src={atletasIcon} alt="Inscritos" className="page-title-icon" />
                        </span>
                        <div className="page-title-texts">
                            <h1>Inscritos</h1>
                            <div className="hint">{coletividade?.nome || ""}</div>
                        </div>
                    </div>
                </div>

                {erro && <div className="alert error">{erro}</div>}
                {msg && <div className="alert ok">{msg}</div>}

                <div className="stack-sections">
                    <section className="card">
                        <div className="modalidades-toolbar">
                            <div className="toolbar-title-group">
                                <h2>Lista geral</h2>
                                <span className="toolbar-count">{inscritosFiltrados.length} inscrito(s)</span>
                            </div>
                            {podeGerir && (
                                <button type="button" className="btn btn-primary" onClick={() => setShowCreateForm((prev) => !prev)}>
                                    {showCreateForm ? "Fechar registo" : "Registar inscrito"}
                                </button>
                            )}
                        </div>

                        <div className="row" style={{ marginBottom: 16 }}>
                            <div className="row2">
                                <input className="input" name="nome" placeholder="Pesquisar por nome" value={filtros.nome} onChange={onFiltroChange} />
                                <select className="input" name="atividade" value={filtros.atividade} onChange={onFiltroChange}>
                                    <option value="">Todas as atividades</option>
                                    {atividades.map((atividade) => (
                                        <option key={atividade.id} value={atividade.id}>{atividade?.atividade?.nome || "Atividade"}</option>
                                    ))}
                                </select>
                            </div>
                            <select className="input" name="estado" value={filtros.estado} onChange={onFiltroChange}>
                                <option value="">Todos os estados</option>
                                {estados.map((estado) => (
                                    <option key={estado.id} value={estado.id}>{estado.descricao}</option>
                                ))}
                            </select>
                        </div>

                        {showCreateForm && podeGerir && (
                            <div className="card" style={{ marginBottom: 18 }}>
                                <h3 style={{ marginTop: 0 }}>Registar inscrito</h3>
                                <div className="form-scroll">
                                    <form className="row" onSubmit={registarInscrito}>
                                        <input className="input" name="nome" placeholder="Nome *" value={form.nome} onChange={onFormChange} />
                                        <div className="row2">
                                            <input className="input" type="date" name="dataNascimento" value={form.dataNascimento} onChange={onFormChange} />
                                            <select className="input" name="estadoId" value={form.estadoId} onChange={onFormChange}>
                                                {estados.map((estado) => <option key={estado.id} value={estado.id}>{estado.descricao}</option>)}
                                            </select>
                                        </div>
                                        <div className="row2">
                                            <input className="input" name="email" placeholder="Email" value={form.email} onChange={onFormChange} />
                                            <TelefoneInput name="telefone" value={form.telefone} onChange={onFormChange} />
                                        </div>
                                        <input className="input" name="morada" placeholder="Morada" value={form.morada} onChange={onFormChange} />
                                        <div className="row2">
                                            <input className="input" type="date" name="dataInscricao" value={form.dataInscricao} onChange={onFormChange} />
                                            <input className="input" type="date" name="dataFim" value={form.dataFim} onChange={onFormChange} />
                                        </div>
                                        <div>
                                            <label style={{ fontWeight: 500, marginBottom: 6, display: "block" }}>Atividades *</label>
                                            {atividades.length === 0 ? (
                                                <p className="subtle" style={{ margin: 0 }}>Sem atividades disponíveis.</p>
                                            ) : (
                                                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 20px" }}>
                                                    {atividades.map((atividade) => {
                                                        const sid = String(atividade.id);
                                                        return (
                                                            <label key={atividade.id} className="checkbox-inline" style={{ cursor: "pointer" }}>
                                                                <input
                                                                    type="checkbox"
                                                                    value={sid}
                                                                    checked={form.coletividadeAtividadeIds.includes(sid)}
                                                                    onChange={(e) => {
                                                                        setForm((prev) => ({
                                                                            ...prev,
                                                                            coletividadeAtividadeIds: e.target.checked
                                                                                ? [...prev.coletividadeAtividadeIds, sid]
                                                                                : prev.coletividadeAtividadeIds.filter((x) => x !== sid),
                                                                        }));
                                                                    }}
                                                                />
                                                                <span>{atividade?.atividade?.nome || "Atividade"}</span>
                                                            </label>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                        <label className="checkbox-inline" style={{ alignSelf: "flex-start" }}>
                                            <input type="checkbox" name="ativo" checked={form.ativo} onChange={onFormChange} />
                                            <span>Inscrição ativa</span>
                                        </label>
                                        <div className="actions">
                                            <button className="btn btn-primary" type="submit" disabled={saving}>{saving ? "A guardar..." : "Guardar"}</button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}

                        {loading ? (
                            <p className="subtle">A carregar inscritos...</p>
                        ) : inscritosFiltrados.length === 0 ? (
                            <p className="subtle">Sem inscritos para apresentar.</p>
                        ) : (
                            <div className="table-wrap">
                                <table className="dashboard-table">
                                    <thead>
                                    <tr>
                                        <th>Nome</th>
                                        <th>Data Nasc.</th>
                                        <th>Email</th>
                                        <th>Telefone</th>
                                        <th>Atividades</th>
                                        <th>Estado</th>
                                        <th>Ações</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {inscritosPaginados.map((item) => (
                                        <tr key={item.id}>
                                            <td>{item.nome || "-"}</td>
                                            <td>{formatDateOnly(item.dataNascimento)}</td>
                                            <td>{item.email || "-"}</td>
                                            <td>{item.telefone || "-"}</td>
                                            <td>{Array.isArray(item.atividades) && item.atividades.length > 0 ? item.atividades.map((atividade) => atividade.atividadeNome).join(", ") : "-"}</td>
                                            <td>
                                                <span className={estadoBadgeClass(item.estadoDescricao)}>{item.estadoDescricao || "-"}</span>
                                            </td>
                                            <td>
                                                <div className="table-actions">
                                                    {podeGerir ? (
                                                        <>
                                                            <button type="button" className="btn" onClick={() => abrirEditar(item)}>Editar</button>
                                                            <button type="button" className="btn" onClick={() => abrirGerirAtividades(item)}>Gerir atividades</button>
                                                        </>
                                                    ) : (
                                                        <span className="subtle">Sem ações</span>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                        <Pagination {...paginationProps} />
                    </section>
                </div>
            </div>

            {editOpen && (
                <div className="modal-backdrop" onClick={() => setEditOpen(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Editar inscrito</h3>
                            <button type="button" className="btn modal-close" onClick={() => setEditOpen(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            <div className="row">
                                <input className="input" name="nome" placeholder="Nome" value={editForm.nome || ""} onChange={onEditChange} />
                                <div className="row2">
                                    <input className="input" type="date" name="dataNascimento" value={editForm.dataNascimento || ""} onChange={onEditChange} />
                                    <select className="input" name="estadoId" value={editForm.estadoId || "1"} onChange={onEditChange}>
                                        {estados.map((estado) => <option key={estado.id} value={estado.id}>{estado.descricao}</option>)}
                                    </select>
                                </div>
                                <div className="row2">
                                    <input className="input" name="email" placeholder="Email" value={editForm.email || ""} onChange={onEditChange} />
                                    <TelefoneInput name="telefone" value={editForm.telefone || ""} onChange={onEditChange} />
                                </div>
                                <input className="input" name="morada" placeholder="Morada" value={editForm.morada || ""} onChange={onEditChange} />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn" onClick={() => setEditOpen(false)}>Cancelar</button>
                            <button type="button" className="btn btn-primary" disabled={saving} onClick={guardarEdicao}>{saving ? "A guardar..." : "Guardar"}</button>
                        </div>
                    </div>
                </div>
            )}

            {manageOpen && manageTarget && (
                <div className="modal-backdrop" onClick={() => setManageOpen(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Gerir atividades — {manageTarget.nome}</h3>
                            <button type="button" className="btn modal-close" onClick={() => setManageOpen(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            <div className="row" style={{ marginBottom: 16 }}>
                                <h4 style={{ margin: 0 }}>Adicionar nova atividade</h4>
                                <div className="row2">
                                    <select className="input" value={manageForm.coletividadeAtividadeId} onChange={(e) => setManageForm((prev) => ({ ...prev, coletividadeAtividadeId: e.target.value }))}>
                                        <option value="">Seleciona uma atividade</option>
                                        {atividadesDisponiveisGestao.map((atividade) => <option key={atividade.id} value={atividade.id}>{atividade?.atividade?.nome || "Atividade"}</option>)}
                                    </select>
                                    <input className="input" type="date" value={manageForm.dataInscricao} onChange={(e) => setManageForm((prev) => ({ ...prev, dataInscricao: e.target.value }))} />
                                </div>
                                <div className="actions">
                                    <button type="button" className="btn btn-primary" disabled={saving || atividadesDisponiveisGestao.length === 0} onClick={adicionarAtividade}>
                                        {saving ? "A guardar..." : "Adicionar atividade"}
                                    </button>
                                </div>
                            </div>

                            <div className="table-wrap">
                                <table className="dashboard-table">
                                    <thead>
                                    <tr>
                                        <th>Atividade</th>
                                        <th>Data de inscrição</th>
                                        <th>Data fim</th>
                                        <th>Ações</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {(manageTarget.atividades || []).map((atividade) => (
                                        <tr key={atividade.inscricaoId}>
                                            <td>{atividade.atividadeNome || "-"}</td>
                                            <td>{formatDateOnly(atividade.dataInscricao)}</td>
                                            <td>{formatDateOnly(atividade.dataFim)}</td>
                                            <td>
                                                <div className="table-actions">
                                                    <button type="button" className="btn btn-danger" onClick={() => removerAtividade(manageTarget, atividade.inscricaoId)}>
                                                        Remover
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}