package com.gestaoclubes.api.model;

import java.sql.Timestamp;

public class Evento {
    private int id;
    private String titulo;
    private String descricao;
    private Timestamp dataHora;
    private Timestamp dataHoraFim;
    private String local;
    private String observacoes;
    private String tipo;
    private Integer clubeModalidadeId;
    private Integer coletividadeAtividadeId;
    private int criadoPor;
    private Double latitude;
    private Double longitude;

    public Evento() {}

    public Evento(String titulo, String descricao, Timestamp dataHora, String local,
                  String observacoes, String tipo, Integer clubeModalidadeId,
                  Integer coletividadeAtividadeId, int criadoPor) {
        this.titulo = titulo;
        this.descricao = descricao;
        this.dataHora = dataHora;
        this.local = local;
        this.observacoes = observacoes;
        this.tipo = tipo;
        this.clubeModalidadeId = clubeModalidadeId;
        this.coletividadeAtividadeId = coletividadeAtividadeId;
        this.criadoPor = criadoPor;
    }

    public Evento(int id, String titulo, String descricao, Timestamp dataHora, String local,
                  String observacoes, String tipo, Integer clubeModalidadeId,
                  Integer coletividadeAtividadeId, int criadoPor) {
        this.id = id;
        this.titulo = titulo;
        this.descricao = descricao;
        this.dataHora = dataHora;
        this.local = local;
        this.observacoes = observacoes;
        this.tipo = tipo;
        this.clubeModalidadeId = clubeModalidadeId;
        this.coletividadeAtividadeId = coletividadeAtividadeId;
        this.criadoPor = criadoPor;
    }

    public int getId() { return id; }
    public void setId(int id) { this.id = id; }
    public String getTitulo() { return titulo; }
    public void setTitulo(String titulo) { this.titulo = titulo; }
    public String getDescricao() { return descricao; }
    public void setDescricao(String descricao) { this.descricao = descricao; }
    public Timestamp getDataHora() { return dataHora; }
    public void setDataHora(Timestamp dataHora) { this.dataHora = dataHora; }
    public Timestamp getDataHoraFim() { return dataHoraFim; }
    public void setDataHoraFim(Timestamp dataHoraFim) { this.dataHoraFim = dataHoraFim; }
    public String getLocal() { return local; }
    public void setLocal(String local) { this.local = local; }
    public String getObservacoes() { return observacoes; }
    public void setObservacoes(String observacoes) { this.observacoes = observacoes; }
    public String getTipo() { return tipo; }
    public void setTipo(String tipo) { this.tipo = tipo; }
    public Integer getClubeModalidadeId() { return clubeModalidadeId; }
    public void setClubeModalidadeId(Integer clubeModalidadeId) { this.clubeModalidadeId = clubeModalidadeId; }
    public Integer getColetividadeAtividadeId() { return coletividadeAtividadeId; }
    public void setColetividadeAtividadeId(Integer coletividadeAtividadeId) { this.coletividadeAtividadeId = coletividadeAtividadeId; }
    public int getCriadoPor() { return criadoPor; }
    public void setCriadoPor(int criadoPor) { this.criadoPor = criadoPor; }
    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }
    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }
}
