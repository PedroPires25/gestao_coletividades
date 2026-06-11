/**
 * Retorna o caminho para a página inicial do utilizador com base no seu perfil e afetação.
 * @param {object} user - O objeto do utilizador, geralmente vindo do `useAuth`.
 * @returns {string|null} O caminho para a página inicial ou null se pendente.
 */
export function getHomePathByRole(user) {
    if (!user) return "/login";
    
    const { role, clubeId, modalidadeId, coletividadeId, atividadeId, estadoRegisto } = user;

    // Se não está aprovado, será tratado em outro lugar
    if (estadoRegisto !== "APROVADO") {
        return null;
    }

    switch (role) {
        case "SUPER_ADMIN":
            return "/admin/users";

        case "ADMINISTRADOR":
        case "SECRETARIO":
            if (clubeId) {
                return `/clubes/${clubeId}`;
            }
            if (coletividadeId) {
                return `/coletividades/${coletividadeId}`;
            }
            return "/menu"; // fallback se não tiver id

        case "ATLETA":
            if (clubeId && modalidadeId) {
                return `/clubes/${clubeId}/clube-modalidade/${modalidadeId}/modalidade`;
            }
            return "/menu";

        case "TREINADOR_PRINCIPAL":
            if (clubeId) {
                return `/clubes/${clubeId}/treinador`;
            }
            return "/menu";

        case "DEPARTAMENTO_MEDICO":
            if (clubeId) {
                return `/clubes/${clubeId}/medico`;
            }
            return "/menu";

        case "STAFF":
            if (clubeId && modalidadeId) {
                return `/clubes/${clubeId}/clube-modalidade/${modalidadeId}/modalidade`;
            }
            if (clubeId) {
                return `/clubes/${clubeId}`;
            }
            if (coletividadeId) {
                return `/coletividades/${coletividadeId}`;
            }
            return "/menu";

        case "PROFESSOR":
            if (clubeId && modalidadeId) {
                return `/clubes/${clubeId}/clube-modalidade/${modalidadeId}/modalidade`;
            }
            if (clubeId) {
                return `/clubes/${clubeId}`;
            }
            if (coletividadeId) {
                return `/coletividades/${coletividadeId}/professor`;
            }
            return "/menu";

        case "TREINADOR_COLETIVIDADE":
            if (coletividadeId) {
                return `/coletividades/${coletividadeId}/treinador`;
            }
            return "/menu";

        case "UTENTE":
        case "INSCRITO_COLETIVIDADE":
            if (coletividadeId && atividadeId) {
                return `/coletividades/${coletividadeId}/utentes/atividades/${atividadeId}`;
            }
            return "/menu";

        case "USER": {
            if (clubeId) return `/minha-area/clube/${clubeId}`;
            if (coletividadeId) return `/minha-area/coletividade/${coletividadeId}`;
            return "/menu";
        }

        default:
            return "/menu";
    }
}
