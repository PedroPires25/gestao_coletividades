import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import SideMenu from "../components/SideMenu";
import { useAuth } from "../auth/AuthContext";
import { getClubeById } from "../api";
import { getConsultas, createConsulta, updateConsulta } from "../services/medico";
import { getStaffByDepartamento } from "../services/staff";
import { getAtletasByClube } from "../services/atletas";

const TIPOS_CONSULTA = ["Triagem", "Avaliação", "Seguimento", "Urgência", "Pré-competição", "Pós-lesão", "Outro"];

const ESTADOS_CONSULTA = [
    { value: "AGENDADA", label: "Agendada" },
    { value: "REALIZADA", label: "Realizada" },
    { value: "CANCELADA", label: "Cancelada" },
    { value: "NAO_COMPARECEU", label: "Não compareceu" },
];

const ESTADO_BADGE = {
    AGENDADA: { label: "Agendada", color: "#5b8cff" },
    REALIZADA: { label: "Realizada", color: "#28c76f" },
    CANCELADA: { label: "Cancelada", color: "#ff5c5c" },
    NAO_COMPARECEU: { label: "Não compareceu", color: "#f3a32d" },
};

function estadoSugerido(dataStr) {
    if (!dataStr) return "REALIZADA";
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const data = new Date(dataStr + "T00:00:00");
    return data > hoje ? "AGENDADA" : "REALIZADA";
}

function fmt(val) {
    if (!val) return "-";
    return String(val).includes("T") ? String(val).split("T")[0] : String(val).slice(0, 10);
}

const EMPTY_FORM = {
    atletaId: "",
    staffId: "",
    dataConsulta: new Date().toISOString().slice(0, 10),
    estado: "REALIZADA",
    tipo: "",
    motivo: "",
    diagnostico: "",
    notas: "",
};

function FormFields({ values, onChange: onCh, atletasList, staffList }) {
    const isRealizada = values.estado === "REALIZADA";

    function handleDateChange(e) {
        const { value } = e.target;
        onCh(e);
        // Auto-suggest estado when date changes, but only if currently AGENDADA or REALIZADA
        const currentEstado = values.estado;
        if (currentEstado === "AGENDADA" || currentEstado === "REALIZADA") {
            const sugerido = estadoSugerido(value);
            if (sugerido !== currentEstado) {
                onCh({ target: { name: "estado", value: sugerido } });
            }
        }
    }

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
            <div className="row2">
                <div className="row">
                    <label className="field-label">Data da consulta *</label>
                    <input className="input" name="dataConsulta" type="date" value={values.dataConsulta} onChange={handleDateChange} required />
                </div>
                <div className="row">
                    <label className="field-label">Estado *</label>
                    <select className="input" name="estado" value={values.estado} onChange={onCh} required>
                        {ESTADOS_CONSULTA.map((e) => (
                            <option key={e.value} value={e.value}>{e.label}</option>
                        ))}
                    </select>
                </div>
            </div>
            <div className="row">
                <label className="field-label">Tipo *</label>
                <select className="input" name="tipo" value={values.tipo} onChange={onCh} required>
                    <option value="">Selecionar tipo</option>
                    {TIPOS_CONSULTA.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
            </div>
            <div className="row">
                <label className="field-label">Motivo</label>
                <textarea className="input" name="motivo" value={values.motivo} onChange={onCh} rows={2} placeholder="Motivo da consulta..." />
            </div>
            {isRealizada && (
                <>
                    <div className="row">
                        <label className="field-label">Diagnóstico</label>
                        <textarea className="input" name="diagnostico" value={values.diagnostico} onChange={onCh} rows={3} placeholder="Diagnóstico clínico..." />
                    </div>
                    <div className="row">
                        <label className="field-label">Notas</label>
                        <textarea className="input" name="notas" value={values.notas} onChange={onCh} rows={2} placeholder="Notas adicionais..." />
                    </div>
                </>
            )}
        </>
    );
}

export default function ConsultasMedicasPage() {
    const { clubeId } = useParams();
    const navigate = useNavigate();
    const { logout } = useAuth();

    const [clube, setClube] = useState(null);
    const [consultas, setConsultas] = useState([]);
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
                    getConsultas(clubeId),
                    getStaffByDepartamento(clubeId, "medico"),
                    getAtletasByClube(clubeId),
                ]);
                setClube(clubeData || null);
                setConsultas(Array.isArray(data) ? data : []);
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
        if (!form.atletaId) { setErro("Atleta é obrigatório."); return; }
        if (!form.tipo) { setErro("Tipo de consulta é obrigatório."); return; }
        if (!form.dataConsulta) { setErro("Data é obrigatória."); return; }
        if (form.estado === "REALIZADA" && estadoSugerido(form.dataConsulta) === "AGENDADA") {
            setErro("Não é possível registar uma consulta como Realizada com data futura.");
            return;
        }
        setErro(""); setMsg(""); setSaving(true);
        try {
            await createConsulta(clubeId, {
                ...form,
                atletaId: Number(form.atletaId),
                staffId: form.staffId ? Number(form.staffId) : null,
            });
            setMsg("Consulta registada com sucesso.");
            setForm(EMPTY_FORM);
            setShowForm(false);
            const refreshed = await getConsultas(clubeId);
            setConsultas(Array.isArray(refreshed) ? refreshed : []);
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
            dataConsulta: fmt(row.dataConsulta) !== "-" ? fmt(row.dataConsulta) : "",
            estado: row.estado || "REALIZADA",
            tipo: row.tipo || "",
            motivo: row.motivo || "",
            diagnostico: row.diagnostico || "",
            notas: row.notas || "",
        });
        setEditOpen(true);
    }

    async function guardarEdicao() {
        if (!editId) return;
        setErro(""); setMsg(""); setSavingEdit(true);
        try {
            await updateConsulta(clubeId, editId, {
                ...editForm,
                staffId: editForm.staffId ? Number(editForm.staffId) : null,
            });
            setMsg("Consulta atualizada.");
            setEditOpen(false);
            const refreshed = await getConsultas(clubeId);
            setConsultas(Array.isArray(refreshed) ? refreshed : []);
        } catch (e2) {
            setErro(e2.message || "Erro ao atualizar.");
        } finally {
            setSavingEdit(false);
        }
    }

    return (
        <>
            <SideMenu title="Gestão de Clubes" subtitle={clube?.nome || "Clube"} logoHref="/menu" logoSrc="/LOGO_GCDC04.png" items={menuItems} />

            <div className="container" style={{ paddingTop: 24 }}>
                <div className="page-title page-title-with-icon">
                    <div className="page-title-main-wrap">
                        <span className="page-title-icon-circle" style={{ fontSize: "1.6rem" }}>🩺</span>
                        <div className="page-title-texts">
                            <h1>Consultas Médicas</h1>
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
                                <h2>Consultas</h2>
                                <span className="toolbar-count">{consultas.length} registo(s)</span>
                            </div>
                        </div>
                        {loading ? (
                            <p className="subtle">A carregar...</p>
                        ) : consultas.length === 0 ? (
                            <p className="subtle">Sem consultas registadas.</p>
                        ) : (
                            <div className="table-wrap">
                                <table className="dashboard-table">
                                    <thead>
                                        <tr>
                                            <th>Atleta</th>
                                            <th>Data</th>
                                            <th>Estado</th>
                                            <th>Tipo</th>
                                            <th>Motivo</th>
                                            <th>Diagnóstico</th>
                                            <th>Staff</th>
                                            <th>Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {consultas.map((row) => {
                                            const badge = ESTADO_BADGE[row.estado] || { label: row.estado || "—", color: "#888" };
                                            return (
                                                <tr key={row.id}>
                                                    <td>{row.atletaNome || `#${row.atletaId}`}</td>
                                                    <td>{fmt(row.dataConsulta)}</td>
                                                    <td>
                                                        <span style={{
                                                            display: "inline-block",
                                                            padding: "2px 10px",
                                                            borderRadius: 99,
                                                            fontSize: "0.78rem",
                                                            fontWeight: 600,
                                                            background: badge.color + "22",
                                                            color: badge.color,
                                                            border: `1px solid ${badge.color}44`,
                                                        }}>{badge.label}</span>
                                                    </td>
                                                    <td>{row.tipo}</td>
                                                    <td className="cell-muted" style={{ maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.motivo || "-"}</td>
                                                    <td className="cell-muted" style={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.diagnostico || "-"}</td>
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
                            <div className="toolbar-title-group"><h2>Registar consulta</h2></div>
                            <button type="button" className="btn" onClick={() => setShowForm((p) => !p)}>
                                {showForm ? "Fechar" : "Nova consulta"}
                            </button>
                        </div>
                        {showForm && (
                            <div className="form-scroll">
                            <form onSubmit={onSubmit} className="row">
                                <FormFields values={form} onChange={onChange} atletasList={atletasList} staffList={staffList} />
                                <div className="actions" style={{ marginTop: 8 }}>
                                    <button type="submit" className="btn btn-primary" disabled={saving}>
                                        {saving ? "A guardar..." : "Guardar"}
                                    </button>
                                </div>
                            </form>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {editOpen && (
                <div className="modal-overlay" onClick={() => setEditOpen(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Editar Consulta</h2>
                            <button type="button" className="btn-close" onClick={() => setEditOpen(false)}>✕</button>
                        </div>
                        <div className="modal-body">
                            {erro && <div className="alert error">{erro}</div>}
                            <FormFields values={editForm} onChange={onEditChange} atletasList={atletasList} staffList={staffList} />
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
