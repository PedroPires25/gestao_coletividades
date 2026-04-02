const API_URL = ((import.meta.env.VITE_API_URL || "http://localhost:8080").replace(/\/$/, "")) + "/api";
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

    if (token) headers.Authorization = `Bearer ${token}`;

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

export async function getCargosStaff() {
    const data = await authFetch(`/staff/cargos`);
    return extractArray(data);
}

export async function getEscaloesStaff() {
    const data = await authFetch(`/staff/escaloes`);
    return extractArray(data);
}

export async function getStaffByClube(clubeId) {
    const data = await authFetch(`/clubes/${clubeId}/staff`);
    return extractArray(data);
}

export async function getStaffByClubeModalidade(clubeId, clubeModalidadeId) {
    const data = await authFetch(`/clubes/${clubeId}/staff/modalidades/${clubeModalidadeId}`);
    return extractArray(data);
}

export async function createStaff(clubeId, payload) {
    return authFetch(`/clubes/${clubeId}/staff`, {
        method: "POST",
        body: JSON.stringify(payload),
    });
}

export async function updateStaff(clubeId, staffId, payload) {
    return authFetch(`/clubes/${clubeId}/staff/${staffId}`, {
        method: "PUT",
        body: JSON.stringify(payload),
    });
}

export async function updateStaffAfetacao(clubeId, staffId, afetacaoId, payload) {
    return authFetch(`/clubes/${clubeId}/staff/${staffId}/afetacoes/${afetacaoId}`, {
        method: "PUT",
        body: JSON.stringify(payload),
    });
}

export async function getStaffAfetacoes(staffId) {
    const data = await authFetch(`/staff/${staffId}/afetacoes`);
    return extractArray(data);
}

export async function terminarStaffAfetacao(afetacaoId, dataFim) {
    return authFetch(`/staff/afetacoes/${afetacaoId}/terminar`, {
        method: "PUT",
        body: JSON.stringify({ dataFim }),
    });
}
