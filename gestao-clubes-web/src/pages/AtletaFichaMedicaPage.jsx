import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import SideMenu from "../components/SideMenu";
import { useAuth } from "../auth/AuthContext";
import { getClubeById } from "../api";
import { getFichaMedica, saveFichaMedica } from "../services/medico";

const GRUPOS_SANGUINEOS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const EMPTY_FORM = {
    grupoSanguineo: "",
    alergias: "",
    condicoesCronicas: "",
    contactoEmergenciaNome: "",
    contactoEmergenciaTelefone: "",
    notasGerais: "",
};

export default function AtletaFichaMedicaPage() {
    const { clubeId, atletaId } = useParams();
    const navigate = useNavigate();
    const { logout, isAdmin } = useAuth();

    const [clube, setClube] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [erro, setErro] = useState("");
    const [msg, setMsg] = useState("");
    const [form, setForm] = useState(EMPTY_FORM);
    const [atualizadoEm, setAtualizadoEm] = useState(null);
    const [isNew, setIsNew] = useState(true);

    const menuItems = useMemo(() => [
        { label: "Home", to: "/menu" },
        { label: "Clubes", to: "/clubes" },
        ...(isAdmin ? [{ label: "Perfis", to: "/admin/users" }] : []),
        { label: "Módulo Clínico", to: `/clubes/${clubeId}/medico` },
        { label: "Logout", onClick: () => { logout(); navigate("/login", { replace: true }); } },
    ], [clubeId, isAdmin, logout, navigate]);

    useEffect(() => {
        async function carregar() {
            setLoading(true);
            try {
                const [clubeData, fichaData] = await Promise.all([
                    getClubeById(clubeId),
                    getFichaMedica(clubeId, atletaId),
                ]);
                setClube(clubeData || null);
                if (fichaData && fichaData.id) {
                    setIsNew(false);
                    setForm({
                        grupoSanguineo: fichaData.grupoSanguineo || "",
                        alergias: fichaData.alergias || "",
                        condicoesCronicas: fichaData.condicoesCronicas || "",
                        contactoEmergenciaNome: fichaData.contactoEmergenciaNome || "",
                        contactoEmergenciaTelefone: fichaData.contactoEmergenciaTelefone || "",
                        notasGerais: fichaData.notasGerais || "",
                    });
                    setAtualizadoEm(fichaData.atualizadoEm);
                } else {
                    setIsNew(true);
                    setForm(EMPTY_FORM);
                }
            } catch (e) {
                setErro(e.message || "Erro ao carregar ficha.");
            } finally {
                setLoading(false);
            }
        }
        carregar();
    }, [clubeId, atletaId]);

    function onChange(e) {
        const { name, value } = e.target;
        setForm((p) => ({ ...p, [name]: value }));
    }

    async function onSubmit(e) {
        e.preventDefault();
        setErro(""); setMsg(""); setSaving(true);
        try {
            await saveFichaMedica(clubeId, atletaId, form);
            setMsg(isNew ? "Ficha médica criada com sucesso." : "Ficha médica atualizada.");
            setIsNew(false);
            const refreshed = await getFichaMedica(clubeId, atletaId);
            if (refreshed?.atualizadoEm) setAtualizadoEm(refreshed.atualizadoEm);
        } catch (e2) {
            setErro(e2.message || "Erro ao guardar.");
        } finally {
            setSaving(false);
        }
    }

    return (
        <>
            <SideMenu title="Gestão de Clubes" subtitle={clube?.nome || "Clube"} logoHref="/menu" logoSrc="/LOGO_GCDC04.png" items={menuItems} />

            <div className="container" style={{ paddingTop: 24 }}>
                <div className="page-title page-title-with-icon">
                    <div className="page-title-main-wrap">
                        <span className="page-title-icon-circle" style={{ fontSize: "1.6rem" }}>🏥</span>
                        <div className="page-title-texts">
                            <h1>Ficha Médica</h1>
                            <div className="hint">Atleta #{atletaId} · {clube?.nome || ""}</div>
                        </div>
                    </div>
                    <div className="actions">
                        <button type="button" className="btn" onClick={() => navigate(`/clubes/${clubeId}/medico`)}>
                            Módulo Clínico
                        </button>
                    </div>
                </div>

                {erro && <div className="alert error">{erro}</div>}
                {msg && <div className="alert ok">{msg}</div>}

                {loading ? (
                    <p className="subtle">A carregar...</p>
                ) : (
                    <div className="card">
                        {!isNew && atualizadoEm && (
                            <div style={{ marginBottom: 16, fontSize: "0.82rem", color: "var(--color-text-muted, #aaa)" }}>
                                Última atualização: {new Date(atualizadoEm).toLocaleString("pt-PT")}
                            </div>
                        )}

                        <div className="form-scroll">
                        <form onSubmit={onSubmit} className="row">
                            <div className="row">
                                <label className="field-label">Grupo sanguíneo</label>
                                <select className="input" name="grupoSanguineo" value={form.grupoSanguineo} onChange={onChange}>
                                    <option value="">Desconhecido</option>
                                    {GRUPOS_SANGUINEOS.map((g) => <option key={g} value={g}>{g}</option>)}
                                </select>
                            </div>

                            <div className="row">
                                <label className="field-label">Alergias conhecidas</label>
                                <textarea
                                    className="input"
                                    name="alergias"
                                    value={form.alergias}
                                    onChange={onChange}
                                    rows={3}
                                    placeholder="Descreva alergias conhecidas (medicamentos, alimentos, etc.)..."
                                />
                            </div>

                            <div className="row">
                                <label className="field-label">Condições crónicas</label>
                                <textarea
                                    className="input"
                                    name="condicoesCronicas"
                                    value={form.condicoesCronicas}
                                    onChange={onChange}
                                    rows={3}
                                    placeholder="Doenças crónicas, condições de saúde permanentes..."
                                />
                            </div>

                            <div
                                style={{
                                    padding: "12px 14px",
                                    borderRadius: 10,
                                    background: "rgba(99,102,241,0.08)",
                                    border: "1px solid rgba(99,102,241,0.2)",
                                    marginBottom: 4,
                                }}
                            >
                                <div style={{ fontWeight: 700, marginBottom: 10, fontSize: "0.9rem" }}>
                                    🚨 Contacto de Emergência
                                </div>
                                <div className="row2">
                                    <div className="row">
                                        <label className="field-label">Nome</label>
                                        <input className="input" name="contactoEmergenciaNome" value={form.contactoEmergenciaNome} onChange={onChange} placeholder="Nome do contacto de emergência" />
                                    </div>
                                    <div className="row">
                                        <label className="field-label">Telefone</label>
                                        <input className="input" name="contactoEmergenciaTelefone" value={form.contactoEmergenciaTelefone} onChange={onChange} placeholder="912345678" />
                                    </div>
                                </div>
                            </div>

                            <div className="row">
                                <label className="field-label">Notas gerais</label>
                                <textarea
                                    className="input"
                                    name="notasGerais"
                                    value={form.notasGerais}
                                    onChange={onChange}
                                    rows={3}
                                    placeholder="Informações adicionais relevantes para a saúde do atleta..."
                                />
                            </div>

                            <div className="actions" style={{ marginTop: 8 }}>
                                <button type="submit" className="btn btn-primary" disabled={saving}>
                                    {saving ? "A guardar..." : isNew ? "Criar ficha médica" : "Guardar alterações"}
                                </button>
                            </div>
                        </form>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
