package com.gestaoclubes.api.model;

public class StaffColetividadeRow {
    private Integer id;
    private Integer afetacaoId;
    private String nome;
    private String email;
    private String telefone;
    private String morada;
    private String numRegisto;
    private Double remuneracao;
    private Integer cargoId;
    private String cargoNome;
    private String atividadeNome;
    private String dataInicio;
    private String dataFim;
    private String observacoes;
    private Boolean ativo;

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public Integer getAfetacaoId() {
        return afetacaoId;
    }

    public void setAfetacaoId(Integer afetacaoId) {
        this.afetacaoId = afetacaoId;
    }

    public String getNome() {
        return nome;
    }

    public void setNome(String nome) {
        this.nome = nome;
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

    public String getNumRegisto() {
        return numRegisto;
    }

    public void setNumRegisto(String numRegisto) {
        this.numRegisto = numRegisto;
    }

    public Double getRemuneracao() {
        return remuneracao;
    }

    public void setRemuneracao(Double remuneracao) {
        this.remuneracao = remuneracao;
    }

    public Integer getCargoId() {
        return cargoId;
    }

    public void setCargoId(Integer cargoId) {
        this.cargoId = cargoId;
    }

    public String getCargoNome() {
        return cargoNome;
    }

    public void setCargoNome(String cargoNome) {
        this.cargoNome = cargoNome;
    }

    public String getAtividadeNome() {
        return atividadeNome;
    }

    public void setAtividadeNome(String atividadeNome) {
        this.atividadeNome = atividadeNome;
    }

    public String getDataInicio() {
        return dataInicio;
    }

    public void setDataInicio(String dataInicio) {
        this.dataInicio = dataInicio;
    }

    public String getDataFim() {
        return dataFim;
    }

    public void setDataFim(String dataFim) {
        this.dataFim = dataFim;
    }

    public String getObservacoes() {
        return observacoes;
    }

    public void setObservacoes(String observacoes) {
        this.observacoes = observacoes;
    }

    public Boolean getAtivo() {
        return ativo;
    }

    public void setAtivo(Boolean ativo) {
        this.ativo = ativo;
    }
}