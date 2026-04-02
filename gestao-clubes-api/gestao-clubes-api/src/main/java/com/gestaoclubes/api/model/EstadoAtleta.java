package com.gestaoclubes.api.model;

public class EstadoAtleta {
    private int id;
    private String descricao;

    public EstadoAtleta(int id, String descricao) {
        this.id = id;
        this.descricao = descricao;
    }

    public int getId() { return id; }
    public String getDescricao() { return descricao; }

    @Override
    public String toString() { return descricao; }
}
