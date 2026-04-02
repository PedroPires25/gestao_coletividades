import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import SideMenu from "../components/SideMenu";
import { createClube, deleteClube, getClubes, updateClube } from "../api";
import { useAuth } from "../auth/AuthContext";

function formatDateISOToPt(dateISO) {
    if (!dateISO) return "";
    const d = new Date(dateISO);
    if (Number.isNaN(d.getTime())) return dateISO;
    return d.toLocaleDateString("pt-PT");
}

function isoToInputDate(dateISO) {
    if (!dateISO) return "";
    const d = new Date(dateISO);
    if (Number.isNaN(d.getTime())) return "";
    return d.toISOString().slice(0, 10);
}

export default function ClubesPage() {
    const { logout, isAdmin } = useAuth();
    const navigate = useNavigate();

    const [clubes, setClubes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [erro, setErro] = useState("");
    const [msg, setMsg] = useState("");

    const [q, setQ] = useState("");

    const [form, setForm] = useState({
        nome: "",
        email: "",
        telefone: "",
        nif: "",
        morada: "",
        codigoPostal: "",
        localidade: "",
        dataFundacao: "",
    });

    const [editOpen, setEditOpen] = useState(false);
    const [editErro, setEditErro] = useState("");
    const [edit, setEdit] = useState({
        id: null,
        nome: "",
        email: "",
        telefone: "",
        nif: "",
        morada: "",
        codigoPostal: "",
        localidade: "",
        dataFundacao: "",
    });

    async function carregar() {
        setErro("");
        setMsg("");
        setLoading(true);
        try {
            const data = await getClubes();
            setClubes(Array.isArray(data) ? data : []);
        } catch (e) {
            setErro(e.message);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        carregar();
    }, []);

    function onChange(e) {
        setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    }

    async function onSubmit(e) {
        e.preventDefault();
        if (!isAdmin) return;

        setErro("");
        setMsg("");

        try {
            await createClube({
                ...form,
                dataFundacao: form.dataFundacao ? form.dataFundacao : null,
            });

            setMsg("Clube criado com sucesso!");
            setForm({
                nome: "",
                email: "",
                telefone: "",
                nif: "",
                morada: "",
                codigoPostal: "",
                localidade: "",
                dataFundacao: "",
            });
            await carregar();
        } catch (e) {
            setErro(e.message);
        }
    }

    async function onDelete(id) {
        if (!isAdmin) return;

        setErro("");
        setMsg("");
        const ok = window.confirm("Tens a certeza que queres apagar este clube?");
        if (!ok) return;

        try {
            await deleteClube(id);
            setMsg("Clube removido com sucesso!");
            await carregar();
        } catch (e) {
            setErro(e.message);
        }
    }

    function openEditModal(clube) {
        if (!isAdmin) return;

        setEditErro("");
        setEdit({
            id: clube.id,
            nome: clube.nome || "",
            email: clube.email || "",
            telefone: clube.telefone || "",
            nif: clube.nif || "",
            morada: clube.morada || "",
            codigoPostal: clube.codigoPostal || clube.codigo_postal || "",
            localidade: clube.localidade || "",
            dataFundacao: isoToInputDate(clube.dataFundacao),
        });
        setEditOpen(true);
    }

    function closeEditModal() {
        setEditOpen(false);
    }

    function onEditChange(e) {
        setEdit((s) => ({ ...s, [e.target.name]: e.target.value }));
    }

    async function onSaveEdit() {
        if (!isAdmin) return;

        setEditErro("");
        try {
            await updateClube(edit.id, {
                nome: edit.nome,
                email: edit.email,
                telefone: edit.telefone,
                nif: edit.nif,
                morada: edit.morada,
                codigoPostal: edit.codigoPostal,
                localidade: edit.localidade,
                dataFundacao: edit.dataFundacao ? edit.dataFundacao : null,
            });
            setMsg("Clube atualizado com sucesso!");
            setEditOpen(false);
            await carregar();
        } catch (e) {
            setEditErro(e.message);
        }
    }

    const clubesFiltrados = useMemo(() => {
        const term = q.trim().toLowerCase();
        if (!term) return clubes;

        return clubes.filter((c) => {
            const nome = (c.nome || "").toLowerCase();
            const email = (c.email || "").toLowerCase();
            const nif = (c.nif || "").toLowerCase();
            const morada = (c.morada || "").toLowerCase();
            const cp = (c.codigoPostal || c.codigo_postal || "").toLowerCase();
            const loc = (c.localidade || "").toLowerCase();
            return (
                nome.includes(term) ||
                email.includes(term) ||
                nif.includes(term) ||
                morada.includes(term) ||
                cp.includes(term) ||
                loc.includes(term)
            );
        });
    }, [clubes, q]);

    const menuItems = [
        { label: "Home", to: "/menu" },
        { label: "Coletividades", to: "/coletividades" },
        ...(isAdmin ? [{ label: "Perfis", to: "/admin/users" }] : []),
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
                subtitle="Clubes"
                logoHref="/menu"
                items={menuItems}
            />

            <div className="container" style={{ paddingTop: 24 }}>
                <div className="page-title">
                    <h1>Clubes</h1>
                    <div className="hint">
                        {isAdmin
                            ? "CRUD / Pesquisa / Navegação por clube"
                            : "Pesquisa / Consulta / Navegação por clube"}
                    </div>
                </div>

                <div className="stack-sections">

                    {/* Alertas para utilizadores não-admin */}
                    {!isAdmin && erro && <div className="alert error">{erro}</div>}
                    {!isAdmin && msg && <div className="alert ok">{msg}</div>}

                    <section className="card">
                        <h2>Lista</h2>
                        <p className="subtle">
                            {loading ? "A carregar..." : `${clubesFiltrados.length} clube(s) encontrado(s).`}
                        </p>

                        <div className="searchbar">
                            <input
                                className="input"
                                placeholder="Pesquisar por nome, email, NIF, morada, código postal ou localidade..."
                                value={q}
                                onChange={(e) => setQ(e.target.value)}
                            />
                            <button className="btn" type="button" onClick={() => setQ("")}>Limpar</button>
                        </div>

                        <div className="table-wrap">
                            <table>
                                <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Nome</th>
                                    <th>Email</th>
                                    <th>Telefone</th>
                                    <th>NIF</th>
                                    <th>Morada</th>
                                    <th>Cód. Postal</th>
                                    <th>Localidade</th>
                                    <th>Data fundação</th>
                                    {isAdmin && <th>Ações</th>}
                                </tr>
                                </thead>
                                <tbody>
                                {clubesFiltrados.map((c) => (
                                    <tr key={c.id}>
                                        <td className="nowrap">{c.id}</td>
                                        <td>
                                            <Link
                                                className="club-link"
                                                to={`/clubes/${c.id}`}
                                                title="Abrir submenu do clube"
                                            >
                                                {c.nome}
                                            </Link>
                                        </td>
                                        <td className="cell-muted">{c.email || "-"}</td>
                                        <td className="nowrap">{c.telefone || "-"}</td>
                                        <td className="nowrap">{c.nif || "-"}</td>
                                        <td className="cell-muted">{c.morada || "-"}</td>
                                        <td className="nowrap">{c.codigoPostal || c.codigo_postal || "-"}</td>
                                        <td className="cell-muted">{c.localidade || "-"}</td>
                                        <td className="nowrap">{formatDateISOToPt(c.dataFundacao) || "-"}</td>
                                        {isAdmin && (
                                            <td>
                                                <div className="table-actions">
                                                    <button className="btn" onClick={() => openEditModal(c)}>
                                                        Editar
                                                    </button>
                                                    <button className="btn btn-danger" onClick={() => onDelete(c.id)}>
                                                        Apagar
                                                    </button>
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))}

                                {!loading && clubesFiltrados.length === 0 && (
                                    <tr>
                                        <td colSpan={isAdmin ? 10 : 9} className="cell-muted" style={{ padding: 14 }}>
                                            Sem resultados para a pesquisa.
                                        </td>
                                    </tr>
                                )}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    {isAdmin && (
                        <section className="card">
                            <h2>Criar clube</h2>
                            <p className="subtle">Preenche os campos e guarda na base de dados via API.</p>

                            {erro && <div className="alert error">{erro}</div>}
                            {msg && <div className="alert ok">{msg}</div>}

                            <form onSubmit={onSubmit} className="row">
                                <input
                                    className="input"
                                    name="nome"
                                    placeholder="Nome *"
                                    value={form.nome}
                                    onChange={onChange}
                                    required
                                />

                                <div className="row2">
                                    <input
                                        className="input"
                                        name="email"
                                        placeholder="Email"
                                        value={form.email}
                                        onChange={onChange}
                                    />
                                    <input
                                        className="input"
                                        name="telefone"
                                        placeholder="Telefone"
                                        value={form.telefone}
                                        onChange={onChange}
                                    />
                                </div>

                                <div className="row2">
                                    <input
                                        className="input"
                                        name="nif"
                                        placeholder="NIF"
                                        value={form.nif}
                                        onChange={onChange}
                                    />
                                </div>

                                <input
                                    className="input"
                                    name="morada"
                                    placeholder="Morada"
                                    value={form.morada}
                                    onChange={onChange}
                                />

                                <div className="row2">
                                    <input
                                        className="input"
                                        name="codigoPostal"
                                        placeholder="Código Postal"
                                        value={form.codigoPostal}
                                        onChange={onChange}
                                    />
                                    <input
                                        className="input"
                                        name="localidade"
                                        placeholder="Localidade"
                                        value={form.localidade}
                                        onChange={onChange}
                                    />
                                </div>

                                <div className="row">
                                    <label className="field-label" htmlFor="dataFundacao">
                                        Data de fundação
                                    </label>
                                    <input
                                        id="dataFundacao"
                                        className="input"
                                        name="dataFundacao"
                                        type="date"
                                        value={form.dataFundacao}
                                        onChange={onChange}
                                    />
                                </div>

                                <div className="actions">
                                    <button className="btn btn-primary" type="submit">Criar</button>
                                    <button
                                        className="btn"
                                        type="button"
                                        onClick={() =>
                                            setForm({
                                                nome: "",
                                                email: "",
                                                telefone: "",
                                                nif: "",
                                                morada: "",
                                                codigoPostal: "",
                                                localidade: "",
                                                dataFundacao: "",
                                            })
                                        }
                                    >
                                        Limpar
                                    </button>
                                    <button className="btn" type="button" onClick={carregar}>Recarregar</button>
                                </div>
                            </form>
                        </section>
                    )}

                </div>

                {isAdmin && editOpen && (
                    <div className="modal-backdrop" onMouseDown={closeEditModal}>
                        <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h3>Editar clube</h3>
                                <button className="btn" onClick={closeEditModal}>Fechar</button>
                            </div>

                            {editErro && <div className="alert error">{editErro}</div>}

                            <div className="row">
                                <input
                                    className="input"
                                    name="nome"
                                    placeholder="Nome *"
                                    value={edit.nome}
                                    onChange={onEditChange}
                                    required
                                />

                                <div className="row2">
                                    <input
                                        className="input"
                                        name="email"
                                        placeholder="Email"
                                        value={edit.email}
                                        onChange={onEditChange}
                                    />
                                    <input
                                        className="input"
                                        name="telefone"
                                        placeholder="Telefone"
                                        value={edit.telefone}
                                        onChange={onEditChange}
                                    />
                                </div>

                                <div className="row2">
                                    <input
                                        className="input"
                                        name="nif"
                                        placeholder="NIF"
                                        value={edit.nif}
                                        onChange={onEditChange}
                                    />
                                </div>

                                <input
                                    className="input"
                                    name="morada"
                                    placeholder="Morada"
                                    value={edit.morada}
                                    onChange={onEditChange}
                                />

                                <div className="row2">
                                    <input
                                        className="input"
                                        name="codigoPostal"
                                        placeholder="Código Postal"
                                        value={edit.codigoPostal}
                                        onChange={onEditChange}
                                    />
                                    <input
                                        className="input"
                                        name="localidade"
                                        placeholder="Localidade"
                                        value={edit.localidade}
                                        onChange={onEditChange}
                                    />
                                </div>

                                <div className="row">
                                    <label className="field-label" htmlFor="editDataFundacao">
                                        Data de fundação
                                    </label>
                                    <input
                                        id="editDataFundacao"
                                        className="input"
                                        name="dataFundacao"
                                        type="date"
                                        value={edit.dataFundacao}
                                        onChange={onEditChange}
                                    />
                                </div>

                                <div className="actions">
                                    <button className="btn btn-primary" type="button" onClick={onSaveEdit}>
                                        Guardar
                                    </button>
                                    <button className="btn" type="button" onClick={closeEditModal}>
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