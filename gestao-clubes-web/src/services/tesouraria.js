import { API_BASE as API_URL } from "../config/apiBase";

const LS_KEY = "gc_user";

function getStoredToken() {
    try {
        const raw = localStorage.getItem(LS_KEY);
        if (!raw) return null;
        return JSON.parse(raw)?.token ?? null;
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
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const res = await fetch(`${API_URL}${path}`, { ...options, headers });
    if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `Erro ${res.status}`);
    }
    if (res.status === 204) return null;
    return res.json().catch(() => null);
}

// ==========================================
// MENSALIDADES POR ESCALÃO
// ==========================================

export function getTaxasMensalidade(clubeId, epoca = "2024/2025") {
    return authFetch(`/clubes/${clubeId}/tesouraria/mensalidades/config?epoca=${encodeURIComponent(epoca)}`);
}

export function upsertTaxaMensalidade(clubeId, body) {
    return authFetch(`/clubes/${clubeId}/tesouraria/mensalidades/config`, {
        method: "PUT",
        body: JSON.stringify(body),
    });
}

// ==========================================
// TAXAS DE INSCRIÇÃO
// ==========================================

export function getTaxasInscricao(clubeId, epoca = "2024/2025") {
    return authFetch(`/clubes/${clubeId}/tesouraria/inscricoes/config?epoca=${encodeURIComponent(epoca)}`);
}

export function upsertTaxaInscricao(clubeId, body) {
    return authFetch(`/clubes/${clubeId}/tesouraria/inscricoes/config`, {
        method: "PUT",
        body: JSON.stringify(body),
    });
}

// ==========================================
// PAGAMENTOS
// ==========================================

export function getPagamentos(clubeId, params = {}) {
    const qs = new URLSearchParams();
    if (params.atletaId) qs.set("atletaId", params.atletaId);
    if (params.escalaoId) qs.set("escalaoId", params.escalaoId);
    if (params.mes) qs.set("mes", params.mes);
    if (params.ano) qs.set("ano", params.ano);
    if (params.estado) qs.set("estado", params.estado);
    return authFetch(`/clubes/${clubeId}/tesouraria/pagamentos?${qs}`);
}

export function criarPagamento(clubeId, body) {
    return authFetch(`/clubes/${clubeId}/tesouraria/pagamentos`, {
        method: "POST",
        body: JSON.stringify(body),
    });
}

export function atualizarPagamento(clubeId, id, body) {
    return authFetch(`/clubes/${clubeId}/tesouraria/pagamentos/${id}`, {
        method: "PUT",
        body: JSON.stringify(body),
    });
}

// ==========================================
// DÍVIDAS
// ==========================================

export function getDividas(clubeId, params = {}) {
    const qs = new URLSearchParams();
    if (params.escalaoId) qs.set("escalaoId", params.escalaoId);
    if (params.mes) qs.set("mes", params.mes);
    if (params.ano) qs.set("ano", params.ano);
    if (params.atletaId) qs.set("atletaId", params.atletaId);
    return authFetch(`/clubes/${clubeId}/tesouraria/dividas?${qs}`);
}

// ==========================================
// RECEBIMENTOS
// ==========================================

export function getRecebimentos(clubeId, params = {}) {
    const qs = new URLSearchParams();
    if (params.mes) qs.set("mes", params.mes);
    if (params.ano) qs.set("ano", params.ano);
    return authFetch(`/clubes/${clubeId}/tesouraria/recebimentos?${qs}`);
}

// ==========================================
// INSCRIÇÕES
// ==========================================

export function getInscricoes(clubeId, params = {}) {
    const qs = new URLSearchParams();
    if (params.epoca) qs.set("epoca", params.epoca);
    if (params.estado) qs.set("estado", params.estado);
    if (params.atletaId) qs.set("atletaId", params.atletaId);
    return authFetch(`/clubes/${clubeId}/tesouraria/inscricoes?${qs}`);
}

export function criarInscricao(clubeId, body) {
    return authFetch(`/clubes/${clubeId}/tesouraria/inscricoes`, {
        method: "POST",
        body: JSON.stringify(body),
    });
}

export function atualizarInscricao(clubeId, id, body) {
    return authFetch(`/clubes/${clubeId}/tesouraria/inscricoes/${id}`, {
        method: "PUT",
        body: JSON.stringify(body),
    });
}

// ==========================================
// AVISOS
// ==========================================

export function enviarAvisos(clubeId, body) {
    return authFetch(`/clubes/${clubeId}/tesouraria/avisos`, {
        method: "POST",
        body: JSON.stringify(body),
    });
}
