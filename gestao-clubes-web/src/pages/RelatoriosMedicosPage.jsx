import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import SideMenu from "../components/SideMenu";
import { useAuth } from "../auth/AuthContext";
import { getClubeById } from "../api";
import { getRelatorios, createRelatorio, updateRelatorio } from "../services/medico";
import { getStaffByDepartamento } from "../services/staff";
import { getAtletasByClube } from "../services/atletas";

const TIPOS_RELATORIO = [
    "Aptidão física", "Alta médica", "Apto para competição", "Inapto para competição",
    "Avaliação periódica", "Relatório de lesão", "Relatório de seguimento", "Outro",
];

function fmt(val) {
    if (!val) return "-";
    return String(val).includes("T") ? String(val).split("T")[0] : String(val).slice(0, 10);
}

const EMPTY_FORM = {
    atletaId: "",
    staffId: "",
    dataRelatorio: new Date().toISOString().slice(0, 10),
    tipo: "",
    conteudo: "",
    confidencial: false,
};

export default function RelatoriosMedicosPage() {
    const { clubeId } = useParams();
    const navigate = useNavigate();
    const { logout } = useAuth();

    const [clube, setClube] = useState(null);
    const [relatorios, setRelatorios] = useState([]);
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
                    getRelatorios(clubeId),
                    getStaffByDepartamento(clubeId, "medico"),
                    getAtletasByClube(clubeId),
                ]);
                setClube(clubeData || null);
                setRelatorios(Array.isArray(data) ? data : []);
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
        const { name, value, type, checked } = e.target;
        setForm((p) => ({ ...p, [name]: type === "checkbox" ? checked : value }));
    }

    function onEditChange(e) {
        const { name, value, type, checked } = e.target;
        setEditForm((p) => ({ ...p, [name]: type === "checkbox" ? checked : value }));
    }

    async function onSubmit(e) {
        e.preventDefault();
        if (!form.atletaId) { setErro("Atleta é obrigatório."); return; }
        if (!form.tipo) { setErro("Tipo de relatório é obrigatório."); return; }
        if (!form.dataRelatorio) { setErro("Data é obrigatória."); return; }
        setErro(""); setMsg(""); setSaving(true);
        try {
            await createRelatorio(clubeId, {
                ...form,
                atletaId: Number(form.atletaId),
                staffId: form.staffId ? Number(form.staffId) : null,
                confidencial: Boolean(form.confidencial),
            });
            setMsg("Relatório registado com sucesso.");
            setForm(EMPTY_FORM);
            setShowForm(false);
            const refreshed = await getRelatorios(clubeId);
            setRelatorios(Array.isArray(refreshed) ? refreshed : []);
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
            dataRelatorio: fmt(row.dataRelatorio) !== "-" ? fmt(row.dataRelatorio) : "",
            tipo: row.tipo || "",
            conteudo: row.conteudo || "",
            confidencial: Boolean(row.confidencial),
        });
        setEditOpen(true);
    }

    async function guardarEdicao() {
        if (!editId) return;
        setErro(""); setMsg(""); setSavingEdit(true);
        try {
            await updateRelatorio(clubeId, editId, {
                ...editForm,
                staffId: editForm.staffId ? Number(editForm.staffId) : null,
                confidencial: Boolean(editForm.confidencial),
            });
            setMsg("Relatório atualizado.");
            setEditOpen(false);
            const refreshed = await getRelatorios(clubeId);
            setRelatorios(Array.isArray(refreshed) ? refreshed : []);
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
                        <label className="field-label">Data do relatório *</label>
                        <input className="input" name="dataRelatorio" type="date" value={values.dataRelatorio} onChange={onCh} required />
                    </div>
                    <div className="row">
                        <label className="field-label">Tipo *</label>
                        <select className="input" name="tipo" value={values.tipo} onChange={onCh} required>
                            <option value="">Selecionar tipo</option>
                            {TIPOS_RELATORIO.map((t) => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                </div>
                <div className="row">
                    <label className="field-label">Conteúdo</label>
                    <textarea className="input" name="conteudo" value={values.conteudo} onChange={onCh} rows={5} placeholder="Conteúdo do relatório clínico..." />
                </div>
                <div className="row">
                    <label className="filter-checkbox" style={{ gap: 8, cursor: "pointer" }}>
                        <input type="checkbox" name="confidencial" checked={Boolean(values.confidencial)} onChange={onCh} />
                        <span>Relatório confidencial</span>
                    </label>
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
                        <span className="page-title-icon-circle" style={{ fontSize: "1.6rem" }}>📋</span>
                        <div className="page-title-texts">
                            <h1>Relatórios Médicos</h1>
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
                                <h2>Relatórios</h2>
                                <span className="toolbar-count">{relatorios.length} registo(s)</span>
                            </div>
                        </div>
                        {loading ? (
                            <p className="subtle">A carregar...</p>
                        ) : relatorios.length === 0 ? (
                            <p className="subtle">Sem relatórios registados.</p>
                        ) : (
                            <div className="table-wrap">
                                <table className="dashboard-table">
                                    <thead>
                                        <tr>
                                            <th>Atleta</th>
                                            <th>Data</th>
                                            <th>Tipo</th>
                                            <th>Confidencial</th>
                                            <th>Staff</th>
                                            <th>Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {relatorios.map((row) => (
                                            <tr key={row.id}>
                                                <td>{row.atletaNome || `#${row.atletaId}`}</td>
                                                <td>{fmt(row.dataRelatorio)}</td>
                                                <td>{row.tipo}</td>
                                                <td>
                                                    {row.confidencial ? (
                                                        <span style={{
                                                            padding: "2px 10px", borderRadius: 20,
                                                            fontSize: "0.78rem", fontWeight: 700,
                                                            background: "rgba(239,68,68,0.13)",
                                                            border: "1px solid rgba(239,68,68,0.3)",
                                                            color: "#f87171",
                                                        }}>🔒 Confidencial</span>
                                                    ) : (
                                                        <span className="cell-muted">Não</span>
                                                    )}
                                                </td>
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
                            <div className="toolbar-title-group"><h2>Criar relatório</h2></div>
                            <button type="button" className="btn" onClick={() => setShowForm((p) => !p)}>
                                {showForm ? "Fechar" : "Novo relatório"}
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
                            <h2>Editar Relatório</h2>
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
