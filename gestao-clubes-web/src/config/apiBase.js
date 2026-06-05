const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();

if (!configuredApiUrl) {
    throw new Error("VITE_API_URL não está configurada para este ambiente.");
}

export const API_ORIGIN = configuredApiUrl.replace(/\/$/, "");
export const API_BASE = `${API_ORIGIN}/api`;
