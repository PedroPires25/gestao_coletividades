package com.gestaoclubes.api.service;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

import java.util.logging.Logger;

/**
 * Implementação simulada do SmsService.
 * Ativa quando notificacoes.sms.ativo=false (ou não definido).
 * Apenas regista o SMS no log — não faz chamadas externas.
 */
@Service
@ConditionalOnProperty(name = "notificacoes.sms.ativo", havingValue = "false", matchIfMissing = true)
public class SmsMockService implements SmsService {

    private static final Logger LOGGER = Logger.getLogger(SmsMockService.class.getName());

    @Override
    public void enviarSms(String numero, String mensagem) {
        LOGGER.info("[SMS SIMULADO] Para: " + numero + " | Mensagem: " + mensagem);
    }
}
