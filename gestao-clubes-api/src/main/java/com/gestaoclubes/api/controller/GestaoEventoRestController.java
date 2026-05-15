package com.gestaoclubes.api.controller;

import com.gestaoclubes.api.dao.*;
import com.gestaoclubes.api.model.ClubeModalidade;
import com.gestaoclubes.api.model.ColetividadeAtividade;
import com.gestaoclubes.api.model.Evento;
import com.gestaoclubes.api.security.SecurityUtils;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@RestController
@RequestMapping("/api/gestao/eventos")
public class GestaoEventoRestController {

    private final EventoDAO eventoDAO = new EventoDAO();
    private final EventoAtletaDAO eventoAtletaDAO = new EventoAtletaDAO();
    private final EventoInscritoDAO eventoInscritoDAO = new EventoInscritoDAO();
    private final ClubeModalidadeDAO clubeModalidadeDAO = new ClubeModalidadeDAO();
    private final ColetividadeAtividadeDAO coletividadeAtividadeDAO = new ColetividadeAtividadeDAO();

    private boolean canManageEventos() {
        return SecurityUtils.isSuperAdmin()
                || SecurityUtils.isAdministradorEstrutura()
                || isSecretario()
                || isTreinadorPrincipal()
                || isProfessor();
    }

    private ResponseEntity<?> forbidden() {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(Map.of("erro", "Acesso negado. Apenas utilizadores com permissão na respetiva estrutura, modalidade ou atividade podem gerir eventos."));
    }

    /** GET /api/gestao/eventos — list all events */
    @GetMapping
    public ResponseEntity<?> listarTodos() {
        if (!canManageEventos()) return forbidden();

        if (SecurityUtils.isSuperAdmin()) {
            return ResponseEntity.ok(eventoDAO.listarTodos());
        }

        return ResponseEntity.ok(
                eventoDAO.listarTodos().stream()
                        .filter(this::canManageEvento)
                        .toList()
        );
    }

    /** GET /api/gestao/eventos/{id} — get single event */
    @GetMapping("/{id}")
    public ResponseEntity<?> obter(@PathVariable int id) {
        if (!canManageEventos()) return forbidden();

        Map<String, Object> evento = eventoDAO.buscarPorId(id);
        if (evento == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("erro", "Evento não encontrado."));
        }
        if (!canManageEvento(evento)) return forbidden();
        return ResponseEntity.ok(evento);
    }

    /** POST /api/gestao/eventos — create event */
    @PostMapping
    public ResponseEntity<?> criar(@RequestBody Map<String, Object> body) {
        if (!canManageEventos()) return forbidden();

        String titulo = (String) body.get("titulo");
        String descricao = (String) body.get("descricao");
        String dataHoraStr = (String) body.get("dataHora");
        String local = (String) body.get("local");
        String observacoes = (String) body.get("observacoes");
        String tipo = (String) body.get("tipo");

        if (titulo == null || titulo.isBlank() || dataHoraStr == null || local == null || local.isBlank()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("erro", "Título, data/hora e local são obrigatórios."));
        }

        if (tipo == null || (!tipo.equals("MODALIDADE") && !tipo.equals("ATIVIDADE"))) {
            return ResponseEntity.badRequest()
                    .body(Map.of("erro", "Tipo deve ser MODALIDADE ou ATIVIDADE."));
        }

        Timestamp dataHora;
        try {
            LocalDateTime ldt = LocalDateTime.parse(dataHoraStr, DateTimeFormatter.ISO_LOCAL_DATE_TIME);
            dataHora = Timestamp.valueOf(ldt);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("erro", "Formato de data inválido. Use ISO 8601."));
        }

        Integer clubeModalidadeId = null;
        Integer coletividadeAtividadeId = null;

        if ("MODALIDADE".equals(tipo)) {
            Object cmIdObj = body.get("clubeModalidadeId");
            if (cmIdObj == null) {
                return ResponseEntity.badRequest().body(Map.of("erro", "clubeModalidadeId é obrigatório para tipo MODALIDADE."));
            }
            clubeModalidadeId = ((Number) cmIdObj).intValue();
            if (!canManageClubeModalidade(clubeModalidadeId)) return forbidden();
        } else {
            Object caIdObj = body.get("coletividadeAtividadeId");
            if (caIdObj == null) {
                return ResponseEntity.badRequest().body(Map.of("erro", "coletividadeAtividadeId é obrigatório para tipo ATIVIDADE."));
            }
            coletividadeAtividadeId = ((Number) caIdObj).intValue();
            if (!canManageColetividadeAtividade(coletividadeAtividadeId)) return forbidden();
        }

        int criadoPor = SecurityUtils.currentUserId();

        Double latitude = body.get("latitude") != null ? ((Number) body.get("latitude")).doubleValue() : null;
        Double longitude = body.get("longitude") != null ? ((Number) body.get("longitude")).doubleValue() : null;

        Evento evento = new Evento(titulo, descricao, dataHora, local, observacoes, tipo,
                clubeModalidadeId, coletividadeAtividadeId, criadoPor);
        evento.setLatitude(latitude);
        evento.setLongitude(longitude);

        // Data/hora fim (opcional)
        String dataHoraFimStr = (String) body.get("dataHoraFim");
        if (dataHoraFimStr != null && !dataHoraFimStr.isBlank()) {
            try {
                LocalDateTime ldtFim = LocalDateTime.parse(dataHoraFimStr, DateTimeFormatter.ISO_LOCAL_DATE_TIME);
                evento.setDataHoraFim(Timestamp.valueOf(ldtFim));
            } catch (Exception e) {
                return ResponseEntity.badRequest().body(Map.of("erro", "Formato de data/hora fim inválido."));
            }
        }

        Integer eventoId = eventoDAO.inserirEDevolverId(evento);
        if (eventoId == null) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("erro", "Erro ao criar evento."));
        }

        // Save convocados
        List<Integer> convocados = extrairIds(body.get("convocados"));
        if (!convocados.isEmpty()) {
            if ("MODALIDADE".equals(tipo)) {
                eventoAtletaDAO.inserirMultiplos(eventoId, convocados);
            } else {
                eventoInscritoDAO.inserirMultiplos(eventoId, convocados);
            }
        }

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(Map.of("id", eventoId, "mensagem", "Evento criado com sucesso."));
    }

    /** PUT /api/gestao/eventos/{id} — update event */
    @PutMapping("/{id}")
    public ResponseEntity<?> atualizar(@PathVariable int id, @RequestBody Map<String, Object> body) {
        if (!canManageEventos()) return forbidden();

        Map<String, Object> existente = eventoDAO.buscarPorId(id);
        if (existente == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("erro", "Evento não encontrado."));
        }
        if (!canManageEvento(existente)) return forbidden();

        String titulo = (String) body.get("titulo");
        String descricao = (String) body.get("descricao");
        String dataHoraStr = (String) body.get("dataHora");
        String local = (String) body.get("local");
        String observacoes = (String) body.get("observacoes");

        if (titulo == null || titulo.isBlank() || dataHoraStr == null || local == null || local.isBlank()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("erro", "Título, data/hora e local são obrigatórios."));
        }

        Timestamp dataHora;
        try {
            LocalDateTime ldt = LocalDateTime.parse(dataHoraStr, DateTimeFormatter.ISO_LOCAL_DATE_TIME);
            dataHora = Timestamp.valueOf(ldt);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("erro", "Formato de data inválido."));
        }

        String tipo = (String) existente.get("tipo");
        Integer clubeModalidadeId = existente.get("clubeModalidadeId") != null
                ? ((Number) existente.get("clubeModalidadeId")).intValue() : null;
        Integer coletividadeAtividadeId = existente.get("coletividadeAtividadeId") != null
                ? ((Number) existente.get("coletividadeAtividadeId")).intValue() : null;

        Evento eventoAtualizado = new Evento(id, titulo, descricao, dataHora, local, observacoes,
                tipo, clubeModalidadeId, coletividadeAtividadeId,
                ((Number) existente.get("criadoPor")).intValue());

        Double latitude = body.get("latitude") != null ? ((Number) body.get("latitude")).doubleValue() : null;
        Double longitude = body.get("longitude") != null ? ((Number) body.get("longitude")).doubleValue() : null;
        eventoAtualizado.setLatitude(latitude);
        eventoAtualizado.setLongitude(longitude);

        // Data/hora fim (opcional)
        String dataHoraFimStr = (String) body.get("dataHoraFim");
        if (dataHoraFimStr != null && !dataHoraFimStr.isBlank()) {
            try {
                LocalDateTime ldtFim = LocalDateTime.parse(dataHoraFimStr, DateTimeFormatter.ISO_LOCAL_DATE_TIME);
                eventoAtualizado.setDataHoraFim(Timestamp.valueOf(ldtFim));
            } catch (Exception e) {
                return ResponseEntity.badRequest().body(Map.of("erro", "Formato de data/hora fim inválido."));
            }
        }

        boolean ok = eventoDAO.atualizar(id, eventoAtualizado);
        if (!ok) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("erro", "Erro ao atualizar evento."));
        }

        // Replace convocados if provided
        if (body.containsKey("convocados")) {
            List<Integer> convocados = extrairIds(body.get("convocados"));
            if ("MODALIDADE".equals(tipo)) {
                eventoAtletaDAO.removerTodos(id);
                if (!convocados.isEmpty()) eventoAtletaDAO.inserirMultiplos(id, convocados);
            } else {
                eventoInscritoDAO.removerTodos(id);
                if (!convocados.isEmpty()) eventoInscritoDAO.inserirMultiplos(id, convocados);
            }
        }

        return ResponseEntity.ok(Map.of("mensagem", "Evento atualizado com sucesso."));
    }

    /** DELETE /api/gestao/eventos/{id} — delete event */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> remover(@PathVariable int id) {
        if (!canManageEventos()) return forbidden();

        Map<String, Object> existente = eventoDAO.buscarPorId(id);
        if (existente == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("erro", "Evento não encontrado."));
        }
        if (!canManageEvento(existente)) return forbidden();

        // Remove convocados first (also handled by CASCADE, but explicit for safety)
        String tipo = (String) existente.get("tipo");
        if ("MODALIDADE".equals(tipo)) {
            eventoAtletaDAO.removerTodos(id);
        } else {
            eventoInscritoDAO.removerTodos(id);
        }

        boolean ok = eventoDAO.remover(id);
        if (!ok) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("erro", "Erro ao eliminar evento."));
        }

        return ResponseEntity.ok(Map.of("mensagem", "Evento eliminado com sucesso."));
    }

    /** GET /api/gestao/eventos/{id}/convocados — get convocados */
    @GetMapping("/{id}/convocados")
    public ResponseEntity<?> listarConvocados(@PathVariable int id) {
        if (!canManageEventos()) return forbidden();

        Map<String, Object> evento = eventoDAO.buscarPorId(id);
        if (evento == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("erro", "Evento não encontrado."));
        }
        if (!canManageEvento(evento)) return forbidden();

        String tipo = (String) evento.get("tipo");
        if ("MODALIDADE".equals(tipo)) {
            return ResponseEntity.ok(eventoAtletaDAO.listarPorEvento(id));
        } else {
            return ResponseEntity.ok(eventoInscritoDAO.listarPorEvento(id));
        }
    }

    /** PUT /api/gestao/eventos/{id}/convocados — replace convocados list */
    @PutMapping("/{id}/convocados")
    public ResponseEntity<?> atualizarConvocados(@PathVariable int id, @RequestBody Map<String, Object> body) {
        if (!canManageEventos()) return forbidden();

        Map<String, Object> evento = eventoDAO.buscarPorId(id);
        if (evento == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("erro", "Evento não encontrado."));
        }
        if (!canManageEvento(evento)) return forbidden();

        List<Integer> convocados = extrairIds(body.get("convocados"));
        String tipo = (String) evento.get("tipo");

        if ("MODALIDADE".equals(tipo)) {
            eventoAtletaDAO.removerTodos(id);
            if (!convocados.isEmpty()) eventoAtletaDAO.inserirMultiplos(id, convocados);
        } else {
            eventoInscritoDAO.removerTodos(id);
            if (!convocados.isEmpty()) eventoInscritoDAO.inserirMultiplos(id, convocados);
        }

        return ResponseEntity.ok(Map.of("mensagem", "Convocados atualizados com sucesso."));
    }

    @SuppressWarnings("unchecked")
    private List<Integer> extrairIds(Object obj) {
        if (obj == null) return Collections.emptyList();
        List<Integer> ids = new ArrayList<>();
        if (obj instanceof List<?> list) {
            for (Object item : list) {
                if (item instanceof Number n) ids.add(n.intValue());
            }
        }
        return ids;
    }

    private boolean canManageEvento(Map<String, Object> evento) {
        if (SecurityUtils.isSuperAdmin()) {
            return true;
        }

        String tipo = (String) evento.get("tipo");
        if ("MODALIDADE".equals(tipo) && evento.get("clubeModalidadeId") instanceof Number numero) {
            return canManageClubeModalidade(numero.intValue());
        }
        if ("ATIVIDADE".equals(tipo) && evento.get("coletividadeAtividadeId") instanceof Number numero) {
            return canManageColetividadeAtividade(numero.intValue());
        }
        return false;
    }

    private boolean canManageClubeModalidade(Integer clubeModalidadeId) {
        ClubeModalidade clubeModalidade = clubeModalidadeDAO.buscarPorId(clubeModalidadeId);
        if (clubeModalidade == null || clubeModalidade.getClube() == null) return false;

        Integer clubeId = clubeModalidade.getClube().getId();
        if (clubeId == null) return false;
        if (SecurityUtils.isSuperAdmin()) return true;

        if (SecurityUtils.isAdministradorEstrutura() || isSecretario()) {
            return clubeId.equals(SecurityUtils.currentClubeId());
        }

        if ((isTreinadorPrincipal() || isProfessor())
                && clubeId.equals(SecurityUtils.currentClubeId())) {
            Integer modalidadeAtual = SecurityUtils.currentModalidadeId();
            return modalidadeAtual != null && modalidadeAtual.equals(clubeModalidadeId);
        }

        return false;
    }

    private boolean canManageColetividadeAtividade(Integer coletividadeAtividadeId) {
        ColetividadeAtividade associacao = coletividadeAtividadeDAO.obterPorId(coletividadeAtividadeId);
        if (associacao == null) return false;

        Integer coletividadeId = associacao.getColetividadeId();
        if (coletividadeId == null) return false;
        if (SecurityUtils.isSuperAdmin()) return true;

        if (SecurityUtils.isAdministradorEstrutura() || isSecretario()) {
            return coletividadeId.equals(SecurityUtils.currentColetividadeId());
        }

        if (isProfessor() && coletividadeId.equals(SecurityUtils.currentColetividadeId())) {
            Integer atividadeAtual = SecurityUtils.currentAtividadeId();
            return atividadeAtual != null && atividadeAtual.equals(coletividadeAtividadeId);
        }

        return false;
    }

    private boolean isSecretario() {
        return "ROLE_SECRETARIO".equals(SecurityUtils.currentRole());
    }

    private boolean isTreinadorPrincipal() {
        return "ROLE_TREINADOR_PRINCIPAL".equals(SecurityUtils.currentRole());
    }

    private boolean isProfessor() {
        return "ROLE_PROFESSOR".equals(SecurityUtils.currentRole());
    }
}
