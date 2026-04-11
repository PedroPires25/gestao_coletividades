package com.gestaoclubes.api.model;

import java.util.Date;

public class Atleta {
    private int id;
    private String nome;
    private Date dataNascimento;
    private String email;
    private String telefone;
    private String morada;
    private int clubeAtualId;
    private int estadoId;

    // NOVOS CAMPOS
    private int escalaoId;
    private double remuneracao;
    private String fotoPath;
    private Integer utilizadorId;

    public Atleta(int id, String nome, Date dataNascimento, String email, String telefone, String morada,
                  int clubeAtualId, int estadoId, int escalaoId, double remuneracao) {
        this(id, nome, dataNascimento, email, telefone, morada, clubeAtualId, estadoId, escalaoId, remuneracao, null);
    }

    public Atleta(int id, String nome, Date dataNascimento, String email, String telefone, String morada,
                  int clubeAtualId, int estadoId, int escalaoId, double remuneracao, String fotoPath) {
        this.id = id;
        this.nome = nome;
        this.dataNascimento = dataNascimento;
        this.email = email;
        this.telefone = telefone;
        this.morada = morada;
        this.clubeAtualId = clubeAtualId;
        this.estadoId = estadoId;
        this.escalaoId = escalaoId;
        this.remuneracao = remuneracao;
        this.fotoPath = fotoPath;
    }

    public Atleta(String nome, Date dataNascimento, String email, String telefone, String morada,
                  int clubeAtualId, int estadoId, int escalaoId, double remuneracao) {
        this(0, nome, dataNascimento, email, telefone, morada, clubeAtualId, estadoId, escalaoId, remuneracao);
    }

    // Construtores antigos (compatibilidade com código antigo)
    public Atleta(int id, String nome, Date dataNascimento, String email, String telefone, String morada,
                  int clubeAtualId, int estadoId) {
        this(id, nome, dataNascimento, email, telefone, morada, clubeAtualId, estadoId, 0, 0.0);
    }

    public Atleta(String nome, Date dataNascimento, String email, String telefone, String morada,
                  int clubeAtualId, int estadoId) {
        this(0, nome, dataNascimento, email, telefone, morada, clubeAtualId, estadoId, 0, 0.0);
    }

    public int getId() { return id; }
    public String getNome() { return nome; }
    public Date getDataNascimento() { return dataNascimento; }
    public String getEmail() { return email; }
    public String getTelefone() { return telefone; }
    public String getMorada() { return morada; }
    public int getClubeAtualId() { return clubeAtualId; }
    public int getEstadoId() { return estadoId; }

    public int getEscalaoId() { return escalaoId; }
    public double getRemuneracao() { return remuneracao; }
    public String getFotoPath() { return fotoPath; }
    public void setFotoPath(String fotoPath) { this.fotoPath = fotoPath; }
    public Integer getUtilizadorId() { return utilizadorId; }
    public void setUtilizadorId(Integer utilizadorId) { this.utilizadorId = utilizadorId; }
}
