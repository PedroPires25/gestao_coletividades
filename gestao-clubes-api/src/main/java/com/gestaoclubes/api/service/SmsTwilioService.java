package com.gestaoclubes.api.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

/**
 * Implementação real do SmsService via Twilio.
 * Ativa quando notificacoes.sms.ativo=true.
 *
 * Para ativar, adicionar ao pom.xml:
 *   <dependency>
 *       <groupId>com.twilio.sdk</groupId>
 *       <artifactId>twilio</artifactId>
 *       <version>10.1.0</version>
 *   </dependency>
 *
 * E definir as variáveis de ambiente:
 *   TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER
 *   NOTIFICACOES_SMS_ATIVO=true
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
        // Integração Twilio — descomentar após adicionar a dependência ao pom.xml:
        //
        // Twilio.init(accountSid, authToken);
        // Message.creator(
        //     new PhoneNumber(numero),
        //     new PhoneNumber(fromNumber),
        //     mensagem
        // ).create();

        throw new UnsupportedOperationException(
            "SmsTwilioService não configurado. Adicione a dependência Twilio ao pom.xml.");
    }
}
