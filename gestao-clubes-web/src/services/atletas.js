const API_URL = `${(import.meta.env.VITE_API_URL || "http://localhost:8080").replace(/\/$/, "")}/api`;
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

function extractArray(payload) {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.content)) return payload.content;
    if (Array.isArray(payload?.items)) return payload.items;
    if (Array.isArray(payload?.result)) return payload.result;
    return [];
}

async function authFetch(path, options = {}) {
    const token = getStoredToken();

    const headers = {
        "Content-Type": "application/json",
        ...(options.headers || {}),
    };

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}${path}`, {
        ...options,
        headers,
    });

    if (!response.ok) {
        const text = await response.text().catch(() => "");
        throw new Error(text || `Erro HTTP ${response.status}`);
    }

    const ct = response.headers.get("content-type") || "";
    if (ct.includes("application/json")) return response.json();
    return response.text();
}

export async function getModalidadesByClube(clubeId) {
    const data = await authFetch(`/clubes/${clubeId}/modalidades?ativas=true`);
    return extractArray(data);
}

export async function getAtletasByClubeModalidade(clubeId, clubeModalidadeId) {
    const data = await authFetch(`/clubes/${clubeId}/clube-modalidade/${clubeModalidadeId}/atletas`);
    return extractArray(data);
}

export async function getEscaloes() {
    const data = await authFetch(`/atletas/escaloes`);
    return extractArray(data);
}

export async function getEstadosAtleta() {
    const data = await authFetch(`/atletas/estados`);
    return extractArray(data);
}

export async function createAtleta(clubeId, modalidadeId, payload) {
    return authFetch(`/clubes/${clubeId}/modalidades/${modalidadeId}/atletas`, {
        method: "POST",
        body: JSON.stringify(payload),
    });
}

export async function updateAtleta(clubeId, modalidadeId, atletaId, payload) {
    return authFetch(`/clubes/${clubeId}/modalidades/${modalidadeId}/atletas/${atletaId}`, {
        method: "PUT",
        body: JSON.stringify(payload),
    });
}