package com.gestaoclubes.api.model;

public class ClubeModalidade {

    private int id;
    private Clube clube;
    private Modalidade modalidade;
    private String epoca;
    private boolean ativo;

    public ClubeModalidade(int id, Clube clube, Modalidade modalidade, String epoca, boolean ativo) {
        this.id = id;
        this.clube = clube;
        this.modalidade = modalidade;
        this.epoca = epoca;
        this.ativo = ativo;
    }

    public ClubeModalidade(Clube clube, Modalidade modalidade, String epoca, boolean ativo) {
        this(0, clube, modalidade, epoca, ativo);
    }

    public int getId() { return id; }
    public Clube getClube() { return clube; }
    public Modalidade getModalidade() { return modalidade; }
    public String getEpoca() { return epoca; }
    public boolean isAtivo() { return ativo; }

    @Override
    public String toString() {
        String ep = (epoca == null || epoca.isBlank()) ? "" : " (" + epoca + ")";
        return modalidade.getNome() + ep;
    }
}
