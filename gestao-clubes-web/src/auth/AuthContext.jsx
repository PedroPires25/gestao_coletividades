import { createContext, useContext, useMemo, useState } from "react";
import { apiLogin } from "../api";
import { useTheme } from "../theme/ThemeContext";

const AuthContext = createContext(null);
const LS_KEY = "gc_user";

function calcularRedirectUrl(user) {
    if (!user) return "/menu";
    
    const { role, clubeId, modalidadeId, coletividadeId, atividadeId, estadoRegisto } = user;

    // Se não está aprovado, será tratado em outro lugar
    if (estadoRegisto !== "APROVADO") {
        return null;
    }

    switch (role) {
        case "SUPER_ADMIN":
            return "/admin/users";

        case "ADMINISTRADOR":
            if (clubeId) {
                return `/clubes/${clubeId}`;
            }
            if (coletividadeId) {
                return `/coletividades/${coletividadeId}`;
            }
            return "/menu";

        case "ATLETA":
            if (clubeId && modalidadeId) {
                return `/clubes/${clubeId}/clube-modalidade/${modalidadeId}/modalidade`;
            }
            return null;

        case "TREINADOR_PRINCIPAL":
            if (clubeId && modalidadeId) {
                return `/clubes/${clubeId}/staff/modalidades/${modalidadeId}`;
            }
            return null;

        case "DEPARTAMENTO_MEDICO":
            if (clubeId) {
                return `/clubes/${clubeId}`;
            }
            return null;

        case "STAFF":
        case "PROFESSOR":
            if (clubeId && modalidadeId) {
                return `/clubes/${clubeId}/clube-modalidade/${modalidadeId}/modalidade`;
            }
            if (clubeId) {
                return `/clubes/${clubeId}`;
            }
            if (coletividadeId) {
                return `/coletividades/${coletividadeId}`;
            }
            return null;

        case "SECRETARIO":
            if (clubeId) return `/clubes/${clubeId}`;
            if (coletividadeId) return `/coletividades/${coletividadeId}`;
            return "/menu";

        case "UTENTE":
            if (coletividadeId && atividadeId) {
                return `/coletividades/${coletividadeId}/utentes/atividades/${atividadeId}`;
            }
            return null;

        case "USER": {
            const clubeId = user.clubeId ?? null;
            const coletividadeId = user.coletividadeId ?? null;
            if (clubeId) return `/minha-area/clube/${clubeId}`;
            if (coletividadeId) return `/minha-area/coletividade/${coletividadeId}`;
            return "/menu";
        }

        default:
            return "/menu";
    }
}

export function AuthProvider({ children }) {
    const { resetTheme, applyUserTheme } = useTheme();

    const [session, setSession] = useState(() => {
        try {
            const raw = localStorage.getItem(LS_KEY);
            return raw ? JSON.parse(raw) : null;
        } catch {
            return null;
        }
    });

    async function login(email, password) {
        const response = await apiLogin(email.trim(), password);
        
        if (response?.user) {
            response.redirectUrl = calcularRedirectUrl(response.user);
            applyUserTheme(response.user.temaPreferido);
        }
        
        setSession(response);
        localStorage.setItem(LS_KEY, JSON.stringify(response));
        return response;
    }

    function logout() {
        setSession(null);
        localStorage.removeItem(LS_KEY);
        resetTheme();
    }

    function updateSession(updatedUser) {
        setSession((prev) => {
            const next = { ...prev, user: { ...prev?.user, ...updatedUser } };
            localStorage.setItem(LS_KEY, JSON.stringify(next));
            return next;
        });
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const value = useMemo(() => {
        const role = session?.user?.role ?? null;
        const redirectUrl = session?.redirectUrl ?? calcularRedirectUrl(session?.user) ?? "/menu";
        const isSuperAdmin = role === "SUPER_ADMIN";
        const isScopedAdmin = role === "ADMINISTRADOR";
        const scopedAdminActive = isScopedAdmin && (session?.user?.privilegiosAtivos ?? false);
        const isAdmin = isSuperAdmin || scopedAdminActive;

        return {
            session,
            token: session?.token ?? null,
            user: session?.user ?? null,
            redirectUrl,
            redirectPath: redirectUrl,
            isAuthenticated: !!session?.token,
            role,
            isAdmin,
            isSuperAdmin,
            isScopedAdmin,
            privilegiosAtivos: session?.user?.privilegiosAtivos ?? false,
            estadoRegisto: session?.user?.estadoRegisto ?? null,
            clubeId: session?.user?.clubeId ?? null,
            modalidadeId: session?.user?.modalidadeId ?? null,
            coletividadeId: session?.user?.coletividadeId ?? null,
            atividadeId: session?.user?.atividadeId ?? null,
            nome: session?.user?.nome ?? null,
            logoPath: session?.user?.logoPath ?? null,
            canManageClube: (targetClubeId) => isSuperAdmin || (scopedAdminActive && Number(targetClubeId) === (session?.user?.clubeId ?? null)),
            canManageColetividade: (targetColetividadeId) => isSuperAdmin || (scopedAdminActive && Number(targetColetividadeId) === (session?.user?.coletividadeId ?? null)),
            login,
            logout,
            updateSession,
        };
    }, [session]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth deve ser usado dentro de <AuthProvider>");
    return ctx;
}
