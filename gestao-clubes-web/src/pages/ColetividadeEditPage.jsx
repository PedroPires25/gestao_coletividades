import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import SideMenu from "../components/SideMenu";
import { getColetividadeById, updateColetividade, uploadColetividadeLogo, getUploadUrl } from "../api";
import { useAuth } from "../auth/AuthContext";
import defaultLogo from "../assets/default-logo.svg";

function isoToInputDate(dateISO) {
    if (!dateISO) return "";
    const d = new Date(dateISO);
    if (Number.isNaN(d.getTime())) return "";
    return d.toISOString().slice(0, 10);
}

export default function ColetividadeEditPage() {
    const { id: coletividadeId } = useParams();
    const navigate = useNavigate();
    const { logout, isAdmin, isSuperAdmin, canManageColetividade } = useAuth();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [erro, setErro] = useState("");
    const [msg, setMsg] = useState("");

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

    useEffect(() => {
        let active = true;

        async function load() {
            setErro("");
            setLoading(true);

            if (!coletividadeId || coletividadeId === "undefined") {
                if (active) {
                    setErro("ID da coletividade inválido.");
                    setLoading(false);
                }
                return;
            }

            if (!canManageColetividade(Number(coletividadeId))) {
                navigate("/acesso-negado", { replace: true });
                return;
            }

            try {
                const data = await getColetividadeById(coletividadeId);
                if (active) {
                    setForm({
                        nome: data.nome || "",
                        email: data.email || "",
                        telefone: data.telefone || "",
                        nif: data.nif || "",
                        morada: data.morada || "",
                        codigoPostal: data.codigoPostal || data.codigo_postal || "",
                        localidade: data.localidade || "",
                        dataFundacao: isoToInputDate(data.dataFundacao),
                    });
                    setLogoPreview(data.logoPath ? getUploadUrl(data.logoPath) : null);
                }
            } catch (e) {
                if (active) setErro(e.message || "Não foi possível carregar os dados da coletividade.");
            } finally {
                if (active) setLoading(false);
            }
        }

        load();
        return () => { active = false; };
    }, [coletividadeId, canManageColetividade, navigate]);

    function onChange(e) {
        setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    }

    function onLogoChange(e) {
        const file = e.target.files[0];
        setLogoFile(file || null);
        if (file) {
            setLogoPreview(URL.createObjectURL(file));
        }
    }

    async function onSubmit(e) {
        e.preventDefault();
        if (!canManageColetividade(Number(coletividadeId))) return;

        setErro("");
        setMsg("");
        setSaving(true);

        try {
            await updateColetividade(coletividadeId, {
                nome: form.nome,
                email: form.email,
                telefone: form.telefone,
                nif: form.nif,
                morada: form.morada,
                codigoPostal: form.codigoPostal,
                localidade: form.localidade,
                dataFundacao: form.dataFundacao || null,
            });

            if (logoFile) {
                try {
                    await uploadColetividadeLogo(coletividadeId, logoFile);
                } catch (uploadErr) {
                    console.warn("Coletividade atualizada, mas logo falhou:", uploadErr.message);
                }
            }

            setMsg("Dados da coletividade atualizados com sucesso!");
            setLogoFile(null);
        } catch (e) {
            setErro(e.message || "Não foi possível atualizar a coletividade.");
        } finally {
            setSaving(false);
        }
    }

    const menuItems = [
        { label: "Home", to: "/menu" },
        ...(isSuperAdmin ? [{ label: "Clubes", to: "/clubes" }] : []),
        ...(isSuperAdmin ? [{ label: "Coletividades", to: "/coletividades" }] : []),
        ...(isAdmin ? [{ label: "Perfis", to: "/admin/users" }] : []),
        { label: "← Voltar à Coletividade", to: `/coletividades/${coletividadeId}` },
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
                subtitle="Definições da Coletividade"
                logoHref="/menu"
                logoSrc="/LOGO_GCDC04.png"
                items={menuItems}
            />

            <div className="container" style={{ paddingTop: 24 }}>
                <div className="page-title">
                    <h1>Definições da Coletividade</h1>
                    <div className="hint">Edita os dados da tua coletividade.</div>
                </div>

                {loading ? (
                    <div className="card"><p>A carregar...</p></div>
                ) : (
                    <div className="card">
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

                            <div className="row">
                                <label className="field-label" htmlFor="logoFile">
                                    Logo da coletividade
                                </label>
                                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                    <img
                                        src={logoPreview || defaultLogo}
                                        alt="Preview"
                                        style={{ width: 48, height: 48, objectFit: "cover", borderRadius: 8, border: "1px solid var(--border)" }}
                                    />
                                    <input
                                        id="logoFile"
                                        type="file"
                                        accept="image/png,image/jpeg,image/gif,image/webp"
                                        onChange={onLogoChange}
                                    />
                                </div>
                            </div>

                            <div className="actions">
                                <button className="btn btn-primary" type="submit" disabled={saving}>
                                    {saving ? "A guardar..." : "Guardar alterações"}
                                </button>
                                <button
                                    className="btn"
                                    type="button"
                                    onClick={() => navigate(`/coletividades/${coletividadeId}`)}
                                >
                                    Cancelar
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </>
    );
}
