package com.gestaoclubes.api.controller;

import com.gestaoclubes.api.dao.EventoColetividadeDAO;
import com.gestaoclubes.api.security.SecurityUtils;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;
import java.util.Objects;

@RestController
@RequestMapping("/api/coletividades")
public class EventoColetividadeRestController {

    private final EventoColetividadeDAO eventoDAO;

    public EventoColetividadeRestController(EventoColetividadeDAO eventoDAO) {
        this.eventoDAO = eventoDAO;
    }

    public static class EventoRequest {
        public Integer coletividadeAtividadeId;
        public String titulo;
        public String descricao;
        public String dataEvento;
        public String horaInicio;
        public String horaFim;
        public String localEvento;
        public String responsavel;
        public Integer maxParticipantes;
        public Boolean permiteInscricao;
        public String estado;
    }

    public static class InscricaoRequest {
        public Integer inscritoId;
        public Integer utilizadorId;
        public String nomeParticipante;
    }

    @GetMapping("/{coletividadeId}/eventos")
    public ResponseEntity<List<Map<String, Object>>> listarEventos(
            @PathVariable int coletividadeId,
            @RequestParam(required = false) String estado,
            @RequestParam(required = false) Integer coletividadeAtividadeId
    ) {
        return ResponseEntity.ok(eventoDAO.listarEventos(coletividadeId, estado, coletividadeAtividadeId));
    }

    @PostMapping("/{coletividadeId}/eventos")
    public ResponseEntity<?> criarEvento(
            @PathVariable int coletividadeId,
            @RequestBody EventoRequest body
    ) {
        exigirGestaoEventos(coletividadeId);
        if (SecurityUtils.isProfessorOuTreinadorColetividade()) {
            Integer professorAtividadeId = SecurityUtils.currentAtividadeId();
            if (professorAtividadeId == null || !professorAtividadeId.equals(body.coletividadeAtividadeId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("Professor/Treinador só pode criar eventos para a sua atividade.");
            }
        }
        String erro = validarEvento(body);
        if (erro != null) {
            return ResponseEntity.badRequest().body(erro);
        }

        int id = eventoDAO.criarEvento(
                coletividadeId,
                body.coletividadeAtividadeId,
                body.titulo.trim(),
                body.descricao,
                body.dataEvento,
                body.horaInicio,
                body.horaFim,
                body.localEvento,
                body.responsavel,
                body.maxParticipantes,
                Boolean.TRUE.equals(body.permiteInscricao),
                body.estado,
                SecurityUtils.currentUserId()
        );

        if (id <= 0) {
            return ResponseEntity.badRequest().body("Não foi possível criar o evento.");
        }

        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("id", id));
    }

    @PutMapping("/{coletividadeId}/eventos/{eventoId}")
    public ResponseEntity<?> atualizarEvento(
            @PathVariable int coletividadeId,
            @PathVariable int eventoId,
            @RequestBody EventoRequest body
    ) {
        exigirGestaoEventos(coletividadeId);
        if (!eventoDAO.eventoPertenceColetividade(coletividadeId, eventoId)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Evento não encontrado.");
        }
        if (SecurityUtils.isProfessorOuTreinadorColetividade()) {
            Map<String, Object> eventoAtual = eventoDAO.obterEvento(eventoId);
            Integer professorAtividadeId = SecurityUtils.currentAtividadeId();
            Object raw = eventoAtual != null ? eventoAtual.get("coletividadeAtividadeId") : null;
            Integer eventoAtividadeId = raw instanceof Number n ? n.intValue() : null;
            if (professorAtividadeId == null || !professorAtividadeId.equals(eventoAtividadeId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("Professor/Treinador só pode gerir eventos da sua atividade.");
            }
        }

        String erro = validarEvento(body);
        if (erro != null) {
            return ResponseEntity.badRequest().body(erro);
        }

        boolean ok = eventoDAO.atualizarEvento(
                eventoId,
                body.titulo.trim(),
                body.descricao,
                body.dataEvento,
                body.horaInicio,
                body.horaFim,
                body.localEvento,
                body.responsavel,
                body.maxParticipantes,
                Boolean.TRUE.equals(body.permiteInscricao),
                body.estado
        );

        return ok
                ? ResponseEntity.ok().body("Evento atualizado com sucesso.")
                : ResponseEntity.badRequest().body("Não foi possível atualizar o evento.");
    }

    @DeleteMapping("/{coletividadeId}/eventos/{eventoId}")
    public ResponseEntity<?> eliminarEvento(
            @PathVariable int coletividadeId,
            @PathVariable int eventoId
    ) {
        exigirGestaoEventos(coletividadeId);
        if (!eventoDAO.eventoPertenceColetividade(coletividadeId, eventoId)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Evento não encontrado.");
        }
        if (SecurityUtils.isProfessorOuTreinadorColetividade()) {
            Map<String, Object> eventoAtual = eventoDAO.obterEvento(eventoId);
            Integer professorAtividadeId = SecurityUtils.currentAtividadeId();
            Object raw = eventoAtual != null ? eventoAtual.get("coletividadeAtividadeId") : null;
            Integer eventoAtividadeId = raw instanceof Number n ? n.intValue() : null;
            if (professorAtividadeId == null || !professorAtividadeId.equals(eventoAtividadeId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("Professor/Treinador só pode gerir eventos da sua atividade.");
            }
        }

        return eventoDAO.eliminarEvento(eventoId)
                ? ResponseEntity.ok().body("Evento eliminado com sucesso.")
                : ResponseEntity.badRequest().body("Não foi possível eliminar o evento.");
    }

    @GetMapping("/{coletividadeId}/eventos/{eventoId}/inscricoes")
    public ResponseEntity<?> listarInscricoes(
            @PathVariable int coletividadeId,
            @PathVariable int eventoId
    ) {
        if (!eventoDAO.eventoPertenceColetividade(coletividadeId, eventoId)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Evento não encontrado.");
        }
        return ResponseEntity.ok(eventoDAO.listarInscricoes(eventoId));
    }

    @PostMapping("/{coletividadeId}/eventos/{eventoId}/inscricoes")
    public ResponseEntity<?> inscreverParticipante(
            @PathVariable int coletividadeId,
            @PathVariable int eventoId,
            @RequestBody InscricaoRequest body
    ) {
        if (!eventoDAO.eventoPertenceColetividade(coletividadeId, eventoId)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Evento não encontrado.");
        }

        Map<String, Object> evento = eventoDAO.obterEvento(eventoId);
        if (evento == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Evento não encontrado.");
        }
        if (!Boolean.TRUE.equals(evento.get("permiteInscricao"))) {
            return ResponseEntity.badRequest().body("Este evento não permite inscrições.");
        }
        if (!"Aberto".equals(String.valueOf(evento.get("estado")))) {
            return ResponseEntity.badRequest().body("As inscrições para este evento não estão abertas.");
        }

        String nomeParticipante = body == null ? null : body.nomeParticipante;
        Integer inscritoId = body == null ? null : body.inscritoId;
        Integer utilizadorId = body == null ? SecurityUtils.currentUserId() : body.utilizadorId;
        if (utilizadorId == null) {
            utilizadorId = SecurityUtils.currentUserId();
        }

        if ((nomeParticipante == null || nomeParticipante.isBlank()) && inscritoId == null) {
            return ResponseEntity.badRequest().body("Indica um participante para efetuar a inscrição.");
        }

        int id = eventoDAO.inscreverParticipante(eventoId, inscritoId, utilizadorId, nomeParticipante);
        if (id <= 0) {
            return ResponseEntity.badRequest().body("Não foi possível efetuar a inscrição.");
        }

        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("id", id));
    }

    @DeleteMapping("/{coletividadeId}/eventos/{eventoId}/inscricoes/{inscricaoId}")
    public ResponseEntity<?> cancelarInscricao(
            @PathVariable int coletividadeId,
            @PathVariable int eventoId,
            @PathVariable int inscricaoId
    ) {
        if (!eventoDAO.eventoPertenceColetividade(coletividadeId, eventoId)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Evento não encontrado.");
        }
        if (eventoDAO.obterInscricao(eventoId, inscricaoId) == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Inscrição não encontrada.");
        }

        return eventoDAO.cancelarInscricaoPorId(eventoId, inscricaoId)
                ? ResponseEntity.ok().body("Inscrição cancelada com sucesso.")
                : ResponseEntity.badRequest().body("Não foi possível cancelar a inscrição.");
    }

    private String validarEvento(EventoRequest body) {
        if (body == null) return "Pedido inválido.";
        if (body.titulo == null || body.titulo.isBlank()) return "O título é obrigatório.";
        if (body.dataEvento == null || body.dataEvento.isBlank()) return "A data do evento é obrigatória.";
        if (body.maxParticipantes != null && body.maxParticipantes < 0) return "O máximo de participantes é inválido.";
        return null;
    }

    private void exigirGestaoEventos(int coletividadeId) {
        boolean podeGerir = SecurityUtils.canManageColetividade(coletividadeId)
                || (SecurityUtils.isSecretario() && Objects.equals(SecurityUtils.currentColetividadeId(), coletividadeId))
                || (SecurityUtils.isProfessorOuTreinadorColetividade() && Objects.equals(SecurityUtils.currentColetividadeId(), coletividadeId));

        if (!podeGerir) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Sem permissão para gerir eventos desta coletividade.");
        }
    }
}
