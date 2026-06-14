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

export async function getUtentesByColetividadeAtividade(coletividadeId, coletividadeAtividadeId) {
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

    return http(`/coletividades/${coletividadeId}/atividades/${coletividadeAtividadeId}/utentes`);
}

export async function getTodosInscritos(coletividadeId) {
    return http(`/coletividades/${coletividadeId}/inscritos`);
}

export async function createUtente(coletividadeId, payload) {
    return http(`/coletividades/${coletividadeId}/utentes`, {
        method: "POST",
        body: JSON.stringify(payload),
    });
}

export async function updateUtente(coletividadeId, utenteId, payload) {
    return http(`/coletividades/${coletividadeId}/utentes/${utenteId}`, {
        method: "PUT",
        body: JSON.stringify(payload),
    });
}

export async function adicionarAtividadeInscrito(coletividadeId, utenteId, payload) {
    return http(`/coletividades/${coletividadeId}/utentes/${utenteId}/atividades`, {
        method: "POST",
        body: JSON.stringify(payload),
    });
}

export async function removerAtividadeInscrito(coletividadeId, utenteId, inscricaoId) {
    return http(`/coletividades/${coletividadeId}/utentes/${utenteId}/inscricao/${inscricaoId}`, {
        method: "DELETE",
    });
}

export async function getEstadosInscrito() {
    return [
        { id: 1, descricao: "Ativo" },
        { id: 2, descricao: "Matrícula anulada" },
        { id: 3, descricao: "Matrícula suspensa" },
        { id: 4, descricao: "Excluído" },
    ];
}
