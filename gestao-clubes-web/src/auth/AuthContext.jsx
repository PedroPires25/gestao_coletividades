import { createContext, useContext, useMemo, useState } from "react";
import { apiLogin } from "../api";

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
        case "ADMIN":
            return "/admin/users";

        case "ATLETA":
            if (clubeId && modalidadeId) {
                return `/clubes/${clubeId}/atletas/modalidades/${modalidadeId}`;
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
        case "SECRETARIO":
        case "PROFESSOR":
            // Prioridade: CLUBE > COLETIVIDADE
            if (clubeId) {
                return `/clubes/${clubeId}`;
            }
            if (coletividadeId) {
                return `/coletividades/${coletividadeId}`;
            }
            return null;

        case "UTENTE":
            if (coletividadeId && atividadeId) {
                return `/coletividades/${coletividadeId}/utentes/atividades/${atividadeId}`;
            }
            return null;

        case "USER":
            return "/menu";

        default:
            return "/menu";
    }
}

export function AuthProvider({ children }) {
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
        
        // Calcular redirectUrl com base no user retornado
        if (response?.user) {
            const redirectUrl = calcularRedirectUrl(response.user);
            response.redirectUrl = redirectUrl;
        }
        
        setSession(response);
        localStorage.setItem(LS_KEY, JSON.stringify(response));
        return response;
    }

    function logout() {
        setSession(null);
        localStorage.removeItem(LS_KEY);
    }

    const role = session?.user?.role ?? null;
    const redirectUrl = session?.redirectUrl ?? calcularRedirectUrl(session?.user) ?? "/menu";

    const value = useMemo(() => ({
        session,
        token: session?.token ?? null,
        user: session?.user ?? null,
        redirectUrl,
        redirectPath: redirectUrl,
        isAuthenticated: !!session?.token,
        role,
        isAdmin: role === "ADMIN",
        privilegiosAtivos: session?.user?.privilegiosAtivos ?? false,
        estadoRegisto: session?.user?.estadoRegisto ?? null,
        clubeId: session?.user?.clubeId ?? null,
        modalidadeId: session?.user?.modalidadeId ?? null,
        coletividadeId: session?.user?.coletividadeId ?? null,
        atividadeId: session?.user?.atividadeId ?? null,
        login,
        logout,
    }), [session, role, redirectUrl]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth deve ser usado dentro de <AuthProvider>");
    return ctx;
}
