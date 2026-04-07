import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import SideMenu from "../components/SideMenu";
import { createColetividade, deleteColetividade, getColetividades, updateColetividade, uploadColetividadeLogo, getUploadUrl } from "../api";
import { useAuth } from "../auth/AuthContext";
import defaultLogo from "../assets/default-logo.svg";

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

export default function ColetividadesPage() {
    const { logout, isAdmin } = useAuth();
    const navigate = useNavigate();

    const [coletividades, setColetividades] = useState([]);
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
    const [logoFile, setLogoFile] = useState(null);
    const [logoPreview, setLogoPreview] = useState(null);

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
    const [editLogoFile, setEditLogoFile] = useState(null);
    const [editLogoPreview, setEditLogoPreview] = useState(null);

    async function carregar() {
        setErro("");
        setMsg("");
        setLoading(true);
        try {
            const data = await getColetividades();
            setColetividades(Array.isArray(data) ? data : []);
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

    function onLogoChange(e) {
        const file = e.target.files[0];
        setLogoFile(file || null);
        if (file) {
            setLogoPreview(URL.createObjectURL(file));
        } else {
            setLogoPreview(null);
        }
    }

    function onEditLogoChange(e) {
        const file = e.target.files[0];
        setEditLogoFile(file || null);
        if (file) {
            setEditLogoPreview(URL.createObjectURL(file));
        } else {
            setEditLogoPreview(null);
        }
    }

    async function onSubmit(e) {
        e.preventDefault();
        if (!isAdmin) return;

        setErro("");
        setMsg("");

        try {
            await createColetividade({
                ...form,
                dataFundacao: form.dataFundacao ? form.dataFundacao : null,
            });

            if (logoFile) {
                try {
                    const data = await getColetividades();
                    const nova = Array.isArray(data) ? data.find(c => c.nome === form.nome) : null;
                    if (nova) {
                        await uploadColetividadeLogo(nova.id, logoFile);
                    }
                } catch (uploadErr) {
                    console.warn("Coletividade criada, mas logo falhou:", uploadErr.message);
                }
            }

            setMsg("Coletividade criada com sucesso!");
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
            setLogoFile(null);
            setLogoPreview(null);
            await carregar();
        } catch (e) {
            setErro(e.message);
        }
    }

    async function onDelete(id) {
        if (!isAdmin) return;

        setErro("");
        setMsg("");
        const ok = window.confirm("Tens a certeza que queres apagar esta coletividade?");
        if (!ok) return;

        try {
            await deleteColetividade(id);
            setMsg("Coletividade removida com sucesso!");
            await carregar();
        } catch (e) {
            setErro(e.message);
        }
    }

    function openEditModal(coletividade) {
        if (!isAdmin) return;

        setEditErro("");
        setEdit({
            id: coletividade.id,
            nome: coletividade.nome || "",
            email: coletividade.email || "",
            telefone: coletividade.telefone || "",
            nif: coletividade.nif || "",
            morada: coletividade.morada || "",
            codigoPostal: coletividade.codigoPostal || coletividade.codigo_postal || "",
            localidade: coletividade.localidade || "",
            dataFundacao: isoToInputDate(coletividade.dataFundacao),
        });
        setEditLogoFile(null);
        setEditLogoPreview(coletividade.logoPath ? getUploadUrl(coletividade.logoPath) : null);
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
            await updateColetividade(edit.id, {
                nome: edit.nome,
                email: edit.email,
                telefone: edit.telefone,
                nif: edit.nif,
                morada: edit.morada,
                codigoPostal: edit.codigoPostal,
                localidade: edit.localidade,
                dataFundacao: edit.dataFundacao ? edit.dataFundacao : null,
            });

            if (editLogoFile) {
                try {
                    await uploadColetividadeLogo(edit.id, editLogoFile);
                } catch (uploadErr) {
                    console.warn("Coletividade atualizada, mas logo falhou:", uploadErr.message);
                }
            }

            setMsg("Coletividade atualizada com sucesso!");
            setEditOpen(false);
            setEditLogoFile(null);
            setEditLogoPreview(null);
            await carregar();
        } catch (e) {
            setEditErro(e.message);
        }
    }

    const coletividadesFiltradas = useMemo(() => {
        const term = q.trim().toLowerCase();
        if (!term) return coletividades;

        return coletividades.filter((c) => {
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
    }, [coletividades, q]);

    const menuItems = [
        { label: "Home", to: "/menu" },
        { label: "Clubes", to: "/clubes" },
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
            <SideMenu title="Gestão de Coletividades" subtitle="Coletividades" logoHref="/menu" items={menuItems} />

            <div className="container" style={{ paddingTop: 24 }}>
                <div className="page-title">
                    <h1>Coletividades</h1>
                    <div className="hint">{isAdmin ? "CRUD / Pesquisa" : "Pesquisa / Consulta"}</div>
                </div>

                <div className="stack-sections">
                    {isAdmin && (
                        <section className="card">
                            <h2>Criar coletividade</h2>
                            <p className="subtle">Preenche os campos e guarda na base de dados via API.</p>

                            {erro && <div className="alert error">{erro}</div>}
                            {msg && <div className="alert ok">{msg}</div>}

                            <form onSubmit={onSubmit} className="row">
                                <input className="input" name="nome" placeholder="Nome *" value={form.nome} onChange={onChange} required />

                                <div className="row2">
                                    <input className="input" name="email" placeholder="Email" value={form.email} onChange={onChange} />
                                    <input className="input" name="telefone" placeholder="Telefone" value={form.telefone} onChange={onChange} />
                                </div>

                                <div className="row2">
                                    <input className="input" name="nif" placeholder="NIF" value={form.nif} onChange={onChange} />
                                </div>

                                <input className="input" name="morada" placeholder="Morada" value={form.morada} onChange={onChange} />

                                <div className="row2">
                                    <input className="input" name="codigoPostal" placeholder="Código Postal" value={form.codigoPostal} onChange={onChange} />
                                    <input className="input" name="localidade" placeholder="Localidade" value={form.localidade} onChange={onChange} />
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

                                <div className="row">
                                    <label className="field-label" htmlFor="logoFileCol">
                                        Logo da coletividade
                                    </label>
                                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                        <img
                                            src={logoPreview || defaultLogo}
                                            alt="Preview"
                                            style={{ width: 48, height: 48, objectFit: "cover", borderRadius: 8, border: "1px solid var(--border)" }}
                                        />
                                        <input
                                            id="logoFileCol"
                                            type="file"
                                            accept="image/png,image/jpeg,image/gif,image/webp"
                                            onChange={onLogoChange}
                                        />
                                    </div>
                                </div>

                                <div className="actions">
                                    <button className="btn btn-primary" type="submit">Criar</button>
                                    <button
                                        className="btn"
                                        type="button"
                                        onClick={() => {
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
                                            setLogoFile(null);
                                            setLogoPreview(null);
                                        }}
                                    >
                                        Limpar
                                    </button>
                                    <button className="btn" type="button" onClick={carregar}>Recarregar</button>
                                </div>
                            </form>
                        </section>
                    )}

                    {!isAdmin && erro && <div className="alert error">{erro}</div>}
                    {!isAdmin && msg && <div className="alert ok">{msg}</div>}

                    <section className="card">
                        <h2>Lista</h2>
                        <p className="subtle">{loading ? "A carregar..." : `${coletividadesFiltradas.length} coletividade(s) encontrada(s).`}</p>

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
                                    <th>Logo</th>
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
                                {coletividadesFiltradas.map((c) => (
                                    <tr key={c.id}>
                                        <td>
                                            <img
                                                src={c.logoPath ? getUploadUrl(c.logoPath) : defaultLogo}
                                                alt="Logo"
                                                style={{ width: 36, height: 36, objectFit: "cover", borderRadius: 6 }}
                                            />
                                        </td>
                                        <td className="nowrap">{c.id}</td>
                                        <td>
                                            <Link
                                                className="club-link"
                                                to={`/coletividades/${c.id}`}
                                                title="Abrir submenu da coletividade"
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
                                                    <button className="btn" onClick={() => openEditModal(c)}>Editar</button>
                                                    <button className="btn btn-danger" onClick={() => onDelete(c.id)}>Apagar</button>
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))}

                                {!loading && coletividadesFiltradas.length === 0 && (
                                    <tr>
                                        <td colSpan={isAdmin ? 11 : 10} className="cell-muted" style={{ padding: 14 }}>
                                            Sem resultados para a pesquisa.
                                        </td>
                                    </tr>
                                )}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </div>

                {isAdmin && editOpen && (
                    <div className="modal-backdrop" onMouseDown={closeEditModal}>
                        <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h3>Editar coletividade</h3>
                                <button className="btn" onClick={closeEditModal}>Fechar</button>
                            </div>

                            {editErro && <div className="alert error">{editErro}</div>}

                            <div className="row">
                                <input className="input" name="nome" placeholder="Nome *" value={edit.nome} onChange={onEditChange} required />

                                <div className="row2">
                                    <input className="input" name="email" placeholder="Email" value={edit.email} onChange={onEditChange} />
                                    <input className="input" name="telefone" placeholder="Telefone" value={edit.telefone} onChange={onEditChange} />
                                </div>

                                <div className="row2">
                                    <input className="input" name="nif" placeholder="NIF" value={edit.nif} onChange={onEditChange} />
                                </div>

                                <input className="input" name="morada" placeholder="Morada" value={edit.morada} onChange={onEditChange} />

                                <div className="row2">
                                    <input className="input" name="codigoPostal" placeholder="Código Postal" value={edit.codigoPostal} onChange={onEditChange} />
                                    <input className="input" name="localidade" placeholder="Localidade" value={edit.localidade} onChange={onEditChange} />
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

                                <div className="row">
                                    <label className="field-label" htmlFor="editLogoFileCol">
                                        Logo da coletividade
                                    </label>
                                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                        <img
                                            src={editLogoPreview || defaultLogo}
                                            alt="Preview"
                                            style={{ width: 48, height: 48, objectFit: "cover", borderRadius: 8, border: "1px solid var(--border)" }}
                                        />
                                        <input
                                            id="editLogoFileCol"
                                            type="file"
                                            accept="image/png,image/jpeg,image/gif,image/webp"
                                            onChange={onEditLogoChange}
                                        />
                                    </div>
                                </div>

                                <div className="actions">
                                    <button className="btn btn-primary" type="button" onClick={onSaveEdit}>Guardar</button>
                                    <button className="btn" type="button" onClick={closeEditModal}>Cancelar</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}