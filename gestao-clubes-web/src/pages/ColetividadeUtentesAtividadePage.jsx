import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import SideMenu from "../components/SideMenu";
import { useAuth } from "../auth/AuthContext";
import { getColetividadeById } from "../api";
import { getAtividadesByColetividade } from "../services/coletividadeAtividades";
import { createUtente, getEstadosInscrito, getUtentesByColetividadeAtividade } from "../services/utentes";
import atletasIcon from "../assets/atletas.svg";

function formatDateOnly(value) {
    if (!value) return "";
    const text = String(value).trim();
    return text.includes("T") ? text.split("T")[0] : text.slice(0, 10);
}

function hasPendingName(value) {
    return !value || String(value).trim() === "-";
}

function PendingNameCell() {
    return (
        <div>
            <div style={{ color: "#ffcc66", fontWeight: 700 }}>
                ⚠ Completar dados de inscrição
            </div>
            <div style={{ fontSize: "0.8rem", opacity: 0.8 }}>
                Registo criado por aprovação administrativa
            </div>
        </div>
    );
}

export default function ColetividadeUtentesAtividadePage() {
    const { coletividadeId, coletividadeAtividadeId } = useParams();
    const navigate = useNavigate();
    const { logout, isAdmin } = useAuth();

    const [coletividade, setColetividade] = useState(null);
    const [atividadeAtiva, setAtividadeAtiva] = useState(null);
    const [utentes, setUtentes] = useState([]);
    const [estados, setEstados] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [erro, setErro] = useState("");
    const [msg, setMsg] = useState("");

    const [form, setForm] = useState({
        nome: "",
        dataNascimento: "",
        email: "",
        telefone: "",
        morada: "",
        estadoId: "1",
        dataInscricao: new Date().toISOString().slice(0, 10),
        dataFim: "",
        ativo: true,
    });

    const menuItems = useMemo(() => [
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
    ], [coletividadeId, isAdmin, logout, navigate]);

    async function carregar() {
        setErro("");
        setMsg("");
        setLoading(true);

        try {
            const [col, atividadesRows, utentesRows, estadosRows] = await Promise.all([
                getColetividadeById(coletividadeId),
                getAtividadesByColetividade(coletividadeId, { apenasAtivas: false }),
                getUtentesByColetividadeAtividade(coletividadeId, coletividadeAtividadeId),
                getEstadosInscrito(),
            ]);

            const atividade = (Array.isArray(atividadesRows) ? atividadesRows : []).find(
                (r) => String(r.id) === String(coletividadeAtividadeId)
            );

            setColetividade(col || null);
            setAtividadeAtiva(atividade || null);
            setUtentes(Array.isArray(utentesRows) ? utentesRows : []);
            setEstados(Array.isArray(estadosRows) ? estadosRows : []);
        } catch (e) {
            setErro(e.message || "Não foi possível carregar os utentes.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        carregar();
    }, [coletividadeId, coletividadeAtividadeId]);

    function onChange(e) {
        const { name, value, type, checked } = e.target;
        setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
    }

    async function onSubmit(e) {
        e.preventDefault();
        if (!form.nome.trim()) {
            setErro("Indica o nome do utente.");
            return;
        }

        setSaving(true);
        setErro("");
        setMsg("");

        try {
            await createUtente(coletividadeId, coletividadeAtividadeId, {
                nome: form.nome.trim(),
                dataNascimento: form.dataNascimento || null,
                email: form.email.trim() || null,
                telefone: form.telefone.trim() || null,
                morada: form.morada.trim() || null,
                estadoId: Number(form.estadoId),
                dataInscricao: form.dataInscricao || null,
                dataFim: form.dataFim || null,
                ativo: Boolean(form.ativo),
            });

            setMsg("Utente registado com sucesso.");
            setForm((prev) => ({
                ...prev,
                nome: "",
                dataNascimento: "",
                email: "",
                telefone: "",
                morada: "",
                dataFim: "",
                ativo: true,
                dataInscricao: new Date().toISOString().slice(0, 10),
            }));
            await carregar();
        } catch (e) {
            setErro(e.message || "Não foi possível registar o utente.");
        } finally {
            setSaving(false);
        }
    }

    return (
        <>
            <SideMenu title="Gestão de Coletividades" subtitle={coletividade?.nome || "Coletividade"} logoHref="/menu" logoSrc="/logo.png" items={menuItems} />
            <div className="container" style={{ paddingTop: 24 }}>
                <div className="page-title page-title-with-icon">
                    <div className="page-title-main-wrap">
                        <span className="page-title-icon-circle">
                            <img src={atletasIcon} alt="Utentes" className="page-title-icon" />
                        </span>
                        <div className="page-title-texts">
                            <h1>{atividadeAtiva?.atividade?.nome || "Utentes da atividade"}</h1>
                        </div>
                    </div>
                    <div className="actions">
                        <button type="button" className="btn" onClick={() => navigate(`/coletividades/${coletividadeId}/utentes`)}>
                            Voltar
                        </button>
                    </div>
                </div>

                {erro && <div className="alert error">{erro}</div>}
                {msg && <div className="alert ok">{msg}</div>}

                <div className="stack-sections">
                    <section className="card">
                        <div className="modalidades-toolbar">
                            <div className="toolbar-title-group">
                                <h2>Listagem de utentes</h2>
                                <span className="toolbar-count">{utentes.length} registo(s)</span>
                            </div>
                        </div>

                        {loading ? (
                            <p className="subtle">A carregar utentes...</p>
                        ) : utentes.length === 0 ? (
                            <p className="subtle">Sem utentes registados nesta atividade.</p>
                        ) : (
                            <div className="table-wrap">
                                <table className="dashboard-table">
                                    <thead>
                                    <tr>
                                        <th>Nome</th>
                                        <th>Data Nasc.</th>
                                        <th>Email</th>
                                        <th>Telefone</th>
                                        <th>Morada</th>
                                        <th>Estado</th>
                                        <th>Data Inscrição</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {utentes.map((u) => {
                                        const pendingName = hasPendingName(u.nome);

                                        return (
                                            <tr
                                                key={u.id}
                                                style={pendingName ? { backgroundColor: "rgba(255, 200, 0, 0.08)" } : {}}
                                            >
                                                <td>{pendingName ? <PendingNameCell /> : u.nome}</td>
                                                <td>{formatDateOnly(u.dataNascimento) || "-"}</td>
                                                <td>{u.email || "-"}</td>
                                                <td>{u.telefone || "-"}</td>
                                                <td>{u.morada || "-"}</td>
                                                <td>{u.estadoDescricao || "-"}</td>
                                                <td>{formatDateOnly(u.dataInscricao) || "-"}</td>
                                            </tr>
                                        );
                                    })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </section>

                    <section className="card">
                        <h2>Registar utente</h2>
                        <form className="row" onSubmit={onSubmit}>
                            <input className="input" name="nome" placeholder="Nome *" value={form.nome} onChange={onChange} />
                            <div className="row2">
                                <input className="input" type="date" name="dataNascimento" value={form.dataNascimento} onChange={onChange} />
                                <select className="input" name="estadoId" value={form.estadoId} onChange={onChange}>
                                    {estados.map((e) => (
                                        <option key={e.id} value={e.id}>{e.descricao}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="row2">
                                <input className="input" name="email" placeholder="Email" value={form.email} onChange={onChange} />
                                <input className="input" name="telefone" placeholder="Telefone" value={form.telefone} onChange={onChange} />
                            </div>
                            <input className="input" name="morada" placeholder="Morada" value={form.morada} onChange={onChange} />
                            <div className="row2">
                                <input className="input" type="date" name="dataInscricao" value={form.dataInscricao} onChange={onChange} />
                                <input className="input" type="date" name="dataFim" value={form.dataFim} onChange={onChange} />
                            </div>
                            <div className="actions">
                                <button className="btn btn-primary" type="submit" disabled={saving}>
                                    {saving ? "A guardar..." : "Guardar"}
                                </button>
                            </div>
                        </form>
                    </section>
                </div>
            </div>
        </>
    );
}