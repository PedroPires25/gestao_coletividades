package com.gestaoclubes.api.model;

import java.sql.Date;

public class Prescricao {
    private int id;
    private int clubeId;
    private int atletaId;
    private Integer staffId;
    private Integer consultaId;
    private String medicamento;
    private String dosagem;
    private String frequencia;
    private Date dataInicio;
    private Date dataFim;
    private String notas;

    public Prescricao() {}

    public Prescricao(int id, int clubeId, int atletaId, Integer staffId, Integer consultaId,
                      String medicamento, String dosagem, String frequencia,
                      Date dataInicio, Date dataFim, String notas) {
        this.id = id;
        this.clubeId = clubeId;
        this.atletaId = atletaId;
        this.staffId = staffId;
        this.consultaId = consultaId;
        this.medicamento = medicamento;
        this.dosagem = dosagem;
        this.frequencia = frequencia;
        this.dataInicio = dataInicio;
        this.dataFim = dataFim;
        this.notas = notas;
    }

    public int getId() { return id; }
    public int getClubeId() { return clubeId; }
    public int getAtletaId() { return atletaId; }
    public Integer getStaffId() { return staffId; }
    public Integer getConsultaId() { return consultaId; }
    public String getMedicamento() { return medicamento; }
    public String getDosagem() { return dosagem; }
    public String getFrequencia() { return frequencia; }
    public Date getDataInicio() { return dataInicio; }
    public Date getDataFim() { return dataFim; }
    public String getNotas() { return notas; }
}
