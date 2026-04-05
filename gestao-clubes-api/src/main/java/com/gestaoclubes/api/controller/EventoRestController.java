package com.gestaoclubes.api.controller;

import com.gestaoclubes.api.dao.EventoAtletaDAO;
import com.gestaoclubes.api.dao.EventoDAO;
import com.gestaoclubes.api.dao.EventoInscritoDAO;
import com.gestaoclubes.api.model.Evento;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/eventos")
public class EventoRestController {

    private final EventoDAO eventoDAO = new EventoDAO();
    private final EventoAtletaDAO eventoAtletaDAO = new EventoAtletaDAO();
    private final EventoInscritoDAO eventoInscritoDAO = new EventoInscritoDAO();

    /** GET /api/eventos — list all events */
    @GetMapping
    public ResponseEntity<?> listarTodos() {
        return ResponseEntity.ok(eventoDAO.listarTodos());
    }

    /** GET /api/eventos/{id} — get event by id */
    @GetMapping("/{id}")
    public ResponseEntity<?> obter(@PathVariable int id) {
        Map<String, Object> evento = eventoDAO.buscarPorId(id);
        if (evento == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("erro", "Evento não encontrado."));
        }
        return ResponseEntity.ok(evento);
    }

    /** GET /api/eventos/{id}/convocados — list convocados for an event */
    @GetMapping("/{id}/convocados")
    public ResponseEntity<?> listarConvocados(@PathVariable int id) {
        Map<String, Object> evento = eventoDAO.buscarPorId(id);
        if (evento == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("erro", "Evento não encontrado."));
        }

        String tipo = (String) evento.get("tipo");
        if ("MODALIDADE".equals(tipo)) {
            return ResponseEntity.ok(eventoAtletaDAO.listarPorEvento(id));
        } else {
            return ResponseEntity.ok(eventoInscritoDAO.listarPorEvento(id));
        }
    }

    /** GET /api/eventos/por-clube/{clubeId} — list all events for a club */
    @GetMapping("/por-clube/{clubeId}")
    public ResponseEntity<?> listarPorClube(@PathVariable int clubeId) {
        return ResponseEntity.ok(eventoDAO.listarPorClube(clubeId));
    }

    /** GET /api/eventos/clube/{clubeModalidadeId} — list events by clube_modalidade */
    @GetMapping("/clube/{clubeModalidadeId}")
    public ResponseEntity<?> listarPorClubeModalidade(@PathVariable int clubeModalidadeId) {
        return ResponseEntity.ok(eventoDAO.listarPorClubeModalidade(clubeModalidadeId));
    }

    /** GET /api/eventos/coletividade/{coletividadeAtividadeId} — list events by coletividade_atividade */
    @GetMapping("/coletividade/{coletividadeAtividadeId}")
    public ResponseEntity<?> listarPorColetividadeAtividade(@PathVariable int coletividadeAtividadeId) {
        return ResponseEntity.ok(eventoDAO.listarPorColetividadeAtividade(coletividadeAtividadeId));
    }
}
