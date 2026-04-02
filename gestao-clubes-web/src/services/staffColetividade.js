const API_BASE = `${(import.meta.env.VITE_API_URL || "http://localhost:8080").replace(/\/$/, "")}/api`;
const LS_KEY = "gc_user";

function getStoredToken() {
    try {
        const raw = localStorage.getItem(LS_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        return parsed?.token ?? null;
    } catch {
        return null;
    }
}

async function http(path, options = {}) {
    const token = getStoredToken();

    const headers = {
        "Content-Type": "application/json",
        ...(options.headers || {}),
    };

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    const res = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers,
    });

    if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `Erro HTTP ${res.status}`);
    }

    const ct = res.headers.get("content-type") || "";
    if (ct.includes("application/json")) return res.json();
    return res.text();
}

export async function getStaffByColetividadeAtividade(coletividadeId, coletividadeAtividadeId) {
    if (
        coletividadeId === undefined ||
        coletividadeId === null ||
        coletividadeId === "" ||
        coletividadeId === "undefined" ||
        coletividadeAtividadeId === undefined ||
        coletividadeAtividadeId === null ||
        coletividadeAtividadeId === "" ||
        coletividadeAtividadeId === "undefined"
    ) {
        return [];
    }

    return http(`/coletividades/${coletividadeId}/atividades/${coletividadeAtividadeId}/staff`);
}

export async function createStaffColetividade(coletividadeId, payload) {
    return http(`/coletividades/${coletividadeId}/staff`, {
        method: "POST",
        body: JSON.stringify(payload),
    });
}

export async function getCargosColetividadeStaff() {
    return [
        { id: 1, nome: "Presidente" },
        { id: 2, nome: "Vice-Presidente" },
        { id: 3, nome: "Secretário" },
        { id: 4, nome: "Tesoureiro" },
        { id: 5, nome: "Rececionista" },
        { id: 6, nome: "Professor" },
        { id: 7, nome: "Vogal" },
        { id: 8, nome: "Auxiliar de Limpeza" },
        { id: 9, nome: "Técnico de Manutenção" },
        { id: 10, nome: "Maestro" },
        { id: 11, nome: "Porteiro" },
        { id: 12, nome: "Cozinheiro" },
        { id: 13, nome: "Empregado de Bar" },
        { id: 14, nome: "Ajudante de Cozinha" },
        { id: 15, nome: "Monitor" },
        { id: 16, nome: "Treinador" },
        { id: 17, nome: "Roupeiro" },
        { id: 18, nome: "Enfermeiro" },
        { id: 19, nome: "Fisioterapeuta" },
        { id: 20, nome: "Administrativo" },
        { id: 21, nome: "Coordenador" },
    ];
}