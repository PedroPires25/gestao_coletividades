package com.gestaoclubes.api.model;

import java.time.LocalDateTime;

public class Evento {
    private Integer id;
    private String titulo;
    private String descricao;
    private LocalDateTime dataHora;
    private String local;
    private String observacoes;
    private String tipo; // MODALIDADE or ATIVIDADE
    private Integer clubeModalidadeId;
    private Integer coletividadeAtividadeId;
    private Integer criadoPor;
    
    // Additional fields for display
    private ClubeModalidade clubeModalidade;
    private ColetividadeAtividade coletividadeAtividade;
    private Utilizador criadoPorUser;

    public Evento() {
    }

    public Evento(Integer id, String titulo, String descricao, LocalDateTime dataHora, String local, 
                  String observacoes, String tipo, Integer clubeModalidadeId, Integer coletividadeAtividadeId, 
                  Integer criadoPor) {
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

    public Evento(String titulo, String descricao, LocalDateTime dataHora, String local, 
                  String observacoes, String tipo, Integer clubeModalidadeId, Integer coletividadeAtividadeId, 
                  Integer criadoPor) {
        this(null, titulo, descricao, dataHora, local, observacoes, tipo, clubeModalidadeId, coletividadeAtividadeId, criadoPor);
    }

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public String getTitulo() { return titulo; }
    public void setTitulo(String titulo) { this.titulo = titulo; }

    public String getDescricao() { return descricao; }
    public void setDescricao(String descricao) { this.descricao = descricao; }

    public LocalDateTime getDataHora() { return dataHora; }
    public void setDataHora(LocalDateTime dataHora) { this.dataHora = dataHora; }

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

    public Integer getCriadoPor() { return criadoPor; }
    public void setCriadoPor(Integer criadoPor) { this.criadoPor = criadoPor; }

    public ClubeModalidade getClubeModalidade() { return clubeModalidade; }
    public void setClubeModalidade(ClubeModalidade clubeModalidade) { this.clubeModalidade = clubeModalidade; }

    public ColetividadeAtividade getColetividadeAtividade() { return coletividadeAtividade; }
    public void setColetividadeAtividade(ColetividadeAtividade coletividadeAtividade) { this.coletividadeAtividade = coletividadeAtividade; }

    public Utilizador getCriadoPorUser() { return criadoPorUser; }
    public void setCriadoPorUser(Utilizador criadoPorUser) { this.criadoPorUser = criadoPorUser; }
}
