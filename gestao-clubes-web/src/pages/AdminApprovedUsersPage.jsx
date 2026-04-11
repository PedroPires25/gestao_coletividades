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
    getAtividades,
} from "../api";

export default function AdminApprovedUsersPage() {
    const { logout } = useAuth();
    const navigate = useNavigate();

    const [users, setUsers] = useState([]);
    const [profiles, setProfiles] = useState([]);
    const [clubes, setClubes] = useState([]);
    const [coletividades, setColetividades] = useState([]);
    const [modalidades, setModalidades] = useState([]);
    const [atividades, setAtividades] = useState([]);

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
                atividadesData,
            ] = await Promise.all([
                getAdminUsers("APROVADO"),
                getAdminProfiles(),
                getClubes().catch(() => []),
                getColetividades().catch(() => []),
                getModalidades({ ativas: true }).catch(() => []),
                getAtividades().catch(() => []),
            ]);

            const listaUsers = Array.isArray(usersData) ? usersData : [];
            const listaProfiles = Array.isArray(profilesData) ? profilesData : [];

            setUsers(listaUsers);
            setProfiles(listaProfiles);
            setClubes(Array.isArray(clubesData) ? clubesData : []);
            setColetividades(Array.isArray(coletividadesData) ? coletividadesData : []);
            setModalidades(Array.isArray(modalidadesData) ? modalidadesData : []);
            setAtividades(Array.isArray(atividadesData) ? atividadesData : []);

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
                };
                editMap[u.id] = false;
            }

            setPerfilDrafts(perfisMap);
            setAfetacaoDrafts(afetacoesMap);
            setEditingAfetacao(editMap);
        } catch (e) {
            setErro(e.message || "Erro ao carregar utilizadores aprovados.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        carregar();
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

    const atividadesMap = useMemo(
        () => Object.fromEntries(atividades.map((a) => [String(a.id), a.nome])),
        [atividades]
    );

    const filtrados = useMemo(() => {
        const term = q.trim().toLowerCase();
        if (!term) return users;

        return users.filter((u) =>
            (u.email || "").toLowerCase().includes(term) ||
            (u.role || "").toLowerCase().includes(term) ||
            (u.nome || "").toLowerCase().includes(term)
        );
    }, [users, q]);

    function updateAfetacaoField(userId, field, value) {
        setAfetacaoDrafts((prev) => ({
            ...prev,
            [userId]: {
                ...(prev[userId] || {}),
                [field]: value,
            },
        }));
    }

    function toggleEditarAfetacao(userId, open) {
        setEditingAfetacao((prev) => ({
            ...prev,
            [userId]: open,
        }));
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

        try {
            await updateUserAfetacao(
                u.id,
                draft.clubeId === "" ? null : Number(draft.clubeId),
                draft.modalidadeId === "" ? null : Number(draft.modalidadeId),
                draft.coletividadeId === "" ? null : Number(draft.coletividadeId),
                draft.atividadeId === "" ? null : Number(draft.atividadeId)
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
        const clubeNome = draft?.clubeId ? clubesMap[String(draft.clubeId)] || "—" : "—";
        const modalidadeNome = draft?.modalidadeId ? modalidadesMap[String(draft.modalidadeId)] || "—" : "—";
        const coletividadeNome = draft?.coletividadeId ? coletividadesMap[String(draft.coletividadeId)] || "—" : "—";
        const atividadeNome = draft?.atividadeId ? atividadesMap[String(draft.atividadeId)] || "—" : "—";

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
                        Aqui podes alterar perfil, privilégios e afetação dos utilizadores aprovados.
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
                                <th>Perfil</th>
                                <th>Privilégios</th>
                                <th>Afetação</th>
                                <th>Ações</th>
                            </tr>
                            </thead>
                            <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={6} style={{ padding: 14 }}>A carregar...</td>
                                </tr>
                            ) : filtrados.length === 0 ? (
                                <tr>
                                    <td colSpan={6} style={{ padding: 14 }}>Sem utilizadores aprovados.</td>
                                </tr>
                            ) : filtrados.map((u) => {
                                const saving = savingId === u.id;
                                const draft = afetacaoDrafts[u.id] || {};
                                const isSuperAdmin = (perfilDrafts[u.id] || u.role) === "SUPER_ADMIN";
                                const isEditing = !!editingAfetacao[u.id];

                                return (
                                    <tr key={u.id}>
                                        <td>{u.nome || "—"}</td>
                                        <td>{u.email}</td>

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
                                                        <option key={p} value={p}>{p}</option>
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

                                        <td style={{ minWidth: 420 }}>
                                            {isSuperAdmin ? (
                                                <div className="hint">Super administrador não precisa de afetação.</div>
                                            ) : isEditing ? (
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
                                                            {atividades.map((a) => (
                                                                <option key={a.id} value={a.id}>{a.nome}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </>
                                            ) : (
                                                renderResumoAfetacao(draft)
                                            )}
                                        </td>

                                        <td>
                                            {isSuperAdmin ? null : isEditing ? (
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
                </section>
            </div>
        </>
    );
}
