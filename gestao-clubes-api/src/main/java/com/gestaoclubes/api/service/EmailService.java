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
    public void enviarConvocatoria(String emailDestino, String nomeDestinatario,
                                    String nomeEvento, String dataHora, String local) {
        SimpleMailMessage mensagem = new SimpleMailMessage();
        mensagem.setTo(emailDestino);
        mensagem.setSubject("Convocatória - " + nomeEvento);
        mensagem.setText("Olá" + (nomeDestinatario != null ? " " + nomeDestinatario : "") + ",\n\n" +
                "Foi convocado(a) para o seguinte evento:\n\n" +
                "  Evento : " + nomeEvento + "\n" +
                "  Data/Hora: " + dataHora + "\n" +
                "  Local   : " + local + "\n\n" +
                "Por favor confirme a sua presença na plataforma.\n\n" +
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

    public void enviarPlanoTreino(String emailDestino, String nomeAtleta, String conteudoPlano) {
        SimpleMailMessage mensagem = new SimpleMailMessage();
        mensagem.setTo(emailDestino);
        mensagem.setSubject("O seu novo Plano de Treino Individual");
        mensagem.setText("Olá " + nomeAtleta + ",\n\n" +
                "O seu treinador enviou-lhe um novo plano de treino individual.\n\n" +
                "--------------------------------------------------\n" +
                conteudoPlano + "\n" +
                "--------------------------------------------------\n\n" +
                "Bons treinos!\n\n" +
                "Cumprimentos,\n" +
                "A sua Equipa Técnica");

        mailSender.send(mensagem);
    }
}