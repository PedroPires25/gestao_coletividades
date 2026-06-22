import { API_BASE as API_URL } from "../config/apiBase";
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
    return [];
}

async function authFetch(path, options = {}) {
    const token = getStoredToken();
    const headers = {
        "Content-Type": "application/json",
        ...(options.headers || {}),
    };
    if (token) headers.Authorization = `Bearer ${token}`;
    const response = await fetch(`${API_URL}${path}`, { ...options, headers });
    if (!response.ok) {
        const text = await response.text().catch(() => "");
        let msg = text;
        try {
            const json = JSON.parse(text);
            msg = json.message || json.error || text;
        } catch { /* not JSON — use raw text */ }
        throw new Error(msg || `Erro HTTP ${response.status}`);
    }
    const ct = response.headers.get("content-type") || "";
    if (ct.includes("application/json")) return response.json();
    return response.text();
}


export async function getFichaMedica(clubeId, atletaId) {
    try {
        return await authFetch(`/clubes/${clubeId}/medico/atletas/${atletaId}/ficha`);
    } catch (e) {
        if (e.message.includes("204") || e.message.includes("No Content")) return null;
        throw e;
    }
}

export async function saveFichaMedica(clubeId, atletaId, payload) {
    return authFetch(`/clubes/${clubeId}/medico/atletas/${atletaId}/ficha`, {
        method: "PUT",
        body: JSON.stringify(payload),
    });
}

// ---- Lesões ----

export async function getLesoes(clubeId) {
    const data = await authFetch(`/clubes/${clubeId}/medico/lesoes`);
    return extractArray(data);
}

export async function getLesoesPorAtleta(clubeId, atletaId) {
    const data = await authFetch(`/clubes/${clubeId}/medico/atletas/${atletaId}/lesoes`);
    return extractArray(data);
}

export async function createLesao(clubeId, payload) {
    return authFetch(`/clubes/${clubeId}/medico/lesoes`, {
        method: "POST",
        body: JSON.stringify(payload),
    });
}

export async function updateLesao(clubeId, id, payload) {
    return authFetch(`/clubes/${clubeId}/medico/lesoes/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
    });
}

// ---- Consultas ----

export async function getConsultas(clubeId) {
    const data = await authFetch(`/clubes/${clubeId}/medico/consultas`);
    return extractArray(data);
}

export async function getConsultasPorAtleta(clubeId, atletaId) {
    const data = await authFetch(`/clubes/${clubeId}/medico/atletas/${atletaId}/consultas`);
    return extractArray(data);
}

export async function createConsulta(clubeId, payload) {
    return authFetch(`/clubes/${clubeId}/medico/consultas`, {
        method: "POST",
        body: JSON.stringify(payload),
    });
}

export async function updateConsulta(clubeId, id, payload) {
    return authFetch(`/clubes/${clubeId}/medico/consultas/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
    });
}

// ---- Exames ----

export async function getExames(clubeId) {
    const data = await authFetch(`/clubes/${clubeId}/medico/exames`);
    return extractArray(data);
}

export async function getExamesPorAtleta(clubeId, atletaId) {
    const data = await authFetch(`/clubes/${clubeId}/medico/atletas/${atletaId}/exames`);
    return extractArray(data);
}

export async function createExame(clubeId, payload) {
    return authFetch(`/clubes/${clubeId}/medico/exames`, {
        method: "POST",
        body: JSON.stringify(payload),
    });
}

export async function updateExame(clubeId, id, payload) {
    return authFetch(`/clubes/${clubeId}/medico/exames/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
    });
}

// ---- Prescrições ----

export async function getPrescricoes(clubeId) {
    const data = await authFetch(`/clubes/${clubeId}/medico/prescricoes`);
    return extractArray(data);
}

export async function getPrescricoesPorAtleta(clubeId, atletaId) {
    const data = await authFetch(`/clubes/${clubeId}/medico/atletas/${atletaId}/prescricoes`);
    return extractArray(data);
}

export async function createPrescricao(clubeId, payload) {
    return authFetch(`/clubes/${clubeId}/medico/prescricoes`, {
        method: "POST",
        body: JSON.stringify(payload),
    });
}

export async function updatePrescricao(clubeId, id, payload) {
    return authFetch(`/clubes/${clubeId}/medico/prescricoes/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
    });
}

// ---- Upload ficheiro exame ----

export async function uploadExameFicheiro(clubeId, exameId, file) {
    const token = getStoredToken();
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch(`${API_URL}/clubes/${clubeId}/medico/exames/${exameId}/ficheiro`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
    });
    if (!response.ok) {
        const text = await response.text().catch(() => "");
        throw new Error(text || `Erro HTTP ${response.status}`);
    }
    return response.json();
}

export function getExameFileUrl(ficheiroPath) {
    if (!ficheiroPath) return null;
    if (ficheiroPath.startsWith("http")) return ficheiroPath;
    if (ficheiroPath.includes("cloudinary")) return `https://${ficheiroPath}`;
    return `${API_URL}/uploads/${ficheiroPath}`;
}


export async function getRelatorios(clubeId) {
    const data = await authFetch(`/clubes/${clubeId}/medico/relatorios`);
    return extractArray(data);
}

export async function getRelatoriosPorAtleta(clubeId, atletaId) {
    const data = await authFetch(`/clubes/${clubeId}/medico/atletas/${atletaId}/relatorios`);
    return extractArray(data);
}

export async function createRelatorio(clubeId, payload) {
    return authFetch(`/clubes/${clubeId}/medico/relatorios`, {
        method: "POST",
        body: JSON.stringify(payload),
    });
}

export async function updateRelatorio(clubeId, id, payload) {
    return authFetch(`/clubes/${clubeId}/medico/relatorios/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
    });
}