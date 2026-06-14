const atividadeSvgModules = import.meta.glob("./atividades/*.svg", {
    eager: true,
    import: "default",
});

function normalizeAtividadeName(nome) {
    return String(nome || "")
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}

function normalizeAtividadeAssetKey(value) {
    return normalizeAtividadeName(value)
        .replace(/[\s_]+/g, "-")
        .replace(/[^a-z0-9-]/g, "")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");
}

const STATIC_ATIVIDADE_ICONS = Object.entries(atividadeSvgModules).reduce(
    (acc, [path, url]) => {
        const fileName = path.split("/").pop()?.replace(/\.svg$/i, "") || "";
        const key = normalizeAtividadeAssetKey(fileName);
        if (key) acc[key] = url;
        return acc;
    },
    {}
);

function escapeSvgText(text) {
    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
}

function getActivityGlyph(normalizedName) {
    if (/(danca|ballet|zumba|ritmo|coreografia|baile)/.test(normalizedName)) return "dance";
    if (/(musica|canto|coro|coral|guitarra|piano|instrumento|solfejo|harmonia)/.test(normalizedName)) return "music";
    if (/(teatro|drama|palco|expressao|interpretacao|encenacao)/.test(normalizedName)) return "theater";
    if (/(pintura|arte|desenho|ceramica|manualidade|artesanato|bordado|costura|tapecaria)/.test(normalizedName)) return "art";
    if (/(yoga|pilates|meditacao|relaxamento|mindfulness|taichi|qigong)/.test(normalizedName)) return "wellness";
    if (/(caminhada|passeio|natureza|trilho|trekking|senderismo|montanha|bicicleta|ciclismo)/.test(normalizedName)) return "walk";
    if (/(leitura|livro|biblioteca|escrita|literatura|poesia)/.test(normalizedName)) return "book";
    if (/(informatica|computador|digital|tecnologia|programacao|internet|robotica)/.test(normalizedName)) return "digital";
    if (/(natacao|nado|aquatica|hidroginastica)/.test(normalizedName)) return "wellness";
    if (/(futebol|futsal|bola|football)/.test(normalizedName)) return "walk";
    if (/(fotografia|foto|camera|imagem|video)/.test(normalizedName)) return "art";
    if (/(culinaria|cozinha|gastronomia|pastelaria|padaria|confeitaria)/.test(normalizedName)) return "art";
    if (/(jardinagem|horta|botanica|flores|plantas)/.test(normalizedName)) return "walk";
    if (/(xadrez|damas|tabuleiro|puzzle)/.test(normalizedName)) return "book";
    if (/(karate|judo|taekwondo|luta|marciais|kickboxing|boxe)/.test(normalizedName)) return "walk";
    if (/(ginastica|acrobatica|atletismo|corrida|salto)/.test(normalizedName)) return "wellness";
    if (/(tambor|percussao|bateria|ritmos|pandeireta|bombo)/.test(normalizedName)) return "music";
    return "generic";
}

function getStaticAtividadeIcon(nome) {
    const key = normalizeAtividadeAssetKey(nome);
    if (!key) return null;
    return STATIC_ATIVIDADE_ICONS[key] || null;
}

// All glyphs use 64x64 viewBox, stroke="white", fill="none" — consistent with static SVGs.
function renderGlyph(type) {
    switch (type) {
        case "dance":
            return `
                <circle cx="36" cy="10" r="5" stroke="white" stroke-width="3" fill="none"/>
                <path stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none" d="M36 15L30 30"/>
                <path stroke="white" stroke-width="3" stroke-linecap="round" fill="none" d="M33 21L18 14"/>
                <path stroke="white" stroke-width="3" stroke-linecap="round" fill="none" d="M33 21L48 20"/>
                <path stroke="white" stroke-width="3" stroke-linecap="round" fill="none" d="M30 30L18 46"/>
                <path stroke="white" stroke-width="3" stroke-linecap="round" fill="none" d="M30 30L46 44"/>
                <path stroke="white" stroke-width="2.5" stroke-linecap="round" fill="none" d="M18 46L12 52"/>
                <path stroke="white" stroke-width="2.5" stroke-linecap="round" fill="none" d="M46 44L54 48"/>
            `;
        case "music":
            return `
                <path stroke="white" stroke-width="2" stroke-linecap="round" fill="none" d="M10 28L54 28"/>
                <path stroke="white" stroke-width="2" stroke-linecap="round" fill="none" d="M10 35L54 35"/>
                <path stroke="white" stroke-width="2" stroke-linecap="round" fill="none" d="M10 42L54 42"/>
                <path stroke="white" stroke-width="2" stroke-linecap="round" fill="none" d="M10 49L54 49"/>
                <ellipse cx="22" cy="46" rx="4" ry="3" stroke="white" stroke-width="2.5" fill="none"/>
                <path stroke="white" stroke-width="2.5" stroke-linecap="round" fill="none" d="M26 46L26 28"/>
                <ellipse cx="42" cy="39" rx="4" ry="3" stroke="white" stroke-width="2.5" fill="none"/>
                <path stroke="white" stroke-width="2.5" stroke-linecap="round" fill="none" d="M46 39L46 21"/>
                <path stroke="white" stroke-width="2.5" stroke-linecap="round" fill="none" d="M26 28L46 21"/>
            `;
        case "theater":
            return `
                <path stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"
                      d="M8 24C8 14 22 10 26 16C28 20 26 28 20 30C14 32 8 29 8 24Z"/>
                <path stroke="white" stroke-width="2" stroke-linecap="round" fill="none" d="M13 24Q18 30 23 24"/>
                <path stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"
                      d="M36 20C36 10 52 8 56 14C58 18 56 26 50 28C44 30 36 26 36 20Z"/>
                <path stroke="white" stroke-width="2" stroke-linecap="round" fill="none" d="M41 24Q46 18 51 24"/>
                <path stroke="white" stroke-width="2.5" stroke-linecap="round" fill="none" d="M18 30L18 50"/>
                <path stroke="white" stroke-width="2.5" stroke-linecap="round" fill="none" d="M46 28L46 50"/>
                <path stroke="white" stroke-width="2.5" stroke-linecap="round" fill="none" d="M12 50L52 50"/>
            `;
        case "art":
            return `
                <rect x="8" y="8" width="34" height="28" rx="2" stroke="white" stroke-width="2.5" fill="none"/>
                <path stroke="white" stroke-width="3" stroke-linecap="round" fill="none" d="M36 30L54 12"/>
                <path stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"
                      d="M36 30L30 38L38 36Z"/>
                <circle cx="16" cy="48" r="4" stroke="white" stroke-width="2.5" fill="none"/>
                <circle cx="28" cy="50" r="4" stroke="white" stroke-width="2.5" fill="none"/>
                <circle cx="40" cy="48" r="4" stroke="white" stroke-width="2.5" fill="none"/>
            `;
        case "wellness":
            return `
                <circle cx="32" cy="10" r="5" stroke="white" stroke-width="3" fill="none"/>
                <path stroke="white" stroke-width="3" stroke-linecap="round" fill="none" d="M32 15L32 34"/>
                <path stroke="white" stroke-width="3" stroke-linecap="round" fill="none" d="M32 22L18 14"/>
                <path stroke="white" stroke-width="3" stroke-linecap="round" fill="none" d="M32 22L46 14"/>
                <path stroke="white" stroke-width="3" stroke-linecap="round" fill="none" d="M32 34L32 54"/>
                <path stroke="white" stroke-width="3" stroke-linecap="round" fill="none" d="M32 42L20 48"/>
                <path stroke="white" stroke-width="3" stroke-linecap="round" fill="none" d="M20 48L28 42"/>
            `;
        case "walk":
            return `
                <circle cx="36" cy="11" r="5" stroke="white" stroke-width="3" fill="none"/>
                <path stroke="white" stroke-width="3" stroke-linecap="round" fill="none" d="M34 16L32 30"/>
                <path stroke="white" stroke-width="3" stroke-linecap="round" fill="none" d="M33 22L44 28"/>
                <path stroke="white" stroke-width="3" stroke-linecap="round" fill="none" d="M33 22L22 26"/>
                <path stroke="white" stroke-width="3" stroke-linecap="round" fill="none" d="M32 30L38 46"/>
                <path stroke="white" stroke-width="3" stroke-linecap="round" fill="none" d="M32 30L24 44"/>
                <path stroke="white" stroke-width="2.5" stroke-linecap="round" fill="none" d="M38 46L46 48"/>
                <path stroke="white" stroke-width="2.5" stroke-linecap="round" fill="none" d="M24 44L16 46"/>
                <path stroke="white" stroke-width="2.5" stroke-linecap="round" fill="none" d="M46 14L56 56"/>
            `;
        case "book":
            return `
                <path stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none"
                      d="M32 14L10 18L10 52L32 48Z"/>
                <path stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none"
                      d="M32 14L54 18L54 52L32 48Z"/>
                <path stroke="white" stroke-width="2.5" stroke-linecap="round" fill="none" d="M32 14L32 48"/>
                <path stroke="white" stroke-width="2" stroke-linecap="round" fill="none" d="M16 28L26 26"/>
                <path stroke="white" stroke-width="2" stroke-linecap="round" fill="none" d="M16 34L26 32"/>
                <path stroke="white" stroke-width="2" stroke-linecap="round" fill="none" d="M16 40L26 38"/>
                <path stroke="white" stroke-width="2" stroke-linecap="round" fill="none" d="M38 26L48 28"/>
                <path stroke="white" stroke-width="2" stroke-linecap="round" fill="none" d="M38 32L48 34"/>
                <path stroke="white" stroke-width="2" stroke-linecap="round" fill="none" d="M38 38L48 40"/>
            `;
        case "digital":
            return `
                <rect x="10" y="10" width="44" height="30" rx="3" stroke="white" stroke-width="3" fill="none"/>
                <path stroke="white" stroke-width="2" stroke-linecap="round" fill="none" d="M18 20L32 20"/>
                <path stroke="white" stroke-width="2" stroke-linecap="round" fill="none" d="M18 26L38 26"/>
                <path stroke="white" stroke-width="2" stroke-linecap="round" fill="none" d="M18 32L28 32"/>
                <path stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"
                      d="M10 40L6 52L58 52L54 40"/>
                <path stroke="white" stroke-width="2" stroke-linecap="round" fill="none" d="M22 52L42 52"/>
            `;
        default:
            return `
                <circle cx="32" cy="14" r="7" stroke="white" stroke-width="3" fill="none"/>
                <path stroke="white" stroke-width="3" stroke-linecap="round" fill="none" d="M32 21L32 40"/>
                <path stroke="white" stroke-width="3" stroke-linecap="round" fill="none" d="M32 28L16 22"/>
                <path stroke="white" stroke-width="3" stroke-linecap="round" fill="none" d="M32 28L48 22"/>
                <path stroke="white" stroke-width="3" stroke-linecap="round" fill="none" d="M32 40L22 56"/>
                <path stroke="white" stroke-width="3" stroke-linecap="round" fill="none" d="M32 40L42 56"/>
            `;
    }
}

export function getAtividadeIcon(nome) {
    const staticIcon = getStaticAtividadeIcon(nome);
    if (staticIcon) return staticIcon;

    const normalizedName = normalizeAtividadeName(nome);
    const glyph = getActivityGlyph(normalizedName);
    const label = escapeSvgText(nome || "Atividade");

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none" role="img" aria-label="${label}">${renderGlyph(glyph)}</svg>`;

    return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}
