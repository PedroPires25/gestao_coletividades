import futebolIcon from "./futebol.svg";
import basquetebolIcon from "./basquetebol.svg";
import andebolIcon from "./andebol.svg";
import futsalIcon from "./futsal.svg";
import voleibolIcon from "./voleibol.svg";
import atletismoIcon from "./atletismo.svg";
import natacaoIcon from "./natacao.svg";
import tenisIcon from "./tenis.svg";
import padelIcon from "./padel.svg";
import hoqueiIcon from "./hoquei.svg";
import ginasticaIcon from "./ginastica.svg";
import karateIcon from "./karate.svg";
import judoIcon from "./judo.svg";
import taekwondoIcon from "./taekwondo.svg";
import escaladaIcon from "./escalada.svg";
import patinagemIcon from "./patinagem.svg";
import tenisMesaIcon from "./tenis-de-mesa.svg";

// Static map for the main known sports (priority lookup)
const STATIC_BY_NAME = {
    futebol: futebolIcon,
    basquetebol: basquetebolIcon,
    andebol: andebolIcon,
    futsal: futsalIcon,
    voleibol: voleibolIcon,
    atletismo: atletismoIcon,
    natacao: natacaoIcon,
    tenis: tenisIcon,
    padel: padelIcon,
    hoquei: hoqueiIcon,
    ginastica: ginasticaIcon,
    karate: karateIcon,
    judo: judoIcon,
    taekwondo: taekwondoIcon,
    escalada: escaladaIcon,
    patinagem: patinagemIcon,
    "tenis de mesa": tenisMesaIcon,
};

// Secondary lookup: reuse SVGs from the atividades/ folder (ballet, dança, yoga, etc.)
const atividadeSvgModules = import.meta.glob("./atividades/*.svg", {
    eager: true,
    import: "default",
});

function normalizeKey(value) {
    return String(value || "")
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[\s_]+/g, "-")
        .replace(/[^a-z0-9-]/g, "")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");
}

const ATIVIDADES_BY_NAME = Object.entries(atividadeSvgModules).reduce(
    (acc, [path, url]) => {
        const fileName = path.split("/").pop()?.replace(/\.svg$/i, "") || "";
        const key = normalizeKey(fileName);
        if (key) acc[key] = url;
        return acc;
    },
    {}
);

export const MODALIDADE_FIGURAS = {
    Futebol: futebolIcon,
    Basquetebol: basquetebolIcon,
    Andebol: andebolIcon,
    Futsal: futsalIcon,
    Voleibol: voleibolIcon,
    Atletismo: atletismoIcon,
    "Natação": natacaoIcon,
    Natacao: natacaoIcon,
    "Ténis": tenisIcon,
    Tenis: tenisIcon,
    Padel: padelIcon,
    "Hóquei": hoqueiIcon,
    Hoquei: hoqueiIcon,
    "Ginástica": ginasticaIcon,
    Ginastica: ginasticaIcon,
    "Karaté": karateIcon,
    Karate: karateIcon,
    Judo: judoIcon,
    Taekwondo: taekwondoIcon,
    Escalada: escaladaIcon,
    Patinagem: patinagemIcon,
    "Ténis de Mesa": tenisMesaIcon,
    "Tenis de Mesa": tenisMesaIcon,
};

export function normalizeModalidadeName(nome) {
    return String(nome || "")
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}

function escapeSvg(text) {
    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
}

function getModalidadeGlyph(n) {
    // Ball sports
    if (/(futebol|futsal|football|soccer)/.test(n)) return "ball";
    if (/(basquetebol|basket)/.test(n)) return "ball";
    if (/(voleibol|volei)/.test(n)) return "ball";
    if (/(andebol|handbal)/.test(n)) return "ball";
    if (/(rugby|americano)/.test(n)) return "ball";
    // Racket sports
    if (/(tenis|padel|badminton|squash|raquete)/.test(n)) return "racket";
    // Water sports
    if (/(natacao|nado|aquatica|hidroginastica|polo aquatico)/.test(n)) return "swim";
    if (/(canoagem|kayak|piragua|remo|vela|surf|mergulho|triatlo)/.test(n)) return "water";
    // Running / athletics
    if (/(atletismo|corrida|maratona|sprint|salto|lancamento)/.test(n)) return "run";
    // Gymnastics / flexibility
    if (/(ginastica|acrobacia)/.test(n)) return "gymnastics";
    // Dance / performing arts
    if (/(danca|ballet|zumba|ritmo|baile|coreografia|dançaterapia)/.test(n)) return "dance";
    // Music / choir
    if (/(musica|canto|coro|coral|guitarra|piano|instrumento|solfejo)/.test(n)) return "music";
    // Theater / drama
    if (/(teatro|drama|palco|expressao|encenacao)/.test(n)) return "theater";
    // Wellness / mind-body
    if (/(yoga|pilates|meditacao|relaxamento|taichi|qigong|mindfulness)/.test(n)) return "wellness";
    // Martial arts
    if (/(karate|judo|taekwondo|luta|marciais|boxe|kickboxing|wrestling|aikido|hapkido)/.test(n)) return "martial";
    // Climbing
    if (/(escalada|montanha|bouldering|alpinismo)/.test(n)) return "climb";
    // Skating / hockey
    if (/(patinagem|skate|hoquei)/.test(n)) return "skate";
    // Cycling
    if (/(ciclismo|bicicleta|bmx|triatlo)/.test(n)) return "cycle";
    // Golf / precision
    if (/(golf|golfe|tiro|arco|bilhar|bowling|boccia)/.test(n)) return "golf";
    // Equestrian
    if (/(hipismo|equitacao|cavalo)/.test(n)) return "horse";
    // Trekking / walking
    if (/(caminhada|trilho|trekking|senderismo|montanhismo)/.test(n)) return "walk";
    return "sport";
}

function renderModalidadeGlyph(type) {
    switch (type) {
        case "ball":
            return `
                <circle cx="32" cy="14" r="5" stroke="white" stroke-width="3" fill="none"/>
                <path stroke="white" stroke-width="3" stroke-linecap="round" fill="none" d="M30 19L26 30"/>
                <path stroke="white" stroke-width="3" stroke-linecap="round" fill="none" d="M32 22L44 28"/>
                <path stroke="white" stroke-width="3" stroke-linecap="round" fill="none" d="M26 30L16 44"/>
                <path stroke="white" stroke-width="3" stroke-linecap="round" fill="none" d="M26 30L38 42"/>
                <circle cx="50" cy="36" r="7" stroke="white" stroke-width="3" fill="none"/>
                <path stroke="white" stroke-width="2" stroke-linecap="round" fill="none" d="M46 33L54 39"/>
            `;
        case "racket":
            return `
                <ellipse cx="22" cy="22" rx="13" ry="16" stroke="white" stroke-width="3" fill="none"/>
                <path stroke="white" stroke-width="2" stroke-linecap="round" fill="none" d="M14 18L30 26"/>
                <path stroke="white" stroke-width="2" stroke-linecap="round" fill="none" d="M14 24L30 18"/>
                <path stroke="white" stroke-width="3" stroke-linecap="round" fill="none" d="M22 38L44 56"/>
                <circle cx="46" cy="48" r="4" stroke="white" stroke-width="2.5" fill="none"/>
            `;
        case "swim":
            return `
                <circle cx="34" cy="14" r="5" stroke="white" stroke-width="3" fill="none"/>
                <path stroke="white" stroke-width="3" stroke-linecap="round" fill="none"
                      d="M18 24C24 22 29 23 34 28C39 33 43 35 48 35"/>
                <path stroke="white" stroke-width="2.5" stroke-linecap="round" fill="none"
                      d="M14 40C18 37 22 37 26 40C30 43 34 43 38 40C42 37 46 37 50 40"/>
                <path stroke="white" stroke-width="2.5" stroke-linecap="round" fill="none"
                      d="M14 50C18 47 22 47 26 50C30 53 34 53 38 50C42 47 46 47 50 50"/>
            `;
        case "water":
            return `
                <circle cx="32" cy="10" r="5" stroke="white" stroke-width="3" fill="none"/>
                <path stroke="white" stroke-width="3" stroke-linecap="round" fill="none" d="M32 15L32 30"/>
                <path stroke="white" stroke-width="3" stroke-linecap="round" fill="none" d="M32 24L18 20"/>
                <path stroke="white" stroke-width="3" stroke-linecap="round" fill="none" d="M32 24L46 20"/>
                <path stroke="white" stroke-width="3" stroke-linecap="round" fill="none" d="M14 36L50 36"/>
                <path stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none"
                      d="M20 36L14 44L50 44L44 36"/>
                <path stroke="white" stroke-width="2.5" stroke-linecap="round" fill="none"
                      d="M8 52C16 48 24 52 32 52C40 52 48 48 56 52"/>
            `;
        case "run":
            return `
                <circle cx="24" cy="12" r="5" stroke="white" stroke-width="3" fill="none"/>
                <path stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none"
                      d="M21 24L27 17L36 20"/>
                <path stroke="white" stroke-width="3" stroke-linecap="round" fill="none" d="M23 24L17 36"/>
                <path stroke="white" stroke-width="3" stroke-linecap="round" fill="none" d="M28 24L38 32"/>
                <path stroke="white" stroke-width="3" stroke-linecap="round" fill="none" d="M18 36L10 44"/>
                <path stroke="white" stroke-width="3" stroke-linecap="round" fill="none" d="M38 32L34 46"/>
            `;
        case "gymnastics":
            return `
                <circle cx="32" cy="10" r="5" stroke="white" stroke-width="3" fill="none"/>
                <path stroke="white" stroke-width="3" stroke-linecap="round" fill="none" d="M32 15L32 30"/>
                <path stroke="white" stroke-width="3" stroke-linecap="round" fill="none" d="M32 20L18 14"/>
                <path stroke="white" stroke-width="3" stroke-linecap="round" fill="none" d="M32 20L46 14"/>
                <path stroke="white" stroke-width="3" stroke-linecap="round" fill="none" d="M32 30L22 44"/>
                <path stroke="white" stroke-width="3" stroke-linecap="round" fill="none" d="M32 30L48 32"/>
            `;
        case "dance":
            return `
                <circle cx="36" cy="10" r="5" stroke="white" stroke-width="3" fill="none"/>
                <path stroke="white" stroke-width="3" stroke-linecap="round" fill="none" d="M36 15L30 30"/>
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
        case "martial":
            return `
                <circle cx="30" cy="12" r="5" stroke="white" stroke-width="3" fill="none"/>
                <path stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none"
                      d="M30 17L26 28L18 33"/>
                <path stroke="white" stroke-width="3" stroke-linecap="round" fill="none" d="M30 17L40 22L48 20"/>
                <path stroke="white" stroke-width="3" stroke-linecap="round" fill="none" d="M26 28L22 44"/>
                <path stroke="white" stroke-width="3" stroke-linecap="round" fill="none" d="M30 28L42 40"/>
            `;
        case "climb":
            return `
                <path stroke="white" stroke-width="3" stroke-linecap="round" fill="none"
                      d="M18 56L28 36L22 24L34 10L46 22L40 38L52 52"/>
                <circle cx="34" cy="18" r="5" stroke="white" stroke-width="3" fill="none"/>
                <path stroke="white" stroke-width="2.5" stroke-linecap="round" fill="none" d="M28 36L38 34"/>
                <path stroke="white" stroke-width="2.5" stroke-linecap="round" fill="none" d="M22 44L32 42"/>
            `;
        case "skate":
            return `
                <circle cx="32" cy="10" r="5" stroke="white" stroke-width="3" fill="none"/>
                <path stroke="white" stroke-width="3" stroke-linecap="round" fill="none" d="M32 15L32 30"/>
                <path stroke="white" stroke-width="3" stroke-linecap="round" fill="none" d="M32 24L46 18"/>
                <path stroke="white" stroke-width="3" stroke-linecap="round" fill="none" d="M32 30L20 44"/>
                <path stroke="white" stroke-width="3" stroke-linecap="round" fill="none" d="M32 30L44 38"/>
                <path stroke="white" stroke-width="3" stroke-linecap="round" fill="none"
                      d="M16 50C24 46 40 46 48 50"/>
            `;
        case "cycle":
            return `
                <circle cx="16" cy="44" r="12" stroke="white" stroke-width="3" fill="none"/>
                <circle cx="48" cy="44" r="12" stroke="white" stroke-width="3" fill="none"/>
                <path stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none"
                      d="M32 44L38 28L48 44"/>
                <path stroke="white" stroke-width="3" stroke-linecap="round" fill="none" d="M26 28L38 28"/>
                <circle cx="32" cy="16" r="4" stroke="white" stroke-width="2.5" fill="none"/>
            `;
        case "golf":
            return `
                <circle cx="48" cy="14" r="5" stroke="white" stroke-width="3" fill="none"/>
                <path stroke="white" stroke-width="3" stroke-linecap="round" fill="none" d="M16 54L36 14"/>
                <path stroke="white" stroke-width="3" stroke-linecap="round" fill="none" d="M16 54L28 50"/>
                <path stroke="white" stroke-width="2.5" stroke-linecap="round" fill="none" d="M28 22L42 18"/>
            `;
        case "horse":
            return `
                <circle cx="44" cy="12" r="5" stroke="white" stroke-width="3" fill="none"/>
                <path stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none"
                      d="M20 50C20 40 24 34 32 32C40 30 48 32 52 28C56 24 54 16 48 16"/>
                <path stroke="white" stroke-width="3" stroke-linecap="round" fill="none" d="M20 50L16 58"/>
                <path stroke="white" stroke-width="3" stroke-linecap="round" fill="none" d="M28 48L26 58"/>
                <path stroke="white" stroke-width="3" stroke-linecap="round" fill="none" d="M36 46L38 56"/>
                <path stroke="white" stroke-width="3" stroke-linecap="round" fill="none" d="M44 44L48 54"/>
                <path stroke="white" stroke-width="2.5" stroke-linecap="round" fill="none"
                      d="M36 14L34 22L40 28"/>
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
            `;
        default:
            return `
                <circle cx="32" cy="10" r="5" stroke="white" stroke-width="3" fill="none"/>
                <path stroke="white" stroke-width="3" stroke-linecap="round" fill="none" d="M32 15L32 34"/>
                <path stroke="white" stroke-width="3" stroke-linecap="round" fill="none" d="M32 24L16 18"/>
                <path stroke="white" stroke-width="3" stroke-linecap="round" fill="none" d="M32 24L48 18"/>
                <path stroke="white" stroke-width="3" stroke-linecap="round" fill="none" d="M32 34L22 52"/>
                <path stroke="white" stroke-width="3" stroke-linecap="round" fill="none" d="M32 34L42 52"/>
            `;
    }
}

function generateModalidadeIcon(nome) {
    const label = escapeSvg(nome || "Modalidade");
    const glyph = renderModalidadeGlyph(getModalidadeGlyph(normalizeModalidadeName(nome)));
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none" role="img" aria-label="${label}">${glyph}</svg>`;
    return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export function getModalidadeIcon(nome) {
    const n = normalizeModalidadeName(nome);

    // 1. Explicit sports SVGs (highest priority)
    if (STATIC_BY_NAME[n]) return STATIC_BY_NAME[n];

    // 2. Reuse SVGs from atividades/ folder (ballet, dança, yoga, música, etc.)
    const atividadeKey = normalizeKey(nome);
    if (ATIVIDADES_BY_NAME[atividadeKey]) return ATIVIDADES_BY_NAME[atividadeKey];

    // 3. Keyword-based dynamic generation
    return generateModalidadeIcon(nome);
}
