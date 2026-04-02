package com.gestaoclubes.api.model;

public class Staff {
    private int id;
    private String nome;
    private String email;
    private String telefone;
    private String morada;
    private String numRegisto;


    private double remuneracao;

    public Staff(int id, String nome, String email, String telefone, String morada, String numRegisto, double remuneracao) {
        this.id = id;
        this.nome = nome;
        this.email = email;
        this.telefone = telefone;
        this.morada = morada;
        this.numRegisto = numRegisto;
        this.remuneracao = remuneracao;
    }

    public Staff(String nome, String email, String telefone, String morada, String numRegisto, double remuneracao) {
        this(0, nome, email, telefone, morada, numRegisto, remuneracao);
    }

    // Construtores antigos (compatibilidade)
    public Staff(int id, String nome, String email, String telefone, String morada, String numRegisto) {
        this(id, nome, email, telefone, morada, numRegisto, 0.0);
    }

    public Staff(String nome, String email, String telefone, String morada, String numRegisto) {
        this(0, nome, email, telefone, morada, numRegisto, 0.0);
    }

    public int getId() { return id; }
    public String getNome() { return nome; }
    public String getEmail() { return email; }
    public String getTelefone() { return telefone; }
    public String getMorada() { return morada; }
    public String getNumRegisto() { return numRegisto; }

    public double getRemuneracao() { return remuneracao; }
}
