import { createContext, useContext, useMemo, useState } from "react";
import { apiLogin } from "../api";

const AuthContext = createContext(null);
const LS_KEY = "gc_user";

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
        setSession(response);
        localStorage.setItem(LS_KEY, JSON.stringify(response));
        return response;
    }

    function logout() {
        setSession(null);
        localStorage.removeItem(LS_KEY);
    }

    const role = session?.user?.role ?? null;

    const value = useMemo(() => ({
        session,
        token: session?.token ?? null,
        user: session?.user ?? null,
        redirectPath: session?.redirectPath ?? "/menu",
        isAuthenticated: !!session?.token,
        role,
        isAdmin: role === "ADMIN",
        privilegiosAtivos: session?.user?.privilegiosAtivos ?? false,
        estadoRegisto: session?.user?.estadoRegisto ?? null,
        clubeId: session?.user?.clubeId ?? null,
        modalidadeId: session?.user?.modalidadeId ?? null,
        login,
        logout,
    }), [session, role]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth deve ser usado dentro de <AuthProvider>");
    return ctx;
}
