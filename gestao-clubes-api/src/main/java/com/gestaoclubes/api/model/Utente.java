package com.gestaoclubes.api.model;

public class Utente {
    private Integer id;
    private String nome;
    private String dataNascimento;
    private String email;
    private String telefone;
    private String morada;
    private Integer coletividadeAtualId;
    private Integer estadoId;
    private String estadoDescricao;
    private String atividadeNome;
    private String dataInscricao;
    private String dataFim;
    private Boolean ativo;
    private Integer utilizadorId;

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getNome() {
        return nome;
    }

    public void setNome(String nome) {
        this.nome = nome;
    }

    public String getDataNascimento() {
        return dataNascimento;
    }

    public void setDataNascimento(String dataNascimento) {
        this.dataNascimento = dataNascimento;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getTelefone() {
        return telefone;
    }

    public void setTelefone(String telefone) {
        this.telefone = telefone;
    }

    public String getMorada() {
        return morada;
    }

    public void setMorada(String morada) {
        this.morada = morada;
    }

    public Integer getColetividadeAtualId() {
        return coletividadeAtualId;
    }

    public void setColetividadeAtualId(Integer coletividadeAtualId) {
        this.coletividadeAtualId = coletividadeAtualId;
    }

    public Integer getEstadoId() {
        return estadoId;
    }

    public void setEstadoId(Integer estadoId) {
        this.estadoId = estadoId;
    }

    public String getEstadoDescricao() {
        return estadoDescricao;
    }

    public void setEstadoDescricao(String estadoDescricao) {
        this.estadoDescricao = estadoDescricao;
    }

    public String getAtividadeNome() {
        return atividadeNome;
    }

    public void setAtividadeNome(String atividadeNome) {
        this.atividadeNome = atividadeNome;
    }

    public String getDataInscricao() {
        return dataInscricao;
    }

    public void setDataInscricao(String dataInscricao) {
        this.dataInscricao = dataInscricao;
    }

    public String getDataFim() {
        return dataFim;
    }

    public void setDataFim(String dataFim) {
        this.dataFim = dataFim;
    }

    public Boolean getAtivo() {
        return ativo;
    }

    public void setAtivo(Boolean ativo) {
        this.ativo = ativo;
    }

    public Integer getUtilizadorId() {
        return utilizadorId;
    }

    public void setUtilizadorId(Integer utilizadorId) {
        this.utilizadorId = utilizadorId;
    }
}