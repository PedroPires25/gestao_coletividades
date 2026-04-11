import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import SideMenu from "../components/SideMenu";
import { useAuth } from "../auth/AuthContext";
import {
    getAdminUsers,
    updateUserEstadoRegisto,
    updateUserAfetacao,
    getClubes,
    getColetividades,
    getModalidades,
    getAtividades,
} from "../api";

export default function AdminPendingUsersPage() {
    const { logout } = useAuth();
    const navigate = useNavigate();

    const [users, setUsers] = useState([]);
    const [clubes, setClubes] = useState([]);
    const [coletividades, setColetividades] = useState([]);
    const [modalidades, setModalidades] = useState([]);
    const [atividades, setAtividades] = useState([]);
    const [afetacaoDrafts, setAfetacaoDrafts] = useState({});
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
            const [usersData, clubesData, coletividadesData, modalidadesData, atividadesData] = await Promise.all([
                getAdminUsers("PENDENTE"),
                getClubes().catch(() => []),
                getColetividades().catch(() => []),
                getModalidades({ ativas: true }).catch(() => []),
                getAtividades().catch(() => []),
            ]);

            const listaUsers = Array.isArray(usersData) ? usersData : [];
            setUsers(listaUsers);
            setClubes(Array.isArray(clubesData) ? clubesData : []);
            setColetividades(Array.isArray(coletividadesData) ? coletividadesData : []);
            setModalidades(Array.isArray(modalidadesData) ? modalidadesData : []);
            setAtividades(Array.isArray(atividadesData) ? atividadesData : []);

            const drafts = {};
            for (const u of listaUsers) {
                drafts[u.id] = {
                    clubeId: u.clubeId ?? "",
                    modalidadeId: u.modalidadeId ?? "",
                    coletividadeId: u.coletividadeId ?? "",
                    atividadeId: u.atividadeId ?? "",
                };
            }
            setAfetacaoDrafts(drafts);
        } catch (e) {
            setErro(e.message || "Erro ao carregar registos pendentes.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        carregar();
    }, []);

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
            await carregar();
        } catch (e) {
            setErro(e.message || "Erro ao guardar afetação.");
        } finally {
            setSavingId(null);
        }
    }

    async function aprovar(u) {
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

            await updateUserEstadoRegisto(u.id, "APROVADO");

            setMsg(`${u.email} aprovado com sucesso.`);
            await carregar();
        } catch (e) {
            setErro(e.message || "Erro ao aprovar utilizador.");
        } finally {
            setSavingId(null);
        }
    }

    async function rejeitar(u) {
        setErro("");
        setMsg("");
        setSavingId(u.id);

        try {
            await updateUserEstadoRegisto(u.id, "REJEITADO");
            setMsg(`${u.email} rejeitado.`);
            await carregar();
        } catch (e) {
            setErro(e.message || "Erro ao rejeitar utilizador.");
        } finally {
            setSavingId(null);
        }
    }

    return (
        <>
            <SideMenu
                title="Gestão de Utilizadores"
                subtitle="Registos Pendentes"
                logoHref="/menu"
                items={menuItems}
            />

            <div className="container" style={{ paddingTop: 24 }}>
                <div className="page-title">
                    <h1>Registos Pendentes</h1>
                    <div className="hint">
                        Aprova ou rejeita pedidos novos. Ao aprovar, o utilizador passa automaticamente para os aprovados.
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
                                <th>Clube</th>
                                <th>Modalidade</th>
                                <th>Coletividade</th>
                                <th>Atividade</th>
                                <th>Ações</th>
                            </tr>
                            </thead>
                            <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={8} style={{ padding: 14 }}>A carregar...</td>
                                </tr>
                            ) : filtrados.length === 0 ? (
                                <tr>
                                    <td colSpan={8} style={{ padding: 14 }}>Sem registos pendentes.</td>
                                </tr>
                            ) : filtrados.map((u) => {
                                const saving = savingId === u.id;
                                const draft = afetacaoDrafts[u.id] || {};

                                return (
                                    <tr key={u.id}>
                                        <td>{u.nome || "—"}</td>
                                        <td>{u.email}</td>
                                        <td>{u.role}</td>

                                        <td>
                                            <select
                                                className="input"
                                                value={draft.clubeId ?? ""}
                                                onChange={(e) => updateAfetacaoField(u.id, "clubeId", e.target.value)}
                                                disabled={saving || u.role === "ADMIN"}
                                            >
                                                <option value="">Sem clube</option>
                                                {clubes.map((c) => (
                                                    <option key={c.id} value={c.id}>{c.nome}</option>
                                                ))}
                                            </select>
                                        </td>

                                        <td>
                                            <select
                                                className="input"
                                                value={draft.modalidadeId ?? ""}
                                                onChange={(e) => updateAfetacaoField(u.id, "modalidadeId", e.target.value)}
                                                disabled={saving || u.role === "ADMIN"}
                                            >
                                                <option value="">Sem modalidade</option>
                                                {modalidades.map((m) => (
                                                    <option key={m.id} value={m.id}>{m.nome}</option>
                                                ))}
                                            </select>
                                        </td>

                                        <td>
                                            <select
                                                className="input"
                                                value={draft.coletividadeId ?? ""}
                                                onChange={(e) => updateAfetacaoField(u.id, "coletividadeId", e.target.value)}
                                                disabled={saving || u.role === "ADMIN"}
                                            >
                                                <option value="">Sem coletividade</option>
                                                {coletividades.map((c) => (
                                                    <option key={c.id} value={c.id}>{c.nome}</option>
                                                ))}
                                            </select>
                                        </td>

                                        <td>
                                            <select
                                                className="input"
                                                value={draft.atividadeId ?? ""}
                                                onChange={(e) => updateAfetacaoField(u.id, "atividadeId", e.target.value)}
                                                disabled={saving || u.role === "ADMIN"}
                                            >
                                                <option value="">Sem atividade</option>
                                                {atividades.map((a) => (
                                                    <option key={a.id} value={a.id}>{a.nome}</option>
                                                ))}
                                            </select>
                                        </td>

                                        <td>
                                            <div className="table-actions">
                                                <button className="btn" type="button" onClick={() => guardarAfetacao(u)} disabled={saving || u.role === "ADMIN"}>
                                                    Guardar afetação
                                                </button>
                                                <button className="btn btn-primary" type="button" onClick={() => aprovar(u)} disabled={saving}>
                                                    Aprovar
                                                </button>
                                                <button className="btn" type="button" onClick={() => rejeitar(u)} disabled={saving}>
                                                    Rejeitar
                                                </button>
                                            </div>
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