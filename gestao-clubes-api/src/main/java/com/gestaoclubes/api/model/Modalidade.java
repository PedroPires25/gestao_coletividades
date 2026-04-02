package com.gestaoclubes.api.model;

public class Modalidade {
    private int id;
    private String nome;
    private String descricao;
    private boolean ativo;

    public Modalidade(int id, String nome, String descricao, boolean ativo) {
        this.id = id;
        this.nome = nome;
        this.descricao = descricao;
        this.ativo = ativo;
    }

    // Para inserts
    public Modalidade(String nome, String descricao) {
        this(0, nome, descricao, true);
    }

    // Se quiseres manter compatibilidade com o construtor antigo:
    public Modalidade(int id, String nome, String descricao) {
        this(id, nome, descricao, true);
    }

    public int getId() { return id; }
    public String getNome() { return nome; }
    public String getDescricao() { return descricao; }
    public boolean isAtivo() { return ativo; }

    @Override
    public String toString() {
        return nome;
    }
}
