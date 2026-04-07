package com.gestaoclubes.api.model;

import java.util.Date;

public class Clube {

    private int id;
    private String nome;
    private String nif;
    private String email;
    private String telefone;
    private String morada;
    private String codigoPostal;
    private String localidade;
    private Date dataFundacao;
    private String logoPath;

    public Clube() {}

    public Clube(int id, String nome, String nif, String email,
                 String telefone, String morada, String codigoPostal, String localidade, Date dataFundacao) {
        this.id = id;
        this.nome = nome;
        this.nif = nif;
        this.email = email;
        this.telefone = telefone;
        this.morada = morada;
        this.codigoPostal = codigoPostal;
        this.localidade = localidade;
        this.dataFundacao = dataFundacao;
    }

    public Clube(String nome, String nif, String email,
                 String telefone, String morada, String codigoPostal, String localidade, Date dataFundacao) {
        this(0, nome, nif, email, telefone, morada, codigoPostal, localidade, dataFundacao);
    }

    public int getId() { return id; }
    public String getNome() { return nome; }
    public String getNif() { return nif; }
    public String getEmail() { return email; }
    public String getTelefone() { return telefone; }
    public String getMorada() { return morada; }
    public String getCodigoPostal() { return codigoPostal; }
    public String getLocalidade() { return localidade; }
    public Date getDataFundacao() { return dataFundacao; }
    public String getLogoPath() { return logoPath; }
    public void setLogoPath(String logoPath) { this.logoPath = logoPath; }

    @Override
    public String toString() {
        return nome;
    }
}
