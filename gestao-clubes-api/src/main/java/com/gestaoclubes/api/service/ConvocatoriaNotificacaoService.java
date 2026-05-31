package com.gestaoclubes.api.service;

import com.gestaoclubes.api.dao.EventoAtletaDAO;
import com.gestaoclubes.api.dao.EventoInscritoDAO;
import com.gestaoclubes.api.dao.NotificacaoDAO;
import com.gestaoclubes.api.model.Notificacao;
import com.gestaoclubes.api.model.Notificacao.Canal;
import com.gestaoclubes.api.model.Notificacao.Estado;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

/**
 * Envia (ou simula) notificações de convocatória para cada convocado.
 * Corre de forma assíncrona para não bloquear a resposta HTTP.
 */
@Service
public class ConvocatoriaNotificacaoService {

    @Value("${notificacoes.sms.ativo:false}")
    private boolean smsAtivo;

    @Value("${notificacoes.email.ativo:true}")
    private boolean emailAtivo;

    private final EmailService emailService;
    private final SmsService smsService;
    private final NotificacaoDAO notificacaoDAO = new NotificacaoDAO();
    private final EventoAtletaDAO eventoAtletaDAO = new EventoAtletaDAO();
    private final EventoInscritoDAO eventoInscritoDAO = new EventoInscritoDAO();

    public ConvocatoriaNotificacaoService(EmailService emailService, SmsService smsService) {
        this.emailService = emailService;
        this.smsService = smsService;
    }

    /**
     * Notifica todos os convocados de um evento.
     *
     * @param eventoId   ID do evento
     * @param evento     dados do evento (titulo, dataHora, local)
     * @param tipo       "MODALIDADE" ou "ATIVIDADE"
     */
    @Async
    public void notificarConvocados(int eventoId, Map<String, Object> evento, String tipo) {
        String nomeEvento = String.valueOf(evento.getOrDefault("titulo", "Evento"));
        String dataHora   = formatarDataHora(evento.get("dataHora"));
        String local      = String.valueOf(evento.getOrDefault("local", ""));

        if ("MODALIDADE".equals(tipo)) {
            List<Map<String, Object>> atletas = eventoAtletaDAO.listarPorEvento(eventoId);
            for (Map<String, Object> atleta : atletas) {
                Integer atletaId = atleta.get("id") != null ? ((Number) atleta.get("id")).intValue() : null;
                String nome      = (String) atleta.get("nome");
                String email     = (String) atleta.get("email");
                String telefone  = (String) atleta.get("telefone");

                notificarEmail(atletaId, eventoId, nome, email, nomeEvento, dataHora, local);
                notificarSms(atletaId, eventoId, nome, telefone, nomeEvento, dataHora, local);
            }
        } else {
            List<Map<String, Object>> inscritos = eventoInscritoDAO.listarPorEvento(eventoId);
            for (Map<String, Object> inscrito : inscritos) {
                Integer inscritoId = inscrito.get("id") != null ? ((Number) inscrito.get("id")).intValue() : null;
                String nome        = (String) inscrito.get("nome");
                String email       = (String) inscrito.get("email");

                notificarEmail(inscritoId, eventoId, nome, email, nomeEvento, dataHora, local);
                // inscritos não têm campo telefone — SMS não aplicável
            }
        }
    }

    // --- private helpers ---

    private void notificarEmail(Integer pessoaId, int eventoId, String nome,
                                 String email, String nomeEvento, String dataHora, String local) {
        if (email == null || email.isBlank()) return;

        String mensagem = "Convocatória: " + nomeEvento + " | " + dataHora + " | " + local;
        Estado estado;

        if (emailAtivo) {
            try {
                emailService.enviarConvocatoria(email, nome, nomeEvento, dataHora, local);
                estado = Estado.ENVIADA;
            } catch (Exception e) {
                System.err.println("[EMAIL] Erro ao enviar para " + email + ": " + e.getMessage());
                estado = Estado.ERRO;
            }
        } else {
            System.out.println("[EMAIL SIMULADO] Para: " + email + " | " + mensagem);
            estado = Estado.SIMULADA;
        }

        notificacaoDAO.inserir(new Notificacao(pessoaId, eventoId, Canal.EMAIL, email, mensagem, estado));
    }

    private void notificarSms(Integer pessoaId, int eventoId, String nome,
                               String telefone, String nomeEvento, String dataHora, String local) {
        if (telefone == null || telefone.isBlank()) return;

        String mensagem = "Convocatória: " + nomeEvento + " | " + dataHora + " | " + local;
        Estado estado;

        if (smsAtivo) {
            try {
                smsService.enviarSms(telefone, mensagem);
                estado = Estado.ENVIADA;
            } catch (Exception e) {
                System.err.println("[SMS] Erro ao enviar para " + telefone + ": " + e.getMessage());
                estado = Estado.ERRO;
            }
        } else {
            smsService.enviarSms(telefone, mensagem); // chama mock que só faz log
            estado = Estado.SIMULADA;
        }

        notificacaoDAO.inserir(new Notificacao(pessoaId, eventoId, Canal.SMS, telefone, mensagem, estado));
    }

    private String formatarDataHora(Object dataHora) {
        if (dataHora == null) return "";
        if (dataHora instanceof java.sql.Timestamp ts) {
            return ts.toLocalDateTime().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm"));
        }
        return dataHora.toString();
    }
}