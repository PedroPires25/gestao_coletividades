package com.gestaoclubes.api.controller;

import com.gestaoclubes.api.dao.AtletaDAO;
import com.gestaoclubes.api.dao.ClubeModalidadeDAO;
import com.gestaoclubes.api.dao.EventoAtletaDAO;
import com.gestaoclubes.api.dao.EventoDAO;
import com.gestaoclubes.api.model.ClubeModalidade;
import com.gestaoclubes.api.model.Evento;
import com.gestaoclubes.api.security.SecurityUtils;
import com.gestaoclubes.api.service.EmailService;
import com.gestaoclubes.api.service.TreinadorService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@RestController
@RequestMapping("/api")
public class TreinadorRestController {

    private final TreinadorService treinadorService;
    private final EmailService emailService;
    private final AtletaDAO atletaDAO = new AtletaDAO();
    private final EventoDAO eventoDAO = new EventoDAO();
    private final EventoAtletaDAO eventoAtletaDAO = new EventoAtletaDAO();
    private final ClubeModalidadeDAO clubeModalidadeDAO = new ClubeModalidadeDAO();

    public TreinadorRestController(EmailService emailService) {
        this.treinadorService = new TreinadorService();
        this.emailService = emailService;
    }

    // ==========================================
    // LISTAR ATLETAS DO CLUBE (para dropdowns)
    // ==========================================

    @GetMapping("/clubes/{clubeId}/treinador/atletas")
    public List<Map<String, Object>> listarAtletasDoClube(@PathVariable int clubeId) {
        exigirAcessoTreinador(clubeId);
        return atletaDAO.listarPorClube(clubeId);
    }

    @GetMapping("/clubes/{clubeId}/treinador/convocatorias/atletas")
    public List<Map<String, Object>> listarAtletasConvocatorias(@PathVariable int clubeId) {
        exigirTreinadorNoClube(clubeId);
        Integer clubeModalidadeId = exigirModalidadeTreinadorNoClube(clubeId);
        return atletaDAO.listarPorClubeModalidade(clubeId, clubeModalidadeId);
    }

    @GetMapping("/clubes/{clubeId}/treinador/convocatorias")
    public List<Map<String, Object>> listarConvocatorias(@PathVariable int clubeId) {
        exigirTreinadorNoClube(clubeId);
        Integer clubeModalidadeId = exigirModalidadeTreinadorNoClube(clubeId);

        return eventoDAO.listarPorClubeEModalidade(clubeId, clubeModalidadeId).stream()
                .peek(ev -> ev.put("subtipo", ev.get("observacoes")))
                .toList();
    }

    @GetMapping("/clubes/{clubeId}/treinador/convocatorias/{eventoId}/convocados")
    public List<Map<String, Object>> listarConvocadosConvocatoria(
            @PathVariable int clubeId,
            @PathVariable int eventoId
    ) {
        exigirTreinadorNoClube(clubeId);
        Integer clubeModalidadeId = exigirModalidadeTreinadorNoClube(clubeId);
        // Allow any trainer of this modalidade to view convocados (edit still requires ownership)
        Map<String, Object> evento = eventoDAO.buscarPorId(eventoId);
        if (evento == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Evento não encontrado.");
        }
        Integer eventoClubeModalidadeId = numeroParaInt(evento.get("clubeModalidadeId"));
        Integer eventoClubeId = numeroParaInt(evento.get("clubeId"));
        if (!Objects.equals(eventoClubeModalidadeId, clubeModalidadeId) || !Objects.equals(eventoClubeId, clubeId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Não tem permissão para ver este evento.");
        }
        if (!"MODALIDADE".equals(evento.get("tipo"))) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Apenas eventos de modalidade podem ser geridos no módulo Convocatórias.");
        }
        return eventoAtletaDAO.listarPorEvento(eventoId);
    }

    @PostMapping("/clubes/{clubeId}/treinador/convocatorias")
    public ResponseEntity<?> criarConvocatoria(
            @PathVariable int clubeId,
            @RequestBody Map<String, Object> payload
    ) {
        int treinadorId = exigirTreinadorNoClube(clubeId);
        Integer clubeModalidadeId = exigirModalidadeTreinadorNoClube(clubeId);

        String titulo = valorTexto(payload.get("titulo"));
        String local = valorTexto(payload.get("local"));
        String descricao = valorTexto(payload.get("descricao"));
        String subtipo = valorTexto(payload.get("subtipo"));
        if (titulo == null || local == null || subtipo == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "título, local e subtipo são obrigatórios.");
        }

        LocalDateTime inicio = extrairDataHoraInicio(payload);
        LocalDateTime fim = extrairDataHoraFim(payload, inicio);
        if (fim != null && fim.isBefore(inicio)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A hora de fim não pode ser anterior à hora de início.");
        }

        List<Integer> atletasConvocados = extrairIds(payload.get("atletasConvocados"));
        if (!atletaDAO.todosPertencemClubeModalidade(clubeModalidadeId, atletasConvocados)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Existem atletas fora da equipa/modalidade do treinador.");
        }

        Evento evento = new Evento(
                titulo,
                descricao,
                Timestamp.valueOf(inicio),
                local,
                subtipo,
                "MODALIDADE",
                clubeModalidadeId,
                null,
                treinadorId
        );
        if (fim != null) evento.setDataHoraFim(Timestamp.valueOf(fim));
        evento.setLatitude(extrairDouble(payload.get("latitude")));
        evento.setLongitude(extrairDouble(payload.get("longitude")));

        Integer eventoId = eventoDAO.inserirEDevolverId(evento);
        if (eventoId == null) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Erro ao criar evento.");
        }

        if (!atletasConvocados.isEmpty()) {
            eventoAtletaDAO.inserirMultiplos(eventoId, atletasConvocados);
        }

        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "id", eventoId,
                "mensagem", "Evento criado com sucesso."
        ));
    }

    @PutMapping("/clubes/{clubeId}/treinador/convocatorias/{eventoId}")
    public ResponseEntity<?> editarConvocatoria(
            @PathVariable int clubeId,
            @PathVariable int eventoId,
            @RequestBody Map<String, Object> payload
    ) {
        int treinadorId = exigirTreinadorNoClube(clubeId);
        Integer clubeModalidadeId = exigirModalidadeTreinadorNoClube(clubeId);
        validarEventoTreinador(eventoId, clubeId, clubeModalidadeId, treinadorId);

        String titulo = valorTexto(payload.get("titulo"));
        String local = valorTexto(payload.get("local"));
        String descricao = valorTexto(payload.get("descricao"));
        String subtipo = valorTexto(payload.get("subtipo"));
        if (titulo == null || local == null || subtipo == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "título, local e subtipo são obrigatórios.");
        }

        LocalDateTime inicio = extrairDataHoraInicio(payload);
        LocalDateTime fim = extrairDataHoraFim(payload, inicio);
        if (fim != null && fim.isBefore(inicio)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A hora de fim não pode ser anterior à hora de início.");
        }

        List<Integer> atletasConvocados = extrairIds(payload.get("atletasConvocados"));
        if (!atletaDAO.todosPertencemClubeModalidade(clubeModalidadeId, atletasConvocados)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Existem atletas fora da equipa/modalidade do treinador.");
        }

        Evento eventoAtualizado = new Evento(
                eventoId,
                titulo,
                descricao,
                Timestamp.valueOf(inicio),
                local,
                subtipo,
                "MODALIDADE",
                clubeModalidadeId,
                null,
                treinadorId
        );
        if (fim != null) eventoAtualizado.setDataHoraFim(Timestamp.valueOf(fim));
        eventoAtualizado.setLatitude(extrairDouble(payload.get("latitude")));
        eventoAtualizado.setLongitude(extrairDouble(payload.get("longitude")));

        boolean atualizado = eventoDAO.atualizar(eventoId, eventoAtualizado);
        if (!atualizado) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Erro ao atualizar evento.");
        }

        eventoAtletaDAO.removerTodos(eventoId);
        if (!atletasConvocados.isEmpty()) {
            eventoAtletaDAO.inserirMultiplos(eventoId, atletasConvocados);
        }

        return ResponseEntity.ok(Map.of("mensagem", "Evento atualizado com sucesso."));
    }

    // ==========================================
    // SESSÕES DE TREINO
    // ==========================================

    @GetMapping("/clubes/{clubeId}/treinador/sessoes")
    public List<Map<String, Object>> listarSessoes(@PathVariable int clubeId) {
        exigirAcessoTreinador(clubeId);
        return treinadorService.listarSessoes(clubeId);
    }

    @PostMapping("/clubes/{clubeId}/treinador/sessoes")
    public ResponseEntity<?> criarSessao(
            @PathVariable int clubeId,
            @RequestBody Map<String, Object> payload
    ) {
        exigirAcessoTreinador(clubeId);
        boolean ok = treinadorService.criarSessao(clubeId, payload);
        if (!ok) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Erro ao criar sessão de treino.");
        }
        return ResponseEntity.ok(Map.of("ok", true));
    }

    // ==========================================
    // ASSIDUIDADE
    // ==========================================

    @GetMapping("/clubes/{clubeId}/treinador/assiduidade")
    public List<Map<String, Object>> obterAssiduidade(
            @PathVariable int clubeId,
            @RequestParam String startDate,
            @RequestParam String endDate
    ) {
        exigirAcessoTreinador(clubeId);
        if (startDate == null || endDate == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "startDate e endDate são obrigatórios.");
        }
        return treinadorService.obterAssiduidade(clubeId, startDate, endDate);
    }

    // ==========================================
    // PLANOS DE TREINO
    // ==========================================

    @PostMapping("/clubes/{clubeId}/treinador/planos")
    public ResponseEntity<?> criarPlanoTreino(
            @PathVariable int clubeId,
            @RequestBody Map<String, Object> payload
    ) {
        exigirAcessoTreinador(clubeId);
        boolean ok = treinadorService.criarPlanoTreino(clubeId, payload, emailService);
        if (!ok) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Erro ao criar e enviar plano de treino.");
        }
        return ResponseEntity.ok(Map.of("ok", true));
    }

    // ==========================================
    // Helpers
    // ==========================================

    private void exigirAcessoTreinador(int clubeId) {
        if (SecurityUtils.isSuperAdmin()) return;
        if (SecurityUtils.canManageClube(clubeId)) return;
        String role = SecurityUtils.currentRole();
        // Assumindo que a role para treinador é ROLE_TREINADOR_PRINCIPAL (com base no perfis que foram inseridos no SQL)
        if ("ROLE_TREINADOR_PRINCIPAL".equals(role) && Integer.valueOf(clubeId).equals(SecurityUtils.currentClubeId())) return;
        
        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Sem permissão para aceder ao módulo de treinador deste clube.");
    }

    private int exigirTreinadorNoClube(int clubeId) {
        String role = SecurityUtils.currentRole();
        Integer treinadorId = SecurityUtils.currentUserId();
        Integer clubeAtual = SecurityUtils.currentClubeId();

        if (!"ROLE_TREINADOR_PRINCIPAL".equals(role)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Apenas treinadores podem gerir convocatórias.");
        }
        if (treinadorId == null || clubeAtual == null || clubeAtual != clubeId) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Sem permissão para gerir convocatórias deste clube.");
        }
        return treinadorId;
    }

    private Integer exigirModalidadeTreinadorNoClube(int clubeId) {
        Integer clubeModalidadeId = SecurityUtils.currentModalidadeId();
        if (clubeModalidadeId == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Treinador sem modalidade/equipa associada.");
        }

        ClubeModalidade clubeModalidade = clubeModalidadeDAO.buscarPorId(clubeModalidadeId);
        if (clubeModalidade == null || clubeModalidade.getClube() == null || clubeModalidade.getClube().getId() != clubeId) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "A modalidade/equipa não pertence ao clube autenticado.");
        }
        return clubeModalidadeId;
    }

    private Map<String, Object> validarEventoTreinador(int eventoId, int clubeId, int clubeModalidadeId, int treinadorId) {
        Map<String, Object> existente = eventoDAO.buscarPorId(eventoId);
        if (existente == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Evento não encontrado.");
        }

        Integer criadoPor = numeroParaInt(existente.get("criadoPor"));
        Integer eventoClubeId = numeroParaInt(existente.get("clubeId"));
        Integer eventoModalidadeId = numeroParaInt(existente.get("clubeModalidadeId"));
        String tipo = Objects.toString(existente.get("tipo"), null);

        boolean clubeCorreto = Objects.equals(eventoClubeId, clubeId);
        boolean modalidadeCorreta = Objects.equals(eventoModalidadeId, clubeModalidadeId);
        boolean tipoPermitido = "MODALIDADE".equals(tipo);

        if (!clubeCorreto || !modalidadeCorreta || !tipoPermitido) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Não tem permissão para gerir este evento.");
        }
        return existente;
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

    private Integer numeroParaInt(Object valor) {
        if (valor instanceof Number n) return n.intValue();
        return null;
    }

    private String valorTexto(Object value) {
        if (value == null) return null;
        String texto = String.valueOf(value).trim();
        return texto.isBlank() ? null : texto;
    }

    private Double extrairDouble(Object value) {
        if (value == null) return null;
        if (value instanceof Number n) return n.doubleValue();
        try {
            String texto = String.valueOf(value).trim();
            if (texto.isBlank()) return null;
            return Double.parseDouble(texto);
        } catch (NumberFormatException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Coordenadas inválidas.");
        }
    }

    private LocalDateTime extrairDataHoraInicio(Map<String, Object> payload) {
        String dataHora = valorTexto(payload.get("dataHora"));
        if (dataHora != null) return parseDataHora(dataHora, "dataHora");

        String data = valorTexto(payload.get("data"));
        String horaInicio = valorTexto(payload.get("horaInicio"));
        if (data == null || horaInicio == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Data e hora de início são obrigatórias.");
        }
        return combinarDataHora(data, horaInicio, "data/hora início");
    }

    private LocalDateTime extrairDataHoraFim(Map<String, Object> payload, LocalDateTime inicio) {
        String dataHoraFim = valorTexto(payload.get("dataHoraFim"));
        if (dataHoraFim != null) return parseDataHora(dataHoraFim, "dataHoraFim");

        String horaFim = valorTexto(payload.get("horaFim"));
        if (horaFim == null) return null;

        String data = valorTexto(payload.get("data"));
        String dataFim = valorTexto(payload.get("dataFim"));
        String dataBase = dataFim != null ? dataFim : (data != null ? data : inicio.toLocalDate().toString());
        return combinarDataHora(dataBase, horaFim, "data/hora fim");
    }

    private LocalDateTime combinarDataHora(String data, String hora, String campo) {
        try {
            LocalDate d = LocalDate.parse(data, DateTimeFormatter.ISO_LOCAL_DATE);
            LocalTime h = LocalTime.parse(hora, DateTimeFormatter.ofPattern("HH:mm"));
            return LocalDateTime.of(d, h);
        } catch (DateTimeParseException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Formato inválido para " + campo + ".");
        }
    }

    private LocalDateTime parseDataHora(String dataHora, String campo) {
        try {
            return LocalDateTime.parse(dataHora, DateTimeFormatter.ISO_LOCAL_DATE_TIME);
        } catch (DateTimeParseException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Formato inválido para " + campo + ".");
        }
    }
}