import { useState, useEffect, useRef } from "react";
import { useAuth } from "../auth/AuthContext";
import SideMenu from "../components/SideMenu";
import {
    getMyProfile,
    updateMyProfile,
    uploadUtilizadorAvatar,
    getUploadUrl,
} from "../api";

export default function PerfilPage() {
    const { user, updateSession } = useAuth();
    const [nome, setNome] = useState("");
    const [email, setEmail] = useState("");
    const [logoPath, setLogoPath] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState(null);
    const fileRef = useRef(null);

    useEffect(() => {
        let cancelled = false;
        getMyProfile()
            .then((data) => {
                if (cancelled) return;
                setNome(data.nome || "");
                setEmail(data.email || "");
                setLogoPath(data.logoPath || null);
            })
            .catch(() => setMsg({ type: "error", text: "Erro ao carregar perfil." }))
            .finally(() => !cancelled && setLoading(false));
        return () => { cancelled = true; };
    }, []);

    async function handleSave(e) {
        e.preventDefault();
        setSaving(true);
        setMsg(null);
        try {
            const updated = await updateMyProfile({ nome: nome.trim() });
            updateSession({ nome: updated.nome, logoPath: updated.logoPath });
            setMsg({ type: "success", text: "Perfil atualizado com sucesso." });
        } catch {
            setMsg({ type: "error", text: "Erro ao guardar perfil." });
        } finally {
            setSaving(false);
        }
    }

    async function handleFotoUpload(e) {
        const file = e.target.files?.[0];
        if (!file) return;
        setSaving(true);
        setMsg(null);
        try {
            const res = await uploadUtilizadorAvatar(user.id, file);
            const newPath = res.logoPath || res.path || res;
            setLogoPath(typeof newPath === "string" ? newPath : null);
            updateSession({ logoPath: typeof newPath === "string" ? newPath : null });
            setMsg({ type: "success", text: "Foto atualizada com sucesso." });
        } catch {
            setMsg({ type: "error", text: "Erro ao fazer upload da foto." });
        } finally {
            setSaving(false);
            if (fileRef.current) fileRef.current.value = "";
        }
    }

    const avatarUrl = logoPath ? getUploadUrl(logoPath) : null;

    return (
        <>
            <SideMenu
                title="Gestão de Coletividades"
                subtitle="Perfil"
                logoHref="/menu"
                logoSrc="/logo.png"
                items={[]}
                showBurger={false}
            />

            {loading ? (
                <div className="perfil-page"><p>A carregar...</p></div>
            ) : (
                <div className="perfil-page">
                    <h2>Editar Perfil</h2>

                    {msg && (
                        <div className={`perfil-msg perfil-msg-${msg.type}`}>
                            {msg.text}
                        </div>
                    )}

                    <div className="perfil-avatar-section">
                        <div className="perfil-avatar-circle">
                            {avatarUrl ? (
                                <img src={avatarUrl} alt="Avatar" />
                            ) : (
                                <span className="perfil-avatar-initials">
                                    {(nome || email || "?")[0].toUpperCase()}
                                </span>
                            )}
                        </div>
                        <label className="perfil-avatar-upload-btn">
                            Alterar Foto
                            <input
                                ref={fileRef}
                                type="file"
                                accept="image/*"
                                onChange={handleFotoUpload}
                                hidden
                            />
                        </label>
                    </div>

                    <form className="perfil-form" onSubmit={handleSave}>
                        <div className="perfil-field">
                            <label htmlFor="perfil-email">Email</label>
                            <input
                                id="perfil-email"
                                type="email"
                                value={email}
                                disabled
                                className="perfil-input"
                            />
                        </div>

                        <div className="perfil-field">
                            <label htmlFor="perfil-nome">Nome</label>
                            <input
                                id="perfil-nome"
                                type="text"
                                value={nome}
                                onChange={(e) => setNome(e.target.value)}
                                className="perfil-input"
                                maxLength={200}
                            />
                        </div>

                        <button type="submit" className="perfil-save-btn" disabled={saving}>
                            {saving ? "A guardar..." : "Guardar"}
                        </button>
                    </form>
                </div>
            )}
        </>
    );
}
