package com.gestaoclubes.api.model;

/**
 * Classe Perfil representa o tipo ou função de um utilizador no sistema.
 * Ex: "Administrador", "Técnico", "Formador", etc.
 */
public class Perfil {

    private final int id;
    private final String descricao;

    public Perfil(int id, String descricao) {
        this.id = id;
        this.descricao = descricao;
    }

    public int getId() {
        return id;
    }

    public String getDescricao() {
        return descricao;
    }

    @Override
    public String toString() {
        return descricao;
    }
}
