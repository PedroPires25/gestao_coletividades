package com.gestaoclubes.api.model;

public class EventoAtleta {
    private int eventoId;
    private int atletaId;

    public EventoAtleta(int eventoId, int atletaId) {
        this.eventoId = eventoId;
        this.atletaId = atletaId;
    }

    public int getEventoId() { return eventoId; }
    public int getAtletaId() { return atletaId; }
}
