package com.gestaoclubes.api.service;

import com.gestaoclubes.api.dao.AtletaDAO;
import com.gestaoclubes.api.dao.StaffDAO;
import com.gestaoclubes.api.model.Atleta;
import com.gestaoclubes.api.model.Staff;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.logging.Logger;

/**
 * Centralizes medical email notification logic for all clinical module operations.
 * Sends notifications to:
 *   - The athlete referenced in the record
 *   - Active trainers of the club
 *   - Staff (when the medical record subject is a staff member)
 */
@Service
public class NotificacaoMedicaService {

    private static final Logger LOGGER = Logger.getLogger(NotificacaoMedicaService.class.getName());

    @Autowired
    private EmailService emailService;

    @Value("${notificacoes.email.ativo:true}")
    private boolean emailAtivo;

    private final AtletaDAO atletaDAO = new AtletaDAO();
    private final StaffDAO staffDAO = new StaffDAO();

    /**
     * Sends medical notifications for an athlete-related clinical record.
     *
     * @param clubeId        Club ID
     * @param atletaId       Athlete ID (the subject of the clinical record)
     * @param tipoRegisto    Human-readable record type (e.g. "Lesão", "Consulta Médica")
     * @param acao           Action description (e.g. "registada", "atualizada")
     * @param detalhesAtleta Clinical details visible to the athlete only
     * @param resumoPublico  Non-clinical summary for trainers
     * @param confidencial   If true, trainers receive only a generic notification
     */
    public void notificarAtleta(int clubeId, int atletaId,
                                 String tipoRegisto, String acao,
                                 String detalhesAtleta, String resumoPublico,
                                 boolean confidencial) {
        if (!emailAtivo) return;

        Atleta atleta = atletaDAO.buscarPorId(atletaId);
        String nomeAtleta = atleta != null ? atleta.getNome() : "Atleta #" + atletaId;

        // 1. Notify the athlete with full clinical details
        try {
            String emailAtleta = atletaDAO.obterEmailEfetivo(atletaId);
            if (emailAtleta != null && !emailAtleta.isBlank()) {
                emailService.enviarNotificacaoMedicaAtleta(emailAtleta, nomeAtleta, tipoRegisto, acao, detalhesAtleta);
                LOGGER.info("Email médico enviado ao atleta " + nomeAtleta + " <" + emailAtleta + ">");
            } else {
                LOGGER.warning("Atleta " + atletaId + " não tem email configurado — notificação não enviada.");
            }
        } catch (Exception e) {
            LOGGER.warning("Falha ao enviar email ao atleta " + atletaId + ": " + e.getMessage());
        }

        // 2. Notify active trainers of the club (non-clinical summary only)
        try {
            List<Map<String, Object>> treinadores = staffDAO.listarTreinadoresPorClube(clubeId);
            for (Map<String, Object> treinador : treinadores) {
                String emailTreinador = (String) treinador.get("emailEfetivo");
                String nomeTreinador = (String) treinador.get("nome");
                if (emailTreinador == null || emailTreinador.isBlank()) continue;
                try {
                    emailService.enviarNotificacaoMedicaTreinador(
                            emailTreinador, nomeTreinador, nomeAtleta,
                            tipoRegisto, acao, resumoPublico, confidencial);
                    LOGGER.info("Email médico enviado ao treinador " + nomeTreinador + " <" + emailTreinador + ">");
                } catch (Exception e) {
                    LOGGER.warning("Falha ao enviar email ao treinador " + nomeTreinador + ": " + e.getMessage());
                }
            }
        } catch (Exception e) {
            LOGGER.warning("Falha ao obter treinadores do clube " + clubeId + ": " + e.getMessage());
        }
    }

    /**
     * Sends medical notifications for a staff-related clinical record.
     * Sends to the staff member and, if applicable, to hierarchical superiors in the same club.
     *
     * @param clubeId      Club ID
     * @param staffId      Staff member ID (subject of the clinical record)
     * @param tipoRegisto  Human-readable record type
     * @param acao         Action description
     * @param detalhes     Clinical details
     */
    public void notificarStaff(int clubeId, int staffId,
                                String tipoRegisto, String acao, String detalhes) {
        if (!emailAtivo) return;

        Staff staff = staffDAO.buscarPorId(staffId);
        String nomeStaff = staff != null ? staff.getNome() : "Staff #" + staffId;

        // Notify the staff member
        try {
            String emailStaff = staffDAO.obterEmailEfetivo(staffId);
            if (emailStaff != null && !emailStaff.isBlank()) {
                emailService.enviarNotificacaoMedicaStaff(emailStaff, nomeStaff, tipoRegisto, acao, detalhes);
                LOGGER.info("Email médico enviado ao staff " + nomeStaff + " <" + emailStaff + ">");
            } else {
                LOGGER.warning("Staff " + staffId + " não tem email configurado — notificação não enviada.");
            }
        } catch (Exception e) {
            LOGGER.warning("Falha ao enviar email ao staff " + staffId + ": " + e.getMessage());
        }

        // Notify direction/responsible staff in the club (Presidente, Secretário)
        try {
            List<Map<String, Object>> direcao = staffDAO.listarPorClubeDepartamento(clubeId, "direcao");
            for (Map<String, Object> responsavel : direcao) {
                String emailResp = (String) responsavel.get("email");
                String nomeResp = (String) responsavel.get("nome");
                if (emailResp == null || emailResp.isBlank()) continue;
                try {
                    emailService.enviarNotificacaoMedicaStaff(emailResp, nomeResp, tipoRegisto, acao,
                            "Atualização clínica relativa ao staff " + nomeStaff + ".");
                    LOGGER.info("Email médico (staff) enviado ao responsável " + nomeResp + " <" + emailResp + ">");
                } catch (Exception e) {
                    LOGGER.warning("Falha ao enviar email ao responsável " + nomeResp + ": " + e.getMessage());
                }
            }
        } catch (Exception e) {
            LOGGER.warning("Falha ao obter direção do clube " + clubeId + ": " + e.getMessage());
        }
    }
}
