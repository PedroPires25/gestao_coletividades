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

// =======================
// ATLETAS
// =======================

export async function getAtletasTreinador(clubeId) {
    return authFetch(`/clubes/${clubeId}/treinador/atletas`);
}

export async function getAtletasConvocatoriasTreinador(clubeId, escalaoId, clubeModalidadeId) {
    const searchParams = new URLSearchParams();
    if (escalaoId != null && escalaoId !== "") searchParams.set("escalaoId", escalaoId);
    if (clubeModalidadeId != null && clubeModalidadeId !== "") searchParams.set("clubeModalidadeId", clubeModalidadeId);
    const params = searchParams.toString() ? `?${searchParams.toString()}` : "";
    return authFetch(`/clubes/${clubeId}/treinador/convocatorias/atletas${params}`);
}

export async function getEscaloesTreinador(clubeId) {
    return authFetch(`/clubes/${clubeId}/treinador/escaloes`);
}

export async function getConvocatoriasTreinador(clubeId) {
    return authFetch(`/clubes/${clubeId}/treinador/convocatorias`);
}

export async function getConvocadosConvocatoriaTreinador(clubeId, eventoId) {
    return authFetch(`/clubes/${clubeId}/treinador/convocatorias/${eventoId}/convocados`);
}

export async function createConvocatoriaTreinador(clubeId, payload) {
    return authFetch(`/clubes/${clubeId}/treinador/convocatorias`, {
        method: "POST",
        body: JSON.stringify(payload),
    });
}

export async function updateConvocatoriaTreinador(clubeId, eventoId, payload) {
    return authFetch(`/clubes/${clubeId}/treinador/convocatorias/${eventoId}`, {
        method: "PUT",
        body: JSON.stringify(payload),
    });
}

// =======================
// SESSÕES DE TREINO
// =======================

export async function getSessoesTreino(clubeId) {
    return authFetch(`/clubes/${clubeId}/treinador/sessoes`);
}

export async function createSessaoTreino(clubeId, payload) {
    return authFetch(`/clubes/${clubeId}/treinador/sessoes`, {
        method: "POST",
        body: JSON.stringify(payload),
    });
}

export async function updateSessaoTreino(clubeId, sessaoId, payload) {
    return authFetch(`/clubes/${clubeId}/treinador/sessoes/${sessaoId}`, {
        method: "PUT",
        body: JSON.stringify(payload),
    });
}

// =======================
// ASSIDUIDADE
// =======================

export async function getAssiduidade(clubeId, startDate, endDate) {
    const params = new URLSearchParams({ startDate, endDate });
    return authFetch(`/clubes/${clubeId}/treinador/assiduidade?${params.toString()}`);
}

export async function getAssiduidadeAtleta(clubeId, atletaId, startDate, endDate) {
    const params = new URLSearchParams({ startDate, endDate });
    return authFetch(`/clubes/${clubeId}/treinador/assiduidade/atleta/${atletaId}?${params.toString()}`);
}

// =======================
// PLANOS DE TREINO
// =======================

export async function enviarPlanoTreino(clubeId, payload) {
    return authFetch(`/clubes/${clubeId}/treinador/planos`, {
        method: "POST",
        body: JSON.stringify(payload),
    });
}