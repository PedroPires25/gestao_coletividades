package com.gestaoclubes.api.service;

import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private final JavaMailSender mailSender;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void enviarEmailRecuperacao(String emailDestino, String link) {
        SimpleMailMessage mensagem = new SimpleMailMessage();
        mensagem.setTo(emailDestino);
        mensagem.setSubject("Recuperação de Palavra-passe - Plataforma de Gestão de Coletividades");
        mensagem.setText("Olá,\n\n" +
                "Recebemos um pedido para recuperar a sua palavra-passe.\n" +
                "Clique no link abaixo para criar uma nova:\n\n" +
                link + "\n\n" +
                "Este link é válido por 30 minutos. Se não fez este pedido, pode ignorar este email.\n\n" +
                "Cumprimentos,\n" +
                "Equipa Gestão de Coletividades");

        mailSender.send(mensagem);
    }
    public void enviarEmailConfirmacaoAlteracao(String emailDestino) {
        SimpleMailMessage mensagem = new SimpleMailMessage();
        mensagem.setTo(emailDestino);
        mensagem.setSubject("Palavra-passe Alterada com Sucesso - Gestão de Coletividades");
        mensagem.setText("Olá,\n\n" +
                "A palavra-passe da sua conta foi alterada com sucesso.\n\n" +
                "Se não realizou esta alteração, por favor contacte o suporte imediatamente.\n\n" +
                "Cumprimentos,\n" +
                "Equipa Gestão de Coletividades");

        mailSender.send(mensagem);
    }
}