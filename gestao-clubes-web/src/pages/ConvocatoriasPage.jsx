import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import SideMenu from "../components/SideMenu";
import MapPicker from "../components/MapPicker";
import MiniMap from "../components/MiniMap";
import { useAuth } from "../auth/AuthContext";
import { getClubeById, getModalidadesDoClube, getUploadUrl } from "../api";
import {
    createConvocatoriaTreinador,
    getAtletasConvocatoriasTreinador,
    getConvocatoriasTreinador,
    getConvocadosConvocatoriaTreinador,
    getEscaloesTreinador,
    updateConvocatoriaTreinador,
} from "../services/treinador";
import { exportToCsv, exportToPdf, printPdf } from "../utils/export";

const SUBTIPOS = [
    { value: "CONVOCATORIA", label: "Convocatória" },
    { value: "TREINO", label: "Treino" },
    { value: "JOGO", label: "Jogo" },
    { value: "TORNEIO", label: "Torneio" },
    { value: "REUNIAO", label: "Reunião" },
    { value: "OUTRO", label: "Outro" },
];

function toFormDate(ts) {
    if (!ts) return "";
    const d = new Date(ts);
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function toFormTime(ts) {
    if (!ts) return "";
    const d = new Date(ts);
    const pad = (n) => String(n).padStart(2, "0");
    return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatDateTimeFromTs(ts) {
    if (!ts) return "—";
    const d = new Date(ts);
    const pad = (n) => String(n).padStart(2, "0");
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function subtipoLabel(value) {
    return SUBTIPOS.find((s) => s.value === value)?.label || value || "Outro";
}

const EMPTY_FORM = {
    titulo: "",
    subtipo: "CONVOCATORIA",
    clubeModalidadeId: "",
    escalaoId: "",
    data: "",
    horaInicio: "",
    horaFim: "",
    local: "",
    descricao: "",
    atletasConvocados: [],
    latitude: null,
    longitude: null,
};

function getClubeModalidadeId(item) {
    return String(item?.id ?? item?.clubeModalidadeId ?? item?.clube_modalidade_id ?? "");
}

function modalidadeLabel(item) {
    const nome = item?.modalidade?.nome || item?.nome || "Modalidade";
    return item?.epoca ? `${nome} (${item.epoca})` : nome;
}

export default function ConvocatoriasPage() {
    const { clubeId } = useParams();
    const navigate = useNavigate();
    const { logout, isTreinador, modalidadeId: modalidadeAtualId } = useAuth();

    const [eventos, setEventos] = useState([]);
    const [atletas, setAtletas] = useState([]);
    const [escaloes, setEscaloes] = useState([]);
    const [modalidades, setModalidades] = useState([]);
    const [loading, setLoading] = useState(true);
    const [erro, setErro] = useState("");
    const [msg, setMsg] = useState("");
    const [saving, setSaving] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [editingEventoId, setEditingEventoId] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [searchAtletas, setSearchAtletas] = useState("");
    const [viewingMap, setViewingMap] = useState(null);
    const [viewingConvocados, setViewingConvocados] = useState(null);
    const [convocadosList, setConvocadosList] = useState([]);
    const [clubeInfo, setClubeInfo] = useState(null);

    const menuItems = useMemo(
        () => [
            { label: "Módulo de Treinador", to: `/clubes/${clubeId}/treinador` },
            { label: "Convocatórias", to: `/clubes/${clubeId}/treinador/convocatorias` },
            { label: "Eventos do Clube", to: `/clubes/${clubeId}/eventos` },
            {
                label: "Logout",
                onClick: () => {
                    logout();
                    navigate("/login", { replace: true });
                },
            },
        ],
        [clubeId, logout, navigate]
    );

    const carregarDados = useCallback(async () => {
        if (!clubeId) return;
        setErro("");
        setLoading(true);
        try {
            const [clubeData, eventosData, escaloesData, modalidadesData] = await Promise.all([
                getClubeById(clubeId).catch(() => null),
                getConvocatoriasTreinador(clubeId),
                getEscaloesTreinador(clubeId),
                getModalidadesDoClube(clubeId, { apenasAtivas: true }),
            ]);
            setClubeInfo(clubeData || null);
            setEventos(Array.isArray(eventosData) ? eventosData : []);
            const escaloesLista = Array.isArray(escaloesData) ? escaloesData : [];
            const modalidadesLista = Array.isArray(modalidadesData) ? modalidadesData : [];
            setEscaloes(escaloesLista);
            setModalidades(modalidadesLista);

            const modalidadeInicial = isTreinador
                ? modalidadeAtualId
                : getClubeModalidadeId(modalidadesLista[0]);
            if (escaloesLista.length > 0) {
                const atletasData = await getAtletasConvocatoriasTreinador(clubeId, escaloesLista[0].id, modalidadeInicial);
                setAtletas(Array.isArray(atletasData) ? atletasData : []);
            } else {
                const atletasData = await getAtletasConvocatoriasTreinador(clubeId, null, modalidadeInicial);
                setAtletas(Array.isArray(atletasData) ? atletasData : []);
            }
        } catch (e) {
            setErro(e.message || "Erro ao carregar convocatórias.");
        } finally {
            setLoading(false);
        }
    }, [clubeId, isTreinador, modalidadeAtualId]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        carregarDados();
    }, [carregarDados]);

    function abrirNovoEvento() {
        const modalidadeInicial = isTreinador
            ? modalidadeAtualId
            : getClubeModalidadeId(modalidades[0]);
        setForm({ ...EMPTY_FORM, clubeModalidadeId: modalidadeInicial || "" });
        setEditingEventoId(null);
        setSearchAtletas("");
        setShowForm(true);
    }

    async function abrirConvocados(evento) {
        setViewingConvocados(evento);
        try {
            const data = await getConvocadosConvocatoriaTreinador(clubeId, evento.id);
            setConvocadosList(Array.isArray(data) ? data : []);
        } catch {
            setConvocadosList([]);
        }
    }

    async function abrirEditar(evento) {
        try {
            const conv = await getConvocadosConvocatoriaTreinador(clubeId, evento.id);
            const ids = (Array.isArray(conv) ? conv : []).map((a) => a.id);
            const escalaoId = evento.escalaoId ?? "";
            const clubeModalidadeId = evento.clubeModalidadeId ?? "";
            if (escalaoId) {
                const atletasData = await getAtletasConvocatoriasTreinador(clubeId, escalaoId, clubeModalidadeId);
                setAtletas(Array.isArray(atletasData) ? atletasData : []);
            } else {
                const atletasData = await getAtletasConvocatoriasTreinador(clubeId, null, clubeModalidadeId);
                setAtletas(Array.isArray(atletasData) ? atletasData : []);
            }
            setForm({
                titulo: evento.titulo || "",
                subtipo: evento.subtipo || "CONVOCATORIA",
                clubeModalidadeId,
                escalaoId: escalaoId,
                data: toFormDate(evento.dataHora),
                horaInicio: toFormTime(evento.dataHora),
                horaFim: toFormTime(evento.dataHoraFim),
                local: evento.local || "",
                descricao: evento.descricao || "",
                atletasConvocados: ids,
                latitude: evento.latitude ?? null,
                longitude: evento.longitude ?? null,
            });
            setEditingEventoId(evento.id);
            setSearchAtletas("");
            setShowForm(true);
        } catch (e) {
            setErro(e.message || "Não foi possível abrir o evento para edição.");
        }
    }

    function toggleAtleta(atletaId) {
        setForm((prev) => ({
            ...prev,
            atletasConvocados: prev.atletasConvocados.includes(atletaId)
                ? prev.atletasConvocados.filter((id) => id !== atletaId)
                : [...prev.atletasConvocados, atletaId],
        }));
    }

    async function guardarEvento(e) {
        e.preventDefault();
        setErro("");
        setMsg("");
        setSaving(true);
        try {
            const payload = {
                titulo: form.titulo.trim(),
                subtipo: form.subtipo,
                clubeModalidadeId: form.clubeModalidadeId ? Number(form.clubeModalidadeId) : null,
                escalaoId: form.escalaoId ? Number(form.escalaoId) : null,
                data: form.data,
                horaInicio: form.horaInicio,
                horaFim: form.horaFim || null,
                local: form.local.trim(),
                descricao: form.descricao.trim() || null,
                atletasConvocados: form.atletasConvocados,
                latitude: form.latitude ?? null,
                longitude: form.longitude ?? null,
            };

            let response;
            if (editingEventoId) {
                response = await updateConvocatoriaTreinador(clubeId, editingEventoId, payload);
            } else {
                response = await createConvocatoriaTreinador(clubeId, payload);
            }

            setShowForm(false);
            setEditingEventoId(null);
            setForm(EMPTY_FORM);
            await carregarDados();

            const emailStatus = response?.emailStatus;
            const mensagem = response?.mensagem;
            if (emailStatus === "FALHA" || emailStatus === "PARCIAL") {
                setErro(mensagem || "Erro ao enviar email da convocatória.");
            } else {
                setMsg(mensagem || "Evento guardado com sucesso.");
                setTimeout(() => setMsg(""), 4500);
            }
        } catch (err) {
            setErro(err.message || "Erro ao guardar evento.");
        } finally {
            setSaving(false);
        }
    }

    const atletasFiltrados = atletas.filter((a) =>
        !searchAtletas || (a.nome || "").toLowerCase().includes(searchAtletas.toLowerCase())
    );

    function prepareExportData() {
        const columns = [
            { key: "titulo", label: "Título" },
            { key: "subtipo", label: "Tipo" },
            { key: "modalidade", label: "Modalidade" },
            { key: "dataHora", label: "Data/Hora" },
            { key: "local", label: "Local" },
            { key: "convocados", label: "Convocados" },
        ];
        const dataToExport = eventos.map((ev) => ({
            titulo: ev.titulo || "-",
            subtipo: subtipoLabel(ev.subtipo),
            modalidade: ev.modalidadeNome || "-",
            dataHora: ev.dataHora ? formatDateTimeFromTs(ev.dataHora) : "-",
            local: ev.local || "-",
            convocados: ev.totalConvocados ?? 0,
        }));
        return { columns, dataToExport };
    }

    function handleExportCsv() {
        const { columns, dataToExport } = prepareExportData();
        exportToCsv(dataToExport, columns, `convocatorias_${clubeInfo?.nome || clubeId}.csv`);
    }

    function handleExportPdf() {
        const { columns, dataToExport } = prepareExportData();
        exportToPdf({
            data: dataToExport,
            columns,
            title: "Convocatórias",
            clubName: clubeInfo?.nome,
            clubLogoUrl: getUploadUrl(clubeInfo?.logoPath),
            filename: `convocatorias_${clubeInfo?.nome || clubeId}.pdf`,
        });
    }

    function handlePrint() {
        const { columns, dataToExport } = prepareExportData();
        printPdf({
            data: dataToExport,
            columns,
            title: "Convocatórias",
            clubName: clubeInfo?.nome,
            clubLogoUrl: getUploadUrl(clubeInfo?.logoPath),
        });
    }

    return (
        <>
            <SideMenu title="Gestão de Clubes" subtitle="Convocatórias" logoHref="/menu" logoSrc="/LOGO_GCDC04.png" items={menuItems} />

            <div className="container" style={{ paddingTop: 24 }}>
                <div className="page-title page-title-with-icon">
                    <div className="page-title-main-wrap">
                        <span className="page-title-icon-circle" style={{ fontSize: "1.6rem" }}>📢</span>
                        <div className="page-title-texts">
                            <h1>Convocatórias</h1>
                            <div className="hint">Área de trabalho para criar e gerir convocatórias.</div>
                        </div>
                    </div>
                    <div className="actions" style={{ display: "flex", gap: 8 }}>
                        <button type="button" className="btn" onClick={() => navigate(`/clubes/${clubeId}/eventos`)}>Eventos do Clube</button>
                        {!showForm && eventos.length > 0 && (
                            <>
                                <button type="button" className="btn btn-sm" onClick={handleExportCsv}>CSV</button>
                                <button type="button" className="btn btn-sm" onClick={handleExportPdf}>PDF</button>
                                <button type="button" className="btn btn-sm" onClick={handlePrint}>Imprimir</button>
                            </>
                        )}
                        {!showForm && (
                            <button type="button" className="btn btn-primary" onClick={abrirNovoEvento}>Novo evento</button>
                        )}
                    </div>
                </div>

                {msg && <div className="alert success">{msg}</div>}
                {erro && <div className="alert error">{erro}</div>}

                {showForm && (
                    <div className="card" style={{ marginBottom: 20 }}>
                        <h2 style={{ marginTop: 0 }}>{editingEventoId ? "Editar evento" : "Novo evento"}</h2>
                        <form onSubmit={guardarEvento}>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Título *</label>
                                    <input className="input" value={form.titulo} onChange={(e) => setForm((p) => ({ ...p, titulo: e.target.value }))} required />
                                </div>

                                <div className="form-group">
                                    <label>Tipo/Subtipo *</label>
                                    <select className="input" value={form.subtipo} onChange={(e) => setForm((p) => ({ ...p, subtipo: e.target.value }))} required>
                                        {SUBTIPOS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>Modalidade *</label>
                                    <select
                                        className="input"
                                        value={form.clubeModalidadeId}
                                        onChange={async (e) => {
                                            const novoClubeModalidadeId = e.target.value;
                                            setForm((p) => ({ ...p, clubeModalidadeId: novoClubeModalidadeId, atletasConvocados: [] }));
                                            try {
                                                const data = await getAtletasConvocatoriasTreinador(clubeId, form.escalaoId || null, novoClubeModalidadeId);
                                                setAtletas(Array.isArray(data) ? data : []);
                                            } catch {
                                                setAtletas([]);
                                            }
                                        }}
                                        disabled={isTreinador}
                                        required
                                    >
                                        <option value="">-- Selecionar modalidade --</option>
                                        {modalidades.map((modalidade) => {
                                            const id = getClubeModalidadeId(modalidade);
                                            return <option key={id} value={id}>{modalidadeLabel(modalidade)}</option>;
                                        })}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>Escalão *</label>
                                    <select
                                        className="input"
                                        value={form.escalaoId}
                                        onChange={async (e) => {
                                            const novoEscalaoId = e.target.value;
                                            setForm((p) => ({ ...p, escalaoId: novoEscalaoId, atletasConvocados: [] }));
                                            if (novoEscalaoId) {
                                                try {
                                                    const data = await getAtletasConvocatoriasTreinador(clubeId, novoEscalaoId, form.clubeModalidadeId);
                                                    setAtletas(Array.isArray(data) ? data : []);
                                                } catch {
                                                    setAtletas([]);
                                                }
                                            }
                                        }}
                                        required
                                    >
                                        <option value="">-- Selecionar escalão --</option>
                                        {escaloes.map((esc) => (
                                            <option key={esc.id} value={esc.id}>{esc.nome}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>Data *</label>
                                    <input type="date" className="input" value={form.data} onChange={(e) => setForm((p) => ({ ...p, data: e.target.value }))} required />
                                </div>

                                <div className="form-group">
                                    <label>Hora início *</label>
                                    <input type="time" className="input" value={form.horaInicio} onChange={(e) => setForm((p) => ({ ...p, horaInicio: e.target.value }))} required />
                                </div>

                                <div className="form-group">
                                    <label>Hora fim</label>
                                    <input type="time" className="input" value={form.horaFim} onChange={(e) => setForm((p) => ({ ...p, horaFim: e.target.value }))} />
                                </div>

                                <div className="form-group">
                                    <label>Local *</label>
                                    <input className="input" value={form.local} onChange={(e) => setForm((p) => ({ ...p, local: e.target.value }))} required />
                                </div>

                                <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                                    <label>Descrição</label>
                                    <textarea className="input" rows={3} value={form.descricao} onChange={(e) => setForm((p) => ({ ...p, descricao: e.target.value }))} />
                                </div>

                                <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                                    <label>📍 Localização no mapa</label>
                                    <MapPicker
                                        searchValue={form.local}
                                        latitude={form.latitude}
                                        longitude={form.longitude}
                                        onLocationChange={(lat, lng, address) =>
                                            setForm((p) => ({
                                                ...p,
                                                latitude: lat,
                                                longitude: lng,
                                                ...(address ? { local: address } : {}),
                                            }))
                                        }
                                    />
                                </div>
                            </div>

                            <div style={{ marginTop: 16 }}>
                                <h3 style={{ marginBottom: 8 }}>Atletas convocados ({form.atletasConvocados.length})</h3>
                                <input
                                    className="input"
                                    placeholder="Filtrar atletas por nome..."
                                    value={searchAtletas}
                                    onChange={(e) => setSearchAtletas(e.target.value)}
                                    style={{ maxWidth: 320, marginBottom: 10 }}
                                />
                                <div style={{ maxHeight: 260, overflowY: "auto", border: "1px solid var(--border-color, #444)", borderRadius: 6, padding: "0.5rem" }}>
                                    {atletasFiltrados.map((a) => (
                                        <label key={a.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 4px", cursor: "pointer" }}>
                                            <input
                                                type="checkbox"
                                                checked={form.atletasConvocados.includes(a.id)}
                                                onChange={() => toggleAtleta(a.id)}
                                            />
                                            <span className="nome-com-avatar">
                                                {a.fotoPath ? (
                                                    <img src={getUploadUrl(a.fotoPath)} alt={a.nome} className="avatar-circle-sm" />
                                                ) : (
                                                    <span className="avatar-circle-sm avatar-initials-sm">{(a.nome || "?")[0].toUpperCase()}</span>
                                                )}
                                                {a.nome}
                                            </span>
                                            {a.escalao && <span style={{ opacity: 0.75, fontSize: "0.84em" }}>— {a.escalao}</span>}
                                        </label>
                                    ))}
                                    {atletasFiltrados.length === 0 && (
                                        <p className="subtle" style={{ padding: "0.5rem", margin: 0 }}>Sem atletas disponíveis para os filtros selecionados.</p>
                                    )}
                                </div>
                            </div>

                            <div style={{ marginTop: 16, display: "flex", gap: 10 }}>
                                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? "A guardar..." : "Guardar"}</button>
                                <button
                                    type="button"
                                    className="btn"
                                    onClick={() => {
                                        setShowForm(false);
                                        setEditingEventoId(null);
                                        setForm(EMPTY_FORM);
                                    }}
                                >
                                    Cancelar
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {loading ? (
                    <p className="subtle">A carregar convocatórias...</p>
                ) : eventos.length === 0 ? (
                    <div className="card" style={{ padding: "1.2rem" }}>
                        <p className="subtle" style={{ margin: 0 }}>Ainda não existem eventos neste módulo.</p>
                    </div>
                ) : (
                    <div className="table-wrap">
                        <table className="dashboard-table">
                            <thead>
                                <tr>
                                    <th>Título</th>
                                    <th>Subtipo</th>
                                    <th>Modalidade</th>
                                    <th>Data/Hora</th>
                                    <th>Data/Hora fim</th>
                                    <th>Local</th>
                                    <th>Convocados</th>
                                    <th>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {eventos.map((ev) => {
                                    return (
                                        <tr key={ev.id}>
                                            <td>{ev.titulo}</td>
                                            <td>{subtipoLabel(ev.subtipo)}</td>
                                            <td>{ev.modalidadeNome || "—"}</td>
                                            <td>{formatDateTimeFromTs(ev.dataHora)}</td>
                                            <td>{ev.dataHoraFim ? formatDateTimeFromTs(ev.dataHoraFim) : "—"}</td>
                                            <td>
                                                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                                    <span style={{ flex: 1 }}>{ev.local || "—"}</span>
                                                    {ev.latitude != null && ev.longitude != null && (
                                                        <MiniMap latitude={ev.latitude} longitude={ev.longitude} onClick={() => setViewingMap(ev)} />
                                                    )}
                                                </div>
                                            </td>
                                            <td>
                                                <button type="button" className="btn btn-sm btn-outline" onClick={() => abrirConvocados(ev)}>
                                                    👥 {ev.totalConvocados || 0}
                                                </button>
                                            </td>
                                            <td>
                                                <button type="button" className="btn btn-sm" onClick={() => abrirEditar(ev)}>Editar</button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {viewingConvocados && (
                <div className="modal-overlay" onClick={() => setViewingConvocados(null)}>
                    <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 560 }}>
                        <div className="modal-header">
                            <h3>👥 Convocados — {viewingConvocados.titulo}</h3>
                            <button className="modal-close" onClick={() => setViewingConvocados(null)}>✕</button>
                        </div>
                        <div className="modal-body">
                            {convocadosList.length === 0 ? (
                                <p className="subtle">Sem convocados registados.</p>
                            ) : (
                                <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                                    {convocadosList.map((c) => (
                                        <li key={c.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0", borderBottom: "1px solid var(--border-color, #444)" }}>
                                            {c.fotoPath ? (
                                                <img src={getUploadUrl(c.fotoPath)} alt={c.nome} className="avatar-circle-sm" />
                                            ) : (
                                                <span className="avatar-circle-sm avatar-initials-sm">{(c.nome || "?")[0].toUpperCase()}</span>
                                            )}
                                            <span>{c.nome}</span>
                                            {c.escalao && <span className="subtle" style={{ fontSize: "0.84em" }}>— {c.escalao}</span>}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {viewingMap && (
                <div className="modal-overlay" onClick={() => setViewingMap(null)}>
                    <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 600 }}>
                        <div className="modal-header">
                            <h3>📍 {viewingMap.titulo} — {viewingMap.local}</h3>
                            <button className="modal-close" onClick={() => setViewingMap(null)}>✕</button>
                        </div>
                        <div className="modal-body">
                            <MapPicker latitude={viewingMap.latitude} longitude={viewingMap.longitude} readOnly />
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
