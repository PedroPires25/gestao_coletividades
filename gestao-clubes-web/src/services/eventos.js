const API_BASE = `${(import.meta.env.VITE_API_URL || "http://localhost:8080").replace(/\/$/, "")}/api`;

function getStoredToken() {
    try {
        const raw = localStorage.getItem("gc_user");
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

export async function getAllEventos() {
    return http("/eventos");
}

export async function getEventoById(id) {
    return http(`/eventos/${id}`);
}

export async function createEvento(data) {
    return http("/eventos", {
        method: "POST",
        body: JSON.stringify(data),
    });
}

export async function updateEvento(id, data) {
    return http(`/eventos/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
    });
}

export async function deleteEvento(id) {
    return http(`/eventos/${id}`, {
        method: "DELETE",
    });
}

export async function getEventosPorClubeModalidade(clubeModalidadeId) {
    return http(`/eventos?clubeModalidadeId=${clubeModalidadeId}`);
}

export async function listarMeusEventos(clubeId) {
    // For now, just load all events and filter client-side
    // In the future, this could be optimized with a backend filter
    return http("/eventos");
}
