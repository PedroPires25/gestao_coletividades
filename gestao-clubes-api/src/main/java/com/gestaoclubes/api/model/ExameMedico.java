package com.gestaoclubes.api.model;

import java.sql.Date;

public class ExameMedico {
    private int id;
    private int clubeId;
    private int atletaId;
    private Integer staffId;
    private Date dataExame;
    private String tipo;
    private String resultado;
    private String ficheiroPath;
    private String notas;

    public ExameMedico() {}

    public ExameMedico(int id, int clubeId, int atletaId, Integer staffId,
                       Date dataExame, String tipo, String resultado,
                       String ficheiroPath, String notas) {
        this.id = id;
        this.clubeId = clubeId;
        this.atletaId = atletaId;
        this.staffId = staffId;
        this.dataExame = dataExame;
        this.tipo = tipo;
        this.resultado = resultado;
        this.ficheiroPath = ficheiroPath;
        this.notas = notas;
    }

    public int getId() { return id; }
    public int getClubeId() { return clubeId; }
    public int getAtletaId() { return atletaId; }
    public Integer getStaffId() { return staffId; }
    public Date getDataExame() { return dataExame; }
    public String getTipo() { return tipo; }
    public String getResultado() { return resultado; }
    public String getFicheiroPath() { return ficheiroPath; }
    public String getNotas() { return notas; }
    public void setFicheiroPath(String ficheiroPath) { this.ficheiroPath = ficheiroPath; }
}
