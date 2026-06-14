import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import SideMenu from "../components/SideMenu";
import TelefoneInput from "../components/TelefoneInput";
import { useAuth } from "../auth/AuthContext";
import { getClubeById, getUploadUrl, uploadStaffFoto } from "../api";
import {
    getCargosStaff,
    getEscaloesStaff,
    getModalidadesByClube,
    getStaffByClubeModalidade,
    updateStaff,
    updateStaffAfetacao,
} from "../services/staff";
import { exportToCsv, exportToPdf, printPdf } from "../utils/export";
import { validateTelefone } from "../utils/validation";

import atletasIcon from "../assets/atletas.svg";

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

function getClubeModalidadeId(item) {
    return String(item?.id ?? item?.clubeModalidadeId ?? item?.clube_modalidade_id ?? "");
}

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

function displayEscaloes(item) {
    if (item?.escaloesNomes) return item.escaloesNomes;
    if (item?.escaloes_nomes) return item.escaloes_nomes;
    return "-";
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

export default function ClubeStaffModalidadePage() {
    const { clubeId, clubeModalidadeId } = useParams();
    const navigate = useNavigate();
    const { logout, isAdmin, isSuperAdmin, isScopedAdmin, isSecretario } = useAuth();
    
    const canManageFotos = isSuperAdmin || isAdmin || isScopedAdmin || isSecretario;

    const [clube, setClube] = useState(null);
    const [modalidadeAtiva, setModalidadeAtiva] = useState(null);
    const [staffRows, setStaffRows] = useState([]);
    const [cargos, setCargos] = useState([]);
    const [escaloes, setEscaloes] = useState([]);

    const [loading, setLoading] = useState(true);
    const [erro, setErro] = useState("");
    const [msg, setMsg] = useState("");

    const [editOpen, setEditOpen] = useState(false);
    const [savingEdit, setSavingEdit] = useState(false);
    const [editForm, setEditForm] = useState({
        id: null,
        afetacaoId: null,
        nome: "",
        email: "",
        telefone: "",
        morada: "",
        numRegisto: "",
        remuneracao: "0.00",
        cargoId: "",
        dataInicio: "",
        dataFim: "",
        observacoes: "",
        ativo: true,
        escaloesIds: [],
        fotoPath: null,
    });

    const fotoInputRef = useRef(null);
    const formFotoInputRef = useRef(null);
    const [fotoTargetId, setFotoTargetId] = useState(null);

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
                setStaffRows(prev =>
                    prev.map(s => s.id === fotoTargetId ? { ...s, fotoPath: res.fotoPath } : s)
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

    const menuItems= useMemo(
        () => [
            { label: "Home", to: "/menu" },
            ...(isSuperAdmin ? [{ label: "Clubes", to: "/clubes" }] : []),
            ...(isSuperAdmin ? [{ label: "Coletividades", to: "/coletividades" }] : []),
            ...(isAdmin ? [{ label: "Perfis", to: "/admin/users" }] : []),
            { label: "Modalidades do Clube", to: `/clubes/${clubeId}/modalidades` },
            { label: "Atletas", to: `/clubes/${clubeId}/atletas` },
            { label: "Staff", to: `/clubes/${clubeId}/staff` },
            { label: "Transferências", to: `/clubes/${clubeId}/transferencias` },
            { label: "Eventos", to: `/clubes/${clubeId}/clube-modalidade/${clubeModalidadeId}/eventos` },
            {
                label: "Logout",
                onClick: () => {
                    logout();
                    navigate("/login", { replace: true });
                },
            },
        ],
        [clubeId, clubeModalidadeId, isAdmin, isSuperAdmin, logout, navigate]
    );

    useEffect(() => {
        async function carregar() {
            if (!clubeId || !clubeModalidadeId) return;

            setErro("");
            setLoading(true);

            try {
                const [clubeData, modalidadesData, cargosData, escaloesData] = await Promise.all([
                    getClubeById(clubeId),
                    getModalidadesByClube(clubeId),
                    getCargosStaff(),
                    getEscaloesStaff(),
                ]);

                const modalidades = Array.isArray(modalidadesData) ? modalidadesData : [];
                const modalidadeSelecionada = modalidades.find(
                    (item) => getClubeModalidadeId(item) === String(clubeModalidadeId)
                );

                if (!modalidadeSelecionada) {
                    setErro("Modalidade não encontrada para este clube.");
                    setLoading(false);
                    return;
                }

                const staffData = await getStaffByClubeModalidade(clubeId, clubeModalidadeId);

                setClube(clubeData || null);
                setModalidadeAtiva(modalidadeSelecionada);
                setStaffRows(Array.isArray(staffData) ? staffData : []);
                setCargos(Array.isArray(cargosData) ? cargosData : []);
                setEscaloes(Array.isArray(escaloesData) ? escaloesData : []);
            } catch (e) {
                setErro(e.message || "Não foi possível carregar o staff da modalidade.");
                setStaffRows([]);
                setModalidadeAtiva(null);
            } finally {
                setLoading(false);
            }
        }

        carregar();
    }, [clubeId, clubeModalidadeId]);

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

    function toggleEscalao(id) {
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
                numRegisto: editForm.numRegisto,
                remuneracao: Number(editForm.remuneracao || 0),
                fotoPath: editForm.fotoPath,
            });

            await updateStaffAfetacao(clubeId, editForm.id, editForm.afetacaoId, {
                cargoId: editForm.cargoId ? Number(editForm.cargoId) : null,
                dataInicio: editForm.dataInicio || null,
                dataFim: editForm.dataFim || null,
                observacoes: editForm.observacoes || null,
                ativo: Boolean(editForm.ativo),
                escaloesIds: (editForm.escaloesIds || []).map((id) => Number(id)),
            });

            const refreshed = await getStaffByClubeModalidade(clubeId, clubeModalidadeId);
            setStaffRows(Array.isArray(refreshed) ? refreshed : []);
            setMsg("Staff atualizado com sucesso.");
            setEditOpen(false);
        } catch (e) {
            setErro(e.message || "Não foi possível editar o staff.");
        } finally {
            setSavingEdit(false);
        }
    }

    const prepareExportData = () => {
        const columns = [
            { key: 'nome', label: 'Nome' },
            { key: 'email', label: 'Email' },
            { key: 'telefone', label: 'Telefone' },
            { key: 'morada', label: 'Morada' },
            { key: 'numRegisto', label: 'Nº Registo' },
            { key: 'remuneracao', label: 'Remuneração' },
            { key: 'cargo', label: 'Cargo' },
            { key: 'escaloes', label: 'Escalões' },
            { key: 'epoca', label: 'Época' },
            { key: 'dataInicio', label: 'Data Início' },
        ];
        const dataToExport = staffRows.map(row => ({
            ...row,
            escaloes: displayEscaloes(row),
            dataInicio: formatDateOnly(row.dataInicio || row.data_inicio) || "-",
            numRegisto: row.numRegisto || row.num_registo || "-",
        }));
        return { columns, dataToExport };
    };

    const handleExportCsv = () => {
        const { columns, dataToExport } = prepareExportData();
        exportToCsv(dataToExport, columns, `staff_${modalidadeAtiva?.modalidade?.nome || 'modalidade'}.csv`);
    };

    const handlePrint = () => {
        const { columns, dataToExport } = prepareExportData();
        printPdf({
            data: dataToExport,
            columns,
            title: `Staff - ${modalidadeAtiva?.modalidade?.nome || 'Modalidade'}`,
            clubName: clube?.nome,
            clubLogoUrl: getUploadUrl(clube?.logoPath),
            generatedText: "Criado em",
        });
    };

    const handleExportPdf = () => {
        const { columns, dataToExport } = prepareExportData();
        exportToPdf({
            data: dataToExport,
            columns,
            title: `Staff - ${modalidadeAtiva?.modalidade?.nome || 'Modalidade'}`,
            clubName: clube?.nome,
            clubLogoUrl: getUploadUrl(clube?.logoPath),
            filename: `staff_${modalidadeAtiva?.modalidade?.nome || 'modalidade'}.pdf`,
            generatedText: "Criado em",
        });
    };

    return (
        <>
            <style>{`
                .btn-upload-photo {
                    color: #333 !important;
                    border: 1px solid #ccc !important;
                    background-color: #fff !important;
                    padding: 6px 12px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 14px;
                    text-align: center;
                }
                .btn-upload-photo:hover {
                    background-color: #f0f0f0 !important;
                }
            `}</style>
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
                <div className="page-title page-title-with-icon no-print">
                    <div className="page-title-main-wrap">
                        <span className="page-title-icon-circle">
                            <img src={atletasIcon} alt="Staff" className="page-title-icon" />
                        </span>
                        <div className="page-title-texts">
                            <h1>{modalidadeAtiva?.modalidade?.nome || "Staff da modalidade"}</h1>
                        </div>
                    </div>

                    <div className="actions">
                        <button type="button" className="btn" onClick={() => navigate(`/clubes/${clubeId}/staff`)}>
                            Voltar
                        </button>
                    </div>
                </div>

                {erro ? <div className="alert error no-print">{erro}</div> : null}
                {msg ? <div className="alert ok no-print">{msg}</div> : null}

                <div className="card">
                    <div className="modalidades-toolbar">
                        <div className="toolbar-title-group">
                            <h2>Listagem de staff</h2>
                            <span className="toolbar-count">{staffRows.length} registo(s)</span>
                        </div>
                        <div className="actions no-print">
                            <button className="btn" onClick={handleExportPdf}>Exportar PDF</button>
                            <button className="btn" onClick={handleExportCsv}>Exportar CSV</button>
                            <button className="btn" onClick={handlePrint}>Imprimir</button>
                        </div>
                    </div>

                    {loading ? (
                        <p className="subtle">A carregar staff...</p>
                    ) : staffRows.length === 0 ? (
                        <p className="subtle">Sem staff registado nesta modalidade.</p>
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
                                    <th>Escalões</th>
                                    <th>Época</th>
                                    <th>Data Início</th>
                                    <th className="no-print">Ações</th>
                                </tr>
                                </thead>
                                <tbody>
                                {staffRows.map((row) => {
                                    const pendingName = hasPendingName(row.nome);

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
                                                        className={`avatar-upload-trigger ${canManageFotos ? 'clickable' : ''}`}
                                                        title={canManageFotos ? "Clique para alterar foto" : ""}
                                                        onClick={(e) => { 
                                                            e.stopPropagation(); 
                                                            if (canManageFotos) handleAvatarClick(row.id);
                                                        }}
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
                                            <td>{row.morada || "-"}</td>
                                            <td>{row.numRegisto || row.num_registo || "-"}</td>
                                            <td>{row.remuneracao != null ? row.remuneracao : "-"}</td>
                                            <td>{row.cargo || "-"}</td>
                                            <td>{displayEscaloes(row)}</td>
                                            <td>{row.epoca || "-"}</td>
                                            <td>{formatDateOnly(row.dataInicio || row.data_inicio) || "-"}</td>
                                            <td className="no-print">
                                                <div className="table-actions">
                                                    <button type="button" className="btn" onClick={() => abrirEditar(row)}>
                                                        Editar
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {editOpen ? (
                <div className="modal-backdrop" onClick={fecharEditar}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Editar staff</h3>
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

                            <div className="row2">
                                <div className="row">
                                    <label className="field-label" htmlFor="editRemuneracao">Remuneração</label>
                                    <input id="editRemuneracao" className="input" name="remuneracao" type="number" min="0" step="0.01" value={editForm.remuneracao} onChange={onEditChange} />
                                </div>
                                <div className="row">
                                    <label className="field-label" htmlFor="editCargoId">Cargo</label>
                                    <select id="editCargoId" className="input" name="cargoId" value={editForm.cargoId} onChange={onEditChange}>
                                        <option value="">Selecionar</option>
                                        {cargos.map((item, index) => {
                                            const value = getOptionValue(item);
                                            const label = getOptionLabel(item);
                                            return <option key={value || `cargo-${index}`} value={value}>{label}</option>;
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

                            <div className="row">
                                <label className="field-label">Escalões</label>
                                <div className="checkbox-grid">
                                    {escaloes.map((escalao) => {
                                        const checked = (editForm.escaloesIds || []).includes(String(escalao.id));
                                        return (
                                            <label className="filter-checkbox" key={escalao.id}>
                                                <input type="checkbox" checked={checked} onChange={() => toggleEscalao(escalao.id)} />
                                                {escalao.nome}
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="row">
                                <label className="field-label" htmlFor="editObservacoes">Observações</label>
                                <textarea id="editObservacoes" className="input" name="observacoes" rows={3} value={editForm.observacoes} onChange={onEditChange} />
                            </div>

                            <label className="filter-checkbox">
                                <input type="checkbox" name="ativo" checked={editForm.ativo} onChange={onEditChange} />
                                Afetação ativa
                            </label>
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