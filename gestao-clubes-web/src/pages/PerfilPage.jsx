import { useState, useEffect, useRef } from "react";
import { useAuth } from "../auth/AuthContext";
import SideMenu from "../components/SideMenu";
import PasswordChecklist from "../components/PasswordChecklist";
import ConfirmPasswordStatus from "../components/ConfirmPasswordStatus";
import { evaluatePassword } from "../utils/passwordStrength";
import {
    getMyProfile,
    updateMyProfile,
    uploadUtilizadorAvatar,
    getUploadUrl,
    changeMyPassword,
} from "../api";

const EyeOpenIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
         fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2.062 12.349a12.24 12.24 0 0 1 19.876 0" />
        <circle cx="12" cy="12" r="3" />
    </svg>
);

const EyeClosedIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
         fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.527 12.234 12.234 0 0 1-1.604 2.887" />
        <path d="M16.637 16.637A12.241 12.241 0 0 1 2.062 12.349a12.235 12.235 0 0 1 2.162-3.805" />
        <path d="M1 1l22 22" />
        <circle cx="12" cy="12" r="3" />
    </svg>
);

const eyeButtonStyle = {
    position: "absolute",
    right: "12px",
    top: "50%",
    transform: "translateY(-50%)",
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "#333333",
    opacity: 0.6,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "4px",
    zIndex: 2,
};

export default function PerfilPage() {
    const { user, updateSession } = useAuth();
    const [nome, setNome] = useState("");
    const [email, setEmail] = useState("");
    const [logoPath, setLogoPath] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState(null);
    const fileRef = useRef(null);

    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmNewPassword, setConfirmNewPassword] = useState("");
    const [savingPw, setSavingPw] = useState(false);
    const [pwMsg, setPwMsg] = useState(null);
    const [showCurrentPw, setShowCurrentPw] = useState(false);
    const [showNewPw, setShowNewPw] = useState(false);
    const [showConfirmPw, setShowConfirmPw] = useState(false);

    const pwResult = evaluatePassword(newPassword);
    const pwValid = pwResult.isValid && newPassword === confirmNewPassword && confirmNewPassword.length > 0;

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

    async function handleChangePassword(e) {
        e.preventDefault();
        setPwMsg(null);

        if (!currentPassword || !newPassword || !confirmNewPassword) {
            setPwMsg({ type: "error", text: "Todos os campos são obrigatórios." });
            return;
        }

        if (newPassword !== confirmNewPassword) {
            setPwMsg({ type: "error", text: "As novas palavras-passe não coincidem." });
            return;
        }

        setSavingPw(true);
        try {
            await changeMyPassword({ currentPassword, newPassword, confirmNewPassword });
            setPwMsg({ type: "success", text: "Palavra-passe alterada com sucesso." });
            setCurrentPassword("");
            setNewPassword("");
            setConfirmNewPassword("");
        } catch (err) {
            const text = typeof err === "string" ? err
                : err?.message || "Erro ao alterar a palavra-passe.";
            setPwMsg({ type: "error", text });
        } finally {
            setSavingPw(false);
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

                    <hr className="perfil-divider" />

                    <h3>Alterar Palavra-passe</h3>

                    {pwMsg && (
                        <div className={`perfil-msg perfil-msg-${pwMsg.type}`}>
                            {pwMsg.text}
                        </div>
                    )}

                    <form className="perfil-form" onSubmit={handleChangePassword}>
                        <div className="perfil-field">
                            <label htmlFor="perfil-pw-current">Palavra-passe atual</label>
                            <div style={{ position: "relative" }}>
                                <input
                                    id="perfil-pw-current"
                                    type={showCurrentPw ? "text" : "password"}
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    className="perfil-input"
                                    autoComplete="current-password"
                                    style={{ paddingRight: "45px" }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowCurrentPw(!showCurrentPw)}
                                    style={eyeButtonStyle}
                                    aria-label={showCurrentPw ? "Ocultar palavra-passe" : "Mostrar palavra-passe"}
                                >
                                    {showCurrentPw ? <EyeOpenIcon /> : <EyeClosedIcon />}
                                </button>
                            </div>
                        </div>

                        <div className="perfil-field">
                            <label htmlFor="perfil-pw-new">Nova palavra-passe</label>
                            <div style={{ position: "relative" }}>
                                <input
                                    id="perfil-pw-new"
                                    type={showNewPw ? "text" : "password"}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="perfil-input"
                                    autoComplete="new-password"
                                    style={{ paddingRight: "45px" }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowNewPw(!showNewPw)}
                                    style={eyeButtonStyle}
                                    aria-label={showNewPw ? "Ocultar palavra-passe" : "Mostrar palavra-passe"}
                                >
                                    {showNewPw ? <EyeOpenIcon /> : <EyeClosedIcon />}
                                </button>
                            </div>
                            <PasswordChecklist password={newPassword} />
                        </div>

                        <div className="perfil-field">
                            <label htmlFor="perfil-pw-confirm">Confirmar nova palavra-passe</label>
                            <div style={{ position: "relative" }}>
                                <input
                                    id="perfil-pw-confirm"
                                    type={showConfirmPw ? "text" : "password"}
                                    value={confirmNewPassword}
                                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                                    className="perfil-input"
                                    autoComplete="new-password"
                                    style={{ paddingRight: "45px" }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPw(!showConfirmPw)}
                                    style={eyeButtonStyle}
                                    aria-label={showConfirmPw ? "Ocultar confirmação" : "Mostrar confirmação"}
                                >
                                    {showConfirmPw ? <EyeOpenIcon /> : <EyeClosedIcon />}
                                </button>
                            </div>
                            <ConfirmPasswordStatus
                                password={newPassword}
                                confirmPassword={confirmNewPassword}
                            />
                        </div>

                        <button
                            type="submit"
                            className="perfil-save-btn"
                            disabled={savingPw || !pwValid || !currentPassword}
                        >
                            {savingPw ? "A alterar..." : "Alterar Palavra-passe"}
                        </button>
                    </form>
                </div>
            )}
        </>
    );
}
