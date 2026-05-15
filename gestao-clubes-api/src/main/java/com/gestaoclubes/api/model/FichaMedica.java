package com.gestaoclubes.api.model;

public class FichaMedica {
    private int id;
    private int atletaId;
    private int clubeId;
    private String grupoSanguineo;
    private String alergias;
    private String condicoesCronicas;
    private String contactoEmergenciaNome;
    private String contactoEmergenciaTelefone;
    private String notasGerais;

    public FichaMedica() {}

    public FichaMedica(int id, int atletaId, int clubeId, String grupoSanguineo,
                       String alergias, String condicoesCronicas,
                       String contactoEmergenciaNome, String contactoEmergenciaTelefone,
                       String notasGerais) {
        this.id = id;
        this.atletaId = atletaId;
        this.clubeId = clubeId;
        this.grupoSanguineo = grupoSanguineo;
        this.alergias = alergias;
        this.condicoesCronicas = condicoesCronicas;
        this.contactoEmergenciaNome = contactoEmergenciaNome;
        this.contactoEmergenciaTelefone = contactoEmergenciaTelefone;
        this.notasGerais = notasGerais;
    }

    public int getId() { return id; }
    public int getAtletaId() { return atletaId; }
    public int getClubeId() { return clubeId; }
    public String getGrupoSanguineo() { return grupoSanguineo; }
    public String getAlergias() { return alergias; }
    public String getCondicoesCronicas() { return condicoesCronicas; }
    public String getContactoEmergenciaNome() { return contactoEmergenciaNome; }
    public String getContactoEmergenciaTelefone() { return contactoEmergenciaTelefone; }
    public String getNotasGerais() { return notasGerais; }
}
