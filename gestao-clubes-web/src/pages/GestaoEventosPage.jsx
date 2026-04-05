import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import SideMenu from "../components/SideMenu";
import MapPicker from "../components/MapPicker";
import MiniMap from "../components/MiniMap";
import { useAuth } from "../auth/AuthContext";
import * as eventosService from "../services/eventos";
import { getModalidadesByClube, getAtletasByClubeModalidade } from "../services/atletas";
import { getAtividadesByColetividade } from "../services/coletividadeAtividades";
import { getUtentesByColetividadeAtividade } from "../services/utentes";

const API_BASE = `${(import.meta.env.VITE_API_URL || "http://localhost:8080").replace(/\/$/, "")}/api`;
const LS_KEY = "gc_user";

function getToken() {
    try {
        const raw = localStorage.getItem(LS_KEY);
        return raw ? JSON.parse(raw)?.token ?? null : null;
    } catch { return null; }
}

async function apiFetch(path) {
    const token = getToken();
    const res = await fetch(`${API_BASE}${path}`, {
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
    });
    if (!res.ok) throw new Error(`Erro HTTP ${res.status}`);
    const ct = res.headers.get("content-type") || "";
    if (ct.includes("application/json")) return res.json();
    return res.text();
}

function formatDataHora(ts) {
    if (!ts) return "";
    const d = new Date(ts);
    const pad = (n) => String(n).padStart(2, "0");
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function toInputDateTime(ts) {
    if (!ts) return "";
    const d = new Date(ts);
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const FORM_EMPTY = {
    titulo: "",
    descricao: "",
    dataHora: "",
    local: "",
    observacoes: "",
    tipo: "MODALIDADE",
    clubeId: "",
    clubeModalidadeId: "",
    coletividadeId: "",
    coletividadeAtividadeId: "",
    convocados: [],
    latitude: null,
    longitude: null,
};

export default function GestaoEventosPage() {
    const { logout, isAdmin, role } = useAuth();
    const navigate = useNavigate();

    const [eventos, setEventos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [erro, setErro] = useState(null);

    // Form state
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState(FORM_EMPTY);
    const [saving, setSaving] = useState(false);
    const [formErro, setFormErro] = useState(null);

    // Lists for selectors
    const [clubes, setClubes] = useState([]);
    const [modalidades, setModalidades] = useState([]);
    const [atletas, setAtletas] = useState([]);
    const [coletividades, setColetividades] = useState([]);
    const [atividades, setAtividades] = useState([]);
    const [utentes, setUtentes] = useState([]);

    // Convocados search filter
    const [convocadosSearch, setConvocadosSearch] = useState("");

    // Convocados view modal
    const [viewingConvocados, setViewingConvocados] = useState(null);
    // Map view modal
    const [viewingMap, setViewingMap] = useState(null);
    const [convocadosList, setConvocadosList] = useState([]);

    const canManage = role === "ADMIN" || role === "SECRETARIO";

    const carregarEventos = useCallback(async () => {
        setLoading(true);
        setErro(null);
        try {
            const data = await eventosService.listarTodosEventos();
            setEventos(Array.isArray(data) ? data : []);
        } catch (e) {
            setErro(e.message || "Erro ao carregar eventos.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { carregarEventos(); }, [carregarEventos]);

    // Load clubs & coletividades on mount
    useEffect(() => {
        apiFetch("/clubes")
            .then(d => setClubes(Array.isArray(d) ? d : (d?.data ?? d?.content ?? [])))
            .catch(() => {});
        apiFetch("/coletividades")
            .then(d => setColetividades(Array.isArray(d) ? d : (d?.data ?? d?.content ?? [])))
            .catch(() => {});
    }, []);

    // Load modalidades when clube changes
    useEffect(() => {
        if (form.tipo === "MODALIDADE" && form.clubeId) {
            getModalidadesByClube(form.clubeId)
                .then(d => setModalidades(Array.isArray(d) ? d : []))
                .catch(() => setModalidades([]));
        } else {
            setModalidades([]);
        }
    }, [form.clubeId, form.tipo]);

    // Load atletas when modalidade changes
    useEffect(() => {
        if (form.tipo === "MODALIDADE" && form.clubeId && form.clubeModalidadeId) {
            getAtletasByClubeModalidade(form.clubeId, form.clubeModalidadeId)
                .then(d => setAtletas(Array.isArray(d) ? d : []))
                .catch(() => setAtletas([]));
        } else {
            setAtletas([]);
        }
    }, [form.clubeModalidadeId, form.clubeId, form.tipo]);

    // Load atividades when coletividade changes
    useEffect(() => {
        if (form.tipo === "ATIVIDADE" && form.coletividadeId) {
            getAtividadesByColetividade(form.coletividadeId, { apenasAtivas: false })
                .then(d => setAtividades(Array.isArray(d) ? d : (d?.data ?? [])))
                .catch(() => setAtividades([]));
        } else {
            setAtividades([]);
        }
    }, [form.coletividadeId, form.tipo]);

    // Load utentes when atividade changes
    useEffect(() => {
        if (form.tipo === "ATIVIDADE" && form.coletividadeId && form.coletividadeAtividadeId) {
            getUtentesByColetividadeAtividade(form.coletividadeId, form.coletividadeAtividadeId)
                .then(d => setUtentes(Array.isArray(d) ? d : []))
                .catch(() => setUtentes([]));
        } else {
            setUtentes([]);
        }
    }, [form.coletividadeAtividadeId, form.coletividadeId, form.tipo]);

    function abrirCriar() {
        setForm(FORM_EMPTY);
        setEditingId(null);
        setFormErro(null);
        setConvocadosSearch("");
        setShowForm(true);
    }

    async function abrirEditar(evento) {
        setFormErro(null);
        setConvocadosSearch("");
        setEditingId(evento.id);

        // Load existing convocados
        let convocadosExistentes = [];
        try {
            const conv = await eventosService.listarConvocadosGestao(evento.id);
            convocadosExistentes = (Array.isArray(conv) ? conv : []).map(c => c.id);
        } catch { /**/ }

        setForm({
            titulo: evento.titulo || "",
            descricao: evento.descricao || "",
            dataHora: toInputDateTime(evento.dataHora),
            local: evento.local || "",
            observacoes: evento.observacoes || "",
            tipo: evento.tipo || "MODALIDADE",
            clubeId: evento.clubeId ? String(evento.clubeId) : "",
            clubeModalidadeId: evento.clubeModalidadeId || "",
            coletividadeId: "",
            coletividadeAtividadeId: evento.coletividadeAtividadeId || "",
            convocados: convocadosExistentes,
            latitude: evento.latitude || null,
            longitude: evento.longitude || null,
        });

        setShowForm(true);
    }

    async function guardar(e) {
        e.preventDefault();
        setSaving(true);
        setFormErro(null);

        try {
            const payload = {
                titulo: form.titulo.trim(),
                descricao: form.descricao.trim() || null,
                dataHora: form.dataHora,
                local: form.local.trim(),
                observacoes: form.observacoes.trim() || null,
                tipo: form.tipo,
                clubeModalidadeId: form.tipo === "MODALIDADE" ? Number(form.clubeModalidadeId) || null : null,
                coletividadeAtividadeId: form.tipo === "ATIVIDADE" ? Number(form.coletividadeAtividadeId) || null : null,
                convocados: form.convocados,
                latitude: form.latitude || null,
                longitude: form.longitude || null,
            };

            if (editingId) {
                await eventosService.atualizarEventoGestao(editingId, payload);
            } else {
                await eventosService.criarEventoGestao(payload);
            }

            setShowForm(false);
            await carregarEventos();
        } catch (err) {
            setFormErro(err.message || "Erro ao guardar evento.");
        } finally {
            setSaving(false);
        }
    }

    async function eliminar(id) {
        if (!window.confirm("Tem a certeza que deseja eliminar este evento?")) return;
        try {
            await eventosService.eliminarEventoGestao(id);
            await carregarEventos();
        } catch (err) {
            alert(err.message || "Erro ao eliminar evento.");
        }
    }

    async function verConvocados(evento) {
        setViewingConvocados(evento);
        try {
            const data = await eventosService.listarConvocadosGestao(evento.id);
            setConvocadosList(Array.isArray(data) ? data : []);
        } catch {
            setConvocadosList([]);
        }
    }

    function toggleConvocado(id) {
        setForm(prev => ({
            ...prev,
            convocados: prev.convocados.includes(id)
                ? prev.convocados.filter(c => c !== id)
                : [...prev.convocados, id],
        }));
    }

    const pessoasDisponiveis = form.tipo === "MODALIDADE" ? atletas : utentes;
    const pessoasFiltradas = pessoasDisponiveis.filter(p =>
        !convocadosSearch || (p.nome || "").toLowerCase().includes(convocadosSearch.toLowerCase())
    );

    const menuItems = [
        { label: "Home", to: "/menu" },
        { label: "Clubes", to: "/clubes" },
        { label: "Coletividades", to: "/coletividades" },
        ...(isAdmin ? [{ label: "Perfis", to: "/admin/users" }] : []),
        { label: "Eventos", to: "/gestao/eventos" },
        {
            label: "Logout",
            onClick: () => { logout(); navigate("/login", { replace: true }); },
        },
    ];

    return (
        <>
            <SideMenu
                title="Gestão de Eventos"
                subtitle="Eventos"
                logoHref="/menu"
                logoSrc="/logo.png"
                items={menuItems}
            />

            <div className="container" style={{ paddingTop: 24 }}>
                <div className="page-header" style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
                    <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => navigate("/menu")}
                        style={{ whiteSpace: "nowrap" }}
                    >
                        ← Voltar ao Menu
                    </button>
                    <h1 className="page-title" style={{ margin: 0, flex: 1 }}>📅 Gestão de Eventos</h1>
                    {canManage && !showForm && (
                        <button className="btn btn-primary" onClick={abrirCriar}>
                            + Criar Evento
                        </button>
                    )}
                </div>

                {erro && <div className="alert alert-danger">{erro}</div>}

                {/* ── Form ── */}
                {showForm && (
                    <div className="card" style={{ marginBottom: "2rem", padding: "1.5rem" }}>
                        <h2 style={{ marginTop: 0 }}>{editingId ? "Editar Evento" : "Novo Evento"}</h2>
                        <form onSubmit={guardar}>
                            <div className="form-grid">
                                {/* Título */}
                                <div className="form-group">
                                    <label>Título *</label>
                                    <input
                                        className="input"
                                        value={form.titulo}
                                        onChange={e => setForm(p => ({ ...p, titulo: e.target.value }))}
                                        required
                                    />
                                </div>

                                {/* Data/Hora */}
                                <div className="form-group">
                                    <label>Data e Hora *</label>
                                    <input
                                        type="datetime-local"
                                        className="input"
                                        value={form.dataHora}
                                        onChange={e => setForm(p => ({ ...p, dataHora: e.target.value }))}
                                        required
                                    />
                                </div>

                                {/* Local */}
                                <div className="form-group">
                                    <label>Local *</label>
                                    <input
                                        className="input"
                                        value={form.local}
                                        onChange={e => setForm(p => ({ ...p, local: e.target.value }))}
                                        required
                                    />
                                </div>

                                {/* Mapa */}
                                <div style={{ gridColumn: "1 / -1" }}>
                                    <label>📍 Localização no Mapa</label>
                                    <MapPicker
                                        latitude={form.latitude}
                                        longitude={form.longitude}
                                        onLocationChange={(lat, lng, address) => {
                                            setForm(p => ({
                                                ...p,
                                                latitude: lat,
                                                longitude: lng,
                                                ...(address ? { local: address } : {}),
                                            }));
                                        }}
                                    />
                                </div>

                                {/* Tipo */}
                                {!editingId && (
                                    <div className="form-group">
                                        <label>Tipo *</label>
                                        <div style={{ display: "flex", gap: "1.5rem", marginTop: "0.4rem" }}>
                                            {["MODALIDADE", "ATIVIDADE"].map(t => (
                                                <label key={t} style={{ display: "flex", alignItems: "center", gap: "0.4rem", cursor: "pointer" }}>
                                                    <input
                                                        type="radio"
                                                        name="tipo"
                                                        value={t}
                                                        checked={form.tipo === t}
                                                        onChange={() => setForm(p => ({ ...p, tipo: t, clubeId: "", clubeModalidadeId: "", coletividadeId: "", coletividadeAtividadeId: "", convocados: [] }))}
                                                    />
                                                    {t === "MODALIDADE" ? "Modalidade" : "Atividade"}
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* MODALIDADE selectors */}
                                {!editingId && form.tipo === "MODALIDADE" && (
                                    <>
                                        <div className="form-group">
                                            <label>Clube *</label>
                                            <select
                                                className="input"
                                                value={form.clubeId}
                                                onChange={e => setForm(p => ({ ...p, clubeId: e.target.value, clubeModalidadeId: "", convocados: [] }))}
                                                required
                                            >
                                                <option value="">-- Selecione o clube --</option>
                                                {clubes.map(c => (
                                                    <option key={c.id} value={c.id}>{c.nome}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label>Modalidade *</label>
                                            <select
                                                className="input"
                                                value={form.clubeModalidadeId}
                                                onChange={e => setForm(p => ({ ...p, clubeModalidadeId: e.target.value, convocados: [] }))}
                                                required
                                                disabled={!form.clubeId}
                                            >
                                                <option value="">-- Selecione a modalidade --</option>
                                                {modalidades.map(m => (
                                                    <option key={m.id} value={m.id}>{m.nome || m.modalidade?.nome}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </>
                                )}

                                {/* ATIVIDADE selectors */}
                                {!editingId && form.tipo === "ATIVIDADE" && (
                                    <>
                                        <div className="form-group">
                                            <label>Coletividade *</label>
                                            <select
                                                className="input"
                                                value={form.coletividadeId}
                                                onChange={e => setForm(p => ({ ...p, coletividadeId: e.target.value, coletividadeAtividadeId: "", convocados: [] }))}
                                                required
                                            >
                                                <option value="">-- Selecione a coletividade --</option>
                                                {coletividades.map(c => (
                                                    <option key={c.id} value={c.id}>{c.nome}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label>Atividade *</label>
                                            <select
                                                className="input"
                                                value={form.coletividadeAtividadeId}
                                                onChange={e => setForm(p => ({ ...p, coletividadeAtividadeId: e.target.value, convocados: [] }))}
                                                required
                                                disabled={!form.coletividadeId}
                                            >
                                                <option value="">-- Selecione a atividade --</option>
                                                {atividades.map(a => (
                                                    <option key={a.id} value={a.id}>{a.nomeAtividade || a.nome}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </>
                                )}

                                {/* Descrição */}
                                <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                                    <label>Descrição</label>
                                    <textarea
                                        className="input"
                                        rows={3}
                                        value={form.descricao}
                                        onChange={e => setForm(p => ({ ...p, descricao: e.target.value }))}
                                    />
                                </div>

                                {/* Observações */}
                                <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                                    <label>Observações</label>
                                    <textarea
                                        className="input"
                                        rows={2}
                                        value={form.observacoes}
                                        onChange={e => setForm(p => ({ ...p, observacoes: e.target.value }))}
                                    />
                                </div>
                            </div>

                            {/* Convocatória */}
                            {pessoasDisponiveis.length > 0 && (
                                <div style={{ marginTop: "1.5rem" }}>
                                    <h3 style={{ marginBottom: "0.75rem" }}>
                                        Convocatória ({form.convocados.length} selecionados)
                                    </h3>
                                    <div style={{ display: "flex", gap: "1rem", marginBottom: "0.75rem", alignItems: "center" }}>
                                        <input
                                            className="input"
                                            placeholder="Filtrar por nome..."
                                            value={convocadosSearch}
                                            onChange={e => setConvocadosSearch(e.target.value)}
                                            style={{ maxWidth: 260 }}
                                        />
                                        <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", cursor: "pointer" }}>
                                            <input
                                                type="checkbox"
                                                checked={form.convocados.length === pessoasDisponiveis.length && pessoasDisponiveis.length > 0}
                                                onChange={e => setForm(p => ({
                                                    ...p,
                                                    convocados: e.target.checked ? pessoasDisponiveis.map(x => x.id) : [],
                                                }))}
                                            />
                                            Selecionar todos
                                        </label>
                                    </div>
                                    <div style={{
                                        maxHeight: 260,
                                        overflowY: "auto",
                                        border: "1px solid var(--border-color, #444)",
                                        borderRadius: 6,
                                        padding: "0.5rem",
                                    }}>
                                        {pessoasFiltradas.map(p => (
                                            <label key={p.id} style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.3rem 0.4rem", cursor: "pointer" }}>
                                                <input
                                                    type="checkbox"
                                                    checked={form.convocados.includes(p.id)}
                                                    onChange={() => toggleConvocado(p.id)}
                                                />
                                                {p.nome}
                                                {p.escalao && <span style={{ fontSize: "0.8em", opacity: 0.7 }}> — {p.escalao}</span>}
                                            </label>
                                        ))}
                                        {pessoasFiltradas.length === 0 && (
                                            <p style={{ opacity: 0.6, padding: "0.5rem" }}>Sem resultados.</p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {formErro && <div className="alert alert-danger" style={{ marginTop: "1rem" }}>{formErro}</div>}

                            <div style={{ marginTop: "1.25rem", display: "flex", gap: "1rem" }}>
                                <button type="submit" className="btn btn-primary" disabled={saving}>
                                    {saving ? "A guardar..." : "Guardar"}
                                </button>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>
                                    Cancelar
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* ── Events Table ── */}
                {!showForm && (loading ? (
                    <p className="loading-text">A carregar eventos...</p>
                ) : eventos.length === 0 ? (
                    <div className="card" style={{ padding: "2rem", textAlign: "center", opacity: 0.7 }}>
                        Nenhum evento criado ainda.
                    </div>
                ) : (
                    <div className="table-wrapper">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Título</th>
                                    <th>Tipo</th>
                                    <th>Associação</th>
                                    <th>Data/Hora</th>
                                    <th>Local</th>
                                    <th>Convocados</th>
                                    {canManage && <th>Ações</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {eventos.map(ev => (
                                    <tr key={ev.id}>
                                        <td><strong>{ev.titulo}</strong></td>
                                        <td>
                                            <span className={`badge ${ev.tipo === "MODALIDADE" ? "badge-cyan" : "badge-orange"}`}>
                                                {ev.tipo === "MODALIDADE" ? "Modalidade" : "Atividade"}
                                            </span>
                                        </td>
                                        <td>
                                            {ev.tipo === "MODALIDADE"
                                                ? `${ev.clubeNome || ""} — ${ev.modalidadeNome || ""}`
                                                : `${ev.coletividadeNome || ""} — ${ev.atividadeNome || ""}`}
                                        </td>
                                        <td>{formatDataHora(ev.dataHora)}</td>
                                        <td>
                                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                                <span>{ev.local}</span>
                                                {ev.latitude && ev.longitude && (
                                                    <MiniMap
                                                        latitude={ev.latitude}
                                                        longitude={ev.longitude}
                                                        onClick={() => setViewingMap(ev)}
                                                    />
                                                )}
                                            </div>
                                        </td>
                                        <td>
                                            <button
                                                className="btn btn-sm btn-outline"
                                                onClick={() => verConvocados(ev)}
                                            >
                                                👥 {ev.totalConvocados || 0}
                                            </button>
                                        </td>
                                        {canManage && (
                                            <td>
                                                <div style={{ display: "flex", gap: "0.5rem" }}>
                                                    <button
                                                        className="btn btn-sm btn-secondary"
                                                        onClick={() => abrirEditar(ev)}
                                                    >
                                                        Editar
                                                    </button>
                                                    <button
                                                        className="btn btn-sm btn-danger"
                                                        onClick={() => eliminar(ev.id)}
                                                    >
                                                        Eliminar
                                                    </button>
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ))}
            </div>

            {/* ── Convocados Modal ── */}
            {viewingConvocados && (
                <div className="modal-overlay" onClick={() => setViewingConvocados(null)}>
                    <div className="modal-box" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Convocados — {viewingConvocados.titulo}</h3>
                            <button className="modal-close" onClick={() => setViewingConvocados(null)}>✕</button>
                        </div>
                        <div className="modal-body">
                            {convocadosList.length === 0 ? (
                                <p style={{ opacity: 0.6 }}>Sem convocados registados.</p>
                            ) : (
                                <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                                    {convocadosList.map(c => (
                                        <li key={c.id} style={{ padding: "0.4rem 0", borderBottom: "1px solid var(--border-color, #333)" }}>
                                            {c.nome}
                                            {c.escalao && <span style={{ opacity: 0.65, marginLeft: "0.5rem" }}>({c.escalao})</span>}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                </div>
            )}
            {/* ── Map View Modal ── */}
            {viewingMap && (
                <div className="modal-overlay" onClick={() => setViewingMap(null)}>
                    <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: 600 }}>
                        <div className="modal-header">
                            <h3>📍 {viewingMap.titulo} — {viewingMap.local}</h3>
                            <button className="modal-close" onClick={() => setViewingMap(null)}>✕</button>
                        </div>
                        <div className="modal-body">
                            <MapPicker
                                latitude={viewingMap.latitude}
                                longitude={viewingMap.longitude}
                                readOnly
                            />
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
