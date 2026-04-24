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

// --- Gestão endpoints (admin / secretário / treinador / professor) ---

export async function listarTodosEventos() {
  return http("/gestao/eventos");
}

export async function criarEventoGestao(payload) {
  return http("/gestao/eventos", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function atualizarEventoGestao(id, payload) {
  return http(`/gestao/eventos/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function eliminarEventoGestao(id) {
  return http(`/gestao/eventos/${id}`, {
    method: "DELETE",
  });
}

export async function listarConvocadosGestao(eventoId) {
  return http(`/gestao/eventos/${eventoId}/convocados`);
}

// --- Public / user endpoints ---

export async function listarEventos(clubeId, clubeModalidadeId) {
  return http(`/eventos/clube/${clubeModalidadeId}`);
}

export async function listarAtletasEvento(eventoId) {
  return http(`/eventos/${eventoId}/convocados`);
}

export async function getEventosPorClube(clubeId) {
  return http(`/eventos/por-clube/${clubeId}`);
}

export async function listarMeusEventos(clubeId) {
  return http(`/eventos/por-clube/${clubeId}`);
}

// --- Club-scoped event management (treinador / professor / secretário) ---

export async function criarEvento(clubeId, clubeModalidadeId, payload) {
  const { atletaIds, ...rest } = payload || {};
  return http(`/gestao/eventos`, {
    method: "POST",
    body: JSON.stringify({
      ...rest,
      ...(Array.isArray(atletaIds) ? { convocados: atletaIds } : {}),
      tipo: "MODALIDADE",
      clubeModalidadeId,
    }),
  });
}

export async function atualizarEvento(clubeId, clubeModalidadeId, eventoId, payload) {
  const { atletaIds, ...rest } = payload || {};
  return http(`/gestao/eventos/${eventoId}`, {
    method: "PUT",
    body: JSON.stringify({
      ...rest,
      ...(Array.isArray(atletaIds) ? { convocados: atletaIds } : {}),
    }),
  });
}

export async function deletarEvento(clubeId, clubeModalidadeId, eventoId) {
  return http(`/gestao/eventos/${eventoId}`, {
    method: "DELETE",
  });
}

