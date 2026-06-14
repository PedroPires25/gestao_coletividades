import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import SideMenu from "../components/SideMenu";
import { useAuth } from "../auth/AuthContext";
import { getColetividadeById, getMinhasAtividades } from "../api";
import {
    getEventosColetividade,
    getInscricoesEvento,
    inscreverEmEvento,
    cancelarInscricaoEvento,
} from "../services/eventosColetividade";
import eventosIcon from "../assets/eventos.svg";
import AtividadeCarousel from "../components/AtividadeCarousel";

function formatDateOnly(value) {
    if (!value) return "-";
    const raw = String(value).trim();
    const date = raw.includes("T") ? raw.split("T")[0] : raw.slice(0, 10);
    const [year, month, day] = date.split("-");
    return year && month && day ? `${day}/${month}/${year}` : date;
}

function badgeEstadoEvento(estado) {
    const cores = {
        Aberto: { bg: "#22c55e20", color: "#15803d", border: "#22c55e" },
        Fechado: { bg: "#94a3b820", color: "#cbd5e1", border: "#94a3b8" },
        Cancelado: { bg: "#ef444420", color: "#fca5a5", border: "#ef4444" },
        "Concluído": { bg: "#3b82f620", color: "#93c5fd", border: "#3b82f6" },
    };
    const c = cores[estado] || { bg: "#88888820", color: "#fff", border: "#888" };
    return (
        <span style={{ padding: "3px 10px", borderRadius: 999, fontSize: "0.78rem", fontWeight: 700, background: c.bg, color: c.color, border: `1px solid ${c.border}` }}>
            {estado || "-"}
        </span>
    );
}

function InscricaoBadge({ estado }) {
    const map = {
        APROVADO: { label: "Aprovado", color: "var(--ok, #22c55e)" },
        PENDENTE: { label: "Pendente", color: "#f59e0b" },
        REJEITADO: { label: "Rejeitado", color: "var(--error, #ef4444)" },
    };
    const info = map[estado] ?? { label: estado ?? "Desconhecido", color: "#6b7280" };
    return (
        <span style={{ display: "inline-block", padding: "2px 12px", borderRadius: 999, background: info.color, color: "#fff", fontWeight: 600, fontSize: "0.85rem" }}>
            {info.label}
        </span>
    );
}

export default function AreaAcessoColetividadePage() {
    const { coletividadeId } = useParams();
    const navigate = useNavigate();
    const { logout, user } = useAuth();

    const [coletividade, setColetividade] = useState(null);
    const [atividades, setAtividades] = useState([]);
    const [eventos, setEventos] = useState([]);
    const [minhasInscricoes, setMinhasInscricoes] = useState({}); // eventId -> inscricaoId
    const [savingEvento, setSavingEvento] = useState({}); // eventId -> bool
    const [loading, setLoading] = useState(true);
    const [erro, setErro] = useState(null);
    const [msgSucesso, setMsgSucesso] = useState("");

    useEffect(() => {
        if (!coletividadeId) return;
        let active = true;
        (async () => {
            try {
                const [coletividadeData, eventosData, atividadesData] = await Promise.all([
                    getColetividadeById(coletividadeId),
                    getEventosColetividade(coletividadeId),
                    getMinhasAtividades(),
                ]);
                if (!active) return;

                const listaEventos = Array.isArray(eventosData) ? eventosData : [];
                setColetividade(coletividadeData);
                setEventos(listaEventos);
                setAtividades(atividadesData || []);

                // Pre-load user's inscriptions for inscribable events
                const inscribiveis = listaEventos.filter(e => e.permiteInscricao);
                if (inscribiveis.length > 0 && user?.id) {
                    const results = await Promise.all(
                        inscribiveis.map(e =>
                            getInscricoesEvento(coletividadeId, e.id)
                                .then(list => ({ eventoId: e.id, list: Array.isArray(list) ? list : [] }))
                                .catch(() => ({ eventoId: e.id, list: [] }))
                        )
                    );
                    if (!active) return;
                    const minhas = {};
                    for (const { eventoId, list } of results) {
                        const minha = list.find(i =>
                            i.utilizadorId != null &&
                            String(i.utilizadorId) === String(user.id) &&
                            i.estado !== "Cancelado"
                        );
                        if (minha) minhas[eventoId] = minha.id;
                    }
                    setMinhasInscricoes(minhas);
                }

                if (active) setLoading(false);
            } catch (e) {
                if (active) {
                    setErro(e.message || "Erro ao carregar dados da coletividade.");
                    setLoading(false);
                }
            }
        })();
        return () => { active = false; };
    }, [coletividadeId, user?.id]);

    async function inscrever(evento) {
        setSavingEvento(prev => ({ ...prev, [evento.id]: true }));
        setMsgSucesso("");
        setErro(null);
        try {
            const nomeParticipante = user?.nome || user?.email || "Participante";
            const res = await inscreverEmEvento(coletividadeId, evento.id, { nomeParticipante });
            const inscricaoId = res?.id ?? null;
            setMinhasInscricoes(prev => ({ ...prev, [evento.id]: inscricaoId }));
            setMsgSucesso(`Inscrito com sucesso em "${evento.titulo}".`);
        } catch (e) {
            setErro(e.message || "Não foi possível efetuar a inscrição.");
        } finally {
            setSavingEvento(prev => ({ ...prev, [evento.id]: false }));
        }
    }

    async function cancelarMinhaInscricao(evento) {
        const inscricaoId = minhasInscricoes[evento.id];
        if (!inscricaoId) return;
        if (!window.confirm(`Cancelar a tua inscrição em "${evento.titulo}"?`)) return;
        setSavingEvento(prev => ({ ...prev, [evento.id]: true }));
        setMsgSucesso("");
        setErro(null);
        try {
            await cancelarInscricaoEvento(coletividadeId, evento.id, inscricaoId);
            setMinhasInscricoes(prev => {
                const next = { ...prev };
                delete next[evento.id];
                return next;
            });
            setMsgSucesso(`Inscrição em "${evento.titulo}" cancelada.`);
        } catch (e) {
            setErro(e.message || "Não foi possível cancelar a inscrição.");
        } finally {
            setSavingEvento(prev => ({ ...prev, [evento.id]: false }));
        }
    }

    const menuItems = [
        { label: "Logout", onClick: () => { logout(); navigate("/login", { replace: true }); } },
    ];

    if (loading) {
        return (
            <div>
                <SideMenu title={coletividade?.nome || "Coletividade"} subtitle="Área de Acesso" logoHref="/login" logoSrc="/LOGO_GCDC04.png" items={menuItems} />
                <div className="container" style={{ paddingTop: 24 }}>
                    <p>A carregar...</p>
                </div>
            </div>
        );
    }

    return (
        <>
            <SideMenu
                title={coletividade?.nome || "Coletividade"}
                subtitle="Área de Acesso"
                logoHref={`/minha-area/coletividade/${coletividadeId}`}
                logoSrc="/LOGO_GCDC04.png"
                items={menuItems}
            />

            <div className="container" style={{ paddingTop: 24 }}>
                <div className="page-title page-title-with-icon">
                    <div className="page-title-main-wrap">
                        <span className="page-title-icon-circle">
                            <img src={eventosIcon} alt="Eventos" className="page-title-icon" />
                        </span>
                        <div className="page-title-texts">
                            <h1>A minha área</h1>
                        </div>
                    </div>
                    <div className="hint">{coletividade?.nome || ""}</div>
                </div>

                {erro && <div className="alert error">{erro}</div>}
                {msgSucesso && <div className="alert success">{msgSucesso}</div>}

                <div className="stack-sections">

                    {/* SECÇÃO 0 — Minhas Atividades */}
                    <section className="card">
                        <div className="modalidades-toolbar">
                            <div className="toolbar-title-group">
                                <h2>As minhas atividades</h2>
                                <span className="toolbar-count">{atividades.length}</span>
                            </div>
                        </div>
                        <AtividadeCarousel atividades={atividades} coletividadeId={coletividadeId} />
                    </section>

                    {/* SECÇÃO 1 — Eventos */}
                    <section className="card">
                        <div className="modalidades-toolbar">
                            <div className="toolbar-title-group">
                                <h2>Eventos da Coletividade</h2>
                                <span className="toolbar-count">{eventos.length}</span>
                            </div>
                        </div>
                        {eventos.length === 0 ? (
                            <p className="subtle">Não existem eventos disponíveis de momento.</p>
                        ) : (
                            <div className="table-wrap">
                                <table className="dashboard-table">
                                    <thead>
                                    <tr>
                                        <th>Título</th>
                                        <th>Data</th>
                                        <th>Local</th>
                                        <th>Atividade</th>
                                        <th>Vagas</th>
                                        <th>Estado</th>
                                        <th>Ações</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {eventos.map((evento) => {
                                        const estaInscrito = evento.id in minhasInscricoes;
                                        const podeInscrever = evento.permiteInscricao && evento.estado === "Aberto";
                                        const isSaving = !!savingEvento[evento.id];
                                        return (
                                            <tr key={evento.id}>
                                                <td style={{ fontWeight: 500 }}>{evento.titulo || "-"}</td>
                                                <td>{formatDateOnly(evento.dataEvento)}</td>
                                                <td>{evento.localEvento || "-"}</td>
                                                <td>{evento.atividadeNome || <span className="subtle">Geral</span>}</td>
                                                <td>
                                                    {evento.maxParticipantes
                                                        ? `${evento.participantesConfirmados || 0}/${evento.maxParticipantes}`
                                                        : "Sem limite"}
                                                </td>
                                                <td>{badgeEstadoEvento(evento.estado)}</td>
                                                <td>
                                                    {podeInscrever && !estaInscrito && (
                                                        <button
                                                            className="btn btn-primary"
                                                            disabled={isSaving}
                                                            onClick={() => inscrever(evento)}
                                                        >
                                                            {isSaving ? "A inscrever..." : "Inscrever-me"}
                                                        </button>
                                                    )}
                                                    {estaInscrito && (
                                                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                            <span style={{ color: "#22c55e", fontWeight: 600, fontSize: "0.85rem" }}>✓ Inscrito</span>
                                                            <button
                                                                className="btn btn-danger"
                                                                style={{ fontSize: "0.78rem", padding: "3px 10px" }}
                                                                disabled={isSaving}
                                                                onClick={() => cancelarMinhaInscricao(evento)}
                                                            >
                                                                {isSaving ? "..." : "Cancelar"}
                                                            </button>
                                                        </div>
                                                    )}
                                                    {!podeInscrever && !estaInscrito && (
                                                        <span className="subtle">—</span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </section>

                    {/* SECÇÃO 2 — Inscrição */}
                    <section className="card">
                        <div className="modalidades-toolbar">
                            <div className="toolbar-title-group">
                                <h2>Informações de Inscrição</h2>
                            </div>
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                <span style={{ fontWeight: 500 }}>Estado do registo:</span>
                                <InscricaoBadge estado={user?.estadoRegisto} />
                            </div>
                            <div>
                                <p style={{ fontWeight: 500, marginBottom: 6 }}>Documentação necessária:</p>
                                <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }} className="subtle">
                                    <li>Documento de identificação (CC ou Passaporte)</li>
                                    <li>Declaração de autorização (menores de 18 anos)</li>
                                    <li>Ficha de inscrição preenchida</li>
                                </ul>
                            </div>
                            <p className="subtle" style={{ margin: 0, lineHeight: 1.7 }}>
                                Envia a documentação para o email da coletividade ou entrega pessoalmente durante o horário de funcionamento.
                                Após validação pelo secretariado, o teu estado de inscrição será atualizado.
                            </p>
                        </div>
                    </section>

                    {/* SECÇÃO 3 — Contactos */}
                    <section className="card">
                        <div className="modalidades-toolbar">
                            <div className="toolbar-title-group">
                                <h2>Contactos</h2>
                            </div>
                        </div>

                        {coletividade ? (
                            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                {coletividade.email && (
                                    <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                                        <span style={{ minWidth: 100, fontWeight: 500 }}>Email:</span>
                                        <a href={`mailto:${coletividade.email}`}>{coletividade.email}</a>
                                    </div>
                                )}
                                {coletividade.telefone && (
                                    <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                                        <span style={{ minWidth: 100, fontWeight: 500 }}>Telefone:</span>
                                        <a href={`tel:${coletividade.telefone}`}>{coletividade.telefone}</a>
                                    </div>
                                )}
                                {coletividade.morada && (
                                    <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                                        <span style={{ minWidth: 100, fontWeight: 500 }}>Morada:</span>
                                        <span>
                                            {coletividade.morada}
                                            {coletividade.codigoPostal ? `, ${coletividade.codigoPostal}` : ""}
                                            {coletividade.localidade ? ` ${coletividade.localidade}` : ""}
                                        </span>
                                    </div>
                                )}
                                {!coletividade.email && !coletividade.telefone && !coletividade.morada && (
                                    <p className="subtle">Informações de contacto não disponíveis.</p>
                                )}
                            </div>
                        ) : (
                            <p className="subtle">Dados da coletividade não disponíveis.</p>
                        )}
                    </section>

                </div>
            </div>
        </>
    );
}