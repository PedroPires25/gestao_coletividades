import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import SideMenu from "../components/SideMenu";
import { useAuth } from "../auth/AuthContext";
import { getClubeById } from "../api";
import { getLesoes, createLesao, updateLesao } from "../services/medico";
import { getStaffByDepartamento } from "../services/staff";
import { getAtletasByClube } from "../services/atletas";

const GRAVIDADES = ["LEVE", "MODERADA", "GRAVE"];

function fmt(val) {
    if (!val) return "-";
    return String(val).includes("T") ? String(val).split("T")[0] : String(val).slice(0, 10);
}

function badgeGravidade(g) {
    const colors = {
        LEVE: { bg: "rgba(34,197,94,0.15)", border: "rgba(34,197,94,0.4)", color: "#4ade80" },
        MODERADA: { bg: "rgba(251,191,36,0.15)", border: "rgba(251,191,36,0.4)", color: "#fbbf24" },
        GRAVE: { bg: "rgba(239,68,68,0.15)", border: "rgba(239,68,68,0.4)", color: "#f87171" },
    };
    const s = colors[g] || colors.LEVE;
    return (
        <span
            style={{
                padding: "2px 10px",
                borderRadius: 20,
                fontSize: "0.78rem",
                fontWeight: 700,
                background: s.bg,
                border: `1px solid ${s.border}`,
                color: s.color,
            }}
        >
            {g}
        </span>
    );
}

const EMPTY_FORM = {
    atletaId: "",
    staffId: "",
    tipo: "",
    parteCorpo: "",
    gravidade: "LEVE",
    dataLesao: new Date().toISOString().slice(0, 10),
    dataRetornoPrevista: "",
    dataRetornoEfetiva: "",
    descricao: "",
    tratamento: "",
};

export default function RegistosLesaoPage() {
    const { clubeId } = useParams();
    const navigate = useNavigate();
    const { logout } = useAuth();

    const [clube, setClube] = useState(null);
    const [lesoes, setLesoes] = useState([]);
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
                const [clubeData, lesoesData, staffData, atletasData] = await Promise.all([
                    getClubeById(clubeId),
                    getLesoes(clubeId),
                    getStaffByDepartamento(clubeId, "medico"),
                    getAtletasByClube(clubeId),
                ]);
                setClube(clubeData || null);
                setLesoes(Array.isArray(lesoesData) ? lesoesData : []);
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

    function onChange(e) {
        const { name, value } = e.target;
        setForm((p) => ({ ...p, [name]: value }));
    }

    function onEditChange(e) {
        const { name, value } = e.target;
        setEditForm((p) => ({ ...p, [name]: value }));
    }

    async function onSubmit(e) {
        e.preventDefault();
        if (!form.tipo.trim()) { setErro("Tipo de lesão é obrigatório."); return; }
        if (!form.dataLesao) { setErro("Data da lesão é obrigatória."); return; }
        if (!form.atletaId) { setErro("Atleta é obrigatório."); return; }
        setErro(""); setMsg(""); setSaving(true);
        try {
            await createLesao(clubeId, {
                ...form,
                atletaId: Number(form.atletaId),
                staffId: form.staffId ? Number(form.staffId) : null,
            });
            setMsg("Lesão registada com sucesso.");
            setForm(EMPTY_FORM);
            setShowForm(false);
            const refreshed = await getLesoes(clubeId);
            setLesoes(Array.isArray(refreshed) ? refreshed : []);
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
            tipo: row.tipo || "",
            parteCorpo: row.parteCorpo || "",
            gravidade: row.gravidade || "LEVE",
            dataLesao: fmt(row.dataLesao) !== "-" ? fmt(row.dataLesao) : "",
            dataRetornoPrevista: fmt(row.dataRetornoPrevista) !== "-" ? fmt(row.dataRetornoPrevista) : "",
            dataRetornoEfetiva: fmt(row.dataRetornoEfetiva) !== "-" ? fmt(row.dataRetornoEfetiva) : "",
            descricao: row.descricao || "",
            tratamento: row.tratamento || "",
        });
        setEditOpen(true);
    }

    async function guardarEdicao() {
        if (!editId) return;
        setErro(""); setMsg(""); setSavingEdit(true);
        try {
            await updateLesao(clubeId, editId, {
                ...editForm,
                staffId: editForm.staffId ? Number(editForm.staffId) : null,
            });
            setMsg("Lesão atualizada.");
            setEditOpen(false);
            const refreshed = await getLesoes(clubeId);
            setLesoes(Array.isArray(refreshed) ? refreshed : []);
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
                        <label className="field-label">Staff responsável</label>
                        <select className="input" name="staffId" value={values.staffId} onChange={onCh}>
                            <option value="">Nenhum</option>
                            {staffList.map((s) => (
                                <option key={s.id} value={s.id}>{s.nome || `Staff #${s.id}`}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className="row2">
                    <div className="row">
                        <label className="field-label">Tipo de lesão *</label>
                        <input className="input" name="tipo" value={values.tipo} onChange={onCh} placeholder="Ex: Entorse, Fratura, Distensão..." required />
                    </div>
                    <div className="row">
                        <label className="field-label">Parte do corpo</label>
                        <input className="input" name="parteCorpo" value={values.parteCorpo} onChange={onCh} placeholder="Ex: Joelho direito" />
                    </div>
                </div>
                <div className="row2">
                    <div className="row">
                        <label className="field-label">Gravidade</label>
                        <select className="input" name="gravidade" value={values.gravidade} onChange={onCh}>
                            {GRAVIDADES.map((g) => <option key={g} value={g}>{g}</option>)}
                        </select>
                    </div>
                    <div className="row">
                        <label className="field-label">Data da lesão *</label>
                        <input className="input" name="dataLesao" type="date" value={values.dataLesao} onChange={onCh} required />
                    </div>
                </div>
                <div className="row2">
                    <div className="row">
                        <label className="field-label">Retorno previsto</label>
                        <input className="input" name="dataRetornoPrevista" type="date" value={values.dataRetornoPrevista} onChange={onCh} />
                    </div>
                    <div className="row">
                        <label className="field-label">Retorno efetivo</label>
                        <input className="input" name="dataRetornoEfetiva" type="date" value={values.dataRetornoEfetiva} onChange={onCh} />
                    </div>
                </div>
                <div className="row">
                    <label className="field-label">Descrição</label>
                    <textarea className="input" name="descricao" value={values.descricao} onChange={onCh} rows={3} placeholder="Descrição detalhada da lesão..." />
                </div>
                <div className="row">
                    <label className="field-label">Tratamento</label>
                    <textarea className="input" name="tratamento" value={values.tratamento} onChange={onCh} rows={3} placeholder="Protocolo de tratamento..." />
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
                        <span className="page-title-icon-circle" style={{ fontSize: "1.6rem" }}>🩹</span>
                        <div className="page-title-texts">
                            <h1>Registos de Lesões</h1>
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
                                <h2>Lesões</h2>
                                <span className="toolbar-count">{lesoes.length} registo(s)</span>
                            </div>
                        </div>
                        {loading ? (
                            <p className="subtle">A carregar...</p>
                        ) : lesoes.length === 0 ? (
                            <p className="subtle">Sem lesões registadas.</p>
                        ) : (
                            <div className="table-wrap">
                                <table className="dashboard-table">
                                    <thead>
                                        <tr>
                                            <th>Atleta</th>
                                            <th>Tipo</th>
                                            <th>Parte do corpo</th>
                                            <th>Gravidade</th>
                                            <th>Data lesão</th>
                                            <th>Retorno previsto</th>
                                            <th>Staff</th>
                                            <th>Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {lesoes.map((row) => (
                                            <tr key={row.id}>
                                                <td>{row.atletaNome || `#${row.atletaId}`}</td>
                                                <td>{row.tipo}</td>
                                                <td className="cell-muted">{row.parteCorpo || "-"}</td>
                                                <td>{badgeGravidade(row.gravidade)}</td>
                                                <td>{fmt(row.dataLesao)}</td>
                                                <td className="cell-muted">{fmt(row.dataRetornoPrevista)}</td>
                                                <td className="cell-muted">{row.staffNome || "-"}</td>
                                                <td>
                                                    <button type="button" className="btn" onClick={() => abrirEditar(row)}>Editar</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    <div className="card">
                        <div className="modalidades-toolbar">
                            <div className="toolbar-title-group"><h2>Registar lesão</h2></div>
                            <button type="button" className="btn" onClick={() => setShowForm((p) => !p)}>
                                {showForm ? "Fechar" : "Nova lesão"}
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
                            <h2>Editar Lesão</h2>
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
