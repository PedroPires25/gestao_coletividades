import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import SideMenu from "../components/SideMenu";
import TelefoneInput from "../components/TelefoneInput";
import { useAuth } from "../auth/AuthContext";
import { getColetividadeById } from "../api";
import { getAtividadesByColetividade } from "../services/coletividadeAtividades";
import {
    createUtente,
    getEstadosInscrito,
    getUtentesByColetividadeAtividade,
    removerAtividadeInscrito,
    updateUtente,
} from "../services/utentes";
import atletasIcon from "../assets/atletas.svg";
import { validateTelefone } from "../utils/validation";

function formatDateOnly(value) {
    if (!value) return "-";
    const text = String(value).trim();
    const date = text.includes("T") ? text.split("T")[0] : text.slice(0, 10);
    const [year, month, day] = date.split("-");
    return year && month && day ? `${day}/${month}/${year}` : date;
}

function hasPendingName(value) {
    return !value || String(value).trim() === "-";
}

function PendingNameCell() {
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 4, padding: "8px 10px", borderRadius: 10, background: "rgba(255, 193, 7, 0.14)", border: "1px solid rgba(255, 193, 7, 0.38)" }}>
            <div style={{ color: "#ffd166", fontWeight: 800 }}>⚠ Completar dados de inscrição</div>
            <div style={{ fontSize: "0.8rem", opacity: 0.9 }}>Registo criado por aprovação administrativa</div>
        </div>
    );
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
};

export default function ColetividadeUtentesAtividadePage() {
    const { coletividadeId, coletividadeAtividadeId } = useParams();
    const navigate = useNavigate();
    const { logout, isAdmin, isSuperAdmin, isSecretario, canManageColetividade, coletividadeId: authColetividadeId } = useAuth();
    const podeGerir = canManageColetividade(Number(coletividadeId)) ||
        (isSecretario && Number(authColetividadeId) === Number(coletividadeId));

    const [coletividade, setColetividade] = useState(null);
    const [atividadeAtiva, setAtividadeAtiva] = useState(null);
    const [utentes, setUtentes] = useState([]);
    const [estados, setEstados] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [erro, setErro] = useState("");
    const [msg, setMsg] = useState("");
    const [editOpen, setEditOpen] = useState(false);
    const [editForm, setEditForm] = useState({});

    const [form, setForm] = useState(FORM_INICIAL);

    const menuItems = useMemo(() => [
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
    ], [coletividadeId, isAdmin, isSuperAdmin, logout, navigate]);

    const carregar = useCallback(async () => {
        setErro("");
        setMsg("");
        setLoading(true);

        try {
            const [col, atividadesRows, utentesRows, estadosRows] = await Promise.all([
                getColetividadeById(coletividadeId),
                getAtividadesByColetividade(coletividadeId, { apenasAtivas: false }),
                getUtentesByColetividadeAtividade(coletividadeId, coletividadeAtividadeId),
                getEstadosInscrito(),
            ]);

            const atividade = (Array.isArray(atividadesRows) ? atividadesRows : []).find(
                (r) => String(r.id) === String(coletividadeAtividadeId)
            );

            setColetividade(col || null);
            setAtividadeAtiva(atividade || null);
            setUtentes(Array.isArray(utentesRows) ? utentesRows : []);
            setEstados(Array.isArray(estadosRows) ? estadosRows : []);
        } catch (e) {
            setErro(e.message || "Não foi possível carregar os inscritos.");
        } finally {
            setLoading(false);
        }
    }, [coletividadeId, coletividadeAtividadeId]);

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            void carregar();
        }, 0);

        return () => window.clearTimeout(timeoutId);
    }, [carregar]);

    function onChange(e) {
        const { name, value, type, checked } = e.target;
        setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
    }

    function onEditChange(e) {
        const { name, value } = e.target;
        setEditForm((prev) => ({ ...prev, [name]: value }));
    }

    function abrirEditar(utente) {
        setEditForm({
            id: utente.id,
            nome: utente.nome || "",
            dataNascimento: utente.dataNascimento ? String(utente.dataNascimento).slice(0, 10) : "",
            email: utente.email || "",
            telefone: utente.telefone || "",
            morada: utente.morada || "",
            estadoId: String(utente.estadoId || 1),
        });
        setEditOpen(true);
    }

    async function onSubmit(e) {
        e.preventDefault();
        if (!form.nome.trim()) {
            setErro("Indica o nome do inscrito.");
            return;
        }
        const telErr = validateTelefone(form.telefone);
        if (telErr) { setErro(telErr); return; }

        setSaving(true);
        setErro("");
        setMsg("");

        try {
            await createUtente(coletividadeId, coletividadeAtividadeId, {
                nome: form.nome.trim(),
                dataNascimento: form.dataNascimento || null,
                email: form.email.trim() || null,
                telefone: form.telefone.trim() || null,
                morada: form.morada.trim() || null,
                estadoId: Number(form.estadoId),
                dataInscricao: form.dataInscricao || null,
                dataFim: form.dataFim || null,
                ativo: Boolean(form.ativo),
            });

            setMsg("Inscrito registado com sucesso.");
            setForm({ ...FORM_INICIAL });
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

    async function removerDaAtividade(utente) {
        if (!window.confirm(`Remover ${utente.nome || "este inscrito"} desta atividade?`)) return;
        setSaving(true);
        setErro("");
        setMsg("");
        try {
            await removerAtividadeInscrito(coletividadeId, utente.id, utente.inscricaoId);
            setMsg("Inscrição removida com sucesso.");
            await carregar();
        } catch (e) {
            setErro(e.message || "Não foi possível remover o inscrito desta atividade.");
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
                            <h1>{atividadeAtiva?.atividade?.nome || "Inscritos da atividade"}</h1>
                        </div>
                    </div>
                    <div className="actions">
                        <button type="button" className="btn" onClick={() => navigate(`/coletividades/${coletividadeId}/utentes`)}>
                            Voltar
                        </button>
                    </div>
                </div>

                {erro && <div className="alert error">{erro}</div>}
                {msg && <div className="alert ok">{msg}</div>}

                <div className="stack-sections">
                    <section className="card">
                        <div className="modalidades-toolbar">
                            <div className="toolbar-title-group">
                                <h2>Listagem de inscritos</h2>
                                <span className="toolbar-count">{utentes.length} registo(s)</span>
                            </div>
                        </div>

                        {loading ? (
                            <p className="subtle">A carregar inscritos...</p>
                        ) : utentes.length === 0 ? (
                            <p className="subtle">Sem inscritos registados nesta atividade.</p>
                        ) : (
                            <div className="table-wrap">
                                <table className="dashboard-table">
                                    <thead>
                                    <tr>
                                        <th>Nome</th>
                                        <th>Data Nasc.</th>
                                        <th>Email</th>
                                        <th>Telefone</th>
                                        <th>Morada</th>
                                        <th>Estado</th>
                                        <th>Data Inscrição</th>
                                        <th>Ações</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {utentes.map((u) => {
                                        const pendingName = hasPendingName(u.nome);
                                        return (
                                            <tr key={u.inscricaoId || u.id} style={pendingName ? { background: "rgba(255, 193, 7, 0.18)", boxShadow: "inset 5px 0 0 #ffcc33" } : {}}>
                                                <td>{pendingName ? <PendingNameCell /> : u.nome}</td>
                                                <td>{formatDateOnly(u.dataNascimento)}</td>
                                                <td>{u.email || "-"}</td>
                                                <td>{u.telefone || "-"}</td>
                                                <td>{u.morada || "-"}</td>
                                                <td>{u.estadoDescricao || "-"}</td>
                                                <td>{formatDateOnly(u.dataInscricao)}</td>
                                                <td>
                                                    {podeGerir ? (
                                                        <div className="table-actions">
                                                            <button type="button" className="btn" onClick={() => abrirEditar(u)}>Editar</button>
                                                            <button type="button" className="btn btn-danger" onClick={() => removerDaAtividade(u)}>Remover desta atividade</button>
                                                        </div>
                                                    ) : (
                                                        <span className="subtle">Sem ações</span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </section>

                    {podeGerir && (
                        <section className="card">
                            <h2>Registar inscrito</h2>
                            <div className="form-scroll">
                                <form className="row" onSubmit={onSubmit}>
                                    <input className="input" name="nome" placeholder="Nome *" value={form.nome} onChange={onChange} />
                                    <div className="row2">
                                        <input className="input" type="date" name="dataNascimento" value={form.dataNascimento} onChange={onChange} />
                                        <select className="input" name="estadoId" value={form.estadoId} onChange={onChange}>
                                            {estados.map((e) => <option key={e.id} value={e.id}>{e.descricao}</option>)}
                                        </select>
                                    </div>
                                    <div className="row2">
                                        <input className="input" name="email" placeholder="Email" value={form.email} onChange={onChange} />
                                        <TelefoneInput name="telefone" value={form.telefone} onChange={onChange} />
                                    </div>
                                    <input className="input" name="morada" placeholder="Morada" value={form.morada} onChange={onChange} />
                                    <div className="row2">
                                        <input className="input" type="date" name="dataInscricao" value={form.dataInscricao} onChange={onChange} />
                                        <input className="input" type="date" name="dataFim" value={form.dataFim} onChange={onChange} />
                                    </div>
                                    <div className="actions">
                                        <button className="btn btn-primary" type="submit" disabled={saving}>{saving ? "A guardar..." : "Guardar"}</button>
                                    </div>
                                </form>
                            </div>
                        </section>
                    )}
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
        </>
    );
}
