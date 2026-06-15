package com.gestaoclubes.api.service;

import com.gestaoclubes.api.dao.NotificacaoPlataformaDAO;
import com.gestaoclubes.api.dao.PerfilDAO;
import com.gestaoclubes.api.model.NotificacaoPlataforma;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.logging.Logger;

@Service
public class NotificacaoPlataformaService {

    private static final Logger LOGGER = Logger.getLogger(NotificacaoPlataformaService.class.getName());
    private final NotificacaoPlataformaDAO dao = new NotificacaoPlataformaDAO();

    /**
     * Called when a new PENDENTE registration is created.
     * Creates notifications for the appropriate responsible users.
     *
     * @param registoPendenteId the ID of the newly registered (pending) user
     * @param perfil the profile of the new user (e.g. ADMINISTRADOR, ATLETA, UTENTE, etc.)
     * @param clubeId the clube they registered for (or null)
     * @param coletividadeId the coletividade they registered for (or null)
     */
    public void criarNotificacoesPorNovoRegisto(int registoPendenteId, String perfil, Integer clubeId, Integer coletividadeId) {
        try {
            boolean isAdmin = PerfilDAO.ADMINISTRADOR.equals(perfil);

            List<Integer> destinatarios;
            String tipo;
            String mensagem;

            if (isAdmin) {
                destinatarios = dao.buscarSuperAdmins();
                if (clubeId != null) {
                    tipo = "NOVO_ADMIN_CLUBE";
                    mensagem = "Novo administrador de clube por aprovar.";
                } else {
                    tipo = "NOVO_ADMIN_COLETIVIDADE";
                    mensagem = "Novo administrador de coletividade por aprovar.";
                }
            } else if (clubeId != null) {
                destinatarios = dao.buscarAdminsESecretariosDoClube(clubeId);
                tipo = "NOVO_REGISTO_CLUBE";
                mensagem = "Tem um novo utilizador por aprovar.";
            } else if (coletividadeId != null) {
                destinatarios = dao.buscarAdminsESecretariosDaColetividade(coletividadeId);
                tipo = "NOVO_REGISTO_COLETIVIDADE";
                mensagem = "Tem um novo utilizador por aprovar.";
            } else {
                destinatarios = dao.buscarSuperAdmins();
                tipo = "NOVO_REGISTO";
                mensagem = "Tem um novo utilizador por aprovar.";
            }

            for (Integer destinatarioId : destinatarios) {
                NotificacaoPlataforma n = new NotificacaoPlataforma();
                n.setUtilizadorDestinoId(destinatarioId);
                n.setTipo(tipo);
                n.setMensagem(mensagem);
                n.setEntidadeTipo("UTILIZADOR");
                n.setEntidadeId(registoPendenteId);
                n.setRegistoPendenteId(registoPendenteId);
                n.setClubeId(clubeId);
                n.setColetividadeId(coletividadeId);
                dao.inserir(n);
            }
        } catch (Exception e) {
            LOGGER.warning("Erro ao criar notificações: " + e.getMessage());
        }
    }

    /**
     * Called when a pending registration is approved or rejected.
     * Resolves all associated notifications.
     */
    public void resolverPorRegistoPendente(int registoPendenteId) {
        try {
            dao.resolverPorRegistoPendente(registoPendenteId);
        } catch (Exception e) {
            LOGGER.warning("Erro ao resolver notificações: " + e.getMessage());
        }
    }
}
