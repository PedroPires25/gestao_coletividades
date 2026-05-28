package com.gestaoclubes.api.model;

import java.sql.Timestamp;

public class PresencaTreino {
    private int id;
    private int sessaoTreinoId;
    private int atletaId;
    private boolean presente;
    private Timestamp criadoEm;
    private Timestamp atualizadoEm;

    public PresencaTreino() {}

    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public int getSessaoTreinoId() {
        return sessaoTreinoId;
    }

    public void setSessaoTreinoId(int sessaoTreinoId) {
        this.sessaoTreinoId = sessaoTreinoId;
    }

    public int getAtletaId() {
        return atletaId;
    }

    public void setAtletaId(int atletaId) {
        this.atletaId = atletaId;
    }

    public boolean isPresente() {
        return presente;
    }

    public void setPresente(boolean presente) {
        this.presente = presente;
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