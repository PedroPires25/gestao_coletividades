import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import SideMenu from "../components/SideMenu";
import { useAuth } from "../auth/AuthContext";
import {
    getAdminProfiles,
    getAdminUsers,
    updateUserPerfil,
    updateUserPrivilegios,
    updateUserAfetacao,
    getClubes,
    getColetividades,
    getModalidades,
    getAtividadesDaColetividade,
} from "../api";
import { usePagination } from "../hooks/usePagination";
import Pagination from "../components/Pagination";

export default function AdminApprovedUsersPage() {
    const {
        logout,
        isSuperAdmin,
        isScopedAdmin,
        clubeId: adminClubeId,
        coletividadeId: adminColetividadeId,
    } = useAuth();

    const isAdminClube = isScopedAdmin && !!adminClubeId && !adminColetividadeId;
    const isAdminColetividade = isScopedAdmin && !!adminColetividadeId && !adminClubeId;
    const navigate = useNavigate();

    const PERFIL_LABELS = {
        ADMINISTRADOR: "Administrador",
        USER: "Utilizador",
        ATLETA: "Atleta",
        INSCRITO: "Inscrito (Coletividade)",
        STAFF: "Staff",
        PROFESSOR: "Professor / Treinador",
        TREINADOR_PRINCIPAL: "Treinador Principal",
        DEPARTAMENTO_MEDICO: "Departamento Médico",
        SECRETARIO: "Secretário",
        SUPER_ADMIN: "Super Admin",
    };

    const [users, setUsers] = useState([]);
    const [profiles, setProfiles] = useState([]);
    const [clubes, setClubes] = useState([]);
    const [coletividades, setColetividades] = useState([]);
    const [modalidades, setModalidades] = useState([]);

    const [atividadesPorColetividade, setAtividadesPorColetividade] = useState({});

    const [perfilDrafts, setPerfilDrafts] = useState({});
    const [afetacaoDrafts, setAfetacaoDrafts] = useState({});
    const [editingAfetacao, setEditingAfetacao] = useState({});

    const [loading, setLoading] = useState(true);
    const [erro, setErro] = useState("");
    const [msg, setMsg] = useState("");
    const [q, setQ] = useState("");
    const [savingId, setSavingId] = useState(null);

    const menuItems = [
        { label: "Home", to: "/menu" },
        { label: "Perfis", to: "/admin/users" },
        { label: "utilizadoresAprovar", to: "/admin/users/pending" },
        { label: "utilizadoresAutorizados", to: "/admin/users/approved" },
        {
            label: "Logout",
            onClick: () => {
                logout();
                navigate("/login", { replace: true });
            },
        },
    ];

    async function carregar() {
        setErro("");
        setMsg("");
        setLoading(true);
        try {
            const [
                usersData,
                profilesData,
                clubesData,
                coletividadesData,
                modalidadesData,
            ] = await Promise.all([
                getAdminUsers("APROVADO"),
                isSuperAdmin ? getAdminProfiles() : Promise.resolve([]),
                getClubes().catch(() => []),
                getColetividades().catch(() => []),
                getModalidades({ ativas: true }).catch(() => []),
            ]);
            const listaUsers = Array.isArray(usersData) ? usersData : [];
            const listaProfiles = Array.isArray(profilesData) ? profilesData : [];
            setUsers(listaUsers);
            setProfiles(listaProfiles);
            setClubes(Array.isArray(clubesData) ? clubesData : []);
            setColetividades(Array.isArray(coletividadesData) ? coletividadesData : []);
            setModalidades(Array.isArray(modalidadesData) ? modalidadesData : []);

            // Pré-carregar atividades de cada coletividade presente na lista (para exibição)
            const uniqueCols = [...new Set(listaUsers.map((u) => u.coletividadeId).filter(Boolean))];
            const atividadesLoaded = {};
            await Promise.all(
                uniqueCols.map(async (cid) => {
                    try {
                        const data = await getAtividadesDaColetividade(cid);
                        atividadesLoaded[String(cid)] = Array.isArray(data) ? data : [];
                    } catch {
                        atividadesLoaded[String(cid)] = [];
                    }
                })
            );

            const perfisMap = {};
            const afetacoesMap = {};
            const editMap = {};
            for (const u of listaUsers) {
                perfisMap[u.id] = u.role;
                afetacoesMap[u.id] = {
                    clubeId: u.clubeId ?? "",
                    modalidadeId: u.modalidadeId ?? "",
                    coletividadeId: u.coletividadeId ?? "",
                    atividadeId: u.atividadeId ?? "",
                    atividadeNome: u.atividadeNome ?? "",
                };
                editMap[u.id] = false;
            }
            setPerfilDrafts(perfisMap);
            setAfetacaoDrafts(afetacoesMap);
            setEditingAfetacao(editMap);
            setAtividadesPorColetividade(atividadesLoaded);
        } catch (e) {
            setErro(e.message || "Erro ao carregar utilizadores aprovados.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        void carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const clubesMap = useMemo(
        () => Object.fromEntries(clubes.map((c) => [String(c.id), c.nome])),
        [clubes]
    );

    const coletividadesMap = useMemo(
        () => Object.fromEntries(coletividades.map((c) => [String(c.id), c.nome])),
        [coletividades]
    );

    const modalidadesMap = useMemo(
        () => Object.fromEntries(modalidades.map((m) => [String(m.id), m.nome])),
        [modalidades]
    );

    const atividadesMap = useMemo(() => {
        // Constrói o mapa de nomes a partir de todas as atividades carregadas por coletividade
        const map = {};
        for (const lista of Object.values(atividadesPorColetividade)) {
            for (const ca of lista) {
                if (ca.atividadeId && ca.atividade?.nome) {
                    map[String(ca.atividadeId)] = ca.atividade.nome;
                }
            }
        }
        return map;
    }, [atividadesPorColetividade]);

    // Carrega as atividades de uma coletividade (com cache)
    async function carregarAtividadesParaColetividade(coletividadeId) {
        if (!coletividadeId) return;
        const key = String(coletividadeId);
        if (atividadesPorColetividade[key]) return;
        try {
            const data = await getAtividadesDaColetividade(coletividadeId);
            setAtividadesPorColetividade((prev) => ({
                ...prev,
                [key]: Array.isArray(data) ? data : [],
            }));
        } catch {
            // falha silenciosa: atividades não carregadas para esta coletividade
        }
    }

    const filtrados = useMemo(() => {
        const term = q.trim().toLowerCase();
        if (!term) return users;

        return users.filter((u) =>
            (u.email || "").toLowerCase().includes(term) ||
            (u.role || "").toLowerCase().includes(term) ||
            (u.nome || "").toLowerCase().includes(term)
        );
    }, [users, q]);

    const { paginated: usersPaginados, ...paginationProps } = usePagination(filtrados, 25);

    function updateAfetacaoField(userId, field, value) {
        setAfetacaoDrafts((prev) => ({
            ...prev,
            [userId]: {
                ...(prev[userId] || {}),
                [field]: value,
                // Limpar atividade ao mudar coletividade
                ...(field === "coletividadeId" ? { atividadeId: "", atividadeNome: "" } : {}),
                // Limpar nome em cache ao mudar atividade directamente
                ...(field === "atividadeId" ? { atividadeNome: "" } : {}),
            },
        }));
        if (field === "coletividadeId" && value) {
            carregarAtividadesParaColetividade(value);
        }
    }

    function toggleEditarAfetacao(userId, open) {
        setEditingAfetacao((prev) => ({
            ...prev,
            [userId]: open,
        }));
        if (open) {
            const draft = afetacaoDrafts[userId] || {};
            const coletividadeToLoad = isAdminColetividade
                ? adminColetividadeId
                : (draft.coletividadeId || null);
            if (coletividadeToLoad) {
                carregarAtividadesParaColetividade(coletividadeToLoad);
            }
        }
    }

    async function guardarPerfil(u) {
        setErro("");
        setMsg("");
        setSavingId(u.id);

        try {
            await updateUserPerfil(u.id, perfilDrafts[u.id]);
            setMsg(`Perfil de ${u.email} atualizado com sucesso.`);
            await carregar();
        } catch (e) {
            setErro(e.message || "Erro ao alterar perfil.");
        } finally {
            setSavingId(null);
        }
    }

    async function togglePrivilegios(u) {
        setErro("");
        setMsg("");
        setSavingId(u.id);

        try {
            await updateUserPrivilegios(u.id, !u.privilegiosAtivos);
            setMsg(
                !u.privilegiosAtivos
                    ? `Privilégios ativados para ${u.email}.`
                    : `Privilégios revogados para ${u.email}.`
            );
            await carregar();
        } catch (e) {
            setErro(e.message || "Erro ao alterar privilégios.");
        } finally {
            setSavingId(null);
        }
    }

    async function guardarAfetacao(u) {
        setErro("");
        setMsg("");
        setSavingId(u.id);

        const draft = afetacaoDrafts[u.id] || {};

        // Determinar os valores finais consoante o tipo de administrador
        let finalClubeId, finalModalidadeId, finalColetividadeId, finalAtividadeId;

        if (isAdminClube) {
            finalClubeId = adminClubeId;
            finalModalidadeId = draft.modalidadeId === "" ? null : Number(draft.modalidadeId) || null;
            finalColetividadeId = null;
            finalAtividadeId = null;
        } else if (isAdminColetividade) {
            finalClubeId = null;
            finalModalidadeId = null;
            finalColetividadeId = adminColetividadeId;
            finalAtividadeId = draft.atividadeId === "" ? null : Number(draft.atividadeId) || null;
        } else {
            // Super Admin — todos os campos livres
            finalClubeId = draft.clubeId === "" ? null : Number(draft.clubeId) || null;
            finalModalidadeId = draft.modalidadeId === "" ? null : Number(draft.modalidadeId) || null;
            finalColetividadeId = draft.coletividadeId === "" ? null : Number(draft.coletividadeId) || null;
            finalAtividadeId = draft.atividadeId === "" ? null : Number(draft.atividadeId) || null;
        }

        try {
            await updateUserAfetacao(
                u.id,
                finalClubeId,
                finalModalidadeId,
                finalColetividadeId,
                finalAtividadeId
            );

            setMsg(`Afetação de ${u.email} atualizada.`);
            setEditingAfetacao((prev) => ({
                ...prev,
                [u.id]: false,
            }));
            await carregar();
        } catch (e) {
            setErro(e.message || "Erro ao atualizar afetação.");
        } finally {
            setSavingId(null);
        }
    }

    function renderResumoAfetacao(draft) {
        if (isAdminClube) {
            const modalidadeNome = draft?.modalidadeId ? modalidadesMap[String(draft.modalidadeId)] || "—" : "—";
            return <div className="hint">Modalidade: {modalidadeNome}</div>;
        }
        if (isAdminColetividade) {
            // Prefer enriched name from backend domain tables; fall back to map lookup
            const atividadeNome = draft?.atividadeNome
                || (draft?.atividadeId ? atividadesMap[String(draft.atividadeId)] || "—" : "—");
            return <div className="hint">Atividade: {atividadeNome}</div>;
        }
        // Super Admin — informação completa
        const clubeNome = draft?.clubeId ? clubesMap[String(draft.clubeId)] || "—" : "—";
        const modalidadeNome = draft?.modalidadeId ? modalidadesMap[String(draft.modalidadeId)] || "—" : "—";
        const coletividadeNome = draft?.coletividadeId ? coletividadesMap[String(draft.coletividadeId)] || "—" : "—";
        const atividadeNome = draft?.atividadeNome
            || (draft?.atividadeId ? atividadesMap[String(draft.atividadeId)] || "—" : "—");
        return (
            <div className="hint">
                <div>Clube: {clubeNome} | Modalidade: {modalidadeNome}</div>
                <div>Coletividade: {coletividadeNome} | Atividade: {atividadeNome}</div>
            </div>
        );
    }

    return (
        <>
            <SideMenu
                title="Gestão de Utilizadores"
                subtitle="Utilizadores Aprovados"
                logoHref="/menu"
                items={menuItems}
            />

            <div className="container" style={{ paddingTop: 24 }}>
                <div className="page-title">
                    <h1>Utilizadores Aprovados</h1>
                    <div className="hint">
                        {isSuperAdmin
                            ? "Aqui podes alterar perfil, privilégios e afetação dos utilizadores aprovados."
                            : "Aqui podes consultar e gerir a afetação dos utilizadores aprovados da tua estrutura."}
                    </div>
                </div>

                {erro && <div className="alert error">{erro}</div>}
                {msg && <div className="alert ok">{msg}</div>}

                <section className="card">
                    <div className="searchbar">
                        <input
                            className="input"
                            placeholder="Pesquisar por nome, email ou perfil..."
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                        />
                        <button className="btn" type="button" onClick={() => setQ("")}>
                            Limpar
                        </button>
                        <button className="btn" type="button" onClick={carregar}>
                            Recarregar
                        </button>
                    </div>

                    <div className="table-wrap">
                        <table>
                            <thead>
                            <tr>
                                <th>Nome</th>
                                <th>Email</th>
                                {isSuperAdmin && <th>Perfil</th>}
                                {isSuperAdmin && <th>Privilégios</th>}
                                <th>{isAdminClube ? "Modalidade" : isAdminColetividade ? "Atividade" : "Afetação"}</th>
                                <th>Ações</th>
                            </tr>
                            </thead>
                            <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={isSuperAdmin ? 6 : 4} style={{ padding: 14 }}>A carregar...</td>
                                </tr>
                            ) : filtrados.length === 0 ? (
                                <tr>
                                    <td colSpan={isSuperAdmin ? 6 : 4} style={{ padding: 14 }}>Sem utilizadores aprovados.</td>
                                </tr>
                            ) : usersPaginados.map((u) => {
                                const saving = savingId === u.id;
                                const draft = afetacaoDrafts[u.id] || {};
                                const isSuperAdminUser = (perfilDrafts[u.id] || u.role) === "SUPER_ADMIN";
                                const isEditing = !!editingAfetacao[u.id];

                                return (
                                    <tr key={u.id}>
                                        <td>{u.nome || "—"}</td>
                                        <td>{u.email}</td>

                                        {isSuperAdmin && (
                                        <td>
                                            <div className="row" style={{ gap: 8 }}>
                                                <select
                                                    className="input"
                                                    value={perfilDrafts[u.id] || u.role}
                                                    onChange={(e) =>
                                                        setPerfilDrafts((prev) => ({
                                                            ...prev,
                                                            [u.id]: e.target.value,
                                                        }))
                                                    }
                                                    disabled={saving}
                                                >
                                                    {profiles.map((p) => (
                                                        <option key={p} value={p}>{PERFIL_LABELS[p] || p}</option>
                                                    ))}
                                                </select>

                                                <button
                                                    className="btn"
                                                    type="button"
                                                    onClick={() => guardarPerfil(u)}
                                                    disabled={saving}
                                                >
                                                    Guardar
                                                </button>
                                            </div>
                                        </td>
                                        )}

                                        {isSuperAdmin && (
                                        <td>
                                            <button
                                                className="btn"
                                                type="button"
                                                onClick={() => togglePrivilegios(u)}
                                                disabled={saving}
                                            >
                                                {u.privilegiosAtivos ? "Revogar privilégios" : "Ativar privilégios"}
                                            </button>
                                        </td>
                                        )}

                                        <td style={{ minWidth: isAdminClube || isAdminColetividade ? 240 : 420 }}>
                                            {isSuperAdminUser ? (
                                                <div className="hint">Super administrador não precisa de afetação.</div>
                                            ) : isEditing ? (
                                                isAdminClube ? (
                                                    // Admin Clube — apenas modalidade
                                                    <div className="row" style={{ gap: 8 }}>
                                                        <select
                                                            className="input"
                                                            value={draft.modalidadeId ?? ""}
                                                            onChange={(e) => updateAfetacaoField(u.id, "modalidadeId", e.target.value)}
                                                            disabled={saving}
                                                        >
                                                            <option value="">Sem modalidade</option>
                                                            {modalidades.map((m) => (
                                                                <option key={m.id} value={m.id}>{m.nome}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                ) : isAdminColetividade ? (
                                                    // Admin Coletividade — apenas atividade
                                                    <div className="row" style={{ gap: 8 }}>
                                                        <select
                                                            className="input"
                                                            value={draft.atividadeId ?? ""}
                                                            onChange={(e) => updateAfetacaoField(u.id, "atividadeId", e.target.value)}
                                                            disabled={saving}
                                                        >
                                                            <option value="">Sem atividade</option>
                                                            {(atividadesPorColetividade[String(adminColetividadeId)] || []).map((ca) => (
                                                                <option key={ca.atividadeId} value={ca.atividadeId}>
                                                                    {ca.atividade?.nome || ca.atividadeId}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                ) : (
                                                    // Super Admin — todos os campos
                                                    <>
                                                        <div className="row" style={{ gap: 8 }}>
                                                            <select
                                                                className="input"
                                                                value={draft.clubeId ?? ""}
                                                                onChange={(e) => updateAfetacaoField(u.id, "clubeId", e.target.value)}
                                                                disabled={saving}
                                                            >
                                                                <option value="">Sem clube</option>
                                                                {clubes.map((c) => (
                                                                    <option key={c.id} value={c.id}>{c.nome}</option>
                                                                ))}
                                                            </select>

                                                            <select
                                                                className="input"
                                                                value={draft.modalidadeId ?? ""}
                                                                onChange={(e) => updateAfetacaoField(u.id, "modalidadeId", e.target.value)}
                                                                disabled={saving}
                                                            >
                                                                <option value="">Sem modalidade</option>
                                                                {modalidades.map((m) => (
                                                                    <option key={m.id} value={m.id}>{m.nome}</option>
                                                                ))}
                                                            </select>
                                                        </div>

                                                        <div className="row" style={{ gap: 8, marginTop: 8 }}>
                                                            <select
                                                                className="input"
                                                                value={draft.coletividadeId ?? ""}
                                                                onChange={(e) => updateAfetacaoField(u.id, "coletividadeId", e.target.value)}
                                                                disabled={saving}
                                                            >
                                                                <option value="">Sem coletividade</option>
                                                                {coletividades.map((c) => (
                                                                    <option key={c.id} value={c.id}>{c.nome}</option>
                                                                ))}
                                                            </select>

                                                            <select
                                                                className="input"
                                                                value={draft.atividadeId ?? ""}
                                                                onChange={(e) => updateAfetacaoField(u.id, "atividadeId", e.target.value)}
                                                                disabled={saving}
                                                            >
                                                                <option value="">Sem atividade</option>
                                                                {(atividadesPorColetividade[String(draft.coletividadeId)] || []).map((ca) => (
                                                                    <option key={ca.atividadeId} value={ca.atividadeId}>
                                                                        {ca.atividade?.nome || ca.atividadeId}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                    </>
                                                )
                                            ) : (
                                                renderResumoAfetacao(draft)
                                            )}
                                        </td>

                                        <td>
                                            {isSuperAdminUser ? null : isEditing ? (
                                                <div className="table-actions">
                                                    <button
                                                        className="btn btn-primary"
                                                        type="button"
                                                        onClick={() => guardarAfetacao(u)}
                                                        disabled={saving}
                                                    >
                                                        Guardar afetação
                                                    </button>
                                                    <button
                                                        className="btn"
                                                        type="button"
                                                        onClick={() => toggleEditarAfetacao(u.id, false)}
                                                        disabled={saving}
                                                    >
                                                        Cancelar
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    className="btn"
                                                    type="button"
                                                    onClick={() => toggleEditarAfetacao(u.id, true)}
                                                    disabled={saving}
                                                >
                                                    Editar
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                            </tbody>
                        </table>
                    </div>
                    <Pagination {...paginationProps} />
                </section>
            </div>
        </>
    );
}