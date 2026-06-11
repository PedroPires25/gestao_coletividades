import { createContext, useContext, useMemo, useState } from "react";
import { apiLogin } from "../api";
import { useTheme } from "../theme/ThemeContext";
import { getHomePathByRole } from "../utils/navigation";

const AuthContext = createContext(null);
const LS_KEY = "gc_user";

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
            response.redirectUrl = getHomePathByRole(response.user);
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
        const redirectUrl = session?.redirectUrl ?? getHomePathByRole(session?.user) ?? "/menu";
        const isSuperAdmin = role === "SUPER_ADMIN";
        const isScopedAdmin = role === "ADMINISTRADOR";
        const scopedAdminActive = isScopedAdmin && (session?.user?.privilegiosAtivos ?? false);
        const isAdmin = isSuperAdmin || scopedAdminActive;
        const isSecretario = role === "SECRETARIO";
        const isGestorLocal = scopedAdminActive || isSecretario;

        const isDepartamentoMedico = role === "DEPARTAMENTO_MEDICO";
        const isTreinador = role === "TREINADOR_PRINCIPAL";
        const isProfessorColetividade = role === "PROFESSOR" && !!session?.user?.coletividadeId;
        const isTreinadorColetividade = role === "TREINADOR_COLETIVIDADE" && !!session?.user?.coletividadeId;
        const isProfessorOuTreinadorColetividade = isProfessorColetividade || isTreinadorColetividade;

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
            isSecretario,
            isGestorLocal,
            isDepartamentoMedico,
            isTreinador,
            isProfessorColetividade,
            isTreinadorColetividade,
            isProfessorOuTreinadorColetividade,
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