const API_BASE = `${(import.meta.env.VITE_API_URL || "http://localhost:8080").replace(/\/$/, "")}/api`;

function getStoredToken() {
  try {
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

}

}

    method: "POST",
  });
}

    method: "PUT",
  });
}

  });
}

}

}

export async function listarMeusEventos(clubeId) {
}
