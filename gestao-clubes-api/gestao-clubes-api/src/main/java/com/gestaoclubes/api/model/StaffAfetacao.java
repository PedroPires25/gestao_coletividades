package com.gestaoclubes.api.model;

import java.util.Date;

public class StaffAfetacao {
    private int id;
    private Staff staff;
    private Clube clube;
    private ClubeModalidade clubeModalidade; // pode ser null
    private CargoStaff cargo;
    private Date dataInicio;
    private Date dataFim;
    private String observacoes;

    public StaffAfetacao(int id, Staff staff, Clube clube, ClubeModalidade cm, CargoStaff cargo,
                         Date dataInicio, Date dataFim, String observacoes) {
        this.id = id;
        this.staff = staff;
        this.clube = clube;
        this.clubeModalidade = cm;
        this.cargo = cargo;
        this.dataInicio = dataInicio;
        this.dataFim = dataFim;
        this.observacoes = observacoes;
    }

    public StaffAfetacao(Staff staff, Clube clube, ClubeModalidade cm, CargoStaff cargo,
                         Date dataInicio, Date dataFim, String observacoes) {
        this(0, staff, clube, cm, cargo, dataInicio, dataFim, observacoes);
    }

    public int getId() { return id; }
    public Staff getStaff() { return staff; }
    public Clube getClube() { return clube; }
    public ClubeModalidade getClubeModalidade() { return clubeModalidade; }
    public CargoStaff getCargo() { return cargo; }
    public Date getDataInicio() { return dataInicio; }
    public Date getDataFim() { return dataFim; }
    public String getObservacoes() { return observacoes; }
}
