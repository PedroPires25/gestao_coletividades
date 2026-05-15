package com.gestaoclubes.api.model;

import java.sql.Date;

public class RelatorioMedico {
    private int id;
    private int clubeId;
    private int atletaId;
    private Integer staffId;
    private Date dataRelatorio;
    private String tipo;
    private String conteudo;
    private boolean confidencial;

    public RelatorioMedico() {}

    public RelatorioMedico(int id, int clubeId, int atletaId, Integer staffId,
                           Date dataRelatorio, String tipo, String conteudo, boolean confidencial) {
        this.id = id;
        this.clubeId = clubeId;
        this.atletaId = atletaId;
        this.staffId = staffId;
        this.dataRelatorio = dataRelatorio;
        this.tipo = tipo;
        this.conteudo = conteudo;
        this.confidencial = confidencial;
    }

    public int getId() { return id; }
    public int getClubeId() { return clubeId; }
    public int getAtletaId() { return atletaId; }
    public Integer getStaffId() { return staffId; }
    public Date getDataRelatorio() { return dataRelatorio; }
    public String getTipo() { return tipo; }
    public String getConteudo() { return conteudo; }
    public boolean isConfidencial() { return confidencial; }
}
