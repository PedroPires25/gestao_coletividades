package com.gestaoclubes.api.model;

import java.sql.Timestamp;

public class Evento {
    private int id;
    private String titulo;
    private String descricao;
    private Timestamp dataHora;
    private String local;
    private String observacoes;
    private String tipo; // "MODALIDADE" or "ATIVIDADE"
    private Integer clubeModalidadeId;
    private Integer coletividadeAtividadeId;
    private int criadoPor;
    private Timestamp createdAt;
    private Timestamp updatedAt;

    /** Constructor for modality events */
    public Evento(int id, String titulo, String descricao, Timestamp dataHora,
                  String local, String observacoes, Integer clubeModalidadeId, int criadoPor) {
        this.id = id;
        this.titulo = titulo;
        this.descricao = descricao;
        this.dataHora = dataHora;
        this.local = local;
        this.observacoes = observacoes;
        this.tipo = "MODALIDADE";
        this.clubeModalidadeId = clubeModalidadeId;
        this.coletividadeAtividadeId = null;
        this.criadoPor = criadoPor;
    }

    /** Full constructor */
    public Evento(int id, String titulo, String descricao, Timestamp dataHora,
                  String local, String observacoes, String tipo,
                  Integer clubeModalidadeId, Integer coletividadeAtividadeId, int criadoPor) {
        this.id = id;
        this.titulo = titulo;
        this.descricao = descricao;
        this.dataHora = dataHora;
        this.local = local;
        this.observacoes = observacoes;
        this.tipo = tipo != null ? tipo : "MODALIDADE";
        this.clubeModalidadeId = clubeModalidadeId;
        this.coletividadeAtividadeId = coletividadeAtividadeId;
        this.criadoPor = criadoPor;
    }

    /** No-id constructor for inserts */
    public Evento(String titulo, String descricao, Timestamp dataHora,
                  String local, String observacoes, String tipo,
                  Integer clubeModalidadeId, Integer coletividadeAtividadeId, int criadoPor) {
        this(0, titulo, descricao, dataHora, local, observacoes, tipo,
             clubeModalidadeId, coletividadeAtividadeId, criadoPor);
    }

    /** Legacy constructor for backward compatibility */
    public Evento(String titulo, Timestamp dataHora, String local,
                  int clubeModalidadeId, int criadoPor) {
        this(0, titulo, null, dataHora, local, null, "MODALIDADE", clubeModalidadeId, null, criadoPor);
    }

    public int getId() { return id; }
    public String getTitulo() { return titulo; }
    public String getDescricao() { return descricao; }
    public Timestamp getDataHora() { return dataHora; }
    public String getLocal() { return local; }
    public String getObservacoes() { return observacoes; }
    public String getTipo() { return tipo; }
    public Integer getClubeModalidadeId() { return clubeModalidadeId; }
    public Integer getColetividadeAtividadeId() { return coletividadeAtividadeId; }
    public int getCriadoPor() { return criadoPor; }
    public Timestamp getCreatedAt() { return createdAt; }
    public Timestamp getUpdatedAt() { return updatedAt; }
}
