package com.gestaoclubes.api.model;

import java.sql.Timestamp;

public class PlanoTreino {
    private int id;
    private int clubeId;
    private int atletaId;
    private String conteudo;
    private Timestamp dataCriacao;

    public PlanoTreino() {}

    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public int getClubeId() {
        return clubeId;
    }

    public void setClubeId(int clubeId) {
        this.clubeId = clubeId;
    }

    public int getAtletaId() {
        return atletaId;
    }

    public void setAtletaId(int atletaId) {
        this.atletaId = atletaId;
    }

    public String getConteudo() {
        return conteudo;
    }

    public void setConteudo(String conteudo) {
        this.conteudo = conteudo;
    }

    public Timestamp getDataCriacao() {
        return dataCriacao;
    }

    public void setDataCriacao(Timestamp dataCriacao) {
        this.dataCriacao = dataCriacao;
    }
}