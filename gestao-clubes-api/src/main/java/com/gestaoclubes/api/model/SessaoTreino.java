package com.gestaoclubes.api.model;

import java.sql.Time;
import java.sql.Date;
import java.sql.Timestamp;

public class SessaoTreino {
    private int id;
    private int clubeId;
    private Date dataTreino;
    private Time horaTreino;
    private String observacoes;
    private Timestamp criadoEm;
    private Timestamp atualizadoEm;

    // Construtores, getters e setters

    public SessaoTreino() {}

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

    public Date getDataTreino() {
        return dataTreino;
    }

    public void setDataTreino(Date dataTreino) {
        this.dataTreino = dataTreino;
    }

    public Time getHoraTreino() {
        return horaTreino;
    }

    public void setHoraTreino(Time horaTreino) {
        this.horaTreino = horaTreino;
    }

    public String getObservacoes() {
        return observacoes;
    }

    public void setObservacoes(String observacoes) {
        this.observacoes = observacoes;
    }

    public Timestamp getCriadoEm() {
        return criadoEm;
    }

    public void setCriadoEm(Timestamp criadoEm) {
        this.criadoEm = criadoEm;
    }

    public Timestamp getAtualizadoEm() {
        return atualizadoEm;
    }

    public void setAtualizadoEm(Timestamp atualizadoEm) {
        this.atualizadoEm = atualizadoEm;
    }
}