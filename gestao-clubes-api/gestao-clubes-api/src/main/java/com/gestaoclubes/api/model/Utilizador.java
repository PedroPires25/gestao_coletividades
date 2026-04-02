package com.gestaoclubes.api.model;

public class Utilizador {

    private int id;
    private String utilizador;   // email/username
    private String palavraChave; // hash BCrypt
    private int perfilId;
    private boolean ativo;

    public Utilizador() {}

    public Utilizador(int id, String utilizador, String palavraChave, int perfilId, boolean ativo) {
        this.id = id;
        this.utilizador = utilizador;
        this.palavraChave = palavraChave;
        this.perfilId = perfilId;
        this.ativo = ativo;
    }

    public int getId() { return id; }
    public void setId(int id) { this.id = id; }

    public String getUtilizador() { return utilizador; }
    public void setUtilizador(String utilizador) { this.utilizador = utilizador; }

    public String getPalavraChave() { return palavraChave; }
    public void setPalavraChave(String palavraChave) { this.palavraChave = palavraChave; }

    public int getPerfilId() { return perfilId; }
    public void setPerfilId(int perfilId) { this.perfilId = perfilId; }

    public boolean isAtivo() { return ativo; }
    public void setAtivo(boolean ativo) { this.ativo = ativo; }
}