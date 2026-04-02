package com.gestaoclubes.api.model;

public class CargoStaff {
    private int id;
    private String nome;
    private String descricao;
    private boolean ativo;

    public CargoStaff(int id, String nome, String descricao, boolean ativo) {
        this.id = id;
        this.nome = nome;
        this.descricao = descricao;
        this.ativo = ativo;
    }

    public CargoStaff(String nome, String descricao) {
        this(0, nome, descricao, true);
    }

    public int getId() { return id; }
    public String getNome() { return nome; }
    public String getDescricao() { return descricao; }
    public boolean isAtivo() { return ativo; }

    @Override
    public String toString() { return nome; }
}
