import { API_BASE } from "../config/apiBase";

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

export async function getEventosColetividade(coletividadeId, params = {}) {
    const search = new URLSearchParams();
    if (params.estado) search.set("estado", params.estado);
    if (params.coletividadeAtividadeId) search.set("coletividadeAtividadeId", params.coletividadeAtividadeId);
    const suffix = search.toString() ? `?${search.toString()}` : "";
    return http(`/coletividades/${coletividadeId}/eventos${suffix}`);
}

export async function getTodosEventosColetividade(params = {}) {
    const search = new URLSearchParams();
    if (params.estado) search.set("estado", params.estado);
    const suffix = search.toString() ? `?${search.toString()}` : "";
    return http(`/coletividades/eventos${suffix}`);
}

export async function criarEventoColetividade(coletividadeId, body) {
    return http(`/coletividades/${coletividadeId}/eventos`, {
        method: "POST",
        body: JSON.stringify(body),
    });
}

export async function atualizarEventoColetividade(coletividadeId, eventoId, body) {
    return http(`/coletividades/${coletividadeId}/eventos/${eventoId}`, {
        method: "PUT",
        body: JSON.stringify(body),
    });
}

export async function eliminarEventoColetividade(coletividadeId, eventoId) {
    return http(`/coletividades/${coletividadeId}/eventos/${eventoId}`, {
        method: "DELETE",
    });
}

export async function getInscricoesEvento(coletividadeId, eventoId) {
    return http(`/coletividades/${coletividadeId}/eventos/${eventoId}/inscricoes`);
}

export async function inscreverEmEvento(coletividadeId, eventoId, body) {
    return http(`/coletividades/${coletividadeId}/eventos/${eventoId}/inscricoes`, {
        method: "POST",
        body: JSON.stringify(body),
    });
}

export async function cancelarInscricaoEvento(coletividadeId, eventoId, inscricaoId) {
    return http(`/coletividades/${coletividadeId}/eventos/${eventoId}/inscricoes/${inscricaoId}`, {
        method: "DELETE",
    });
}
