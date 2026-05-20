package com.gestaoclubes.api.model;

import java.time.LocalDateTime;

public class Notificacao {

    public enum Canal { EMAIL, SMS, WHATSAPP }
    public enum Estado { PENDENTE, ENVIADA, ERRO, SIMULADA }

    private Long id;
    private Integer utilizadorId;
    private Integer eventoId;
    private Canal canal;
    private String destino;
    private String mensagem;
    private Estado estado;
    private LocalDateTime dataCriacao;
    private LocalDateTime dataEnvio;

    public Notificacao() {}

    public Notificacao(Integer utilizadorId, Integer eventoId, Canal canal,
                       String destino, String mensagem, Estado estado) {
        this.utilizadorId = utilizadorId;
        this.eventoId = eventoId;
        this.canal = canal;
        this.destino = destino;
        this.mensagem = mensagem;
        this.estado = estado;
        this.dataCriacao = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Integer getUtilizadorId() { return utilizadorId; }
    public void setUtilizadorId(Integer utilizadorId) { this.utilizadorId = utilizadorId; }
    public Integer getEventoId() { return eventoId; }
    public void setEventoId(Integer eventoId) { this.eventoId = eventoId; }
    public Canal getCanal() { return canal; }
    public void setCanal(Canal canal) { this.canal = canal; }
    public String getDestino() { return destino; }
    public void setDestino(String destino) { this.destino = destino; }
    public String getMensagem() { return mensagem; }
    public void setMensagem(String mensagem) { this.mensagem = mensagem; }
    public Estado getEstado() { return estado; }
    public void setEstado(Estado estado) { this.estado = estado; }
    public LocalDateTime getDataCriacao() { return dataCriacao; }
    public void setDataCriacao(LocalDateTime dataCriacao) { this.dataCriacao = dataCriacao; }
    public LocalDateTime getDataEnvio() { return dataEnvio; }
    public void setDataEnvio(LocalDateTime dataEnvio) { this.dataEnvio = dataEnvio; }
}
