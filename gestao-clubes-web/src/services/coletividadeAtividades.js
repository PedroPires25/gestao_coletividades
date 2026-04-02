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

export async function getAtividadesByColetividade(coletividadeId, { apenasAtivas = true, ano = "" } = {}) {
    if (
        coletividadeId === undefined ||
        coletividadeId === null ||
        coletividadeId === "" ||
        coletividadeId === "undefined"
    ) {
        return [];
    }

    const params = new URLSearchParams();
    params.set("ativas", apenasAtivas ? "true" : "false");
    if (ano && String(ano).trim() !== "") {
        params.set("ano", String(ano).trim());
    }

    return http(`/coletividades/${coletividadeId}/atividades?${params.toString()}`);
}

export async function getAtividadesCatalogo() {
    return http("/coletividades/atividades-catalogo");
}

export async function anexarAtividadeAColetividade(coletividadeId, { atividadeId, ano }) {
    return http(`/coletividades/${coletividadeId}/atividades`, {
        method: "POST",
        body: JSON.stringify({
            atividadeId: Number(atividadeId),
            ano: String(ano || "").trim(),
        }),
    });
}

export async function removerAtividadeDaColetividade(id) {
    return http(`/coletividades/atividade-associacao/${id}`, {
        method: "DELETE",
    });
}

export async function criarAtividade({ nome, descricao = "" }) {
    return http("/atividades", {
        method: "POST",
        body: JSON.stringify({
            nome: String(nome).trim(),
            descricao: String(descricao || "").trim(),
        }),
    });
}

export async function editarAtividade(id, { nome, descricao = "" }) {
    return http(`/atividades/${id}`, {
        method: "PUT",
        body: JSON.stringify({
            nome: String(nome).trim(),
            descricao: String(descricao || "").trim(),
        }),
    });
}