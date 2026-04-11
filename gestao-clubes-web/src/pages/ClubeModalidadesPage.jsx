import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import SideMenu from "../components/SideMenu";
import { useAuth } from "../auth/AuthContext";
import {
    getClubeById,
    getModalidades,
    getModalidadesDoClube,
    criarModalidade,
    editarModalidade,
    removerModalidadeDoClube,
    anexarModalidadeAoClube,
} from "../api";

import modalidadesIcon from "../assets/modalidades.svg";

function currentEpoca() {
    const y = new Date().getFullYear();
    return `${y - 1}/${y}`;
}

function normalizeEpoca(input) {
    const s = String(input ?? "").trim();
    if (!s) return "";

    const m = s.match(/^(\d{4})\s*\/\s*(\d{4})$/);
    if (m) return `${m[1]}/${m[2]}`;

    const y = s.match(/^(\d{4})$/);
    if (y) {
        const end = Number(y[1]);
        if (!Number.isFinite(end)) return s;
        return `${end - 1}/${end}`;
    }

    return s;
}

function buildEpocas({ past = 15, future = 15 } = {}) {
    const y = new Date().getFullYear();
    const list = [];

    for (let endYear = y - past; endYear <= y + future; endYear++) {
        list.push(`${endYear - 1}/${endYear}`);
    }

    return list.sort((a, b) => b.localeCompare(a));
}


export default function ClubeModalidadesPage() {
    const { clubeId } = useParams();
    const { logout, isAdmin, isSuperAdmin } = useAuth();
    const navigate = useNavigate();

    const [clube, setClube] = useState(null);
    const [modalidadesClube, setModalidadesClube] = useState([]);
    const [todasAssociacoesClube, setTodasAssociacoesClube] = useState([]);
    const [todasModalidades, setTodasModalidades] = useState([]);

    const [loading, setLoading] = useState(true);
    const [erro, setErro] = useState("");
    const [msg, setMsg] = useState("");

    const [apenasAtivas, setApenasAtivas] = useState(true);
    const [epocaSelecionada, setEpocaSelecionada] = useState("");
    const [pesquisa, setPesquisa] = useState("");
    const [ordenacao, setOrdenacao] = useState({ campo: "nome", direcao: "asc" });

    const [novoNome, setNovoNome] = useState("");
    const [novaDescricao, setNovaDescricao] = useState("");

    const [modalidadeExistenteId, setModalidadeExistenteId] = useState("");
    const [epocaNovaAssociacao, setEpocaNovaAssociacao] = useState(currentEpoca());

    const [editOpen, setEditOpen] = useState(false);
    const [editId, setEditId] = useState(null);
    const [editNome, setEditNome] = useState("");
    const [editDescricao, setEditDescricao] = useState("");

    const menuItems = useMemo(
        () => [
            { label: "Home", to: "/menu" },
            { label: "Clubes", to: "/clubes" },
            { label: "Coletividades", to: "/coletividades" },
            ...(isSuperAdmin ? [{ label: "Perfis", to: "/admin/users" }] : []),
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
        ],
        [clubeId, isSuperAdmin, logout, navigate]
    );

    const epocasGeradas = useMemo(() => buildEpocas(), []);

    const epocasExistentesBD = useMemo(() => {
        const s = new Set(
            (todasAssociacoesClube || [])
                .map((cm) => normalizeEpoca(cm?.epoca))
                .filter(Boolean)
        );
        return Array.from(s);
    }, [todasAssociacoesClube]);

    const epocasParaFiltro = useMemo(() => {
        const set = new Set([...epocasGeradas, ...epocasExistentesBD]);
        return Array.from(set).sort((a, b) => b.localeCompare(a));
    }, [epocasGeradas, epocasExistentesBD]);

    const modalidadesDisponiveisParaAnexar = useMemo(() => {
        const epocaBase = normalizeEpoca(epocaNovaAssociacao);

        const idsJaAssociadosNaEpoca = new Set(
            (todasAssociacoesClube || [])
                .filter((cm) => normalizeEpoca(cm?.epoca) === epocaBase)
                .map((cm) => Number(cm?.modalidade?.id ?? cm?.modalidadeId ?? cm?.modalidade_id))
                .filter((id) => Number.isFinite(id) && id > 0)
        );

        return (todasModalidades || [])
            .filter((m) => Number(m?.id) > 0)
            .filter((m) => !idsJaAssociadosNaEpoca.has(Number(m.id)))
            .sort((a, b) =>
                String(a?.nome ?? "").localeCompare(String(b?.nome ?? ""), "pt", {
                    sensitivity: "base",
                })
            );
    }, [todasAssociacoesClube, todasModalidades, epocaNovaAssociacao]);

    async function carregar() {
        if (!clubeId) return;

        setErro("");
        setMsg("");
        setLoading(true);

        try {
            const [c, modsFiltradas, modsTodasAssociacoes, modsTodas] = await Promise.all([
                getClubeById(clubeId),
                getModalidadesDoClube(clubeId, {
                    apenasAtivas,
                    epoca: epocaSelecionada ? normalizeEpoca(epocaSelecionada) : "",
                }),
                getModalidadesDoClube(clubeId, {
                    apenasAtivas: false,
                    epoca: "",
                }),
                getModalidades({ ativas: true }),
            ]);

            setClube(c || null);
            setModalidadesClube(Array.isArray(modsFiltradas) ? modsFiltradas : []);
            setTodasAssociacoesClube(Array.isArray(modsTodasAssociacoes) ? modsTodasAssociacoes : []);
            setTodasModalidades(Array.isArray(modsTodas) ? modsTodas : []);

            const epocaDefault = normalizeEpoca(epocaNovaAssociacao || currentEpoca());
            const disponiveis = (Array.isArray(modsTodas) ? modsTodas : []).filter((m) => {
                const jaExiste = (Array.isArray(modsTodasAssociacoes) ? modsTodasAssociacoes : []).some((cm) => {
                    const modalidadeIdAssoc = Number(
                        cm?.modalidade?.id ?? cm?.modalidadeId ?? cm?.modalidade_id
                    );
                    return (
                        modalidadeIdAssoc === Number(m?.id) &&
                        normalizeEpoca(cm?.epoca) === epocaDefault
                    );
                });
                return !jaExiste;
            });

            if (!modalidadeExistenteId && disponiveis.length > 0) {
                setModalidadeExistenteId(String(disponiveis[0].id));
            }
            if (disponiveis.length === 0) {
                setModalidadeExistenteId("");
            }
        } catch (e) {
            setErro(e.message || "Erro ao carregar modalidades.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (!clubeId) return;
        carregar();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [clubeId, apenasAtivas, epocaSelecionada]);

    useEffect(() => {
        const primeira = modalidadesDisponiveisParaAnexar[0];
        if (!primeira) {
            setModalidadeExistenteId("");
            return;
        }

        const atualExiste = modalidadesDisponiveisParaAnexar.some(
            (m) => String(m.id) === String(modalidadeExistenteId)
        );

        if (!atualExiste) {
            setModalidadeExistenteId(String(primeira.id));
        }
    }, [modalidadesDisponiveisParaAnexar, modalidadeExistenteId]);

    async function onCriar() {
        if (!isAdmin) return;

        setErro("");
        setMsg("");

        const nome = String(novoNome || "").trim();
        const descricao = String(novaDescricao || "").trim();

        if (!nome) {
            setErro("O nome da modalidade é obrigatório.");
            return;
        }

        try {
            await criarModalidade({ nome, descricao });

            setNovoNome("");
            setNovaDescricao("");

            const novas = await getModalidades({ ativas: true });
            setTodasModalidades(Array.isArray(novas) ? novas : []);

            setMsg("Modalidade criada com sucesso!");
        } catch (e) {
            setErro(e.message || "Erro ao criar modalidade.");
        }
    }

    async function onAnexarExistente() {
        if (!isAdmin) return;

        setErro("");
        setMsg("");

        const modalidadeId = Number(modalidadeExistenteId);
        const epoca = normalizeEpoca(epocaNovaAssociacao);

        if (!modalidadeId || modalidadeId <= 0) {
            setErro("Selecione uma modalidade existente.");
            return;
        }

        if (!epoca) {
            setErro("A época é obrigatória.");
            return;
        }

        try {
            await anexarModalidadeAoClube(clubeId, {
                modalidadeId,
                epoca,
            });

            setMsg("Modalidade anexada ao clube com sucesso.");
            await carregar();
        } catch (e) {
            setErro(e.message || "Erro ao anexar modalidade ao clube.");
        }
    }

    function abrirEditar(mod) {
        if (!isAdmin) return;

        setEditId(mod?.id ?? null);
        setEditNome(mod?.nome ?? "");
        setEditDescricao(mod?.descricao ?? "");
        setEditOpen(true);
    }

    async function guardarEdicao() {
        if (!isAdmin) return;

        setErro("");
        setMsg("");

        const nome = String(editNome || "").trim();
        const descricao = String(editDescricao || "").trim();

        if (!editId || !nome) {
            setErro("O nome é obrigatório.");
            return;
        }

        try {
            await editarModalidade(editId, { nome, descricao });
            setEditOpen(false);
            setMsg("Modalidade atualizada com sucesso!");
            await carregar();
        } catch (e) {
            setErro(e.message || "Erro ao editar modalidade.");
        }
    }

    async function apagarModalidade(clubeModalidadeId) {
        if (!isAdmin) return;

        const confirmar = window.confirm(
            "Tem a certeza que pretende remover esta modalidade do clube?"
        );
        if (!confirmar) return;

        setErro("");
        setMsg("");

        try {
            await removerModalidadeDoClube(clubeModalidadeId);
            setMsg("Modalidade removida do clube com sucesso.");
            await carregar();
        } catch (e) {
            setErro(e.message || "Erro ao remover modalidade.");
        }
    }

    function alternarOrdenacao(campo) {
        setOrdenacao((prev) => {
            if (prev.campo === campo) {
                return {
                    campo,
                    direcao: prev.direcao === "asc" ? "desc" : "asc",
                };
            }
            return { campo, direcao: "asc" };
        });
    }

    const modalidadesVisiveis = useMemo(() => {
        const termo = pesquisa.trim().toLowerCase();

        let lista = [...modalidadesClube];

        if (termo) {
            lista = lista.filter((cm) => {
                const nome = String(cm?.modalidade?.nome ?? "").toLowerCase();
                const descricao = String(cm?.modalidade?.descricao ?? "").toLowerCase();
                const epoca = String(cm?.epoca ?? "").toLowerCase();

                return (
                    nome.includes(termo) ||
                    descricao.includes(termo) ||
                    epoca.includes(termo)
                );
            });
        }

        lista.sort((a, b) => {
            let va = "";
            let vb = "";

            switch (ordenacao.campo) {
                case "descricao":
                    va = String(a?.modalidade?.descricao ?? "");
                    vb = String(b?.modalidade?.descricao ?? "");
                    break;
                case "epoca":
                    va = String(a?.epoca ?? "");
                    vb = String(b?.epoca ?? "");
                    break;
                case "ativo":
                    va = a?.ativo ? "1" : "0";
                    vb = b?.ativo ? "1" : "0";
                    break;
                case "nome":
                default:
                    va = String(a?.modalidade?.nome ?? "");
                    vb = String(b?.modalidade?.nome ?? "");
                    break;
            }

            const cmp = va.localeCompare(vb, "pt", { sensitivity: "base" });
            return ordenacao.direcao === "asc" ? cmp : -cmp;
        });

        return lista;
    }, [modalidadesClube, pesquisa, ordenacao]);

    const subtitle = clube?.nome ? clube.nome : `Clube #${clubeId}`;

    return (
        <>
            <SideMenu
                title="Gestão de Coletividades"
                subtitle={subtitle}
                logoHref="/menu"
                items={menuItems}
            />

            <div className="container" style={{ paddingTop: 24 }}>
                <div className="page-title page-title-with-icon">
                    <div className="page-title-main-wrap">
                        <span className="page-title-icon-circle">
                            <img
                                src={modalidadesIcon}
                                alt="Modalidades do Clube"
                                className="page-title-icon"
                            />
                        </span>

                        <div className="page-title-texts">
                            <h1>Modalidades do Clube</h1>
                        </div>
                    </div>

                    <div className="hint">{subtitle}</div>
                </div>

                {erro && <div className="alert error">{erro}</div>}
                {msg && <div className="alert ok">{msg}</div>}

                <div className="card" style={{ marginBottom: 16 }}>
                    <h2>Filtrar por época</h2>

                    <div className="row2">
                        <div className="row">
                            <select
                                className="input"
                                value={epocaSelecionada}
                                onChange={(e) => setEpocaSelecionada(e.target.value)}
                            >
                                <option value="">Todas</option>
                                {epocasParaFiltro.map((ep) => (
                                    <option key={ep} value={ep}>
                                        {ep}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="filter-checkbox-wrap">
                            <label className="filter-checkbox">
                                <input
                                    type="checkbox"
                                    checked={apenasAtivas}
                                    onChange={(e) => setApenasAtivas(e.target.checked)}
                                />
                                Apenas ativas
                            </label>
                        </div>
                    </div>

                    <div className="actions filters-actions">
                        <button className="btn" type="button" onClick={carregar}>
                            Recarregar
                        </button>
                        <Link className="btn" to={`/clubes/${clubeId}`}>
                            ← Voltar
                        </Link>
                    </div>
                </div>

                {isAdmin && (
                    <div className="card" style={{ marginBottom: 16 }}>
                        <h2>Anexar modalidade existente ao clube</h2>

                        <div className="row">
                            <div className="row2">
                                <select
                                    className="input"
                                    value={modalidadeExistenteId}
                                    onChange={(e) => setModalidadeExistenteId(e.target.value)}
                                >
                                    <option value="">Selecionar modalidade</option>
                                    {modalidadesDisponiveisParaAnexar.map((m) => (
                                        <option key={m.id} value={m.id}>
                                            {m.nome}
                                        </option>
                                    ))}
                                </select>

                                <select
                                    className="input"
                                    value={epocaNovaAssociacao}
                                    onChange={(e) => setEpocaNovaAssociacao(e.target.value)}
                                >
                                    {epocasGeradas.map((ep) => (
                                        <option key={ep} value={ep}>
                                            {ep}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {modalidadesDisponiveisParaAnexar.length === 0 && (
                                <p className="subtle">
                                    Não existem modalidades disponíveis para anexar nesta época.
                                </p>
                            )}

                            <div className="actions">
                                <button
                                    className="btn btn-primary"
                                    type="button"
                                    onClick={onAnexarExistente}
                                    disabled={!modalidadeExistenteId}
                                >
                                    Anexar ao clube
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {isAdmin && (
                    <div className="card" style={{ marginBottom: 16 }}>
                        <h2>Criar nova modalidade</h2>

                        <div className="row">
                            <div className="row2">
                                <input
                                    className="input"
                                    placeholder="Nome *"
                                    value={novoNome}
                                    onChange={(e) => setNovoNome(e.target.value)}
                                />
                                <input
                                    className="input"
                                    placeholder="Descrição (opcional)"
                                    value={novaDescricao}
                                    onChange={(e) => setNovaDescricao(e.target.value)}
                                />
                            </div>

                            <div className="actions">
                                <button className="btn btn-primary" type="button" onClick={onCriar}>
                                    Criar
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="card">
                    <div className="modalidades-toolbar">
                        <div className="toolbar-title-group">
                            <h2>Lista de modalidades</h2>
                            <span className="toolbar-count">
                                {modalidadesVisiveis.length} registo(s)
                            </span>
                        </div>

                        <input
                            className="input toolbar-search"
                            type="text"
                            placeholder="Pesquisar por modalidade, descrição ou época..."
                            value={pesquisa}
                            onChange={(e) => setPesquisa(e.target.value)}
                        />
                    </div>

                    {loading ? (
                        <p className="subtle">A carregar modalidades...</p>
                    ) : modalidadesVisiveis.length === 0 ? (
                        <p className="subtle">Sem modalidades para os filtros selecionados.</p>
                    ) : (
                        <div className="table-wrap">
                            <table className="dashboard-table">
                                <thead>
                                <tr>
                                    <th onClick={() => alternarOrdenacao("nome")} className="sortable-th">
                                        Modalidade
                                    </th>
                                    <th
                                        onClick={() => alternarOrdenacao("descricao")}
                                        className="sortable-th"
                                    >
                                        Descrição
                                    </th>
                                    <th onClick={() => alternarOrdenacao("epoca")} className="sortable-th">
                                        Época
                                    </th>
                                    <th onClick={() => alternarOrdenacao("ativo")} className="sortable-th">
                                        Estado
                                    </th>
                                    {isAdmin && <th>Ações</th>}
                                </tr>
                                </thead>
                                <tbody>
                                {modalidadesVisiveis.map((cm) => {
                                    const epocaAtual = normalizeEpoca(cm?.epoca) === currentEpoca();

                                    return (
                                        <tr key={cm.id}>
                                            <td className="nowrap">{cm?.modalidade?.nome ?? "-"}</td>
                                            <td className="cell-muted">{cm?.modalidade?.descricao ?? "-"}</td>
                                            <td className="nowrap">
                                                    <span
                                                        className={
                                                            epocaAtual
                                                                ? "badge season-current"
                                                                : "badge season-normal"
                                                        }
                                                    >
                                                        {normalizeEpoca(cm?.epoca) || "-"}
                                                    </span>
                                            </td>
                                            <td className="nowrap">
                                                    <span className={cm?.ativo ? "badge active" : "badge inactive"}>
                                                        {cm?.ativo ? "Ativa" : "Inativa"}
                                                    </span>
                                            </td>
                                            {isAdmin && (
                                                <td className="nowrap">
                                                    {cm?.modalidade?.id ? (
                                                        <div className="table-actions">
                                                            <button
                                                                className="btn"
                                                                type="button"
                                                                onClick={() => abrirEditar(cm.modalidade)}
                                                            >
                                                                Editar
                                                            </button>

                                                            <button
                                                                className="btn btn-danger"
                                                                type="button"
                                                                onClick={() => apagarModalidade(cm.id)}
                                                            >
                                                                Remover do clube
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        "-"
                                                    )}
                                                </td>
                                            )}
                                        </tr>
                                    );
                                })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {isAdmin && editOpen && (
                    <div className="modal-backdrop" onMouseDown={() => setEditOpen(false)}>
                        <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h3>Editar modalidade</h3>
                                <button className="btn" type="button" onClick={() => setEditOpen(false)}>
                                    Fechar
                                </button>
                            </div>

                            <div className="row">
                                <input
                                    className="input"
                                    placeholder="Nome *"
                                    value={editNome}
                                    onChange={(e) => setEditNome(e.target.value)}
                                />
                                <input
                                    className="input"
                                    placeholder="Descrição"
                                    value={editDescricao}
                                    onChange={(e) => setEditDescricao(e.target.value)}
                                />

                                <div className="actions">
                                    <button className="btn btn-primary" type="button" onClick={guardarEdicao}>
                                        Guardar
                                    </button>
                                    <button className="btn" type="button" onClick={() => setEditOpen(false)}>
                                        Cancelar
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
