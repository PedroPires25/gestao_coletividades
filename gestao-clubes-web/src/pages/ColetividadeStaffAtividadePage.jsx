import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import SideMenu from "../components/SideMenu";
import { useAuth } from "../auth/AuthContext";
import { getColetividadeById } from "../api";
import { getAtividadesByColetividade } from "../services/coletividadeAtividades";
import { createStaffColetividade, getCargosColetividadeStaff, getStaffByColetividadeAtividade } from "../services/staffColetividade";
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
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                gap: "4px",
                padding: "10px 12px",
                borderRadius: "10px",
                background: "rgba(255, 193, 7, 0.22)",
                border: "1px solid rgba(255, 193, 7, 0.65)",
                boxShadow: "0 0 0 1px rgba(255, 193, 7, 0.08), inset 0 0 0 1px rgba(255,255,255,0.03)",
            }}
        >
            <div style={{ color: "#ffd54f", fontWeight: 800 }}>
                ⚠ Completar dados de inscrição
            </div>
            <div style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.92)" }}>
                Registo criado por aprovação administrativa
            </div>
        </div>
    );
}

export default function ColetividadeStaffAtividadePage() {
    const { coletividadeId, coletividadeAtividadeId } = useParams();
    const navigate = useNavigate();
    const { logout, isAdmin } = useAuth();

    const [coletividade, setColetividade] = useState(null);
    const [atividadeAtiva, setAtividadeAtiva] = useState(null);
    const [rows, setRows] = useState([]);
    const [cargos, setCargos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [erro, setErro] = useState("");
    const [msg, setMsg] = useState("");

    const [form, setForm] = useState({
        nome: "",
        email: "",
        telefone: "",
        morada: "",
        numRegisto: "",
        remuneracao: "0.00",
        cargoId: "",
        dataInicio: new Date().toISOString().slice(0, 10),
        dataFim: "",
        observacoes: "",
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

    const carregar = useCallback(async () => {
        setErro("");
        setMsg("");
        setLoading(true);

        try {
            const [col, atividadesRows, staffRows, cargosRows] = await Promise.all([
                getColetividadeById(coletividadeId),
                getAtividadesByColetividade(coletividadeId, { apenasAtivas: false }),
                getStaffByColetividadeAtividade(coletividadeId, coletividadeAtividadeId),
                getCargosColetividadeStaff(),
            ]);

            const atividade = (Array.isArray(atividadesRows) ? atividadesRows : []).find(
                (r) => String(r.id) === String(coletividadeAtividadeId)
            );

            setColetividade(col || null);
            setAtividadeAtiva(atividade || null);
            setRows(Array.isArray(staffRows) ? staffRows : []);
            setCargos(Array.isArray(cargosRows) ? cargosRows : []);
            if (!form.cargoId && Array.isArray(cargosRows) && cargosRows[0]) {
                setForm((prev) => ({ ...prev, cargoId: String(cargosRows[0].id) }));
            }
        } catch (e) {
            setErro(e.message || "Não foi possível carregar o staff.");
        } finally {
            setLoading(false);
        }
    }, [coletividadeId, coletividadeAtividadeId, form.cargoId]);

    useEffect(() => {
        carregar();
    }, [carregar]);

    function onChange(e) {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    }

    async function onSubmit(e) {
        e.preventDefault();

        if (!form.nome.trim()) {
            setErro("Indica o nome do membro do staff.");
            return;
        }

        setSaving(true);
        setErro("");
        setMsg("");

        try {
            await createStaffColetividade(coletividadeId, {
                nome: form.nome.trim(),
                email: form.email.trim() || null,
                telefone: form.telefone.trim() || null,
                morada: form.morada.trim() || null,
                numRegisto: form.numRegisto.trim() || null,
                remuneracao: Number(form.remuneracao || 0),
                cargoId: Number(form.cargoId),
                coletividadeAtividadeId: Number(coletividadeAtividadeId),
                dataInicio: form.dataInicio || null,
                dataFim: form.dataFim || null,
                observacoes: form.observacoes.trim() || null,
            });

            setMsg("Staff registado com sucesso.");
            setForm((prev) => ({
                ...prev,
                nome: "",
                email: "",
                telefone: "",
                morada: "",
                numRegisto: "",
                remuneracao: "0.00",
                dataFim: "",
                observacoes: "",
                dataInicio: new Date().toISOString().slice(0, 10),
            }));
            await carregar();
        } catch (e) {
            setErro(e.message || "Não foi possível registar o staff.");
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
                            <img src={atletasIcon} alt="Staff" className="page-title-icon" />
                        </span>
                        <div className="page-title-texts">
                            <h1>{atividadeAtiva?.atividade?.nome || "Staff da atividade"}</h1>
                        </div>
                    </div>
                    <div className="actions">
                        <button type="button" className="btn" onClick={() => navigate(`/coletividades/${coletividadeId}/staff`)}>
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
                                <h2>Listagem de staff</h2>
                                <span className="toolbar-count">{rows.length} registo(s)</span>
                            </div>
                        </div>

                        {loading ? (
                            <p className="subtle">A carregar staff...</p>
                        ) : rows.length === 0 ? (
                            <p className="subtle">Sem staff registado nesta atividade.</p>
                        ) : (
                            <div className="table-wrap">
                                <table className="dashboard-table">
                                    <thead>
                                    <tr>
                                        <th>Nome</th>
                                        <th>Email</th>
                                        <th>Telefone</th>
                                        <th>Morada</th>
                                        <th>Nº Registo</th>
                                        <th>Remuneração</th>
                                        <th>Cargo</th>
                                        <th>Data Início</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {rows.map((r) => {
                                        const pendingName = hasPendingName(r.nome);

                                        return (
                                            <tr
                                                key={`${r.id}-${r.afetacaoId}`}
                                                style={
                                                    pendingName
                                                        ? {
                                                            background: "rgba(255, 193, 7, 0.18)",
                                                            boxShadow: "inset 5px 0 0 #ffcc33",
                                                        }
                                                        : {}
                                                }
                                            >
                                                <td>{pendingName ? <PendingNameCell /> : r.nome}</td>
                                                <td>{r.email || "-"}</td>
                                                <td>{r.telefone || "-"}</td>
                                                <td>{r.morada || "-"}</td>
                                                <td>{r.numRegisto || "-"}</td>
                                                <td>{r.remuneracao ?? "-"}</td>
                                                <td>{r.cargoNome || "-"}</td>
                                                <td>{formatDateOnly(r.dataInicio) || "-"}</td>
                                            </tr>
                                        );
                                    })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </section>

                    <section className="card">
                        <h2>Registar staff</h2>
                        <form className="row" onSubmit={onSubmit}>
                            <input className="input" name="nome" placeholder="Nome *" value={form.nome} onChange={onChange} />
                            <div className="row2">
                                <input className="input" name="email" placeholder="Email" value={form.email} onChange={onChange} />
                                <input className="input" name="telefone" placeholder="Telefone" value={form.telefone} onChange={onChange} />
                            </div>
                            <input className="input" name="morada" placeholder="Morada" value={form.morada} onChange={onChange} />
                            <div className="row2">
                                <input className="input" name="numRegisto" placeholder="Nº Registo" value={form.numRegisto} onChange={onChange} />
                                <input className="input" name="remuneracao" placeholder="Remuneração" value={form.remuneracao} onChange={onChange} />
                            </div>
                            <div className="row2">
                                <select className="input" name="cargoId" value={form.cargoId} onChange={onChange}>
                                    {cargos.map((c) => (
                                        <option key={c.id} value={c.id}>{c.nome}</option>
                                    ))}
                                </select>
                                <input className="input" type="date" name="dataInicio" value={form.dataInicio} onChange={onChange} />
                            </div>
                            <div className="row2">
                                <input className="input" type="date" name="dataFim" value={form.dataFim} onChange={onChange} />
                                <input className="input" name="observacoes" placeholder="Observações" value={form.observacoes} onChange={onChange} />
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