package com.gestaoclubes.api.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class EmailService {

    @Value("${brevo.api.key:}")
    private String brevoApiKey;

    @Value("${brevo.sender.email:plataforma.gcdc@gmail.com}")
    private String senderEmail;

    @Value("${brevo.sender.name:Gestao de Coletividades}")
    private String senderName;

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public EmailService() {
        this.restTemplate = new RestTemplate();
        this.objectMapper = new ObjectMapper();
    }

    private void sendBrevoEmail(String emailDestino, String nomeDestinatario, String subject, String textContent) {
        if (brevoApiKey == null || brevoApiKey.trim().isBlank()) {
            System.err.println("ERRO: BREVO_API_KEY não configurada. Email não enviado.");
            return;
        }

        String url = "https://api.brevo.com/v3/smtp/email";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("api-key", brevoApiKey.trim());
        headers.setAccept(List.of(MediaType.APPLICATION_JSON));

        // Format HTML simply by replacing newlines with <br>
        String htmlContent = textContent.replace("\n", "<br/>");

        // O Brevo exige o campo "name" no array "to". 
        // Se estiver em branco, usamos o email como fallback garantido.
        String finalName = (nomeDestinatario == null || nomeDestinatario.trim().isBlank()) ? emailDestino : nomeDestinatario.trim();

        Map<String, String> toObj = new HashMap<>();
        toObj.put("email", emailDestino);
        toObj.put("name", finalName);

        Map<String, Object> body = Map.of(
                "sender", Map.of("name", senderName, "email", senderEmail),
                "to", List.of(toObj),
                "subject", subject,
                "htmlContent", htmlContent
        );

        try {
            String jsonBody = objectMapper.writeValueAsString(body);
            HttpEntity<String> request = new HttpEntity<>(jsonBody, headers);
            
            restTemplate.postForEntity(url, request, String.class);
            System.out.println("Email enviado via Brevo com sucesso para: " + emailDestino);
        } catch (Exception e) {
            System.err.println("Erro ao enviar email via Brevo para " + emailDestino + ": " + e.getMessage());
            throw new RuntimeException("Falha ao enviar email via Brevo", e);
        }
    }

    public void enviarEmailRecuperacao(String emailDestino, String link) {
        String subject = "Recuperação de Palavra-passe - Plataforma de Gestão de Coletividades";
        String text = "Olá,\n\n" +
                "Recebemos um pedido para recuperar a sua palavra-passe.\n" +
                "Clique no link abaixo para criar uma nova:\n\n" +
                link + "\n\n" +
                "Este link é válido por 30 minutos. Se não fez este pedido, pode ignorar este email.\n\n" +
                "Cumprimentos,\n" +
                "Equipa Gestao de Coletividades";

        sendBrevoEmail(emailDestino, emailDestino, subject, text);
    }

    public void enviarConvocatoria(String emailDestino, String nomeDestinatario,
                                    String nomeEvento, String dataHora, String local) {
        enviarConvocatoria(emailDestino, nomeDestinatario, nomeEvento, dataHora, local, null, null);
    }

    public void enviarConvocatoria(String emailDestino, String nomeDestinatario,
                                    String nomeEvento, String dataHora, String local,
                                    String descricao, String subtipo) {
        String subject = "Convocatória - " + nomeEvento;

        StringBuilder texto = new StringBuilder();
        texto.append("Olá").append(nomeDestinatario != null && !nomeDestinatario.isBlank() ? " " + nomeDestinatario : "").append(",\n\n");
        texto.append("Foi convocado(a) para o seguinte evento:\n\n");
        texto.append("  Evento   : ").append(nomeEvento).append("\n");
        if (subtipo != null && !subtipo.isBlank()) {
            texto.append("  Tipo     : ").append(subtipo).append("\n");
        }
        texto.append("  Data/Hora: ").append(dataHora).append("\n");
        texto.append("  Local    : ").append(local).append("\n");
        if (descricao != null && !descricao.isBlank()) {
            texto.append("  Descrição: ").append(descricao).append("\n");
        }
        texto.append("\nPor favor confirme a sua presença na plataforma.\n\n");
        texto.append("Cumprimentos,\n");
        texto.append("Equipa Gestao de Coletividades");

        sendBrevoEmail(emailDestino, nomeDestinatario, subject, texto.toString());
    }

    public void enviarEmailConfirmacaoAlteracao(String emailDestino) {
        String subject = "Palavra-passe Alterada com Sucesso - Gestão de Coletividades";
        String text = "Olá,\n\n" +
                "A palavra-passe da sua conta foi alterada com sucesso.\n\n" +
                "Se não realizou esta alteração, por favor contacte o suporte imediatamente.\n\n" +
                "Cumprimentos,\n" +
                "Equipa Gestao de Coletividades";

        sendBrevoEmail(emailDestino, emailDestino, subject, text);
    }

    public void enviarPlanoTreino(String emailDestino, String nomeAtleta, String conteudoPlano) {
        String subject = "O seu novo Plano de Treino Individual";
        String text = "Olá " + nomeAtleta + ",\n\n" +
                "O seu treinador enviou-lhe um novo plano de treino individual.\n\n" +
                "--------------------------------------------------\n" +
                conteudoPlano + "\n" +
                "--------------------------------------------------\n\n" +
                "Bons treinos!\n\n" +
                "Cumprimentos,\n" +
                "A sua Equipa Técnica";

        sendBrevoEmail(emailDestino, nomeAtleta, subject, text);
    }

    public void enviarAvisoPagamento(String emailDestino, String nomeAtleta, String nomeClube,
                                      int mes, int ano, double valorEmDivida) {
        String[] meses = {"Janeiro","Fevereiro","Março","Abril","Maio","Junho",
                          "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"};
        String nomeMes = (mes >= 1 && mes <= 12) ? meses[mes - 1] : String.valueOf(mes);
        String refAleatoria = String.format("REF%04d%02d%06d", ano, mes, (int)(Math.random() * 999999));
        String subject = "Aviso de pagamento de mensalidade - " + nomeClube;
        String text = "Olá " + nomeAtleta + ",\n\n" +
                "Informamos que se encontra por regularizar a mensalidade referente a " + nomeMes + "/" + ano + ".\n\n" +
                "Valor em dívida: " + String.format("%.2f", valorEmDivida) + " €\n\n" +
                "Dados de pagamento:\n" +
                "IBAN: PT50 0000 0000 0000 0000 0000 0\n" +
                "Referência: " + refAleatoria + "\n" +
                "Entidade: 99999\n\n" +
                "Após pagamento, por favor envie comprovativo para a secretaria do clube.\n\n" +
                "Cumprimentos,\n" +
                nomeClube;
        sendBrevoEmail(emailDestino, nomeAtleta, subject, text);
    }

    // ==========================================
    // NOTIFICAÇÕES MÉDICAS
    // ==========================================

    /**
     * Sends a detailed medical update notification to the athlete.
     */
    public void enviarNotificacaoMedicaAtleta(String emailDestino, String nomeAtleta,
                                               String tipoRegisto, String acao, String detalhes) {
        String subject = "Atualização clínica: " + tipoRegisto + " — Plataforma Gestão de Coletividades";
        StringBuilder texto = new StringBuilder();
        texto.append("Olá ").append(nomeAtleta).append(",\n\n");
        texto.append("Foi ").append(acao).append(" uma atualização clínica relativa à sua ficha médica.\n\n");
        texto.append("─────────────────────────────\n");
        texto.append("Tipo: ").append(tipoRegisto).append("\n");
        if (detalhes != null && !detalhes.isBlank()) {
            texto.append("Detalhe: ").append(detalhes).append("\n");
        }
        texto.append("─────────────────────────────\n\n");
        texto.append("Para consultar o registo completo, aceda à plataforma.\n\n");
        texto.append("Cumprimentos,\n");
        texto.append("Departamento Médico — Gestão de Coletividades");
        sendBrevoEmail(emailDestino, nomeAtleta, subject, texto.toString());
    }

    /**
     * Sends a non-clinical notification to a trainer about an athlete's medical update.
     * If confidential, sends only a generic message.
     */
    public void enviarNotificacaoMedicaTreinador(String emailDestino, String nomeTreinador,
                                                  String nomeAtleta, String tipoRegisto,
                                                  String acao, String resumoPublico,
                                                  boolean confidencial) {
        String subject = "Atualização clínica — " + nomeAtleta;
        StringBuilder texto = new StringBuilder();
        texto.append("Olá").append(nomeTreinador != null && !nomeTreinador.isBlank() ? " " + nomeTreinador : "").append(",\n\n");
        if (confidencial) {
            texto.append("Foi registada uma atualização clínica relativa ao atleta ")
                 .append(nomeAtleta)
                 .append(".\n\n")
                 .append("Consulte a plataforma para mais informações.\n");
        } else {
            texto.append("Existe uma nova atualização clínica relativa ao atleta ").append(nomeAtleta).append(":\n\n");
            texto.append("  → ").append(tipoRegisto).append(" ").append(acao).append(".\n");
            if (resumoPublico != null && !resumoPublico.isBlank()) {
                texto.append("  → ").append(resumoPublico).append("\n");
            }
            texto.append("\nPara detalhes clínicos, contacte o departamento médico.\n");
        }
        texto.append("\nCumprimentos,\n");
        texto.append("Departamento Médico — Gestão de Coletividades");
        sendBrevoEmail(emailDestino, nomeTreinador, subject, texto.toString());
    }

    /**
     * Sends a medical update notification to a staff member.
     */
    public void enviarNotificacaoMedicaStaff(String emailDestino, String nomeStaff,
                                              String tipoRegisto, String acao, String detalhes) {
        String subject = "Atualização clínica: " + tipoRegisto + " — Plataforma Gestão de Coletividades";
        StringBuilder texto = new StringBuilder();
        texto.append("Olá ").append(nomeStaff != null && !nomeStaff.isBlank() ? nomeStaff : "").append(",\n\n");
        texto.append("Foi ").append(acao).append(" uma atualização clínica relativa à sua ficha médica.\n\n");
        texto.append("─────────────────────────────\n");
        texto.append("Tipo: ").append(tipoRegisto).append("\n");
        if (detalhes != null && !detalhes.isBlank()) {
            texto.append("Detalhe: ").append(detalhes).append("\n");
        }
        texto.append("─────────────────────────────\n\n");
        texto.append("Para consultar o registo completo, aceda à plataforma.\n\n");
        texto.append("Cumprimentos,\n");
        texto.append("Departamento Médico — Gestão de Coletividades");
        sendBrevoEmail(emailDestino, nomeStaff, subject, texto.toString());
    }
}