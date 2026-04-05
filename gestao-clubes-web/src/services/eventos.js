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

/**
 * Listar eventos de uma club-modalidade
 */
export async function listarEventos(clubeId, clubeModalidadeId) {
  return http(`/clubes/${clubeId}/clube-modalidade/${clubeModalidadeId}/eventos`);
}

/**
 * Obter detalhes de um evento
 */
export async function obterEvento(clubeId, clubeModalidadeId, eventoId) {
  return http(`/clubes/${clubeId}/clube-modalidade/${clubeModalidadeId}/eventos/${eventoId}`);
}

/**
 * Criar novo evento
 */
export async function criarEvento(clubeId, clubeModalidadeId, dados) {
  return http(`/clubes/${clubeId}/clube-modalidade/${clubeModalidadeId}/eventos`, {
    method: "POST",
    body: JSON.stringify({
      titulo: dados.titulo,
      dataHora: dados.dataHora,
      local: dados.local || null,
      atletaIds: dados.atletaIds || []
    })
  });
}

/**
 * Atualizar evento
 */
export async function atualizarEvento(clubeId, clubeModalidadeId, eventoId, dados) {
  return http(`/clubes/${clubeId}/clube-modalidade/${clubeModalidadeId}/eventos/${eventoId}`, {
    method: "PUT",
    body: JSON.stringify({
      titulo: dados.titulo,
      dataHora: dados.dataHora,
      local: dados.local || null,
      atletaIds: dados.atletaIds || []
    })
  });
}

/**
 * Deletar evento
 */
export async function deletarEvento(clubeId, clubeModalidadeId, eventoId) {
  return http(`/clubes/${clubeId}/clube-modalidade/${clubeModalidadeId}/eventos/${eventoId}`, {
    method: "DELETE"
  });
}

/**
 * Listar atletas convocados para um evento
 */
export async function listarAtletasEvento(eventoId) {
  return http(`/eventos/${eventoId}/atletas`);
}

/**
 * Adicionar múltiplos atletas a um evento
 */
export async function adicionarAtletasEvento(eventoId, atletaIds) {
  return http(`/eventos/${eventoId}/atletas`, {
    method: "POST",
    body: JSON.stringify({ atletaIds })
  });
}

/**
 * Remover atleta de um evento
 */
export async function removerAtletaEvento(eventoId, atletaId) {
  return http(`/eventos/${eventoId}/atletas/${atletaId}`, {
    method: "DELETE"
  });
}

/**
 * Listar eventos onde o atleta autenticado está convocado
 */
export async function listarMeusEventos(clubeId) {
  return http(`/clubes/${clubeId}/atletas/meus-eventos`);
}

// ──────────────────────────────────────────────────────────────────────────────
// Gestão de Eventos (Admin / Secretário)
// ──────────────────────────────────────────────────────────────────────────────

export async function listarTodosEventos() {
  return http(`/gestao/eventos`);
}

export async function obterEventoGestao(eventoId) {
  return http(`/gestao/eventos/${eventoId}`);
}

export async function criarEventoGestao(dados) {
  return http(`/gestao/eventos`, {
    method: "POST",
    body: JSON.stringify(dados),
  });
}

export async function atualizarEventoGestao(eventoId, dados) {
  return http(`/gestao/eventos/${eventoId}`, {
    method: "PUT",
    body: JSON.stringify(dados),
  });
}

export async function eliminarEventoGestao(eventoId) {
  return http(`/gestao/eventos/${eventoId}`, { method: "DELETE" });
}

export async function listarConvocadosGestao(eventoId) {
  return http(`/gestao/eventos/${eventoId}/convocados`);
}

export async function atualizarConvocadosGestao(eventoId, convocados) {
  return http(`/gestao/eventos/${eventoId}/convocados`, {
    method: "PUT",
    body: JSON.stringify({ convocados }),
  });
}

