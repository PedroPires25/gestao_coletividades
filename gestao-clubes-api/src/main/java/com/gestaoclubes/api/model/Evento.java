package com.gestaoclubes.api.model;


public class Evento {
    private String titulo;
    private String descricao;
    private String local;
    private String observacoes;
    private Integer clubeModalidadeId;
    private Integer coletividadeAtividadeId;

    }

        this.id = id;
        this.titulo = titulo;
        this.descricao = descricao;
        this.dataHora = dataHora;
        this.local = local;
        this.observacoes = observacoes;
        this.clubeModalidadeId = clubeModalidadeId;
        this.coletividadeAtividadeId = coletividadeAtividadeId;
        this.criadoPor = criadoPor;
    }

    }


    public String getTitulo() { return titulo; }
    public String getDescricao() { return descricao; }
    public String getLocal() { return local; }
    public String getObservacoes() { return observacoes; }
    public String getTipo() { return tipo; }
    public Integer getClubeModalidadeId() { return clubeModalidadeId; }
    public Integer getColetividadeAtividadeId() { return coletividadeAtividadeId; }
}
