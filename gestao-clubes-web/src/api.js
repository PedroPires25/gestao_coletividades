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

// AUTH
export async function apiLogin(email, password) {
    return http("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
    });
}

export async function apiRegister(payload) {
    return http("/auth/register", {
        method: "POST",
        body: JSON.stringify(payload),
    });
}

export async function getRegisterProfiles() {
    return http("/auth/profiles");
}

// ADMIN USERS
export async function getAdminUsers(estado) {
    const q = estado ? `?estado=${encodeURIComponent(estado)}` : "";
    return http(`/admin/users${q}`);
}

export async function getAdminProfiles() {
    return http("/admin/profiles");
}

export async function updateUserPerfil(userId, perfil) {
    return http(`/admin/users/${userId}/perfil`, {
        method: "PUT",
        body: JSON.stringify({ perfil }),
    });
}

export async function updateUserPrivilegios(userId, privilegiosAtivos) {
    return http(`/admin/users/${userId}/privilegios`, {
        method: "PUT",
        body: JSON.stringify({ privilegiosAtivos }),
    });
}

export async function updateUserEstadoRegisto(userId, estado) {
    return http(`/admin/users/${userId}/estado-registo`, {
        method: "PUT",
        body: JSON.stringify({ estado }),
    });
}

export async function updateUserAfetacao(userId, clubeId, modalidadeId, coletividadeId, atividadeId) {
    return http(`/admin/users/${userId}/afetacao`, {
        method: "PUT",
        body: JSON.stringify({
            clubeId,
            modalidadeId,
            coletividadeId,
            atividadeId,
        }),
    });
}

// CLUBES
export async function getClubes() {
    return http("/clubes");
}

export async function getClubeById(id) {
    if (id === undefined || id === null || id === "" || id === "undefined") {
        throw new Error("ID do clube inválido.");
    }
    return http(`/clubes/${id}`);
}

export async function createClube(payload) {
    return http("/clubes", {
        method: "POST",
        body: JSON.stringify(payload),
    });
}

export async function updateClube(id, payload) {
    return http(`/clubes/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
    });
}

export async function deleteClube(id) {
    return http(`/clubes/${id}`, {
        method: "DELETE",
    });
}

export async function getModalidadesDoClube(clubeId, { apenasAtivas = true, epoca = "" } = {}) {
    if (clubeId === undefined || clubeId === null || clubeId === "" || clubeId === "undefined") {
        return [];
    }

    const params = new URLSearchParams();
    params.set("ativas", apenasAtivas ? "true" : "false");
    if (epoca && String(epoca).trim() !== "") {
        params.set("epoca", String(epoca).trim());
    }
    const q = params.toString() ? `?${params.toString()}` : "";
    return http(`/clubes/${clubeId}/modalidades${q}`);
}

export async function anexarModalidadeAoClube(clubeId, { modalidadeId, epoca }) {
    return http(`/clubes/${clubeId}/modalidades`, {
        method: "POST",
        body: JSON.stringify({
            modalidadeId: Number(modalidadeId),
            epoca: String(epoca).trim(),
        }),
    });
}

export async function removerModalidadeDoClube(id) {
    return http(`/clubes/clube-modalidade/${id}`, {
        method: "DELETE",
    });
}

// COLETIVIDADES
export async function getColetividades() {
    return http("/coletividades");
}

export async function getColetividadeById(id) {
    if (id === undefined || id === null || id === "" || id === "undefined") {
        throw new Error("ID da coletividade inválido.");
    }
    return http(`/coletividades/${id}`);
}

export async function createColetividade(payload) {
    return http("/coletividades", {
        method: "POST",
        body: JSON.stringify(payload),
    });
}

export async function updateColetividade(id, payload) {
    return http(`/coletividades/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
    });
}

export async function deleteColetividade(id) {
    return http(`/coletividades/${id}`, {
        method: "DELETE",
    });
}

export async function getAtividadesDaColetividade(coletividadeId) {
    if (
        coletividadeId === undefined ||
        coletividadeId === null ||
        coletividadeId === "" ||
        coletividadeId === "undefined"
    ) {
        return [];
    }
    return http(`/coletividades/${coletividadeId}/atividades`);
}

// MODALIDADES / ATIVIDADES GERAIS
export async function getModalidades({ ativas = true } = {}) {
    const q = ativas ? "?ativas=true" : "?ativas=false";
    return http(`/modalidades${q}`);
}

export async function criarModalidade({ nome, descricao = "" }) {
    return http("/modalidades", {
        method: "POST",
        body: JSON.stringify({
            nome: String(nome).trim(),
            descricao: String(descricao || "").trim(),
        }),
    });
}

export async function editarModalidade(id, { nome, descricao = "" }) {
    return http(`/modalidades/${id}`, {
        method: "PUT",
        body: JSON.stringify({
            nome: String(nome).trim(),
            descricao: String(descricao || "").trim(),
        }),
    });
}

export async function getAtividades() {
    return http("/atividades");
}

// ---- UPLOAD DE LOGO / AVATAR ----

async function httpUpload(path, file) {
    const token = getStoredToken();
    const formData = new FormData();
    formData.append("file", file);

    const headers = {};
    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    const res = await fetch(`${API_BASE}${path}`, {
        method: "POST",
        headers,
        body: formData,
    });

    if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `Erro HTTP ${res.status}`);
    }

    const ct = res.headers.get("content-type") || "";
    if (ct.includes("application/json")) return res.json();
    return res.text();
}

export async function uploadClubeLogo(id, file) {
    return httpUpload(`/clubes/${id}/logo`, file);
}

export async function uploadColetividadeLogo(id, file) {
    return httpUpload(`/coletividades/${id}/logo`, file);
}

export async function uploadUtilizadorAvatar(id, file) {
    return httpUpload(`/utilizadores/${id}/avatar`, file);
}

export function getUploadUrl(relativePath) {
    if (!relativePath) return null;
    return `${API_BASE}/uploads/${relativePath}`;
}