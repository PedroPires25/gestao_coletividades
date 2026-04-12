import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import SideMenu from "../components/SideMenu";
import { useAuth } from "../auth/AuthContext";
import { getColetividadeById } from "../api";
import {
    getAtividadesByColetividade,
    getAtividadesCatalogo,
    anexarAtividadeAColetividade,
    removerAtividadeDaColetividade,
    criarAtividade,
    editarAtividade,
} from "../services/coletividadeAtividades";

import modalidadesIcon from "../assets/modalidades.svg";

function currentAno() {
    const y = new Date().getFullYear();
    return `${y - 1}/${y}`;
}

function normalizeAno(input) {
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

function buildAnos({ past = 10, future = 10 } = {}) {
    const y = new Date().getFullYear();
    const list = [];

    for (let endYear = y - past; endYear <= y + future; endYear++) {
        list.push(`${endYear - 1}/${endYear}`);
    }

    return list.sort((a, b) => b.localeCompare(a));
}

export default function ColetividadeAtividadesPage() {
    const { id: coletividadeId } = useParams();
    const { logout, isAdmin } = useAuth();
    const navigate = useNavigate();

    const [coletividade, setColetividade] = useState(null);
    const [atividadesColetividade, setAtividadesColetividade] = useState([]);
    const [todasAssociacoes, setTodasAssociacoes] = useState([]);
    const [catalogo, setCatalogo] = useState([]);

    const [loading, setLoading] = useState(true);
    const [erro, setErro] = useState("");
    const [msg, setMsg] = useState("");

    const [apenasAtivas, setApenasAtivas] = useState(true);
    const [anoSelecionado, setAnoSelecionado] = useState("");
    const [pesquisa, setPesquisa] = useState("");
    const [ordenacao, setOrdenacao] = useState({ campo: "nome", direcao: "asc" });

    const [novoNome, setNovoNome] = useState("");
    const [novaDescricao, setNovaDescricao] = useState("");

    const [atividadeExistenteId, setAtividadeExistenteId] = useState("");
    const [anoNovaAssociacao, setAnoNovaAssociacao] = useState(currentAno());

    const [editOpen, setEditOpen] = useState(false);
    const [editId, setEditId] = useState(null);
    const [editNome, setEditNome] = useState("");
    const [editDescricao, setEditDescricao] = useState("");

    const menuItems = useMemo(
        () => [
            { label: "Home", to: "/menu" },
            { label: "Clubes", to: "/clubes" },
            { label: "Coletividades", to: "/coletividades" },
            ...(isAdmin ? [{ label: "Perfis", to: "/admin/users" }] : []),
            { label: "Atividades", to: `/coletividades/${coletividadeId}/atividades` },
            { label: "Utentes", to: `/coletividades/${coletividadeId}/utentes` },
            { label: "Staff", to: `/coletividades/${coletividadeId}/staff` },
            {
                label: "Logout",
                onClick: () => {
                    logout();
                    navigate("/login", { replace: true });
                },
            },
        ],
        [coletividadeId, isAdmin, logout, navigate]
    );

    const anosGerados = useMemo(() => buildAnos(), []);

    const anosExistentesBD = useMemo(() => {
        const s = new Set(
            (todasAssociacoes || [])
                .map((ca) => normalizeAno(ca?.ano))
                .filter(Boolean)
        );
        return Array.from(s);
    }, [todasAssociacoes]);

    const anosParaFiltro = useMemo(() => {
        const set = new Set([...anosGerados, ...anosExistentesBD]);
        return Array.from(set).sort((a, b) => b.localeCompare(a));
    }, [anosGerados, anosExistentesBD]);

    const atividadesDisponiveisParaAnexar = useMemo(() => {
        const anoBase = normalizeAno(anoNovaAssociacao);

        const idsJaAssociadosNoAno = new Set(
            (todasAssociacoes || [])
                .filter((ca) => normalizeAno(ca?.ano) === anoBase)
                .map((ca) => Number(ca?.atividade?.id ?? ca?.atividadeId ?? ca?.atividade_id))
                .filter((id) => Number.isFinite(id) && id > 0)
        );

        return (catalogo || [])
            .filter((a) => Number(a?.id) > 0)
            .filter((a) => !idsJaAssociadosNoAno.has(Number(a.id)))
            .sort((a, b) =>
                String(a?.nome ?? "").localeCompare(String(b?.nome ?? ""), "pt", {
                    sensitivity: "base",
                })
            );
    }, [todasAssociacoes, catalogo, anoNovaAssociacao]);

    async function carregar() {
        if (!coletividadeId) return;

        setErro("");
        setMsg("");
        setLoading(true);

        try {
            const [col, ativFiltradas, ativTodasAssociacoes, ativCatalogo] = await Promise.all([
                getColetividadeById(coletividadeId),
                getAtividadesByColetividade(coletividadeId, {
                    apenasAtivas,
                    ano: anoSelecionado ? normalizeAno(anoSelecionado) : "",
                }),
                getAtividadesByColetividade(coletividadeId, {
                    apenasAtivas: false,
                    ano: "",
                }),
                getAtividadesCatalogo(),
            ]);

            setColetividade(col || null);
            setAtividadesColetividade(Array.isArray(ativFiltradas) ? ativFiltradas : []);
            setTodasAssociacoes(Array.isArray(ativTodasAssociacoes) ? ativTodasAssociacoes : []);
            setCatalogo(Array.isArray(ativCatalogo) ? ativCatalogo : []);

            const anoDefault = normalizeAno(anoNovaAssociacao || currentAno());
            const disponiveis = (Array.isArray(ativCatalogo) ? ativCatalogo : []).filter((a) => {
                const jaExiste = (Array.isArray(ativTodasAssociacoes) ? ativTodasAssociacoes : []).some((ca) => {
                    const atividadeIdAssoc = Number(
                        ca?.atividade?.id ?? ca?.atividadeId ?? ca?.atividade_id
                    );
                    return (
                        atividadeIdAssoc === Number(a?.id) &&
                        normalizeAno(ca?.ano) === anoDefault
                    );
                });
                return !jaExiste;
            });

            if (!atividadeExistenteId && disponiveis.length > 0) {
                setAtividadeExistenteId(String(disponiveis[0].id));
            }
            if (disponiveis.length === 0) {
                setAtividadeExistenteId("");
            }
        } catch (e) {
            setErro(e.message || "Erro ao carregar atividades.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (!coletividadeId) return;
        carregar();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [coletividadeId, apenasAtivas, anoSelecionado]);

    useEffect(() => {
        const primeira = atividadesDisponiveisParaAnexar[0];
        if (!primeira) {
            setAtividadeExistenteId("");
            return;
        }

        const atualExiste = atividadesDisponiveisParaAnexar.some(
            (a) => String(a.id) === String(atividadeExistenteId)
        );

        if (!atualExiste) {
            setAtividadeExistenteId(String(primeira.id));
        }
    }, [atividadesDisponiveisParaAnexar, atividadeExistenteId]);

    async function onCriar() {
        if (!isAdmin) return;

        setErro("");
        setMsg("");

        const nome = String(novoNome || "").trim();
        const descricao = String(novaDescricao || "").trim();

        if (!nome) {
            setErro("O nome da atividade é obrigatório.");
            return;
        }

        try {
            await criarAtividade({ nome, descricao });

            setNovoNome("");
            setNovaDescricao("");

            const novas = await getAtividadesCatalogo();
            setCatalogo(Array.isArray(novas) ? novas : []);

            setMsg("Atividade criada com sucesso!");
        } catch (e) {
            setErro(e.message || "Erro ao criar atividade.");
        }
    }

    async function onAnexarExistente() {
        if (!isAdmin) return;

        setErro("");
        setMsg("");

        const atividadeId = Number(atividadeExistenteId);
        const ano = normalizeAno(anoNovaAssociacao);

        if (!atividadeId || atividadeId <= 0) {
            setErro("Seleciona uma atividade existente.");
            return;
        }

        if (!ano) {
            setErro("O ano é obrigatório.");
            return;
        }

        try {
            await anexarAtividadeAColetividade(coletividadeId, {
                atividadeId,
                ano,
            });

            setMsg("Atividade anexada à coletividade com sucesso.");
            await carregar();
        } catch (e) {
            setErro(e.message || "Erro ao anexar atividade à coletividade.");
        }
    }

    function abrirEditar(atividade) {
        if (!isAdmin) return;

        setEditId(atividade?.id ?? null);
        setEditNome(atividade?.nome ?? "");
        setEditDescricao(atividade?.descricao ?? "");
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
            await editarAtividade(editId, { nome, descricao });
            setEditOpen(false);
            setMsg("Atividade atualizada com sucesso!");
            await carregar();
        } catch (e) {
            setErro(e.message || "Erro ao editar atividade.");
        }
    }

    async function apagarAssociacao(coletividadeAtividadeId) {
        if (!isAdmin) return;

        const confirmar = window.confirm(
            "Tem a certeza que pretende remover esta atividade da coletividade?"
        );
        if (!confirmar) return;

        setErro("");
        setMsg("");

        try {
            await removerAtividadeDaColetividade(coletividadeAtividadeId);
            setMsg("Atividade removida da coletividade com sucesso.");
            await carregar();
        } catch (e) {
            setErro(e.message || "Erro ao remover atividade.");
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

    const atividadesVisiveis = useMemo(() => {
        const termo = pesquisa.trim().toLowerCase();

        let lista = [...atividadesColetividade];

        if (termo) {
            lista = lista.filter((ca) => {
                const nome = String(ca?.atividade?.nome ?? "").toLowerCase();
                const descricao = String(ca?.atividade?.descricao ?? "").toLowerCase();
                const ano = String(ca?.ano ?? "").toLowerCase();

                return (
                    nome.includes(termo) ||
                    descricao.includes(termo) ||
                    ano.includes(termo)
                );
            });
        }

        lista.sort((a, b) => {
            let va = "";
            let vb = "";

            switch (ordenacao.campo) {
                case "descricao":
                    va = String(a?.atividade?.descricao ?? "");
                    vb = String(b?.atividade?.descricao ?? "");
                    break;
                case "ano":
                    va = String(a?.ano ?? "");
                    vb = String(b?.ano ?? "");
                    break;
                case "ativo":
                    va = a?.ativo ? "1" : "0";
                    vb = b?.ativo ? "1" : "0";
                    break;
                case "nome":
                default:
                    va = String(a?.atividade?.nome ?? "");
                    vb = String(b?.atividade?.nome ?? "");
                    break;
            }

            const cmp = va.localeCompare(vb, "pt", { sensitivity: "base" });
            return ordenacao.direcao === "asc" ? cmp : -cmp;
        });

        return lista;
    }, [atividadesColetividade, pesquisa, ordenacao]);

    const subtitle = coletividade?.nome ? coletividade.nome : `Coletividade #${coletividadeId}`;

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
                                alt="Atividades"
                                className="page-title-icon"
                            />
                        </span>

                        <div className="page-title-texts">
                            <h1>Atividades</h1>
                        </div>
                    </div>

                    <div className="hint">{subtitle}</div>
                </div>

                {erro && <div className="alert error">{erro}</div>}
                {msg && <div className="alert ok">{msg}</div>}

                <div className="stack-sections">
                    {isAdmin && (
                        <>
                            <section className="card">
                                <h2>Criar atividade</h2>
                                <p className="subtle">
                                    Cria uma nova atividade no catálogo geral.
                                </p>

                                <div className="row">
                                    <input
                                        className="input"
                                        placeholder="Nome da atividade *"
                                        value={novoNome}
                                        onChange={(e) => setNovoNome(e.target.value)}
                                    />
                                    <input
                                        className="input"
                                        placeholder="Descrição"
                                        value={novaDescricao}
                                        onChange={(e) => setNovaDescricao(e.target.value)}
                                    />

                                    <div className="actions">
                                        <button className="btn btn-primary" type="button" onClick={onCriar}>
                                            Criar
                                        </button>
                                    </div>
                                </div>
                            </section>

                            <section className="card">
                                <h2>Anexar atividade existente</h2>
                                <p className="subtle">
                                    Associa uma atividade já existente à coletividade e ao ano escolhido.
                                </p>

                                <div className="row2">
                                    <select
                                        className="input"
                                        value={atividadeExistenteId}
                                        onChange={(e) => setAtividadeExistenteId(e.target.value)}
                                    >
                                        <option value="">Selecione uma atividade</option>
                                        {atividadesDisponiveisParaAnexar.map((a) => (
                                            <option key={a.id} value={a.id}>
                                                {a.nome}
                                            </option>
                                        ))}
                                    </select>

                                    <input
                                        className="input"
                                        placeholder="Ano"
                                        value={anoNovaAssociacao}
                                        onChange={(e) => setAnoNovaAssociacao(e.target.value)}
                                    />
                                </div>

                                <div className="actions">
                                    <button className="btn btn-primary" type="button" onClick={onAnexarExistente}>
                                        Anexar
                                    </button>
                                </div>
                            </section>
                        </>
                    )}

                    <section className="card">
                        <div className="modalidades-toolbar">
                            <div className="toolbar-title-group">
                                <h2>Lista de atividades da coletividade</h2>
                                <span className="toolbar-count">{atividadesVisiveis.length} registo(s)</span>
                            </div>
                        </div>

                        <div className="searchbar">
                            <input
                                className="input"
                                placeholder="Pesquisar por nome, descrição ou ano..."
                                value={pesquisa}
                                onChange={(e) => setPesquisa(e.target.value)}
                            />
                            <button className="btn" type="button" onClick={() => setPesquisa("")}>
                                Limpar
                            </button>
                        </div>

                        <div className="row2" style={{ marginBottom: 12 }}>
                            <select
                                className="input"
                                value={anoSelecionado}
                                onChange={(e) => setAnoSelecionado(e.target.value)}
                            >
                                <option value="">Todos os anos</option>
                                {anosParaFiltro.map((a) => (
                                    <option key={a} value={a}>
                                        {a}
                                    </option>
                                ))}
                            </select>

                            <label className="checkbox-inline">
                                <input
                                    type="checkbox"
                                    checked={apenasAtivas}
                                    onChange={(e) => setApenasAtivas(e.target.checked)}
                                />
                                <span>Apenas ativas</span>
                            </label>
                        </div>

                        {loading ? (
                            <p className="subtle">A carregar atividades...</p>
                        ) : (
                            <div className="table-wrap">
                                <table className="dashboard-table">
                                    <thead>
                                    <tr>
                                        <th style={{ cursor: "pointer" }} onClick={() => alternarOrdenacao("nome")}>
                                            Nome
                                        </th>
                                        <th style={{ cursor: "pointer" }} onClick={() => alternarOrdenacao("descricao")}>
                                            Descrição
                                        </th>
                                        <th style={{ cursor: "pointer" }} onClick={() => alternarOrdenacao("ano")}>
                                            Ano
                                        </th>
                                        <th style={{ cursor: "pointer" }} onClick={() => alternarOrdenacao("ativo")}>
                                            Ativa
                                        </th>
                                        <th>Ações</th>
                                    </tr>
                                    </thead>

                                    <tbody>
                                    {atividadesVisiveis.map((row) => (
                                        <tr key={row.id}>
                                            <td>{row?.atividade?.nome || "-"}</td>
                                            <td>{row?.atividade?.descricao || "-"}</td>
                                            <td>{row?.ano || "-"}</td>
                                            <td>{row?.ativo ? "Sim" : "Não"}</td>
                                            <td>
                                                <div className="table-actions">
                                                    <button
                                                        className="btn"
                                                        type="button"
                                                        onClick={() => navigate(`/coletividades/${coletividadeId}/utentes/atividades/${row.id}`)}
                                                    >
                                                        Utentes
                                                    </button>

                                                    <button
                                                        className="btn"
                                                        type="button"
                                                        onClick={() => navigate(`/coletividades/${coletividadeId}/staff/atividades/${row.id}`)}
                                                    >
                                                        Staff
                                                    </button>

                                                    {isAdmin && (
                                                        <>
                                                            <button
                                                                className="btn"
                                                                type="button"
                                                                onClick={() => abrirEditar(row.atividade)}
                                                            >
                                                                Editar catálogo
                                                            </button>

                                                            <button
                                                                className="btn btn-danger"
                                                                type="button"
                                                                onClick={() => apagarAssociacao(row.id)}
                                                            >
                                                                Remover
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}

                                    {!loading && atividadesVisiveis.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="cell-muted" style={{ padding: 14 }}>
                                                Sem atividades associadas.
                                            </td>
                                        </tr>
                                    )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </section>
                </div>

                {editOpen && (
                    <div className="modal-backdrop" onMouseDown={() => setEditOpen(false)}>
                        <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h3>Editar atividade</h3>
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
