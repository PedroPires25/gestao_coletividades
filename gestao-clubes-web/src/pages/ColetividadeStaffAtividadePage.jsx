import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import SideMenu from "../components/SideMenu";
import TelefoneInput from "../components/TelefoneInput";
import { useAuth } from "../auth/AuthContext";
import { getColetividadeById } from "../api";
import { getAtividadesByColetividade } from "../services/coletividadeAtividades";
import {
    createStaffColetividade,
    getCargosColetividadeStaff,
    getStaffByColetividadeAtividade,
    removerAfetacaoStaff,
    updateStaffColetividade,
} from "../services/staffColetividade";
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
        <div style={{ display: "flex", flexDirection: "column", gap: 4, padding: "10px 12px", borderRadius: 10, background: "rgba(255, 193, 7, 0.22)", border: "1px solid rgba(255, 193, 7, 0.65)" }}>
            <div style={{ color: "#ffd54f", fontWeight: 800 }}>⚠ Completar dados de inscrição</div>
            <div style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.92)" }}>Registo criado por aprovação administrativa</div>
        </div>
    );
}

const FORM_INICIAL = {
    nome: "",
    email: "",
    telefone: "",
    morada: "",
    numRegisto: "",
    remuneracao: "0.00",
    cargoId: "",
    dataInicio: new Date().toISOString().slice(0, 10),
    dataFim: "",
    observacoes: "",
};

export default function ColetividadeStaffAtividadePage() {
    const { coletividadeId, coletividadeAtividadeId } = useParams();
    const navigate = useNavigate();
    const { logout, isAdmin, isSuperAdmin, isSecretario, canManageColetividade, coletividadeId: authColetividadeId } = useAuth();
    const podeGerir = canManageColetividade(Number(coletividadeId)) ||
        (isSecretario && Number(authColetividadeId) === Number(coletividadeId));

    const [coletividade, setColetividade] = useState(null);
    const [atividadeAtiva, setAtividadeAtiva] = useState(null);
    const [rows, setRows] = useState([]);
    const [cargos, setCargos] = useState([]);
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
            const [col, atividadesRows, staffRows, cargosRows] = await Promise.all([
                getColetividadeById(coletividadeId),
                getAtividadesByColetividade(coletividadeId, { apenasAtivas: false }),
                getStaffByColetividadeAtividade(coletividadeId, coletividadeAtividadeId),
                getCargosColetividadeStaff(),
            ]);

            const atividade = (Array.isArray(atividadesRows) ? atividadesRows : []).find(
                (r) => String(r.id) === String(coletividadeAtividadeId)
            );

            const cargosLista = Array.isArray(cargosRows) ? cargosRows : [];
            setColetividade(col || null);
            setAtividadeAtiva(atividade || null);
            setRows(Array.isArray(staffRows) ? staffRows : []);
            setCargos(cargosLista);
            setForm((prev) => ({ ...prev, cargoId: prev.cargoId || String(cargosLista[0]?.id || "") }));
        } catch (e) {
            setErro(e.message || "Não foi possível carregar o staff.");
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
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    }

    function onEditChange(e) {
        const { name, value } = e.target;
        setEditForm((prev) => ({ ...prev, [name]: value }));
    }

    function abrirEditar(row) {
        setEditForm({
            id: row.id,
            afetacaoId: row.afetacaoId,
            nome: row.nome || "",
            email: row.email || "",
            telefone: row.telefone || "",
            morada: row.morada || "",
            numRegisto: row.numRegisto || "",
            remuneracao: String(row.remuneracao ?? "0.00"),
            dataInicio: row.dataInicio ? String(row.dataInicio).slice(0, 10) : "",
            dataFim: row.dataFim ? String(row.dataFim).slice(0, 10) : "",
            observacoes: row.observacoes || "",
            cargoNome: row.cargoNome || "-",
        });
        setEditOpen(true);
    }

    async function onSubmit(e) {
        e.preventDefault();
        if (!form.nome.trim()) {
            setErro("Indica o nome do membro do staff.");
            return;
        }
        const telErr = validateTelefone(form.telefone);
        if (telErr) { setErro(telErr); return; }

        setSaving(true);
        setErro("");
        setMsg("");

        try {
            await createStaffColetividade(coletividadeId, {
                nome: form.nome.trim(),
                email: form.email.trim() || null,
                telefone: form.telefone.trim() || null,
                morada: form.morada.trim() || null,
                numRegisto: form.numRegisto.trim() || null,
                remuneracao: Number(form.remuneracao || 0),
                cargoId: Number(form.cargoId),
                coletividadeAtividadeId: Number(coletividadeAtividadeId),
                dataInicio: form.dataInicio || null,
                dataFim: form.dataFim || null,
                observacoes: form.observacoes.trim() || null,
            });

            setMsg("Staff registado com sucesso.");
            setForm({ ...FORM_INICIAL, cargoId: String(cargos[0]?.id || "") });
            await carregar();
        } catch (e) {
            setErro(e.message || "Não foi possível registar o staff.");
        } finally {
            setSaving(false);
        }
    }

    async function guardarEdicao() {
        if (!editForm.nome?.trim()) {
            setErro("Indica o nome do membro do staff.");
            return;
        }
        const telErr = validateTelefone(editForm.telefone);
        if (telErr) { setErro(telErr); return; }

        setSaving(true);
        setErro("");
        setMsg("");
        try {
            await updateStaffColetividade(coletividadeId, editForm.id, {
                nome: editForm.nome.trim(),
                email: editForm.email?.trim() || null,
                telefone: editForm.telefone?.trim() || null,
                morada: editForm.morada?.trim() || null,
                numRegisto: editForm.numRegisto?.trim() || null,
                remuneracao: Number(editForm.remuneracao || 0),
                afetacaoId: editForm.afetacaoId,
                dataInicio: editForm.dataInicio || null,
                dataFim: editForm.dataFim || null,
                observacoes: editForm.observacoes?.trim() || null,
            });
            setMsg("Staff atualizado com sucesso.");
            setEditOpen(false);
            await carregar();
        } catch (e) {
            setErro(e.message || "Não foi possível atualizar o staff.");
        } finally {
            setSaving(false);
        }
    }

    async function removerAfetacao(row) {
        if (!window.confirm(`Remover a afetação de ${row.nome || "este elemento"}?`)) return;
        setSaving(true);
        setErro("");
        setMsg("");
        try {
            await removerAfetacaoStaff(coletividadeId, row.id, row.afetacaoId);
            setMsg("Afetação removida com sucesso.");
            await carregar();
        } catch (e) {
            setErro(e.message || "Não foi possível remover a afetação.");
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
                            <img src={atletasIcon} alt="Staff" className="page-title-icon" />
                        </span>
                        <div className="page-title-texts">
                            <h1>{atividadeAtiva?.atividade?.nome || "Staff da atividade"}</h1>
                        </div>
                    </div>
                    <div className="actions">
                        <button type="button" className="btn" onClick={() => navigate(`/coletividades/${coletividadeId}/staff`)}>Voltar</button>
                    </div>
                </div>

                {erro && <div className="alert error">{erro}</div>}
                {msg && <div className="alert ok">{msg}</div>}

                <div className="stack-sections">
                    <section className="card">
                        <div className="modalidades-toolbar">
                            <div className="toolbar-title-group">
                                <h2>Listagem de staff</h2>
                                <span className="toolbar-count">{rows.length} registo(s)</span>
                            </div>
                        </div>

                        {loading ? (
                            <p className="subtle">A carregar staff...</p>
                        ) : rows.length === 0 ? (
                            <p className="subtle">Sem staff registado nesta atividade.</p>
                        ) : (
                            <div className="table-wrap">
                                <table className="dashboard-table">
                                    <thead>
                                    <tr>
                                        <th>Nome</th>
                                        <th>Email</th>
                                        <th>Telefone</th>
                                        <th>Morada</th>
                                        <th>Nº Registo</th>
                                        <th>Remuneração</th>
                                        <th>Cargo</th>
                                        <th>Data Início</th>
                                        <th>Ações</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {rows.map((r) => {
                                        const pendingName = hasPendingName(r.nome);
                                        return (
                                            <tr key={`${r.id}-${r.afetacaoId}`} style={pendingName ? { background: "rgba(255, 193, 7, 0.18)", boxShadow: "inset 5px 0 0 #ffcc33" } : {}}>
                                                <td>{pendingName ? <PendingNameCell /> : r.nome}</td>
                                                <td>{r.email || "-"}</td>
                                                <td>{r.telefone || "-"}</td>
                                                <td>{r.morada || "-"}</td>
                                                <td>{r.numRegisto || "-"}</td>
                                                <td>{r.remuneracao ?? "-"}</td>
                                                <td>{r.cargoNome || "-"}</td>
                                                <td>{formatDateOnly(r.dataInicio)}</td>
                                                <td>
                                                    {podeGerir ? (
                                                        <div className="table-actions">
                                                            <button type="button" className="btn" onClick={() => abrirEditar(r)}>Editar</button>
                                                            <button type="button" className="btn btn-danger" onClick={() => removerAfetacao(r)}>Remover afetação</button>
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
                            <h2>Registar staff</h2>
                            <div className="form-scroll">
                                <form className="row" onSubmit={onSubmit}>
                                    <input className="input" name="nome" placeholder="Nome *" value={form.nome} onChange={onChange} />
                                    <div className="row2">
                                        <input className="input" name="email" placeholder="Email" value={form.email} onChange={onChange} />
                                        <TelefoneInput name="telefone" value={form.telefone} onChange={onChange} />
                                    </div>
                                    <input className="input" name="morada" placeholder="Morada" value={form.morada} onChange={onChange} />
                                    <div className="row2">
                                        <input className="input" name="numRegisto" placeholder="Nº Registo" value={form.numRegisto} onChange={onChange} />
                                        <input className="input" name="remuneracao" placeholder="Remuneração" value={form.remuneracao} onChange={onChange} />
                                    </div>
                                    <div className="row2">
                                        <select className="input" name="cargoId" value={form.cargoId} onChange={onChange}>
                                            {cargos.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
                                        </select>
                                        <input className="input" type="date" name="dataInicio" value={form.dataInicio} onChange={onChange} />
                                    </div>
                                    <div className="row2">
                                        <input className="input" type="date" name="dataFim" value={form.dataFim} onChange={onChange} />
                                        <input className="input" name="observacoes" placeholder="Observações" value={form.observacoes} onChange={onChange} />
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
                            <h3>Editar staff</h3>
                            <button type="button" className="btn modal-close" onClick={() => setEditOpen(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            <div className="row">
                                <input className="input" name="nome" placeholder="Nome" value={editForm.nome || ""} onChange={onEditChange} />
                                <div className="row2">
                                    <input className="input" name="numRegisto" placeholder="Nº Registo" value={editForm.numRegisto || ""} onChange={onEditChange} />
                                    <input className="input" name="remuneracao" placeholder="Remuneração" value={editForm.remuneracao || ""} onChange={onEditChange} />
                                </div>
                                <div className="row2">
                                    <input className="input" name="email" placeholder="Email" value={editForm.email || ""} onChange={onEditChange} />
                                    <TelefoneInput name="telefone" value={editForm.telefone || ""} onChange={onEditChange} />
                                </div>
                                <input className="input" name="morada" placeholder="Morada" value={editForm.morada || ""} onChange={onEditChange} />
                                <div className="row2">
                                    <input className="input" type="date" name="dataInicio" value={editForm.dataInicio || ""} onChange={onEditChange} />
                                    <input className="input" type="date" name="dataFim" value={editForm.dataFim || ""} onChange={onEditChange} />
                                </div>
                                <input className="input" value={`Cargo: ${editForm.cargoNome || "-"}`} readOnly />
                                <textarea className="input" rows={3} name="observacoes" placeholder="Observações" value={editForm.observacoes || ""} onChange={onEditChange} />
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
