package com.gestaoclubes.api.service;

/**
 * Interface de envio de SMS.
 * Permite trocar a implementação (mock, Twilio, E-goi, Vonage…)
 * sem alterar o resto da aplicação.
 */
public interface SmsService {
    void enviarSms(String numero, String mensagem);
}
