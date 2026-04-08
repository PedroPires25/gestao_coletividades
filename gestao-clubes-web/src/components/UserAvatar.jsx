import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { getUploadUrl } from "../api";

function getInitials(nome, email) {
    if (nome && nome.trim()) {
        const parts = nome.trim().split(/\s+/);
        if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        return parts[0][0].toUpperCase();
    }
    if (email) return email[0].toUpperCase();
    return "?";
}

export default function UserAvatar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    const nome = user?.nome || null;
    const email = user?.email || "";
    const logoPath = user?.logoPath || null;
    const avatarUrl = logoPath ? getUploadUrl(logoPath) : null;
    const initials = getInitials(nome, email);
    const displayName = nome || email.split("@")[0];

    useEffect(() => {
        function handleClick(e) {
            if (ref.current && !ref.current.contains(e.target)) {
                setOpen(false);
            }
        }
        if (open) document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, [open]);

    return (
        <div className="user-avatar-wrap" ref={ref}>
            <button
                className="user-avatar-btn"
                onClick={() => setOpen((v) => !v)}
                type="button"
                title={displayName}
            >
                {avatarUrl ? (
                    <img src={avatarUrl} alt={displayName} className="user-avatar-img" />
                ) : (
                    <span className="user-avatar-initials">{initials}</span>
                )}
                <span className="user-avatar-name">{displayName}</span>
            </button>

            {open && (
                <div className="user-avatar-dropdown">
                    <button
                        className="user-avatar-dropdown-item"
                        type="button"
                        onClick={() => {
                            setOpen(false);
                            navigate("/perfil");
                        }}
                    >
                        Editar Perfil
                    </button>
                    <button
                        className="user-avatar-dropdown-item user-avatar-dropdown-logout"
                        type="button"
                        onClick={() => {
                            setOpen(false);
                            logout();
                            navigate("/login", { replace: true });
                        }}
                    >
                        Terminar Sessão
                    </button>
                </div>
            )}
        </div>
    );
}
