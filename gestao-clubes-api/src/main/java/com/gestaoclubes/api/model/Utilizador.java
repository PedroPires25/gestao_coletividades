package com.gestaoclubes.api.model;

public class Utilizador {

    private int id;
    private String utilizador;
    private String palavraChave;
    private int perfilId;
    private boolean ativo;
    private boolean privilegiosAtivos;
    private String estadoRegisto;
    private Integer clubeId;
    private Integer modalidadeId;
    private Integer coletividadeId;
    private Integer atividadeId;
    private String logoPath;
    private String nome;

    public Utilizador() {
    }

    public Utilizador(int id, String utilizador, String palavraChave, int perfilId, boolean ativo,
                      boolean privilegiosAtivos, String estadoRegisto,
                      Integer clubeId, Integer modalidadeId,
                      Integer coletividadeId, Integer atividadeId) {
        this.id = id;
        this.utilizador = utilizador;
        this.palavraChave = palavraChave;
        this.perfilId = perfilId;
        this.ativo = ativo;
        this.privilegiosAtivos = privilegiosAtivos;
        this.estadoRegisto = estadoRegisto;
        this.clubeId = clubeId;
        this.modalidadeId = modalidadeId;
        this.coletividadeId = coletividadeId;
        this.atividadeId = atividadeId;
    }

    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public String getUtilizador() {
        return utilizador;
    }

    public void setUtilizador(String utilizador) {
        this.utilizador = utilizador;
    }

    public String getPalavraChave() {
        return palavraChave;
    }

    public void setPalavraChave(String palavraChave) {
        this.palavraChave = palavraChave;
    }

    public int getPerfilId() {
        return perfilId;
    }

    public void setPerfilId(int perfilId) {
        this.perfilId = perfilId;
    }

    public boolean isAtivo() {
        return ativo;
    }

    public void setAtivo(boolean ativo) {
        this.ativo = ativo;
    }

    public boolean isPrivilegiosAtivos() {
        return privilegiosAtivos;
    }

    public void setPrivilegiosAtivos(boolean privilegiosAtivos) {
        this.privilegiosAtivos = privilegiosAtivos;
    }

    public String getEstadoRegisto() {
        return estadoRegisto;
    }

    public void setEstadoRegisto(String estadoRegisto) {
        this.estadoRegisto = estadoRegisto;
    }

    public Integer getClubeId() {
        return clubeId;
    }

    public void setClubeId(Integer clubeId) {
        this.clubeId = clubeId;
    }

    public Integer getModalidadeId() {
        return modalidadeId;
    }

    public void setModalidadeId(Integer modalidadeId) {
        this.modalidadeId = modalidadeId;
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

    public String getLogoPath() {
        return logoPath;
    }

    public void setLogoPath(String logoPath) {
        this.logoPath = logoPath;
    }

    public String getNome() {
        return nome;
    }

    public void setNome(String nome) {
        this.nome = nome;
    }
}