package com.gestaoclubes.api.model;

public class ColetividadeAtividade {
    private Integer id;
    private Integer coletividadeId;
    private Integer atividadeId;
    private String ano;
    private Boolean ativo;

    private Atividade atividade;

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public Integer getColetividadeId() {
        return coletividadeId;
    }

    public void setColetividadeId(Integer coletividadeId) {
        this.coletividadeId = coletividadeId;
    }

    public Integer getAtividadeId() {
        return atividadeId;
    }

    public void setAtividadeId(Integer atividadeId) {
        this.atividadeId = atividadeId;
    }

    public String getAno() {
        return ano;
    }

    public void setAno(String ano) {
        this.ano = ano;
    }

    public Boolean getAtivo() {
        return ativo;
    }

    public void setAtivo(Boolean ativo) {
        this.ativo = ativo;
    }

    public Atividade getAtividade() {
        return atividade;
    }

    public void setAtividade(Atividade atividade) {
        this.atividade = atividade;
    }
}