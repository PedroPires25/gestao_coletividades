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

        String htmlContent = textContent.replace("\n", "<br/>");

        Map<String, String> toObj = new HashMap<>();
        toObj.put("email", emailDestino);
        if (nomeDestinatario != null && !nomeDestinatario.isBlank()) {
            toObj.put("name", nomeDestinatario);
        }

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
                "Equipa Gestão de Coletividades";

        // Passar o próprio email como nome, caso o nome não esteja disponível
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
        texto.append("Equipa Gestão de Coletividades");

        sendBrevoEmail(emailDestino, nomeDestinatario, subject, texto.toString());
    }

    public void enviarEmailConfirmacaoAlteracao(String emailDestino) {
        String subject = "Palavra-passe Alterada com Sucesso - Gestão de Coletividades";
        String text = "Olá,\n\n" +
                "A palavra-passe da sua conta foi alterada com sucesso.\n\n" +
                "Se não realizou esta alteração, por favor contacte o suporte imediatamente.\n\n" +
                "Cumprimentos,\n" +
                "Equipa Gestão de Coletividades";

        // Passar o próprio email como nome, caso o nome não esteja disponível
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
}