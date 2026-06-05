package com.gestaoclubes.api.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.internet.MimeMessage;

@Service
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:}")
    private String brevoUsername;

    @Value("${spring.mail.password:}")
    private String brevoPassword;

    @Value("${brevo.sender.email:}")
    private String senderEmail;

    @Value("${brevo.sender.name:Gestão de Coletividades}")
    private String senderName;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    private void sendBrevoEmail(String emailDestino, String nomeDestinatario, String subject, String textContent) {
        if (brevoUsername == null || brevoUsername.isBlank() || brevoPassword == null || brevoPassword.isBlank()) {
            throw new IllegalStateException("BREVO_USERNAME e BREVO_PASSWORD devem estar configurados para envio de email.");
        }
        String fromEmail = senderEmail != null && !senderEmail.isBlank() ? senderEmail.trim() : brevoUsername.trim();

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, false, "UTF-8");
            helper.setFrom(fromEmail, senderName);
            helper.setTo(emailDestino);
            helper.setSubject(subject);
            helper.setText(textContent, false);
            mailSender.send(message);
        } catch (Exception e) {
            throw new RuntimeException("Falha ao enviar email via Brevo SMTP", e);
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