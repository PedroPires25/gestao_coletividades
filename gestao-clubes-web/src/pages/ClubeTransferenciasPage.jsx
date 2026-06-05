import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import SideMenu from "../components/SideMenu";
import { useAuth } from "../auth/AuthContext";
import { getTransferencias, registarTransferencia } from "../services/atletas";

const ROLES_TRANSFERENCIA = ["SUPER_ADMIN", "ADMINISTRADOR", "SECRETARIO"];

export default function ClubeTransferenciasPage() {
    const { clubeId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const { user, isSuperAdmin, logout } = useAuth();

    const podeTransferir = ROLES_TRANSFERENCIA.includes(user?.role);

    const atletaInicial = location.state?.atleta ?? null;
    const clubeNome = location.state?.clube?.nome ?? `Clube #${clubeId}`;

    const [transferencias, setTransferencias] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState(null);
    const [refetchKey, setRefetchKey] = useState(0);

    // Formulário de transferência
    const [mostrarForm, setMostrarForm] = useState(!!atletaInicial);
    const [atletaForm, setAtletaForm] = useState(atletaInicial ?? null);
    const [clubeDestinoId, setClubeDestinoId] = useState("");
    const [dataTransferencia, setDataTransferencia] = useState(
        new Date().toISOString().slice(0, 10)
    );
    const [observacoes, setObservacoes] = useState("");
    const [a_guardar, setAGuardar] = useState(false);
    const [msgSucesso, setMsgSucesso] = useState(location.state?.msg ?? null);
    const [erroForm, setErroForm] = useState(null);

    useEffect(() => {
        let activo = true;
        getTransferencias(clubeId)
            .then(dados => { if (activo) { setTransferencias(dados); setErro(null); } })
            .catch(e => { if (activo) setErro(e.message || "Não foi possível carregar as transferências."); })
            .finally(() => { if (activo) setCarregando(false); });
        return () => { activo = false; };
    }, [clubeId, refetchKey]);

    async function submeterTransferencia(e) {
        e.preventDefault();
        if (!atletaForm) return;
        setErroForm(null);
        setAGuardar(true);
        try {
            await registarTransferencia(clubeId, atletaForm.id, {
                clubeDestinoId: clubeDestinoId ? Number(clubeDestinoId) : null,
                dataTransferencia,
                observacoes: observacoes || null,
            });
            setMsgSucesso(`Atleta "${atletaForm.nome}" transferido com sucesso.`);
            setMostrarForm(false);
            setAtletaForm(null);
            setClubeDestinoId("");
            setObservacoes("");
            navigate(location.pathname, { replace: true, state: null });
            setCarregando(true);
            setRefetchKey(k => k + 1);
        } catch (e) {
            setErroForm(e.message || "Não foi possível registar a transferência.");
        } finally {
            setAGuardar(false);
        }
    }

    const menuItems = [
        { label: "Home", to: "/menu" },
        ...(isSuperAdmin ? [{ label: "Clubes", to: "/clubes" }] : []),
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

    return (
        <>
            <SideMenu
                title="Gestão de Coletividades"
                subtitle={`Transferências • ${clubeNome}`}
                logoHref="/menu"
                items={menuItems}
            />

            <div className="container" style={{ paddingTop: 24 }}>
                <div className="page-title">
                    <h1>Transferências</h1>
                    <div className="hint">{clubeNome}</div>
                </div>

                {msgSucesso && (
                    <div className="alert alert-success" style={{ marginBottom: 16 }}>
                        {msgSucesso}
                        <button
                            type="button"
                            className="btn-close"
                            onClick={() => setMsgSucesso(null)}
                            style={{ marginLeft: 8 }}
                        >✕</button>
                    </div>
                )}

                {/* Formulário de nova transferência */}
                {podeTransferir && mostrarForm && atletaForm && (
                    <div className="card" style={{ marginBottom: 24 }}>
                        <h2 style={{ marginBottom: 12 }}>Registar Transferência</h2>
                        <p style={{ marginBottom: 16 }}>
                            Atleta: <strong>{atletaForm.nome}</strong>
                            {atletaForm.escalao && ` · ${atletaForm.escalao}`}
                        </p>
                        <form onSubmit={submeterTransferencia}>
                            <div className="form-group">
                                <label htmlFor="dataTransferencia">Data da Transferência *</label>
                                <input
                                    id="dataTransferencia"
                                    type="date"
                                    className="form-control"
                                    required
                                    value={dataTransferencia}
                                    onChange={e => setDataTransferencia(e.target.value)}
                                />
                            </div>
                            <div className="form-group" style={{ marginTop: 12 }}>
                                <label htmlFor="clubeDestinoId">
                                    ID do Clube de Destino <span className="hint">(opcional)</span>
                                </label>
                                <input
                                    id="clubeDestinoId"
                                    type="number"
                                    min="1"
                                    className="form-control"
                                    placeholder="Deixar em branco se desconhecido"
                                    value={clubeDestinoId}
                                    onChange={e => setClubeDestinoId(e.target.value)}
                                />
                            </div>
                            <div className="form-group" style={{ marginTop: 12 }}>
                                <label htmlFor="observacoes">
                                    Observações <span className="hint">(opcional)</span>
                                </label>
                                <textarea
                                    id="observacoes"
                                    className="form-control"
                                    rows={3}
                                    maxLength={255}
                                    value={observacoes}
                                    onChange={e => setObservacoes(e.target.value)}
                                />
                            </div>
                            {erroForm && (
                                <p className="text-danger" style={{ marginTop: 8 }}>{erroForm}</p>
                            )}
                            <div className="actions" style={{ marginTop: 16 }}>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={a_guardar}
                                >
                                    {a_guardar ? "A guardar..." : "Confirmar Transferência"}
                                </button>
                                <button
                                    type="button"
                                    className="btn"
                                    onClick={() => {
                                        setMostrarForm(false);
                                        setAtletaForm(null);
                                        setErroForm(null);
                                        navigate(location.pathname, { replace: true, state: null });
                                    }}
                                    style={{ marginLeft: 8 }}
                                >
                                    Cancelar
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Histórico de transferências */}
                <div className="card">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                        <h2 style={{ margin: 0 }}>Histórico de Transferências</h2>
                        <Link className="btn" to={`/clubes/${clubeId}`}>← Voltar ao Clube</Link>
                    </div>

                    {carregando && <p className="subtle">A carregar...</p>}
                    {erro && <p className="text-danger">{erro}</p>}

                    {!carregando && !erro && transferencias.length === 0 && (
                        <p className="subtle">Ainda não existem transferências registadas para este clube.</p>
                    )}

                    {!carregando && !erro && transferencias.length > 0 && (
                        <div className="table-wrapper">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Atleta</th>
                                        <th>Tipo</th>
                                        <th>Modalidade</th>
                                        <th>Escalão</th>
                                        <th>Clube de Origem</th>
                                        <th>Clube de Destino</th>
                                        <th>Data</th>
                                        <th>Observações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {transferencias.map(t => (
                                        <tr key={t.id}>
                                            <td>{t.atletaNome}</td>
                                            <td>{t.tipo ?? "Atleta"}</td>
                                            <td>{t.modalidade ?? "—"}</td>
                                            <td>{t.escalao ?? "—"}</td>
                                            <td>{t.clubeOrigem}</td>
                                            <td>{t.clubeDestino ?? <em className="subtle">Externo / Desconhecido</em>}</td>
                                            <td>{t.dataTransferencia ?? "—"}</td>
                                            <td>{t.observacoes ?? "—"}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
