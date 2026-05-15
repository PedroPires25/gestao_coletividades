package com.gestaoclubes.api.model;

import java.sql.Date;

public class RegistoLesao {
    private int id;
    private int clubeId;
    private int atletaId;
    private Integer staffId;
    private String tipo;
    private String parteCorpo;
    private String gravidade;
    private Date dataLesao;
    private Date dataRetornoPrevista;
    private Date dataRetornoEfetiva;
    private String descricao;
    private String tratamento;

    public RegistoLesao() {}

    public RegistoLesao(int id, int clubeId, int atletaId, Integer staffId,
                        String tipo, String parteCorpo, String gravidade,
                        Date dataLesao, Date dataRetornoPrevista, Date dataRetornoEfetiva,
                        String descricao, String tratamento) {
        this.id = id;
        this.clubeId = clubeId;
        this.atletaId = atletaId;
        this.staffId = staffId;
        this.tipo = tipo;
        this.parteCorpo = parteCorpo;
        this.gravidade = gravidade;
        this.dataLesao = dataLesao;
        this.dataRetornoPrevista = dataRetornoPrevista;
        this.dataRetornoEfetiva = dataRetornoEfetiva;
        this.descricao = descricao;
        this.tratamento = tratamento;
    }

    public int getId() { return id; }
    public int getClubeId() { return clubeId; }
    public int getAtletaId() { return atletaId; }
    public Integer getStaffId() { return staffId; }
    public String getTipo() { return tipo; }
    public String getParteCorpo() { return parteCorpo; }
    public String getGravidade() { return gravidade; }
    public Date getDataLesao() { return dataLesao; }
    public Date getDataRetornoPrevista() { return dataRetornoPrevista; }
    public Date getDataRetornoEfetiva() { return dataRetornoEfetiva; }
    public String getDescricao() { return descricao; }
    public String getTratamento() { return tratamento; }
}
