package com.gestaoclubes.api.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

/**
 * Implementação do SmsService via Twilio.
 * Ativa quando notificacoes.sms.ativo=true.
 * Requer a dependência Twilio no pom.xml e as variáveis de ambiente:
 * TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER
 */
@Service
@ConditionalOnProperty(name = "notificacoes.sms.ativo", havingValue = "true")
public class SmsTwilioService implements SmsService {

    @Value("${twilio.account-sid:}")
    private String accountSid;

    @Value("${twilio.auth-token:}")
    private String authToken;

    @Value("${twilio.from-number:}")
    private String fromNumber;

    @Override
    public void enviarSms(String numero, String mensagem) {
        throw new UnsupportedOperationException(
            "SmsTwilioService não configurado. Adicione a dependência Twilio ao pom.xml.");
    }
}
