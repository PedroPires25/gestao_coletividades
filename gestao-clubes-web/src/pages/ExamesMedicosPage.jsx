import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import SideMenu from "../components/SideMenu";
import { useAuth } from "../auth/AuthContext";
import { getClubeById, getUploadUrl } from "../api";
import { getExames, createExame, updateExame, uploadExameFicheiro, getExameFileUrl } from "../services/medico";
import { getStaffByDepartamento } from "../services/staff";
import { getAtletasByClube } from "../services/atletas";
import { exportToCsv, exportToPdf, printPdf } from "../utils/export";

const TIPOS_EXAME = [
    "Análises clínicas", "Electrocardiograma", "Ecocardiograma", "Raio-X",
    "Ressonância magnética", "TAC", "Ecografia", "Teste de esforço",
    "Densitometria óssea", "Outro",
];

function fmt(val) {
    if (!val) return "-";
    return String(val).includes("T") ? String(val).split("T")[0] : String(val).slice(0, 10);
}

const EMPTY_FORM = {
    atletaId: "",
    staffId: "",
    dataExame: new Date().toISOString().slice(0, 10),
    tipo: "",
    resultado: "",
    notas: "",
};

function FormFields({ values, onChange: onCh, fileRef, existingFile, atletasList, staffList }) {
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
                    <label className="field-label">Data do exame *</label>
                    <input className="input" name="dataExame" type="date" value={values.dataExame} onChange={onCh} required />
                </div>
                <div className="row">
                    <label className="field-label">Tipo *</label>
                    <select className="input" name="tipo" value={values.tipo} onChange={onCh} required>
                        <option value="">Selecionar tipo</option>
                        {TIPOS_EXAME.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>
            </div>
            <div className="row">
                <label className="field-label">Resultado</label>
                <textarea className="input" name="resultado" value={values.resultado} onChange={onCh} rows={3} placeholder="Resultado do exame..." />
            </div>
            <div className="row">
                <label className="field-label">Notas</label>
                <textarea className="input" name="notas" value={values.notas} onChange={onCh} rows={2} placeholder="Notas adicionais..." />
            </div>
            <div className="row">
                <label className="field-label">
                    Documentação anexa
                    <span className="cell-muted" style={{ fontWeight: 400, marginLeft: 6 }}>
                        (PDF, imagem, declaração de seguro, Mod.2…)
                    </span>
                </label>
                {existingFile && (
                    <div style={{ marginBottom: 6, fontSize: "0.85rem" }}>
                        Ficheiro atual:{" "}
                        <a href={getExameFileUrl(existingFile)} target="_blank" rel="noreferrer" style={{ color: "var(--color-primary, #6366f1)" }}>
                            📎 Ver / descarregar
                        </a>
                    </div>
                )}
                <input
                    className="input"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    ref={fileRef}
                />
                <div className="cell-muted" style={{ fontSize: "0.78rem", marginTop: 3 }}>
                    Formatos aceites: PDF, JPG, PNG, DOC, DOCX
                </div>
            </div>
        </>
    );
}

export default function ExamesMedicosPage() {
    const { clubeId } = useParams();
    const navigate = useNavigate();
    const { logout } = useAuth();

    const [clube, setClube] = useState(null);
    const [exames, setExames] = useState([]);
    const [staffList, setStaffList] = useState([]);
    const [atletasList, setAtletasList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [erro, setErro] = useState("");
    const [msg, setMsg] = useState("");

    const [showForm, setShowForm] = useState(false);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState(EMPTY_FORM);
    const fileInputRef = useRef(null);
    const editFileInputRef = useRef(null);

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
                    getExames(clubeId),
                    getStaffByDepartamento(clubeId, "medico"),
                    getAtletasByClube(clubeId),
                ]);
                setClube(clubeData || null);
                setExames(Array.isArray(data) ? data : []);
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
        if (!form.tipo) { setErro("Tipo de exame é obrigatório."); return; }
        if (!form.dataExame) { setErro("Data é obrigatória."); return; }
        setErro(""); setMsg(""); setSaving(true);
        try {
            const result = await createExame(clubeId, {
                ...form,
                atletaId: Number(form.atletaId),
                staffId: form.staffId ? Number(form.staffId) : null,
            });
            const file = fileInputRef.current?.files?.[0];
            if (file && result?.id) {
                await uploadExameFicheiro(clubeId, result.id, file);
                if (fileInputRef.current) fileInputRef.current.value = "";
            }
            setMsg("Exame registado com sucesso.");
            setForm(EMPTY_FORM);
            setShowForm(false);
            const refreshed = await getExames(clubeId);
            setExames(Array.isArray(refreshed) ? refreshed : []);
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
            dataExame: fmt(row.dataExame) !== "-" ? fmt(row.dataExame) : "",
            tipo: row.tipo || "",
            resultado: row.resultado || "",
            notas: row.notas || "",
            ficheiroPath: row.ficheiroPath || "",
        });
        setEditOpen(true);
    }

    async function guardarEdicao() {
        if (!editId) return;
        setErro(""); setMsg(""); setSavingEdit(true);
        try {
            await updateExame(clubeId, editId, {
                ...editForm,
                staffId: editForm.staffId ? Number(editForm.staffId) : null,
            });
            const file = editFileInputRef.current?.files?.[0];
            if (file) {
                await uploadExameFicheiro(clubeId, editId, file);
                if (editFileInputRef.current) editFileInputRef.current.value = "";
            }
            setMsg("Exame atualizado.");
            setEditOpen(false);
            const refreshed = await getExames(clubeId);
            setExames(Array.isArray(refreshed) ? refreshed : []);
        } catch (e2) {
            setErro(e2.message || "Erro ao atualizar.");
        } finally {
            setSavingEdit(false);
        }
    }

    function prepareExportData() {
        const columns = [
            { key: "atleta", label: "Atleta" },
            { key: "data", label: "Data" },
            { key: "tipo", label: "Tipo" },
            { key: "resultado", label: "Resultado" },
            { key: "staff", label: "Médico/Staff" },
            { key: "notas", label: "Notas" },
        ];
        const dataToExport = exames.map((row) => ({
            atleta: row.atletaNome || `#${row.atletaId}`,
            data: fmt(row.dataExame),
            tipo: row.tipo || "-",
            resultado: row.resultado || "-",
            staff: row.staffNome || "-",
            notas: row.notas || "-",
        }));
        return { columns, dataToExport };
    }

    function handleExportCsv() {
        const { columns, dataToExport } = prepareExportData();
        exportToCsv(dataToExport, columns, `exames_medicos_${clube?.nome || clubeId}.csv`);
    }

    function handleExportPdf() {
        const { columns, dataToExport } = prepareExportData();
        exportToPdf({
            data: dataToExport,
            columns,
            title: "Exames Médicos",
            clubName: clube?.nome,
            clubLogoUrl: getUploadUrl(clube?.logoPath),
            filename: `exames_medicos_${clube?.nome || clubeId}.pdf`,
        });
    }

    function handlePrint() {
        const { columns, dataToExport } = prepareExportData();
        printPdf({
            data: dataToExport,
            columns,
            title: "Exames Médicos",
            clubName: clube?.nome,
            clubLogoUrl: getUploadUrl(clube?.logoPath),
        });
    }

    return (
        <>
            <SideMenu title="Gestão de Clubes" subtitle={clube?.nome || "Clube"} logoHref="/menu" logoSrc="/LOGO_GCDC04.png" items={menuItems} />

            <div className="container" style={{ paddingTop: 24 }}>
                <div className="page-title page-title-with-icon">
                    <div className="page-title-main-wrap">
                        <span className="page-title-icon-circle" style={{ fontSize: "1.6rem" }}>🔬</span>
                        <div className="page-title-texts">
                            <h1>Exames Médicos</h1>
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
                                <h2>Exames</h2>
                                <span className="toolbar-count">{exames.length} registo(s)</span>
                            </div>
                            {exames.length > 0 && (
                                <div style={{ display: "flex", gap: 6 }}>
                                    <button type="button" className="btn btn-sm" onClick={handleExportCsv}>CSV</button>
                                    <button type="button" className="btn btn-sm" onClick={handleExportPdf}>PDF</button>
                                    <button type="button" className="btn btn-sm" onClick={handlePrint}>Imprimir</button>
                                </div>
                            )}
                        </div>
                        {loading ? (
                            <p className="subtle">A carregar...</p>
                        ) : exames.length === 0 ? (
                            <p className="subtle">Sem exames registados.</p>
                        ) : (
                            <div className="table-wrap">
                                <table className="dashboard-table">
                                    <thead>
                                        <tr>
                                            <th>Atleta</th>
                                            <th>Data</th>
                                            <th>Tipo</th>
                                            <th>Resultado</th>
                                            <th>Ficheiro</th>
                                            <th>Staff</th>
                                            <th>Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {exames.map((row) => (
                                            <tr key={row.id}>
                                                <td>{row.atletaNome || `#${row.atletaId}`}</td>
                                                <td>{fmt(row.dataExame)}</td>
                                                <td>{row.tipo}</td>
                                                <td className="cell-muted" style={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.resultado || "-"}</td>
                                                <td>
                                                    {row.ficheiroPath
                                                        ? <a href={getExameFileUrl(row.ficheiroPath)} target="_blank" rel="noreferrer" style={{ color: "var(--color-primary, #6366f1)" }}>📎</a>
                                                        : <span className="cell-muted">—</span>}
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
                            <div className="toolbar-title-group"><h2>Registar exame</h2></div>
                            <button type="button" className="btn" onClick={() => setShowForm((p) => !p)}>
                                {showForm ? "Fechar" : "Novo exame"}
                            </button>
                        </div>
                        {showForm && (
                            <div className="form-scroll">
                            <form onSubmit={onSubmit} className="row">
                                <FormFields values={form} onChange={onChange} fileRef={fileInputRef} existingFile={null} atletasList={atletasList} staffList={staffList} />
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
                            <h2>Editar Exame</h2>
                            <button type="button" className="btn-close" onClick={() => setEditOpen(false)}>✕</button>
                        </div>
                        <div className="modal-body">
                            {erro && <div className="alert error">{erro}</div>}
                            <FormFields values={editForm} onChange={onEditChange} fileRef={editFileInputRef} existingFile={editForm.ficheiroPath || null} atletasList={atletasList} staffList={staffList} />
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
