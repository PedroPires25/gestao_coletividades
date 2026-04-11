import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import SideMenu from "../components/SideMenu";
import { useAuth } from "../auth/AuthContext";
import { getClubeById, getUploadUrl, uploadAtletaFoto } from "../api";
import {
    getAtletasByClubeModalidade,
    getEstadosAtleta,
    getEscaloes,
    getModalidadesByClube,
    updateAtleta,
} from "../services/atletas";

import atletasIcon from "../assets/atletas.svg";

function getOptionLabel(item) {
    if (item == null) return "";
    if (typeof item === "string" || typeof item === "number") return String(item);

    return (
        item.nome ||
        item.descricao ||
        item.designacao ||
        item.label ||
        item.value ||
        ""
    );
}

function getOptionValue(item) {
    if (item == null) return "";
    if (typeof item === "string" || typeof item === "number") return String(item);

    return item.id != null
        ? String(item.id)
        : String(item.value ?? "");
}

function getClubeModalidadeId(item) {
    return String(
        item?.id ??
        item?.clubeModalidadeId ??
        item?.clube_modalidade_id ??
        ""
    );
}

function formatDateOnly(value) {
    if (!value) return "";
    const text = String(value).trim();
    if (!text) return "";
    return text.includes("T") ? text.split("T")[0] : text.slice(0, 10);
}

function athleteToEditForm(atleta) {
    return {
        id: atleta?.id ?? null,
        nome: atleta?.nome || "",
        dataNascimento: formatDateOnly(
            atleta?.dataNascimento || atleta?.data_nascimento || ""
        ),
        email: atleta?.email || "",
        telefone: atleta?.telefone || "",
        morada: atleta?.morada || "",
        remuneracao:
            atleta?.remuneracao != null ? String(atleta.remuneracao) : "0.00",
        escalaoId: String(
            atleta?.escalaoId ??
            atleta?.escalao_id ??
            atleta?.escalao?.id ??
            ""
        ),
        estadoId: String(
            atleta?.estadoId ??
            atleta?.estado_id ??
            atleta?.estado?.id ??
            ""
        ),
        dataInscricao: formatDateOnly(
            atleta?.dataInscricao || atleta?.data_inscricao || ""
        ),
        dataFim: formatDateOnly(
            atleta?.dataFim || atleta?.data_fim || ""
        ),
        ativo: atleta?.ativo ?? true,
    };
}

function displayEscalao(atleta) {
    return (
        atleta?.escalao?.nome ||
        atleta?.escalao_nome ||
        atleta?.escalaoNome ||
        atleta?.escalao ||
        "-"
    );
}

function displayEstado(atleta) {
    return (
        atleta?.estado?.descricao ||
        atleta?.estado_descricao ||
        atleta?.estadoDescricao ||
        atleta?.estado ||
        "-"
    );
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

export default function ClubeAtletasModalidadePage() {
    const { clubeId, clubeModalidadeId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { logout, isAdmin, isSuperAdmin } = useAuth();

    const [clube, setClube] = useState(null);
    const [modalidadeAtiva, setModalidadeAtiva] = useState(null);
    const [atletas, setAtletas] = useState([]);
    const [escaloes, setEscaloes] = useState([]);
    const [estados, setEstados] = useState([]);

    const [loading, setLoading] = useState(true);
    const [erro, setErro] = useState("");
    const [msg, setMsg] = useState("");

    const [editOpen, setEditOpen] = useState(false);
    const [savingEdit, setSavingEdit] = useState(false);
    const [editForm, setEditForm] = useState({
        id: null,
        nome: "",
        dataNascimento: "",
        email: "",
        telefone: "",
        morada: "",
        remuneracao: "0.00",
        escalaoId: "",
        estadoId: "",
        dataInscricao: "",
        dataFim: "",
        ativo: true,
    });

    const fotoInputRef = useRef(null);
    const [fotoTargetId, setFotoTargetId] = useState(null);

    function handleAvatarClick(atletaId) {
        setFotoTargetId(atletaId);
        if (fotoInputRef.current) {
            fotoInputRef.current.value = "";
            fotoInputRef.current.click();
        }
    }

    async function handleFotoChange(e) {
        const file = e.target.files?.[0];
        if (!file || !fotoTargetId) return;
        try {
            const res = await uploadAtletaFoto(fotoTargetId, file);
            if (res?.fotoPath) {
                setAtletas(prev =>
                    prev.map(a => a.id === fotoTargetId ? { ...a, fotoPath: res.fotoPath } : a)
                );
            }
        } catch (err) {
            setErro("Erro ao fazer upload da foto: " + (err.message || ""));
        }
        setFotoTargetId(null);
    }

    const menuItems= useMemo(
        () => [
            { label: "Home", to: "/menu" },
            { label: "Clubes", to: "/clubes" },
            { label: "Coletividades", to: "/coletividades" },
            ...(isSuperAdmin ? [{ label: "Perfis", to: "/admin/users" }] : []),
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
        [clubeId, isSuperAdmin, logout, navigate]
    );

    async function carregar() {
        if (!clubeId || !clubeModalidadeId) return;

        setErro("");
        setMsg(location.state?.msg || "");
        setLoading(true);

        try {
            const [clubeData, modalidadesData, escaloesData, estadosData] =
                await Promise.all([
                    getClubeById(clubeId),
                    getModalidadesByClube(clubeId),
                    getEscaloes().catch(() => []),
                    getEstadosAtleta().catch(() => []),
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

            const atletasData = await getAtletasByClubeModalidade(
                clubeId,
                getClubeModalidadeId(modalidadeSelecionada)
            );

            setClube(clubeData || null);
            setModalidadeAtiva(modalidadeSelecionada);
            setAtletas(Array.isArray(atletasData) ? atletasData : []);
            setEscaloes(Array.isArray(escaloesData) ? escaloesData : []);
            setEstados(Array.isArray(estadosData) ? estadosData : []);
        } catch (e) {
            setErro(e.message || "Não foi possível carregar os atletas da modalidade.");
            setAtletas([]);
            setModalidadeAtiva(null);
        } finally {
            setLoading(false);
            if (location.state?.msg) {
                navigate(location.pathname, { replace: true, state: {} });
            }
        }
    }

    useEffect(() => {
        carregar();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [clubeId, clubeModalidadeId]);

    function abrirEditar(atleta) {
        setEditForm(athleteToEditForm(atleta));
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

    async function guardarEdicao() {
        if (!editForm.id) return;

        setSavingEdit(true);
        setErro("");
        setMsg("");

        try {
            await updateAtleta(clubeId, clubeModalidadeId, editForm.id, {
                nome: String(editForm.nome || "").trim(),
                dataNascimento: editForm.dataNascimento || null,
                email: String(editForm.email || "").trim() || null,
                telefone: String(editForm.telefone || "").trim() || null,
                morada: String(editForm.morada || "").trim() || null,
                remuneracao: Number(editForm.remuneracao || 0),
                estadoId: editForm.estadoId ? Number(editForm.estadoId) : null,
                escalaoId: editForm.escalaoId ? Number(editForm.escalaoId) : null,
                dataInscricao: editForm.dataInscricao || null,
                dataFim: editForm.dataFim || null,
                ativo: Boolean(editForm.ativo),
                clubeModalidadeId: Number(clubeModalidadeId),
            });

            setMsg("Atleta atualizado com sucesso.");
            setEditOpen(false);
            await carregar();
        } catch (e) {
            setErro(e.message || "Não foi possível editar o atleta.");
        } finally {
            setSavingEdit(false);
        }
    }

    function transferirAtleta(atleta) {
        navigate(`/clubes/${clubeId}/transferencias`, {
            state: {
                atleta,
                clube,
                modalidadeOrigem: modalidadeAtiva,
                msg: `Transferência iniciada para ${atleta?.nome || "atleta"}.`,
            },
        });
    }

    return (
        <>
            <input
                type="file"
                accept="image/*"
                ref={fotoInputRef}
                style={{ display: "none" }}
                onChange={handleFotoChange}
            />
            <SideMenu
                title="Gestão de Coletividades"
                subtitle={clube?.nome || "Clube"}
                logoHref="/menu"
                logoSrc="/logo.png"
                items={menuItems}
            />

            <div className="container" style={{ paddingTop: 24 }}>
                <div className="page-title page-title-with-icon">
                    <div className="page-title-main-wrap">
                        <span className="page-title-icon-circle">
                            <img src={atletasIcon} alt="Atletas" className="page-title-icon" />
                        </span>
                        <div className="page-title-texts">
                            <h1>{modalidadeAtiva?.modalidade?.nome || "Atletas da modalidade"}</h1>
                        </div>
                    </div>

                    <div className="actions">
                        <button
                            type="button"
                            className="btn"
                            onClick={() => navigate(`/clubes/${clubeId}/atletas`)}
                        >
                            Voltar
                        </button>
                    </div>
                </div>

                {erro ? <div className="alert error">{erro}</div> : null}
                {msg ? <div className="alert ok">{msg}</div> : null}

                <div className="card">
                    <div className="modalidades-toolbar">
                        <div className="toolbar-title-group">
                            <h2>Listagem de atletas</h2>
                            <span className="toolbar-count">{atletas.length} registo(s)</span>
                        </div>
                    </div>

                    {loading ? (
                        <p className="subtle">A carregar atletas...</p>
                    ) : atletas.length === 0 ? (
                        <p className="subtle">Sem atletas registados nesta modalidade.</p>
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
                                    <th>Remuneração</th>
                                    <th>Escalão</th>
                                    <th>Estado</th>
                                    <th>Época</th>
                                    <th>Data Inscrição</th>
                                    <th>Ações</th>
                                </tr>
                                </thead>
                                <tbody>
                                {atletas.map((a) => {
                                    const pendingName = hasPendingName(a.nome);

                                    return (
                                        <tr
                                            key={a.id}
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
                                                        className="avatar-upload-trigger"
                                                        title="Clique para alterar foto"
                                                        onClick={(e) => { e.stopPropagation(); handleAvatarClick(a.id); }}
                                                    >
                                                        {a.fotoPath ? (
                                                            <img
                                                                src={getUploadUrl(a.fotoPath)}
                                                                alt={a.nome}
                                                                className="avatar-circle-sm"
                                                            />
                                                        ) : (
                                                            <span className="avatar-circle-sm avatar-initials-sm">
                                                                {(a.nome || "?")[0].toUpperCase()}
                                                            </span>
                                                        )}
                                                    </span>
                                                    {pendingName ? <PendingNameCell /> : a.nome}
                                                </span>
                                            </td>
                                            <td>{formatDateOnly(a.dataNascimento || a.data_nascimento) || "-"}</td>
                                            <td className="cell-muted">{a.email || "-"}</td>
                                            <td className="cell-muted">{a.telefone || "-"}</td>
                                            <td>{a.morada || "-"}</td>
                                            <td>{a.remuneracao != null ? a.remuneracao : "-"}</td>
                                            <td>{displayEscalao(a)}</td>
                                            <td>{displayEstado(a)}</td>
                                            <td>{a.epoca || "-"}</td>
                                            <td>{formatDateOnly(a.dataInscricao || a.data_inscricao) || "-"}</td>
                                            <td>
                                                <div className="table-actions">
                                                    <button
                                                        type="button"
                                                        className="btn"
                                                        onClick={() => abrirEditar(a)}
                                                    >
                                                        Editar
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="btn btn-primary"
                                                        onClick={() => transferirAtleta(a)}
                                                    >
                                                        Transferir
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
                            <h3>Editar atleta</h3>
                            <button
                                type="button"
                                className="btn modal-close"
                                onClick={fecharEditar}
                            >
                                ×
                            </button>
                        </div>

                        <div className="row">
                            <div className="row2">
                                <div className="row">
                                    <label className="field-label" htmlFor="editNome">
                                        Nome
                                    </label>
                                    <input
                                        id="editNome"
                                        className="input"
                                        name="nome"
                                        value={editForm.nome}
                                        onChange={onEditChange}
                                    />
                                </div>

                                <div className="row">
                                    <label className="field-label" htmlFor="editDataNascimento">
                                        Data de nascimento
                                    </label>
                                    <input
                                        id="editDataNascimento"
                                        className="input"
                                        name="dataNascimento"
                                        type="date"
                                        value={editForm.dataNascimento}
                                        onChange={onEditChange}
                                    />
                                </div>
                            </div>

                            <div className="row2">
                                <div className="row">
                                    <label className="field-label" htmlFor="editEmail">
                                        Email
                                    </label>
                                    <input
                                        id="editEmail"
                                        className="input"
                                        name="email"
                                        type="email"
                                        value={editForm.email}
                                        onChange={onEditChange}
                                    />
                                </div>

                                <div className="row">
                                    <label className="field-label" htmlFor="editTelefone">
                                        Telefone
                                    </label>
                                    <input
                                        id="editTelefone"
                                        className="input"
                                        name="telefone"
                                        value={editForm.telefone}
                                        onChange={onEditChange}
                                    />
                                </div>
                            </div>

                            <div className="row">
                                <label className="field-label" htmlFor="editMorada">
                                    Morada
                                </label>
                                <input
                                    id="editMorada"
                                    className="input"
                                    name="morada"
                                    value={editForm.morada}
                                    onChange={onEditChange}
                                />
                            </div>

                            <div className="row2">
                                <div className="row">
                                    <label className="field-label" htmlFor="editRemuneracao">
                                        Remuneração
                                    </label>
                                    <input
                                        id="editRemuneracao"
                                        className="input"
                                        name="remuneracao"
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={editForm.remuneracao}
                                        onChange={onEditChange}
                                    />
                                </div>

                                <div className="row">
                                    <label className="field-label" htmlFor="editDataInscricao">
                                        Data de inscrição
                                    </label>
                                    <input
                                        id="editDataInscricao"
                                        className="input"
                                        name="dataInscricao"
                                        type="date"
                                        value={editForm.dataInscricao}
                                        onChange={onEditChange}
                                    />
                                </div>
                            </div>

                            <div className="row2">
                                <div className="row">
                                    <label className="field-label" htmlFor="editDataFim">
                                        Data fim
                                    </label>
                                    <input
                                        id="editDataFim"
                                        className="input"
                                        name="dataFim"
                                        type="date"
                                        value={editForm.dataFim}
                                        onChange={onEditChange}
                                    />
                                </div>

                                <div className="row">
                                    <label className="field-label" htmlFor="editEscalaoId">
                                        Escalão
                                    </label>
                                    <select
                                        id="editEscalaoId"
                                        className="input"
                                        name="escalaoId"
                                        value={editForm.escalaoId}
                                        onChange={onEditChange}
                                    >
                                        <option value="">Selecionar</option>
                                        {escaloes.map((item, index) => {
                                            const value = getOptionValue(item);
                                            const label = getOptionLabel(item);

                                            return (
                                                <option
                                                    key={value || `escalao-edit-${index}`}
                                                    value={value}
                                                >
                                                    {label}
                                                </option>
                                            );
                                        })}
                                    </select>
                                </div>
                            </div>

                            <div className="row">
                                <label className="field-label" htmlFor="editEstadoId">
                                    Estado
                                </label>
                                <select
                                    id="editEstadoId"
                                    className="input"
                                    name="estadoId"
                                    value={editForm.estadoId}
                                    onChange={onEditChange}
                                >
                                    <option value="">Selecionar</option>
                                    {estados.map((item, index) => {
                                        const value = getOptionValue(item);
                                        const label = getOptionLabel(item);

                                        return (
                                            <option
                                                key={value || `estado-edit-${index}`}
                                                value={value}
                                            >
                                                {label}
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>

                            <label className="filter-checkbox">
                                <input
                                    type="checkbox"
                                    name="ativo"
                                    checked={editForm.ativo}
                                    onChange={onEditChange}
                                />
                                Atleta ativo
                            </label>
                        </div>

                        <div className="modal-footer">
                            <button
                                type="button"
                                className="btn btn-primary"
                                onClick={guardarEdicao}
                                disabled={savingEdit}
                            >
                                {savingEdit ? "A guardar..." : "Guardar"}
                            </button>
                            <button
                                type="button"
                                className="btn"
                                onClick={fecharEditar}
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}
        </>
    );
}
