import { useEffect, useMemo, useRef, useState } from "react";
import { usePagination } from "../hooks/usePagination";
import Pagination from "../components/Pagination";
import { useNavigate, useParams } from "react-router-dom";
import SideMenu from "../components/SideMenu";
import TelefoneInput from "../components/TelefoneInput";
import { useAuth } from "../auth/AuthContext";
import { getClubeById, getUploadUrl, uploadStaffFoto } from "../api";
import {
    createStaff,
    getCargosStaff,
    getEscaloesStaff,
    getStaffByDepartamento,
    updateStaff,
    updateStaffAfetacao,
} from "../services/staff";
import { exportToCsv, exportToPdf, printPdf } from "../utils/export";
import { validateTelefone } from "../utils/validation";

import direcaoIcon from "../assets/direcao.svg";
import deptMedicoIcon from "../assets/departamento-medico.svg";

const DEPT_CONFIG = {
    direcao: {
        titulo: "Direção",
        icon: direcaoIcon,
        cargosFilter: ["Presidente", "Secretário"],
        emptyMsg: "Sem membros da direção registados.",
    },
    medico: {
        titulo: "Departamento Médico",
        icon: deptMedicoIcon,
        cargosFilter: ["Médico", "Enfermeiro", "Fisioterapeuta", "Massagista"],
        emptyMsg: "Sem membros do departamento médico registados.",
    },
};

function formatDateOnly(value) {
    if (!value) return "";
    const text = String(value).trim();
    if (!text) return "";
    return text.includes("T") ? text.split("T")[0] : text.slice(0, 10);
}

function staffToEditForm(item) {
    return {
        id: item?.id ?? null,
        afetacaoId: item?.afetacaoId ?? item?.afetacao_id ?? null,
        nome: item?.nome || "",
        email: item?.email || "",
        telefone: item?.telefone || "",
        morada: item?.morada || "",
        numRegisto: item?.numRegisto || item?.num_registo || "",
        remuneracao: item?.remuneracao != null ? String(item.remuneracao) : "0.00",
        cargoId: String(item?.cargoId ?? item?.cargo_id ?? ""),
        dataInicio: formatDateOnly(item?.dataInicio || item?.data_inicio || ""),
        dataFim: formatDateOnly(item?.dataFim || item?.data_fim || ""),
        observacoes: item?.observacoes || "",
        ativo: item?.ativo ?? true,
        escaloesIds: Array.isArray(item?.escaloesIds)
            ? item.escaloesIds.map((v) => String(v))
            : Array.isArray(item?.escaloes_ids)
                ? item.escaloes_ids.map((v) => String(v))
                : [],
        fotoPath: item?.fotoPath || item?.foto_path || null,
    };
}

function hasPendingName(value) {
    return !value || String(value).trim() === "-";
}

function PendingNameCell() {
    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                gap: "4px",
                padding: "8px 10px",
                borderRadius: "10px",
                background: "rgba(255, 193, 7, 0.14)",
                border: "1px solid rgba(255, 193, 7, 0.38)",
                boxShadow: "inset 0 0 0 1px rgba(255, 255, 255, 0.04)",
            }}
        >
            <div style={{ color: "#ffd166", fontWeight: 800 }}>
                ⚠ Completar dados de inscrição
            </div>
            <div style={{ fontSize: "0.8rem", opacity: 0.9 }}>
                Registo criado por aprovação administrativa
            </div>
        </div>
    );
}

function getOptionLabel(item) {
    if (item == null) return "";
    if (typeof item === "string" || typeof item === "number") return String(item);
    return item.nome || item.descricao || item.designacao || item.label || item.value || "";
}

function getOptionValue(item) {
    if (item == null) return "";
    if (typeof item === "string" || typeof item === "number") return String(item);
    return item.id != null ? String(item.id) : String(item.value ?? "");
}

export default function ClubeDepartamentoStaffPage() {
    const { clubeId, tipo } = useParams();
    const navigate = useNavigate();
    const { logout, isAdmin, isSuperAdmin, isDepartamentoMedico, user, isScopedAdmin, isSecretario } = useAuth();
    
    const canManageFotos = isSuperAdmin || isAdmin || isScopedAdmin || isSecretario;

    const config = DEPT_CONFIG[tipo];

    useEffect(() => {
        if (isDepartamentoMedico && tipo !== "medico") {
            navigate(`/clubes/${clubeId}/medico`, { replace: true });
        }
    }, [isDepartamentoMedico, tipo, clubeId, navigate]);

    const isOwnRow = (row) => row.utilizadorId != null && row.utilizadorId === user?.id;

    const [clube, setClube] = useState(null);
    const [staffRows, setStaffRows] = useState([]);
    const [allCargos, setAllCargos] = useState([]);
    const [escaloes, setEscaloes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [erro, setErro] = useState("");
    const [msg, setMsg] = useState("");

    const [showForm, setShowForm] = useState(false);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
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
        ativo: true,
        escaloesIds: [],
    });

    const [editOpen, setEditOpen] = useState(false);
    const [savingEdit, setSavingEdit] = useState(false);
    const [editForm, setEditForm] = useState(staffToEditForm(null));

    const fotoInputRef = useRef(null);
    const formFotoInputRef = useRef(null);
    const [fotoTargetId, setFotoTargetId] = useState(null);

    const { paginated: staffPaginados, ...staffPaginationProps } = usePagination(staffRows, 25);

    const deptCargos = useMemo(
        () => {
            if (!config) return [];
            const filter = config.cargosFilter.map((n) => n.toLowerCase());
            return allCargos.filter((c) => filter.includes((c.nome || "").toLowerCase()));
        },
        [allCargos, config]
    );

    const menuItems = useMemo(
        () => {
            if (isDepartamentoMedico) {
                return [
                    { label: "Módulo Clínico", to: `/clubes/${clubeId}/medico` },
                    {
                        label: "Logout",
                        onClick: () => {
                            logout();
                            navigate("/login", { replace: true });
                        },
                    },
                ];
            }
            return [
                { label: "Home", to: "/menu" },
                ...(isSuperAdmin ? [{ label: "Clubes", to: "/clubes" }] : []),
                ...(isSuperAdmin ? [{ label: "Coletividades", to: "/coletividades" }] : []),
                ...(isAdmin ? [{ label: "Perfis", to: "/admin/users" }] : []),
                { label: "Modalidades do Clube", to: `/clubes/${clubeId}/modalidades` },
                { label: "Atletas", to: `/clubes/${clubeId}/atletas` },
                { label: "Staff", to: `/clubes/${clubeId}/staff` },
                { label: "Transferências", to: `/clubes/${clubeId}/transferencias` },
                {
                    label: "Logout",
                    onClick: () => {
                        logout();
                        navigate("/login", { replace: true });
                    },
                },
            ];
        },
        [clubeId, isAdmin, isSuperAdmin, isDepartamentoMedico, logout, navigate]
    );

    useEffect(() => {
        async function carregar() {
            if (!clubeId || !tipo || !config) return;

            setErro("");
            setLoading(true);

            try {
                const [clubeData, cargosData, escaloesData, staffData] = await Promise.all([
                    getClubeById(clubeId),
                    getCargosStaff(),
                    getEscaloesStaff(),
                    getStaffByDepartamento(clubeId, tipo),
                ]);

                setClube(clubeData || null);
                setAllCargos(Array.isArray(cargosData) ? cargosData : []);
                setEscaloes(Array.isArray(escaloesData) ? escaloesData : []);
                setStaffRows(Array.isArray(staffData) ? staffData : []);
            } catch (e) {
                setErro(e.message || "Não foi possível carregar o departamento.");
                setStaffRows([]);
            } finally {
                setLoading(false);
            }
        }

        carregar();
    }, [clubeId, tipo, config]);

    function handleAvatarClick(staffId) {
        if (!canManageFotos) return;
        setFotoTargetId(staffId);
        if (fotoInputRef.current) {
            fotoInputRef.current.value = "";
            fotoInputRef.current.click();
        }
    }

    async function handleFotoChange(e) {
        const file = e.target.files?.[0];
        if (!file || !fotoTargetId) return;
        try {
            const res = await uploadStaffFoto(fotoTargetId, file);
            if (res?.fotoPath) {
                setStaffRows((prev) =>
                    prev.map((s) => (s.id === fotoTargetId ? { ...s, fotoPath: res.fotoPath } : s))
                );
            }
        } catch (err) {
            setErro("Erro ao fazer upload da foto: " + (err.message || ""));
        }
        setFotoTargetId(null);
    }
    
    async function handleFormFotoChange(e) {
        const file = e.target.files?.[0];
        if (!file || !editForm.id) return;
        
        try {
            const res = await uploadStaffFoto(editForm.id, file);
            if (res?.fotoPath) {
                setEditForm(prev => ({ ...prev, fotoPath: res.fotoPath }));
                setStaffRows(prev =>
                    prev.map(s => s.id === editForm.id ? { ...s, fotoPath: res.fotoPath } : s)
                );
            }
        } catch (err) {
            alert("Erro ao fazer upload da foto: " + (err.message || ""));
        }
    }
    
    async function handleRemoverFoto() {
        if (!editForm.id) return;
        if (!window.confirm("Tem a certeza que deseja remover a foto?")) return;
        
        try {
             setEditForm(prev => ({ ...prev, fotoPath: null }));
             alert("Aviso: A remoção da foto apenas será efetiva ao guardar as alterações, caso o servidor o suporte.");
        } catch {
             alert("Erro ao remover foto.");
        }
    }

    function onChange(e) {
        const { name, value, type, checked } = e.target;
        setForm((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    }

    function toggleEscalaoForm(id) {
        setForm((prev) => {
            const current = prev.escaloesIds || [];
            const normalized = String(id);
            const exists = current.includes(normalized);
            return {
                ...prev,
                escaloesIds: exists
                    ? current.filter((item) => item !== normalized)
                    : [...current, normalized],
            };
        });
    }

    async function onSubmit(e) {
        e.preventDefault();
        if (!form.nome.trim()) {
            setErro("Indica o nome.");
            return;
        }
        if (!form.cargoId) {
            setErro("Seleciona um cargo.");
            return;
        }
        const telErr = validateTelefone(form.telefone);
        if (telErr) { setErro(telErr); return; }

        setErro("");
        setMsg("");
        setSaving(true);

        try {
            await createStaff(clubeId, {
                nome: form.nome.trim(),
                email: form.email.trim() || null,
                telefone: form.telefone.trim() || null,
                morada: form.morada.trim() || null,
                numRegisto: form.numRegisto.trim() || null,
                remuneracao: Number(form.remuneracao || 0),
                modalidadeId: null,
                cargoId: Number(form.cargoId),
                dataInicio: form.dataInicio || null,
                dataFim: form.dataFim || null,
                observacoes: form.observacoes.trim() || null,
                ativo: Boolean(form.ativo),
                escaloesIds: (form.escaloesIds || []).map((id) => Number(id)),
            });

            setMsg("Membro registado com sucesso.");
            setForm({
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
                ativo: true,
                escaloesIds: [],
            });

            const refreshed = await getStaffByDepartamento(clubeId, tipo);
            setStaffRows(Array.isArray(refreshed) ? refreshed : []);
        } catch (e2) {
            setErro(e2.message || "Não foi possível registar.");
        } finally {
            setSaving(false);
        }
    }

    function abrirEditar(item) {
        setEditForm(staffToEditForm(item));
        setEditOpen(true);
    }

    function fecharEditar() {
        setEditOpen(false);
    }

    function onEditChange(e) {
        const { name, value, type, checked } = e.target;
        setEditForm((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    }

    function toggleEscalaoEdit(id) {
        setEditForm((prev) => {
            const normalized = String(id);
            const current = prev.escaloesIds || [];
            const exists = current.includes(normalized);
            return {
                ...prev,
                escaloesIds: exists
                    ? current.filter((item) => item !== normalized)
                    : [...current, normalized],
            };
        });
    }

    async function guardarEdicao() {
        if (!editForm.id || !editForm.afetacaoId) return;
        const telErr = validateTelefone(editForm.telefone);
        if (telErr) { setErro(telErr); return; }

        setSavingEdit(true);
        setErro("");
        setMsg("");

        try {
            await updateStaff(clubeId, editForm.id, {
                nome: editForm.nome,
                email: editForm.email,
                telefone: editForm.telefone,
                morada: editForm.morada,
                ...(isDepartamentoMedico ? {} : { numRegisto: editForm.numRegisto }),
                ...(isDepartamentoMedico ? {} : { remuneracao: Number(editForm.remuneracao || 0) }),
                fotoPath: editForm.fotoPath,
            });

            if (!isDepartamentoMedico) {
                await updateStaffAfetacao(clubeId, editForm.id, editForm.afetacaoId, {
                    cargoId: editForm.cargoId ? Number(editForm.cargoId) : null,
                    dataInicio: editForm.dataInicio || null,
                    dataFim: editForm.dataFim || null,
                    observacoes: editForm.observacoes || null,
                    ativo: Boolean(editForm.ativo),
                    escaloesIds: (editForm.escaloesIds || []).map((id) => Number(id)),
                });
            }

            const refreshed = await getStaffByDepartamento(clubeId, tipo);
            setStaffRows(Array.isArray(refreshed) ? refreshed : []);
            setMsg("Membro atualizado com sucesso.");
            setEditOpen(false);
        } catch (e2) {
            setErro(e2.message || "Não foi possível editar.");
        } finally {
            setSavingEdit(false);
        }
    }

    if (!config) {
        return (
            <div className="container" style={{ paddingTop: 24 }}>
                <div className="alert error">Tipo de departamento inválido.</div>
            </div>
        );
    }

    function prepareExportData() {
        const isNotMedico = !isDepartamentoMedico;
        const columns = [
            { key: "nome", label: "Nome" },
            { key: "email", label: "Email" },
            { key: "telefone", label: "Telefone" },
            { key: "cargo", label: "Cargo" },
            { key: "numRegisto", label: "Nº Registo" },
            ...(isNotMedico ? [
                { key: "remuneracao", label: "Remuneração" },
                { key: "dataInicio", label: "Data Início" },
            ] : []),
        ];
        const dataToExport = staffRows.map((row) => ({
            nome: row.nome || "-",
            email: row.email || "-",
            telefone: row.telefone || "-",
            cargo: row.cargo || "-",
            numRegisto: row.numRegisto || row.num_registo || "-",
            remuneracao: isNotMedico ? (row.remuneracao != null ? row.remuneracao : "-") : undefined,
            dataInicio: isNotMedico ? (row.dataInicio || row.data_inicio
                ? new Date(row.dataInicio || row.data_inicio).toLocaleDateString("pt-PT")
                : "-") : undefined,
        }));
        return { columns, dataToExport };
    }

    function handleExportCsv() {
        const { columns, dataToExport } = prepareExportData();
        exportToCsv(dataToExport, columns, `${tipo}_${clube?.nome || clubeId}.csv`);
    }

    function handleExportPdf() {
        const { columns, dataToExport } = prepareExportData();
        exportToPdf({
            data: dataToExport,
            columns,
            title: `${config.titulo} — Membros`,
            clubName: clube?.nome,
            clubLogoUrl: getUploadUrl(clube?.logoPath),
            filename: `${tipo}_${clube?.nome || clubeId}.pdf`,
            generatedText: "Criado em",
        });
    }

    function handlePrint() {
        const { columns, dataToExport } = prepareExportData();
        printPdf({
            data: dataToExport,
            columns,
            title: `${config.titulo} — Membros`,
            clubName: clube?.nome,
            clubLogoUrl: getUploadUrl(clube?.logoPath),
            generatedText: "Criado em",
        });
    }

    return (
        <>
            {canManageFotos && (
                <input
                    type="file"
                    accept="image/*"
                    ref={fotoInputRef}
                    style={{ display: "none" }}
                    onChange={handleFotoChange}
                />
            )}
            <SideMenu
                title="Gestão de Coletividades"
                subtitle={clube?.nome || "Clube"}
                logoHref="/menu"
                logoSrc="/LOGO_GCDC04.png"
                items={menuItems}
            />

            <div className="container" style={{ paddingTop: 24 }}>
                <div className="page-title page-title-with-icon">
                    <div className="page-title-main-wrap">
                        <span className="page-title-icon-circle">
                            <img src={config.icon} alt={config.titulo} className="page-title-icon" />
                        </span>
                        <div className="page-title-texts">
                            <h1>{config.titulo}</h1>
                        </div>
                    </div>

                    <div className="actions">
                        {tipo === "medico" && (
                            <button type="button" className="btn btn-primary" onClick={() => navigate(`/clubes/${clubeId}/medico`)}>
                                Módulo Clínico 🩺
                            </button>
                        )}
                        <button type="button" className="btn" onClick={() => navigate(`/clubes/${clubeId}/staff`)}>
                            Voltar
                        </button>
                    </div>
                </div>

                <div className="hint">{clube?.nome || ""}</div>

                {erro ? <div className="alert error">{erro}</div> : null}
                {msg ? <div className="alert ok">{msg}</div> : null}

                <div className="stack-sections">
                    <div className="card">
                        <div className="modalidades-toolbar">
                            <div className="toolbar-title-group">
                                <h2>Membros</h2>
                                <span className="toolbar-count">{staffRows.length} registo(s)</span>
                            </div>
                            {staffRows.length > 0 && (
                                <div className="toolbar-actions" style={{ display: "flex", gap: 6 }}>
                                    <button type="button" className="btn btn-sm" onClick={handleExportCsv}>CSV</button>
                                    <button type="button" className="btn btn-sm" onClick={handleExportPdf}>PDF</button>
                                    <button type="button" className="btn btn-sm" onClick={handlePrint}>Imprimir</button>
                                </div>
                            )}
                        </div>

                        {loading ? (
                            <p className="subtle">A carregar...</p>
                        ) : staffRows.length === 0 ? (
                            <p className="subtle">{config.emptyMsg}</p>
                        ) : (
                            <>
                            <div className="table-wrap">
                                <table className="dashboard-table">
                                    <thead>
                                    <tr>
                                        <th>Nome</th>
                                        <th>Email</th>
                                        <th>Telefone</th>
                                        <th>Cargo</th>
                                        <th>Nº Registo</th>
                                        {!isDepartamentoMedico && <th>Remuneração</th>}
                                        {!isDepartamentoMedico && <th>Data Início</th>}
                                        <th>Ações</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {staffPaginados.map((row) => {
                                        const pendingName = hasPendingName(row.nome);
                                        const canEdit = !isDepartamentoMedico || isOwnRow(row);
                                        return (
                                            <tr
                                                key={`${row.id}-${row.afetacaoId}`}
                                                style={
                                                    pendingName
                                                        ? {
                                                            background: "rgba(255, 193, 7, 0.18)",
                                                            boxShadow: "inset 5px 0 0 #ffcc33",
                                                        }
                                                        : {}
                                                }
                                            >
                                                <td className="nowrap">
                                                    <span className="nome-com-avatar">
                                                        <span
                                                            className={canManageFotos ? "avatar-upload-trigger clickable" : ""}
                                                            title={canManageFotos ? "Clique para alterar foto" : undefined}
                                                            onClick={canManageFotos ? (e) => { e.stopPropagation(); handleAvatarClick(row.id); } : undefined}
                                                            style={{ cursor: canManageFotos ? 'pointer' : 'default' }}
                                                        >
                                                            {row.fotoPath ? (
                                                                <img
                                                                    src={getUploadUrl(row.fotoPath)}
                                                                    alt={row.nome}
                                                                    className="avatar-circle-sm"
                                                                />
                                                            ) : (
                                                                <span className="avatar-circle-sm avatar-initials-sm">
                                                                    {(row.nome || "?")[0].toUpperCase()}
                                                                </span>
                                                            )}
                                                        </span>
                                                        {pendingName ? <PendingNameCell /> : row.nome}
                                                    </span>
                                                </td>
                                                <td className="cell-muted">{row.email || "-"}</td>
                                                <td className="cell-muted">{row.telefone || "-"}</td>
                                                <td>{row.cargo || "-"}</td>
                                                <td>{row.numRegisto || row.num_registo || "-"}</td>
                                                {!isDepartamentoMedico && <td>{row.remuneracao != null ? row.remuneracao : "-"}</td>}
                                                {!isDepartamentoMedico && <td>{formatDateOnly(row.dataInicio || row.data_inicio) || "-"}</td>}
                                                <td>
                                                    <div className="table-actions">
                                                        {canEdit && (
                                                            <button type="button" className="btn" onClick={() => abrirEditar(row)}>
                                                                Editar
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    </tbody>
                                </table>
                            </div>
                            <Pagination {...staffPaginationProps} />
                            </>
                        )}
                    </div>

                    {!isDepartamentoMedico && (
                    <div className="card">
                        <div className="modalidades-toolbar">
                            <div className="toolbar-title-group">
                                <h2>Registar membro</h2>
                            </div>
                            <button
                                type="button"
                                className="btn"
                                onClick={() => setShowForm((prev) => !prev)}
                            >
                                {showForm ? "Fechar" : "Novo registo"}
                            </button>
                        </div>

                        {showForm ? (
                            <div className="form-scroll">
                            <form onSubmit={onSubmit} className="row">
                                <div className="row2">
                                    <div className="row">
                                        <label className="field-label" htmlFor="cargoId">Cargo</label>
                                        <select id="cargoId" className="input" name="cargoId" value={form.cargoId} onChange={onChange} required>
                                            <option value="">Selecionar</option>
                                            {deptCargos.map((cargo) => (
                                                <option key={cargo.id} value={cargo.id}>{cargo.nome}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="row">
                                        <label className="field-label" htmlFor="nome">Nome</label>
                                        <input id="nome" className="input" name="nome" value={form.nome} onChange={onChange} placeholder="Nome" required />
                                    </div>
                                </div>

                                <div className="row2">
                                    <div className="row">
                                        <label className="field-label" htmlFor="email">Email</label>
                                        <input id="email" className="input" name="email" type="email" value={form.email} onChange={onChange} placeholder="email@exemplo.pt" />
                                    </div>
                                    <div className="row">
                                        <label className="field-label" htmlFor="telefone">Telefone</label>
                                        <TelefoneInput name="telefone" value={form.telefone} onChange={onChange} />
                                    </div>
                                </div>

                                <div className="row2">
                                    <div className="row">
                                        <label className="field-label" htmlFor="numRegisto">Nº Registo</label>
                                        <input id="numRegisto" className="input" name="numRegisto" value={form.numRegisto} onChange={onChange} placeholder="Registo profissional" />
                                    </div>
                                    <div className="row">
                                        <label className="field-label" htmlFor="remuneracao">Remuneração</label>
                                        <input id="remuneracao" className="input" name="remuneracao" type="number" min="0" step="0.01" value={form.remuneracao} onChange={onChange} />
                                    </div>
                                </div>

                                <div className="row">
                                    <label className="field-label" htmlFor="morada">Morada</label>
                                    <input id="morada" className="input" name="morada" value={form.morada} onChange={onChange} placeholder="Morada" />
                                </div>

                                <div className="row2">
                                    <div className="row">
                                        <label className="field-label" htmlFor="dataInicio">Data início</label>
                                        <input id="dataInicio" className="input" name="dataInicio" type="date" value={form.dataInicio} onChange={onChange} />
                                    </div>
                                    <div className="row">
                                        <label className="field-label" htmlFor="dataFim">Data fim</label>
                                        <input id="dataFim" className="input" name="dataFim" type="date" value={form.dataFim} onChange={onChange} />
                                    </div>
                                </div>

                                {escaloes.length > 0 ? (
                                    <div className="row">
                                        <label className="field-label">Escalões</label>
                                        <div className="checkbox-grid">
                                            {escaloes.map((escalao) => {
                                                const checked = form.escaloesIds.includes(String(escalao.id));
                                                return (
                                                    <label className="filter-checkbox" key={escalao.id}>
                                                        <input type="checkbox" checked={checked} onChange={() => toggleEscalaoForm(escalao.id)} />
                                                        {escalao.nome}
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ) : null}

                                <div className="row">
                                    <label className="field-label" htmlFor="observacoes">Observações</label>
                                    <textarea id="observacoes" className="input" name="observacoes" value={form.observacoes} onChange={onChange} rows={3} />
                                </div>

                                <label className="filter-checkbox">
                                    <input type="checkbox" name="ativo" checked={form.ativo} onChange={onChange} />
                                    Afetação ativa
                                </label>

                                <div className="actions">
                                    <button className="btn btn-primary" type="submit" disabled={saving}>
                                        {saving ? "A guardar..." : "Registar"}
                                    </button>
                                </div>
                            </form>
                            </div>
                        ) : null}
                    </div>
                    )}
                </div>
            </div>

            {editOpen ? (
                <div className="modal-backdrop" onClick={fecharEditar}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Editar membro</h3>
                            <button type="button" className="btn modal-close" onClick={fecharEditar}>
                                ×
                            </button>
                        </div>

                        {canManageFotos && (
                            <div className="row" style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px', padding: '10px', background: '#f8f9fa', borderRadius: '8px' }}>
                                <div className="avatar-preview" style={{ width: '80px', height: '80px', borderRadius: '50%', overflow: 'hidden', backgroundColor: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    {editForm.fotoPath ? (
                                        <img src={getUploadUrl(editForm.fotoPath)} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <span style={{ fontSize: '24px', color: '#64748b' }}>{(editForm.nome || "?")[0].toUpperCase()}</span>
                                    )}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#334155' }}>Foto de Perfil</h4>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <input 
                                            type="file" 
                                            ref={formFotoInputRef} 
                                            style={{ display: 'none' }} 
                                            accept="image/*"
                                            onChange={handleFormFotoChange}
                                        />
                                        <button 
                                            type="button" 
                                            className="btn btn-sm btn-upload-photo" 
                                            onClick={() => formFotoInputRef.current?.click()}
                                        >
                                            Alterar foto
                                        </button>
                                        {editForm.fotoPath && (
                                            <button 
                                                type="button" 
                                                className="btn btn-sm btn-danger"
                                                onClick={handleRemoverFoto}
                                            >
                                                Remover foto
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="row">
                            {!isDepartamentoMedico && (
                                <div className="row2">
                                    <div className="row">
                                        <label className="field-label" htmlFor="editNome">Nome</label>
                                        <input id="editNome" className="input" name="nome" value={editForm.nome} onChange={onEditChange} />
                                    </div>
                                    <div className="row">
                                        <label className="field-label" htmlFor="editNumRegisto">Nº Registo</label>
                                        <input id="editNumRegisto" className="input" name="numRegisto" value={editForm.numRegisto} onChange={onEditChange} />
                                    </div>
                                </div>
                            )}

                            <div className="row2">
                                <div className="row">
                                    <label className="field-label" htmlFor="editEmail">Email</label>
                                    <input id="editEmail" className="input" name="email" type="email" value={editForm.email} onChange={onEditChange} />
                                </div>
                                <div className="row">
                                    <label className="field-label" htmlFor="editTelefone">Telefone</label>
                                    <TelefoneInput name="telefone" value={editForm.telefone} onChange={onEditChange} />
                                </div>
                            </div>

                            <div className="row">
                                <label className="field-label" htmlFor="editMorada">Morada</label>
                                <input id="editMorada" className="input" name="morada" value={editForm.morada} onChange={onEditChange} />
                            </div>

                            {!isDepartamentoMedico && (
                                <>
                                    <div className="row2">
                                        <div className="row">
                                            <label className="field-label" htmlFor="editRemuneracao">Remuneração</label>
                                            <input id="editRemuneracao" className="input" name="remuneracao" type="number" min="0" step="0.01" value={editForm.remuneracao} onChange={onEditChange} />
                                        </div>
                                        <div className="row">
                                            <label className="field-label" htmlFor="editCargoId">Cargo</label>
                                            <select id="editCargoId" className="input" name="cargoId" value={editForm.cargoId} onChange={onEditChange}>
                                                <option value="">Selecionar</option>
                                                {deptCargos.map((item) => {
                                                    const value = getOptionValue(item);
                                                    const label = getOptionLabel(item);
                                                    return <option key={value} value={value}>{label}</option>;
                                                })}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="row2">
                                        <div className="row">
                                            <label className="field-label" htmlFor="editDataInicio">Data início</label>
                                            <input id="editDataInicio" className="input" name="dataInicio" type="date" value={editForm.dataInicio} onChange={onEditChange} />
                                        </div>
                                        <div className="row">
                                            <label className="field-label" htmlFor="editDataFim">Data fim</label>
                                            <input id="editDataFim" className="input" name="dataFim" type="date" value={editForm.dataFim} onChange={onEditChange} />
                                        </div>
                                    </div>

                                    {escaloes.length > 0 ? (
                                        <div className="row">
                                            <label className="field-label">Escalões</label>
                                            <div className="checkbox-grid">
                                                {escaloes.map((escalao) => {
                                                    const checked = (editForm.escaloesIds || []).includes(String(escalao.id));
                                                    return (
                                                        <label className="filter-checkbox" key={escalao.id}>
                                                            <input type="checkbox" checked={checked} onChange={() => toggleEscalaoEdit(escalao.id)} />
                                                            {escalao.nome}
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ) : null}

                                    <div className="row">
                                        <label className="field-label" htmlFor="editObservacoes">Observações</label>
                                        <textarea id="editObservacoes" className="input" name="observacoes" rows={3} value={editForm.observacoes} onChange={onEditChange} />
                                    </div>

                                    <label className="filter-checkbox">
                                        <input type="checkbox" name="ativo" checked={editForm.ativo} onChange={onEditChange} />
                                        Afetação ativa
                                    </label>
                                </>
                            )}
                        </div>

                        <div className="modal-footer">
                            <button type="button" className="btn btn-primary" onClick={guardarEdicao} disabled={savingEdit}>
                                {savingEdit ? "A guardar..." : "Guardar"}
                            </button>
                            <button type="button" className="btn" onClick={fecharEditar}>Cancelar</button>
                        </div>
                    </div>
                </div>
            ) : null}
        </>
    );
}