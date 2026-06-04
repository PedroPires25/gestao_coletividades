package com.gestaoclubes.api.service;

import com.gestaoclubes.api.dao.TreinadorDAO;
import com.gestaoclubes.api.dao.AtletaDAO;
import com.gestaoclubes.api.model.Atleta;

import java.sql.Date;
import java.sql.Time;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.Map;

public class TreinadorService {

    private final TreinadorDAO treinadorDAO;
    private final AtletaDAO atletaDAO;

    public TreinadorService() {
        this.treinadorDAO = new TreinadorDAO();
        this.atletaDAO = new AtletaDAO();
    }

    public List<Map<String, Object>> listarSessoes(int clubeId) {
        return treinadorDAO.listarSessoes(clubeId);
    }

    @SuppressWarnings("unchecked")
    public boolean criarSessao(int clubeId, Map<String, Object> payload) {
        try {
            String dataStr = (String) payload.get("dataTreino");
            String horaStr = (String) payload.get("horaTreino");
            String observacoes = (String) payload.get("observacoes");
            Map<String, Boolean> presencasRaw = (Map<String, Boolean>) payload.get("presencas");

            Date dataTreino = Date.valueOf(LocalDate.parse(dataStr));
            Time horaTreino = null;
            if (horaStr != null && !horaStr.isEmpty()) {
                horaTreino = Time.valueOf(LocalTime.parse(horaStr));
            }

            int sessaoId = treinadorDAO.inserirSessao(clubeId, dataTreino, horaTreino, observacoes);

            if (sessaoId > 0 && presencasRaw != null) {
                // Convert Map<String, Boolean> to Map<Integer, Boolean>
                java.util.Map<Integer, Boolean> presencas = new java.util.HashMap<>();
                for (Map.Entry<String, Boolean> entry : presencasRaw.entrySet()) {
                    presencas.put(Integer.parseInt(entry.getKey()), entry.getValue());
                }
                treinadorDAO.inserirPresencas(sessaoId, presencas);
            }
            return sessaoId > 0;
        } catch (DateTimeParseException | ClassCastException | NumberFormatException e) {
            e.printStackTrace();
            return false;
        }
    }

    public List<Map<String, Object>> obterAssiduidade(int clubeId, String startDateStr, String endDateStr) {
        try {
            Date startDate = Date.valueOf(LocalDate.parse(startDateStr));
            Date endDate = Date.valueOf(LocalDate.parse(endDateStr));
            return treinadorDAO.obterAssiduidade(clubeId, startDate, endDate);
        } catch (DateTimeParseException | NullPointerException e) {
            e.printStackTrace();
            return new java.util.ArrayList<>();
        }
    }

    public boolean criarPlanoTreino(int clubeId, Map<String, Object> payload, EmailService emailService) {
        try {
            Integer atletaId = (Integer) payload.get("atletaId");
            String conteudo = (String) payload.get("conteudo");

            if (atletaId == null || conteudo == null || conteudo.trim().isEmpty()) {
                return false;
            }

            int planoId = treinadorDAO.inserirPlanoTreino(clubeId, atletaId, conteudo);
            
            if (planoId > 0 && emailService != null) {
                Atleta atleta = atletaDAO.buscarPorId(atletaId);
                if (atleta != null) {
                    String emailDestino = atletaDAO.obterEmailEfetivo(atletaId);
                    if (emailDestino != null && !emailDestino.isBlank()) {
                        try {
                            emailService.enviarPlanoTreino(emailDestino, atleta.getNome(), conteudo);
                        } catch (Exception e) {
                            System.err.println("Erro ao enviar email de plano de treino para atleta " + atletaId + ": " + e.getMessage());
                        }
                    } else {
                        System.err.println("Atleta " + atletaId + " não tem email configurado.");
                    }
                }
            }
            
            return planoId > 0;
        } catch (ClassCastException e) {
            e.printStackTrace();
            return false;
        }
    }
}