package com.gestaoclubes.api.model;

import java.time.LocalDateTime;

public class NotificacaoPlataforma {

    private Long id;
    private Integer utilizadorDestinoId;
    private String tipo;
    private String mensagem;
    private String entidadeTipo;
    private Integer entidadeId;
    private Integer registoPendenteId;
    private Integer clubeId;
    private Integer coletividadeId;
    private boolean lida;
    private boolean resolvida;
    private LocalDateTime criadaEm;
    private LocalDateTime resolvidaEm;

    public NotificacaoPlataforma() {}

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Integer getUtilizadorDestinoId() {
        return utilizadorDestinoId;
    }

    public void setUtilizadorDestinoId(Integer utilizadorDestinoId) {
        this.utilizadorDestinoId = utilizadorDestinoId;
    }

    public String getTipo() {
        return tipo;
    }

    public void setTipo(String tipo) {
        this.tipo = tipo;
    }

    public String getMensagem() {
        return mensagem;
    }

    public void setMensagem(String mensagem) {
        this.mensagem = mensagem;
    }

    public String getEntidadeTipo() {
        return entidadeTipo;
    }

    public void setEntidadeTipo(String entidadeTipo) {
        this.entidadeTipo = entidadeTipo;
    }

    public Integer getEntidadeId() {
        return entidadeId;
    }

    public void setEntidadeId(Integer entidadeId) {
        this.entidadeId = entidadeId;
    }

    public Integer getRegistoPendenteId() {
        return registoPendenteId;
    }

    public void setRegistoPendenteId(Integer registoPendenteId) {
        this.registoPendenteId = registoPendenteId;
    }

    public Integer getClubeId() {
        return clubeId;
    }

    public void setClubeId(Integer clubeId) {
        this.clubeId = clubeId;
    }

    public Integer getColetividadeId() {
        return coletividadeId;
    }

    public void setColetividadeId(Integer coletividadeId) {
        this.coletividadeId = coletividadeId;
    }

    public boolean isLida() {
        return lida;
    }

    public void setLida(boolean lida) {
        this.lida = lida;
    }

    public boolean isResolvida() {
        return resolvida;
    }

    public void setResolvida(boolean resolvida) {
        this.resolvida = resolvida;
    }

    public LocalDateTime getCriadaEm() {
        return criadaEm;
    }

    public void setCriadaEm(LocalDateTime criadaEm) {
        this.criadaEm = criadaEm;
    }

    public LocalDateTime getResolvidaEm() {
        return resolvidaEm;
    }

    public void setResolvidaEm(LocalDateTime resolvidaEm) {
        this.resolvidaEm = resolvidaEm;
    }
}
