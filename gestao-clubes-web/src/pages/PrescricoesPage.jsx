import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import SideMenu from "../components/SideMenu";
import { useAuth } from "../auth/AuthContext";
import { getClubeById } from "../api";
import { getPrescricoes, createPrescricao, updatePrescricao } from "../services/medico";
import { getStaffByDepartamento } from "../services/staff";
import { getAtletasByClube } from "../services/atletas";

function fmt(val) {
    if (!val) return "-";
    return String(val).includes("T") ? String(val).split("T")[0] : String(val).slice(0, 10);
}

function isAtiva(dataFim) {
    if (!dataFim) return true;
    return new Date(dataFim) >= new Date();
}

const EMPTY_FORM = {
    atletaId: "",
    staffId: "",
    consultaId: "",
    medicamento: "",
    dosagem: "",
    frequencia: "",
    dataInicio: new Date().toISOString().slice(0, 10),
    dataFim: "",
    notas: "",
};

export default function PrescricoesPage() {
    const { clubeId } = useParams();
    const navigate = useNavigate();
    const { logout } = useAuth();

    const [clube, setClube] = useState(null);
    const [prescricoes, setPrescricoes] = useState([]);
    const [staffList, setStaffList] = useState([]);
    const [atletasList, setAtletasList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [erro, setErro] = useState("");
    const [msg, setMsg] = useState("");

    const [showForm, setShowForm] = useState(false);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState(EMPTY_FORM);

    const [editOpen, setEditOpen] = useState(false);
    const [editId, setEditId] = useState(null);
    const [editForm, setEditForm] = useState(EMPTY_FORM);
    const [savingEdit, setSavingEdit] = useState(false);

    const menuItems = useMemo(() => [
        { label: "Módulo Clínico", to: `/clubes/${clubeId}/medico` },
        { label: "Eventos do Clube", to: `/clubes/${clubeId}/eventos` },
        { label: "Logout", onClick: () => { logout(); navigate("/login", { replace: true }); } },
    ], [clubeId, logout, navigate]);

    useEffect(() => {
        async function carregar() {
            setLoading(true);
            try {
                const [clubeData, data, staffData, atletasData] = await Promise.all([
                    getClubeById(clubeId),
                    getPrescricoes(clubeId),
                    getStaffByDepartamento(clubeId, "medico"),
                    getAtletasByClube(clubeId),
                ]);
                setClube(clubeData || null);
                setPrescricoes(Array.isArray(data) ? data : []);
                setStaffList(Array.isArray(staffData) ? staffData : []);
                setAtletasList(Array.isArray(atletasData) ? atletasData : []);
            } catch (e) {
                setErro(e.message || "Erro ao carregar.");
            } finally {
                setLoading(false);
            }
        }
        carregar();
    }, [clubeId]);

    function onChange(e) { setForm((p) => ({ ...p, [e.target.name]: e.target.value })); }
    function onEditChange(e) { setEditForm((p) => ({ ...p, [e.target.name]: e.target.value })); }

    async function onSubmit(e) {
        e.preventDefault();
        if (!form.atletaId) { setErro("Atleta é obrigatório."); return; }
        if (!form.medicamento.trim()) { setErro("Medicamento é obrigatório."); return; }
        setErro(""); setMsg(""); setSaving(true);
        try {
            await createPrescricao(clubeId, {
                ...form,
                atletaId: Number(form.atletaId),
                staffId: form.staffId ? Number(form.staffId) : null,
                consultaId: form.consultaId ? Number(form.consultaId) : null,
            });
            setMsg("Prescrição registada com sucesso.");
            setForm(EMPTY_FORM);
            setShowForm(false);
            const refreshed = await getPrescricoes(clubeId);
            setPrescricoes(Array.isArray(refreshed) ? refreshed : []);
        } catch (e2) {
            setErro(e2.message || "Erro ao guardar.");
        } finally {
            setSaving(false);
        }
    }

    function abrirEditar(row) {
        setEditId(row.id);
        setEditForm({
            atletaId: String(row.atletaId || ""),
            staffId: String(row.staffId || ""),
            consultaId: String(row.consultaId || ""),
            medicamento: row.medicamento || "",
            dosagem: row.dosagem || "",
            frequencia: row.frequencia || "",
            dataInicio: fmt(row.dataInicio) !== "-" ? fmt(row.dataInicio) : "",
            dataFim: fmt(row.dataFim) !== "-" ? fmt(row.dataFim) : "",
            notas: row.notas || "",
        });
        setEditOpen(true);
    }

    async function guardarEdicao() {
        if (!editId) return;
        setErro(""); setMsg(""); setSavingEdit(true);
        try {
            await updatePrescricao(clubeId, editId, {
                ...editForm,
                staffId: editForm.staffId ? Number(editForm.staffId) : null,
                consultaId: editForm.consultaId ? Number(editForm.consultaId) : null,
            });
            setMsg("Prescrição atualizada.");
            setEditOpen(false);
            const refreshed = await getPrescricoes(clubeId);
            setPrescricoes(Array.isArray(refreshed) ? refreshed : []);
        } catch (e2) {
            setErro(e2.message || "Erro ao atualizar.");
        } finally {
            setSavingEdit(false);
        }
    }

    function FormFields({ values, onChange: onCh }) {
        return (
            <>
                <div className="row2">
                    <div className="row">
                        <label className="field-label">Atleta *</label>
                        <select className="input" name="atletaId" value={values.atletaId} onChange={onCh} required>
                            <option value="">Selecionar atleta</option>
                            {atletasList.map((a) => (
                                <option key={a.id} value={a.id}>{a.nome}</option>
                            ))}
                        </select>
                    </div>
                    <div className="row">
                        <label className="field-label">Staff médico</label>
                        <select className="input" name="staffId" value={values.staffId} onChange={onCh}>
                            <option value="">Nenhum</option>
                            {staffList.map((s) => (
                                <option key={s.id} value={s.id}>{s.nome || `Staff #${s.id}`}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className="row">
                    <label className="field-label">Medicamento *</label>
                    <input className="input" name="medicamento" value={values.medicamento} onChange={onCh} placeholder="Nome do medicamento" required />
                </div>
                <div className="row2">
                    <div className="row">
                        <label className="field-label">Dosagem</label>
                        <input className="input" name="dosagem" value={values.dosagem} onChange={onCh} placeholder="Ex: 500mg" />
                    </div>
                    <div className="row">
                        <label className="field-label">Frequência</label>
                        <input className="input" name="frequencia" value={values.frequencia} onChange={onCh} placeholder="Ex: 2x dia" />
                    </div>
                </div>
                <div className="row2">
                    <div className="row">
                        <label className="field-label">Data início</label>
                        <input className="input" name="dataInicio" type="date" value={values.dataInicio} onChange={onCh} />
                    </div>
                    <div className="row">
                        <label className="field-label">Data fim</label>
                        <input className="input" name="dataFim" type="date" value={values.dataFim} onChange={onCh} />
                    </div>
                </div>
                <div className="row">
                    <label className="field-label">Notas</label>
                    <textarea className="input" name="notas" value={values.notas} onChange={onCh} rows={2} placeholder="Instruções adicionais..." />
                </div>
            </>
        );
    }

    return (
        <>
            <SideMenu title="Gestão de Clubes" subtitle={clube?.nome || "Clube"} logoHref="/menu" logoSrc="/logo.png" items={menuItems} />

            <div className="container" style={{ paddingTop: 24 }}>
                <div className="page-title page-title-with-icon">
                    <div className="page-title-main-wrap">
                        <span className="page-title-icon-circle" style={{ fontSize: "1.6rem" }}>💊</span>
                        <div className="page-title-texts">
                            <h1>Prescrições</h1>
                            {clube && <div className="hint">{clube.nome}</div>}
                        </div>
                    </div>
                    <div className="actions">
                        <button type="button" className="btn" onClick={() => navigate(`/clubes/${clubeId}/medico`)}>Módulo Clínico</button>
                    </div>
                </div>

                {erro && <div className="alert error">{erro}</div>}
                {msg && <div className="alert ok">{msg}</div>}

                <div className="stack-sections">
                    <div className="card">
                        <div className="modalidades-toolbar">
                            <div className="toolbar-title-group">
                                <h2>Prescrições</h2>
                                <span className="toolbar-count">{prescricoes.length} registo(s)</span>
                            </div>
                        </div>
                        {loading ? (
                            <p className="subtle">A carregar...</p>
                        ) : prescricoes.length === 0 ? (
                            <p className="subtle">Sem prescrições registadas.</p>
                        ) : (
                            <div className="table-wrap">
                                <table className="dashboard-table">
                                    <thead>
                                        <tr>
                                            <th>Atleta</th>
                                            <th>Medicamento</th>
                                            <th>Dosagem</th>
                                            <th>Frequência</th>
                                            <th>Início</th>
                                            <th>Fim</th>
                                            <th>Estado</th>
                                            <th>Staff</th>
                                            <th>Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {prescricoes.map((row) => {
                                            const ativa = isAtiva(row.dataFim);
                                            return (
                                                <tr key={row.id}>
                                                    <td>{row.atletaNome || `#${row.atletaId}`}</td>
                                                    <td style={{ fontWeight: 600 }}>{row.medicamento}</td>
                                                    <td className="cell-muted">{row.dosagem || "-"}</td>
                                                    <td className="cell-muted">{row.frequencia || "-"}</td>
                                                    <td>{fmt(row.dataInicio)}</td>
                                                    <td>{fmt(row.dataFim)}</td>
                                                    <td>
                                                        <span style={{
                                                            padding: "2px 10px", borderRadius: 20,
                                                            fontSize: "0.78rem", fontWeight: 700,
                                                            background: ativa ? "rgba(34,197,94,0.15)" : "rgba(156,163,175,0.15)",
                                                            border: ativa ? "1px solid rgba(34,197,94,0.4)" : "1px solid rgba(156,163,175,0.3)",
                                                            color: ativa ? "#4ade80" : "#9ca3af",
                                                        }}>
                                                            {ativa ? "Ativa" : "Terminada"}
                                                        </span>
                                                    </td>
                                                    <td className="cell-muted">{row.staffNome || "-"}</td>
                                                    <td>
                                                        <button type="button" className="btn" onClick={() => abrirEditar(row)}>Editar</button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    <div className="card">
                        <div className="modalidades-toolbar">
                            <div className="toolbar-title-group"><h2>Registar prescrição</h2></div>
                            <button type="button" className="btn" onClick={() => setShowForm((p) => !p)}>
                                {showForm ? "Fechar" : "Nova prescrição"}
                            </button>
                        </div>
                        {showForm && (
                            <form onSubmit={onSubmit} className="row">
                                <FormFields values={form} onChange={onChange} />
                                <div className="actions" style={{ marginTop: 8 }}>
                                    <button type="submit" className="btn btn-primary" disabled={saving}>
                                        {saving ? "A guardar..." : "Guardar"}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            </div>

            {editOpen && (
                <div className="modal-overlay" onClick={() => setEditOpen(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Editar Prescrição</h2>
                            <button type="button" className="btn-close" onClick={() => setEditOpen(false)}>✕</button>
                        </div>
                        <div className="modal-body">
                            {erro && <div className="alert error">{erro}</div>}
                            <FormFields values={editForm} onChange={onEditChange} />
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn" onClick={() => setEditOpen(false)}>Cancelar</button>
                            <button type="button" className="btn btn-primary" disabled={savingEdit} onClick={guardarEdicao}>
                                {savingEdit ? "A guardar..." : "Guardar alterações"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
