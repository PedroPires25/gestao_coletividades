package com.gestaoclubes.api.model;

import java.sql.Date;

public class ConsultaMedica {
    private int id;
    private int clubeId;
    private int atletaId;
    private Integer staffId;
    private Date dataConsulta;
    private String tipo;
    private String motivo;
    private String diagnostico;
    private String notas;

    public ConsultaMedica() {}

    public ConsultaMedica(int id, int clubeId, int atletaId, Integer staffId,
                          Date dataConsulta, String tipo, String motivo,
                          String diagnostico, String notas) {
        this.id = id;
        this.clubeId = clubeId;
        this.atletaId = atletaId;
        this.staffId = staffId;
        this.dataConsulta = dataConsulta;
        this.tipo = tipo;
        this.motivo = motivo;
        this.diagnostico = diagnostico;
        this.notas = notas;
    }

    public int getId() { return id; }
    public int getClubeId() { return clubeId; }
    public int getAtletaId() { return atletaId; }
    public Integer getStaffId() { return staffId; }
    public Date getDataConsulta() { return dataConsulta; }
    public String getTipo() { return tipo; }
    public String getMotivo() { return motivo; }
    public String getDiagnostico() { return diagnostico; }
    public String getNotas() { return notas; }
}
