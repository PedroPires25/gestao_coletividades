import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import SideMenu from "../components/SideMenu";
import { useAuth } from "../auth/AuthContext";
import { getClubeById } from "../api";
import {
    getAtletasByClubeModalidade,
    getModalidadesByClube,
} from "../services/atletas";
import {
    listarEventos,
    criarEvento,
    atualizarEvento,
    deletarEvento,
    listarAtletasEvento,
} from "../services/eventos";
import modalidadesIcon from "../assets/modalidades.svg";

function formatDateTimeForInput(dateString) {
    if (!dateString) return "";
    const text = String(dateString).trim();
    if (text.includes("T")) return text.slice(0, 16);
    if (text.includes(" ")) return text.replace(" ", "T").slice(0, 16);
    return text.slice(0, 16);
}

function formatDateTimeForDisplay(dateString) {
    if (!dateString) return "-";
    const date = new Date(String(dateString).replace(" ", "T"));
    if (Number.isNaN(date.getTime())) return dateString;
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    const hour = String(date.getHours()).padStart(2, "0");
    const min = String(date.getMinutes()).padStart(2, "0");
    return `${day}/${month}/${year} ${hour}:${min}`;
}

function convertToServerFormat(datetimeLocalValue) {
    if (!datetimeLocalValue) return "";
    const parts = datetimeLocalValue.split("T");
    if (parts.length !== 2) return datetimeLocalValue;
    return `${parts[0]} ${parts[1]}:00`;
}

export default function EventosPage() {
    const { isAdmin, role, logout } = useAuth();
    const { clubeId, clubeModalidadeId } = useParams();
    const navigate = useNavigate();

    const [clube, setClube] = useState(null);
    const [modalidade, setModalidade] = useState(null);
    const [eventos, setEventos] = useState([]);
    const [atletas, setAtletas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [erro, setErro] = useState("");
    const [msg, setMsg] = useState("");

    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({ titulo: "", dataHora: "", local: "", atletaIds: [] });
    const [atletasSearch, setAtletasSearch] = useState("");

    // Convocados expandidos por evento
    const [expandedEventId, setExpandedEventId] = useState(null);
    const [convocadosMap, setConvocadosMap] = useState({});
    const [loadingConvocados, setLoadingConvocados] = useState(false);

    const canManageEventos =
        isAdmin ||
        role === "TREINADOR_PRINCIPAL" ||
        role === "PROFESSOR" ||
        role === "SECRETARIO";

    const menuItems = useMemo(() => {
        if (canManageEventos) {
            return [
                { label: "Home", to: "/menu" },
                { label: "Clubes", to: "/clubes" },
                { label: "Coletividades", to: "/coletividades" },
                ...(isAdmin ? [{ label: "Perfis", to: "/admin/users" }] : []),
                { label: "Modalidades do Clube", to: `/clubes/${clubeId}/modalidades` },
                { label: "Atletas", to: `/clubes/${clubeId}/atletas` },
                { label: "Staff", to: `/clubes/${clubeId}/staff` },
                {
                    label: "Logout",
                    onClick: () => { logout(); navigate("/login", { replace: true }); },
                },
            ];
        }
        return [
            {
                label: "Logout",
                onClick: () => { logout(); navigate("/login", { replace: true }); },
            },
        ];
    }, [canManageEventos, isAdmin, clubeId, logout, navigate]);

    const carregar = useCallback(async () => {
        if (!clubeId || !clubeModalidadeId) return;
        setErro("");
        setLoading(true);
        try {
            const [clubeData, modalidadesData, eventosData, atletasData] = await Promise.all([
                getClubeById(parseInt(clubeId)),
                getModalidadesByClube(parseInt(clubeId)),
                listarEventos(parseInt(clubeId), parseInt(clubeModalidadeId)),
                getAtletasByClubeModalidade(parseInt(clubeId), parseInt(clubeModalidadeId)),
            ]);
            setClube(clubeData);
            setModalidade(
                (Array.isArray(modalidadesData) ? modalidadesData : []).find(
                    (m) => String(m.id) === String(clubeModalidadeId)
                ) || null
            );
            setEventos(Array.isArray(eventosData) ? eventosData : []);
            setAtletas(Array.isArray(atletasData) ? atletasData : []);
        } catch (e) {
            setErro(e.message || "Erro ao carregar dados.");
        } finally {
            setLoading(false);
        }
    }, [clubeId, clubeModalidadeId]);

    useEffect(() => {
        carregar();
    }, [carregar]);

    async function recarregarEventos() {
        try {
            const eventosData = await listarEventos(parseInt(clubeId), parseInt(clubeModalidadeId));
            setEventos(Array.isArray(eventosData) ? eventosData : []);
            setConvocadosMap({});
            setExpandedEventId(null);
        } catch (e) {
            setErro(e.message || "Erro ao recarregar eventos.");
        }
    }

    async function toggleConvocados(eventoId) {
        if (expandedEventId === eventoId) {
            setExpandedEventId(null);
            return;
        }
        setExpandedEventId(eventoId);
        if (convocadosMap[eventoId]) return;
        setLoadingConvocados(true);
        try {
            const dados = await listarAtletasEvento(eventoId);
            setConvocadosMap((prev) => ({ ...prev, [eventoId]: Array.isArray(dados) ? dados : [] }));
        } catch {
            setConvocadosMap((prev) => ({ ...prev, [eventoId]: [] }));
        } finally {
            setLoadingConvocados(false);
        }
    }

    async function handleEdit(evento) {
        setErro("");
        setMsg("");
        setEditingId(evento.id);
        setShowForm(true);
        setForm({
            titulo: evento.titulo || "",
            dataHora: formatDateTimeForInput(evento.dataHora),
            local: evento.local || "",
            atletaIds: [],
        });
        // Carregar convocados existentes
        try {
            const convocados = await listarAtletasEvento(evento.id);
            const ids = (Array.isArray(convocados) ? convocados : []).map((a) => a.id).filter(Boolean);
            setForm((f) => ({ ...f, atletaIds: ids }));
        } catch {
            // Se falhar, continua sem pré-selecção
        }
        setTimeout(() => {
            document.querySelector(".evento-form")?.scrollIntoView({ behavior: "smooth" });
        }, 100);
    }

    function handleCancel() {
        setForm({ titulo: "", dataHora: "", local: "", atletaIds: [] });
        setEditingId(null);
        setShowForm(false);
        setAtletasSearch("");
        setErro("");
    }

    function handleInputChange(e) {
        const { name, value } = e.target;
        setForm((f) => ({ ...f, [name]: value }));
    }

    function toggleAthlete(atletaId) {
        setForm((f) => ({
            ...f,
            atletaIds: f.atletaIds.includes(atletaId)
                ? f.atletaIds.filter((id) => id !== atletaId)
                : [...f.atletaIds, atletaId],
        }));
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setErro("");
        setMsg("");
        if (!form.titulo.trim()) { setErro("Título é obrigatório."); return; }
        if (!form.dataHora) { setErro("Data e hora são obrigatórios."); return; }

        setSaving(true);
        try {
            const payload = {
                titulo: form.titulo.trim(),
                dataHora: convertToServerFormat(form.dataHora),
                local: form.local.trim() || null,
                atletaIds: form.atletaIds,
            };
            if (editingId) {
                await atualizarEvento(parseInt(clubeId), parseInt(clubeModalidadeId), editingId, payload);
                setMsg("Evento atualizado com sucesso!");
            } else {
                await criarEvento(parseInt(clubeId), parseInt(clubeModalidadeId), payload);
                setMsg("Evento criado com sucesso!");
            }
            await recarregarEventos();
            handleCancel();
        } catch (e) {
            setErro(e.message || "Erro ao guardar evento.");
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete(eventoId) {
        setErro("");
        setMsg("");
        if (!window.confirm("Tens a certeza que queres apagar este evento? Os atletas deixarão de estar convocados.")) return;
        try {
            await deletarEvento(parseInt(clubeId), parseInt(clubeModalidadeId), eventoId);
            setMsg("Evento apagado com sucesso!");
            await recarregarEventos();
        } catch (e) {
            setErro(e.message || "Erro ao apagar evento.");
        }
    }

    const atletasFiltrados = atletas.filter((a) =>
        a.nome?.toLowerCase().includes(atletasSearch.toLowerCase())
    );

    const modalidadeNome = modalidade?.modalidade?.nome || modalidade?.nome || "Modalidade";

    if (loading) {
        return (
            <>
                <SideMenu
                    title="Gestão de Clubes"
                    subtitle="A carregar..."
                    logoHref="/menu"
                    logoSrc="/logo.png"
                    items={menuItems}
                />
                <div className="container" style={{ paddingTop: 24 }}>
                    <p>A carregar...</p>
                </div>
            </>
        );
    }

    return (
        <>
            <SideMenu
                title="Gestão de Clubes"
                subtitle={clube?.nome || "Clube"}
                logoHref="/menu"
                logoSrc="/logo.png"
                items={menuItems}
            />

            <div className="container" style={{ paddingTop: 24 }}>
                <div className="page-title page-title-with-icon">
                    <div className="page-title-main-wrap">
                        <span className="page-title-icon-circle">
                            <img src={modalidadesIcon} alt="Eventos" className="page-title-icon" />
                        </span>
                        <div className="page-title-texts">
                            <h1>Eventos</h1>
                            <p className="subtitle">{clube?.nome || ""}</p>
                        </div>
                    </div>
                    <div className="hint">{modalidadeNome}</div>
                </div>

                {erro && <div className="alert error">{erro}</div>}
                {msg && <div className="alert ok">{msg}</div>}

                <div className="stack-sections">
                    {/* LISTA DE EVENTOS */}
                    <section className="card">
                        <div className="modalidades-toolbar">
                            <div className="toolbar-title-group">
                                <h2>Eventos</h2>
                                <span className="toolbar-count">{eventos.length} registo(s)</span>
                            </div>
                            {canManageEventos && !showForm && (
                                <button className="btn btn-primary" onClick={() => { setShowForm(true); setEditingId(null); setForm({ titulo: "", dataHora: "", local: "", atletaIds: [] }); }}>
                                    + Novo evento
                                </button>
                            )}
                        </div>

                        {eventos.length === 0 ? (
                            <p className="subtle">Nenhum evento criado ainda.</p>
                        ) : (
                            <div className="table-wrap">
                                <table className="dashboard-table">
                                    <thead>
                                        <tr>
                                            <th>Título</th>
                                            <th>Data e Hora</th>
                                            <th>Local</th>
                                            <th>Convocados</th>
                                            <th>Detalhes</th>
                                            {canManageEventos && <th>Ações</th>}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {eventos.map((evento) => (
                                            <>
                                                <tr key={evento.id}>
                                                    <td className="nowrap">{evento.titulo}</td>
                                                    <td>{formatDateTimeForDisplay(evento.dataHora)}</td>
                                                    <td>{evento.local || "-"}</td>
                                                    <td>{evento.totalAtletas ?? 0}</td>
                                                    <td>
                                                        <button
                                                            className="btn"
                                                            onClick={() => toggleConvocados(evento.id)}
                                                            title={expandedEventId === evento.id ? "Fechar" : "Ver convocados"}
                                                        >
                                                            {expandedEventId === evento.id ? "▲ Fechar" : "▼ Convocados"}
                                                        </button>
                                                    </td>
                                                    {canManageEventos && (
                                                        <td>
                                                            <div className="table-actions">
                                                                <button className="btn" onClick={() => handleEdit(evento)}>
                                                                    Editar
                                                                </button>
                                                                <button className="btn btn-primary" onClick={() => handleDelete(evento.id)}>
                                                                    Apagar
                                                                </button>
                                                            </div>
                                                        </td>
                                                    )}
                                                </tr>
                                                {expandedEventId === evento.id && (
                                                    <tr key={`conv-${evento.id}`}>
                                                        <td colSpan={canManageEventos ? 6 : 5} style={{ background: "rgba(255,255,255,0.04)", padding: "12px 16px" }}>
                                                            {loadingConvocados && !convocadosMap[evento.id] ? (
                                                                <p className="subtle">A carregar convocados...</p>
                                                            ) : (convocadosMap[evento.id] || []).length === 0 ? (
                                                                <p className="subtle">Nenhum atleta convocado para este evento.</p>
                                                            ) : (
                                                                <div>
                                                                    <strong style={{ display: "block", marginBottom: 8 }}>
                                                                        👥 Atletas convocados ({(convocadosMap[evento.id] || []).length})
                                                                    </strong>
                                                                    <div className="atleta-tags">
                                                                        {(convocadosMap[evento.id] || []).map((a) => (
                                                                            <span key={a.id} className="atleta-tag">
                                                                                {a.nome}
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </td>
                                                    </tr>
                                                )}
                                            </>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </section>

                    {/* FORMULÁRIO DE CRIAÇÃO / EDIÇÃO */}
                    {canManageEventos && showForm && (
                        <section className="card evento-form">
                            <h2>{editingId ? "Editar Evento" : "Novo Evento"}</h2>

                            <form onSubmit={handleSubmit}>
                                <div className="row">
                                    <label className="field-label" htmlFor="titulo">Título *</label>
                                    <input
                                        id="titulo"
                                        name="titulo"
                                        className="input"
                                        type="text"
                                        value={form.titulo}
                                        onChange={handleInputChange}
                                        placeholder="Ex: Jogo contra X"
                                    />
                                </div>

                                <div className="row2">
                                    <div className="row">
                                        <label className="field-label" htmlFor="dataHora">Data e Hora *</label>
                                        <input
                                            id="dataHora"
                                            name="dataHora"
                                            className="input"
                                            type="datetime-local"
                                            value={form.dataHora}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                    <div className="row">
                                        <label className="field-label" htmlFor="local">Local</label>
                                        <input
                                            id="local"
                                            name="local"
                                            className="input"
                                            type="text"
                                            value={form.local}
                                            onChange={handleInputChange}
                                            placeholder="Ex: Pavilhão Municipal"
                                        />
                                    </div>
                                </div>

                                <div className="form-section-divider" />

                                <div className="form-section">
                                    <h3 className="form-section-title">Convocados</h3>
                                    <div className="row">
                                        <label className="field-label">Selecionar Atletas</label>
                                        <input
                                            type="text"
                                            className="input"
                                            placeholder="Procurar atleta..."
                                            value={atletasSearch}
                                            onChange={(e) => setAtletasSearch(e.target.value)}
                                        />
                                        <div className="atleta-list-container">
                                            {atletasFiltrados.length > 0 ? (
                                                atletasFiltrados.map((atleta) => (
                                                    <div
                                                        key={atleta.id}
                                                        className={`atleta-list-item ${form.atletaIds.includes(atleta.id) ? "selected" : ""}`}
                                                        onClick={() => toggleAthlete(atleta.id)}
                                                        style={{ cursor: "pointer" }}
                                                    >
                                                        <div className="atleta-item-content">
                                                            <span className="atleta-name">{atleta.nome}</span>
                                                            <div className="checkbox-indicator">
                                                                {form.atletaIds.includes(atleta.id) && (
                                                                    <span className="check-mark">✓</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <p className="subtle">
                                                    {atletasSearch ? "Nenhum atleta encontrado" : "Nenhum atleta disponível"}
                                                </p>
                                            )}
                                        </div>
                                        <small className="subtle">{form.atletaIds.length} atleta(s) selecionado(s)</small>
                                    </div>
                                </div>

                                <div className="table-actions">
                                    <button type="submit" className="btn btn-primary" disabled={saving}>
                                        {saving ? "A guardar..." : (editingId ? "Atualizar" : "Criar")} Evento
                                    </button>
                                    <button type="button" className="btn" onClick={handleCancel} disabled={saving}>
                                        Cancelar
                                    </button>
                                </div>
                            </form>
                        </section>
                    )}
                </div>
            </div>

            <style>{`
                .atleta-tags {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 6px;
                }
                .atleta-tag {
                    background: rgba(99, 179, 237, 0.18);
                    border: 1px solid rgba(99, 179, 237, 0.4);
                    border-radius: 20px;
                    padding: 3px 12px;
                    font-size: 0.88em;
                    color: inherit;
                }
            `}</style>
        </>
    );
}

