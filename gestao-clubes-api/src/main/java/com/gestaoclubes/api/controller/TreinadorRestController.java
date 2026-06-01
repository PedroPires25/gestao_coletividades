package com.gestaoclubes.api.controller;

import com.gestaoclubes.api.dao.AtletaDAO;
import com.gestaoclubes.api.dao.ClubeModalidadeDAO;
import com.gestaoclubes.api.dao.EscalaoDAO;
import com.gestaoclubes.api.dao.EventoAtletaDAO;
import com.gestaoclubes.api.dao.EventoDAO;
import com.gestaoclubes.api.dao.StaffAfetacaoEscalaoDAO;
import com.gestaoclubes.api.model.ClubeModalidade;
import com.gestaoclubes.api.model.Evento;
import com.gestaoclubes.api.security.SecurityUtils;
import com.gestaoclubes.api.service.ConvocatoriaNotificacaoService;
import com.gestaoclubes.api.service.EmailService;
import com.gestaoclubes.api.service.TreinadorService;
import org.springframework.beans.factory.annotation.Autowired;
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
    @Autowired
    private ConvocatoriaNotificacaoService notificacaoService;
    private final AtletaDAO atletaDAO = new AtletaDAO();
    private final EventoDAO eventoDAO = new EventoDAO();
    private final EventoAtletaDAO eventoAtletaDAO = new EventoAtletaDAO();
    private final ClubeModalidadeDAO clubeModalidadeDAO = new ClubeModalidadeDAO();
    private final EscalaoDAO escalaoDAO = new EscalaoDAO();
    private final StaffAfetacaoEscalaoDAO staffAfetacaoEscalaoDAO = new StaffAfetacaoEscalaoDAO();

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

    /**
     * Returns athletes eligible to be convoked for the trainer's modality.
     * If escalaoId is provided, returns athletes from that escalão and the one immediately below.
     * If escalaoId is absent, returns all athletes of the modality (fallback).
     */
    @GetMapping("/clubes/{clubeId}/treinador/convocatorias/atletas")
    public List<Map<String, Object>> listarAtletasConvocatorias(
            @PathVariable int clubeId,
            @RequestParam(required = false) Integer escalaoId,
            @RequestParam(required = false) Integer clubeModalidadeId
    ) {
        exigirAcessoConvocatorias(clubeId);

        if (temGestaoTotalConvocatorias()) {
            if (clubeModalidadeId == null) {
                return atletaDAO.listarAtivosPorClube(clubeId);
            }
            Integer modalidadeGerivelId = exigirClubeModalidadeDoClube(clubeId, clubeModalidadeId);
            if (escalaoId == null) {
                return atletaDAO.listarPorClubeModalidade(clubeId, modalidadeGerivelId);
            }
            return atletaDAO.listarPorClubeModalidadeEEscaloes(clubeId, modalidadeGerivelId, List.of(escalaoId));
        }

        Integer modalidadeTreinadorId = exigirModalidadeTreinadorNoClube(clubeId);
        if (escalaoId == null) {
            return atletaDAO.listarPorClubeModalidade(clubeId, modalidadeTreinadorId);
        }

        List<Integer> escalaoIds = resolverEscaloesPermitidos(clubeId, modalidadeTreinadorId, escalaoId);
        return atletaDAO.listarPorClubeModalidadeEEscaloes(clubeId, modalidadeTreinadorId, escalaoIds);
    }

    // ==========================================
    // ESCALÕES DO TREINADOR
    // ==========================================

    /**
     * Returns the escalões assigned to the authenticated trainer in the given clube,
     * sorted by the canonical hierarchy (youngest → oldest).
     */
    @GetMapping("/clubes/{clubeId}/treinador/escaloes")
    public List<Map<String, Object>> listarEscaloesTreinador(@PathVariable int clubeId) {
        exigirAcessoConvocatorias(clubeId);
        if (temGestaoTotalConvocatorias()) {
            return escalaoDAO.listarComOrdem();
        }

        Integer clubeModalidadeId = exigirModalidadeTreinadorNoClube(clubeId);
        int utilizadorId = SecurityUtils.currentUserId();

        List<Map<String, Object>> escaloes = staffAfetacaoEscalaoDAO
                .listarEscaloesPorTreinador(utilizadorId, clubeId, clubeModalidadeId);

        // Sort by the canonical hierarchy
        List<String> ordem = EscalaoDAO.ESCALAO_ORDEM;
        escaloes.sort((a, b) -> {
            int posA = ordem.indexOf(((String) a.get("nome")).toLowerCase());
            int posB = ordem.indexOf(((String) b.get("nome")).toLowerCase());
            if (posA < 0) posA = Integer.MAX_VALUE;
            if (posB < 0) posB = Integer.MAX_VALUE;
            return Integer.compare(posA, posB);
        });
        return escaloes;
    }

    // ==========================================
    // CONVOCATÓRIAS
    // ==========================================

    @GetMapping("/clubes/{clubeId}/treinador/convocatorias")
    public List<Map<String, Object>> listarConvocatorias(@PathVariable int clubeId) {
        exigirAcessoConvocatorias(clubeId);
        if (temGestaoTotalConvocatorias()) {
            return eventoDAO.listarModalidadePorClube(clubeId).stream()
                    .peek(ev -> ev.put("subtipo", ev.get("observacoes")))
                    .toList();
        }

        Integer clubeModalidadeId = exigirModalidadeTreinadorNoClube(clubeId);
        int treinadorId = SecurityUtils.currentUserId();
        List<Integer> escalaoIds = idsEscaloesTreinador(clubeId, clubeModalidadeId);

        return eventoDAO.listarPorClubeModalidadeEEscaloes(clubeId, clubeModalidadeId, escalaoIds, treinadorId).stream()
                .peek(ev -> ev.put("subtipo", ev.get("observacoes")))
                .toList();
    }

    @GetMapping("/clubes/{clubeId}/treinador/convocatorias/{eventoId}/convocados")
    public List<Map<String, Object>> listarConvocadosConvocatoria(
            @PathVariable int clubeId,
            @PathVariable int eventoId
    ) {
        exigirAcessoConvocatorias(clubeId);
        Map<String, Object> evento = eventoDAO.buscarPorId(eventoId);
        if (evento == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Evento não encontrado.");
        }

        if (temGestaoTotalConvocatorias()) {
            validarEventoGestor(evento, clubeId);
        } else {
            Integer clubeModalidadeId = exigirModalidadeTreinadorNoClube(clubeId);
            validarEventoVisivelTreinador(evento, clubeId, clubeModalidadeId);
        }
        return eventoAtletaDAO.listarPorEvento(eventoId);
    }

    @PostMapping("/clubes/{clubeId}/treinador/convocatorias")
    public ResponseEntity<?> criarConvocatoria(
            @PathVariable int clubeId,
            @RequestBody Map<String, Object> payload
    ) {
        exigirAcessoConvocatorias(clubeId);
        int utilizadorId = exigirUtilizadorAutenticado();
        boolean gestaoTotal = temGestaoTotalConvocatorias();
        Integer clubeModalidadeId = gestaoTotal
                ? exigirClubeModalidadeDoClube(clubeId, numeroParaInt(payload.get("clubeModalidadeId")))
                : exigirModalidadeTreinadorNoClube(clubeId);

        // Validate escalão
        Integer escalaoId = numeroParaInt(payload.get("escalaoId"));
        List<Integer> escalaoIds = gestaoTotal
                ? validarEscalaoGestor(escalaoId)
                : validarEEscaloes(clubeId, clubeModalidadeId, escalaoId);

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
        if (!atletasConvocados.isEmpty()) {
            if (escalaoId != null) {
                if (!atletaDAO.todosPertencemClubeModalidadeEEscaloes(clubeModalidadeId, escalaoIds, atletasConvocados)) {
                    throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                            "Existem atletas fora do escalão permitido para este evento.");
                }
            } else if (!atletaDAO.todosPertencemClubeModalidade(clubeModalidadeId, atletasConvocados)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Existem atletas fora da modalidade do evento.");
            }
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
                utilizadorId
        );
        evento.setEscalaoId(escalaoId);
        if (fim != null) evento.setDataHoraFim(Timestamp.valueOf(fim));
        evento.setLatitude(extrairDouble(payload.get("latitude")));
        evento.setLongitude(extrairDouble(payload.get("longitude")));

        Integer eventoId = eventoDAO.inserirEDevolverId(evento);
        if (eventoId == null) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Erro ao criar evento.");
        }

        if (!atletasConvocados.isEmpty()) {
            eventoAtletaDAO.inserirMultiplos(eventoId, atletasConvocados);
            Map<String, Object> eventoGuardado = eventoDAO.buscarPorId(eventoId);
            if (eventoGuardado != null) {
                notificacaoService.notificarConvocados(eventoId, eventoGuardado, "MODALIDADE");
            }
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
        exigirAcessoConvocatorias(clubeId);
        int utilizadorId = exigirUtilizadorAutenticado();
        boolean gestaoTotal = temGestaoTotalConvocatorias();
        Integer clubeModalidadeId;
        if (gestaoTotal) {
            Map<String, Object> existente = validarEventoGestor(eventoId, clubeId);
            Integer modalidadePayload = numeroParaInt(payload.get("clubeModalidadeId"));
            clubeModalidadeId = exigirClubeModalidadeDoClube(
                    clubeId,
                    modalidadePayload != null ? modalidadePayload : numeroParaInt(existente.get("clubeModalidadeId"))
            );
        } else {
            clubeModalidadeId = exigirModalidadeTreinadorNoClube(clubeId);
            validarEventoTreinador(eventoId, clubeId, clubeModalidadeId, utilizadorId);
        }

        // Validate escalão
        Integer escalaoId = numeroParaInt(payload.get("escalaoId"));
        List<Integer> escalaoIds = gestaoTotal
                ? validarEscalaoGestor(escalaoId)
                : validarEEscaloes(clubeId, clubeModalidadeId, escalaoId);

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
        if (!atletasConvocados.isEmpty()) {
            if (escalaoId != null) {
                if (!atletaDAO.todosPertencemClubeModalidadeEEscaloes(clubeModalidadeId, escalaoIds, atletasConvocados)) {
                    throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                            "Existem atletas fora do escalão permitido para este evento.");
                }
            } else if (!atletaDAO.todosPertencemClubeModalidade(clubeModalidadeId, atletasConvocados)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Existem atletas fora da modalidade do evento.");
            }
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
                utilizadorId
        );
        eventoAtualizado.setEscalaoId(escalaoId);
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
            Map<String, Object> eventoGuardado = eventoDAO.buscarPorId(eventoId);
            if (eventoGuardado != null) {
                notificacaoService.notificarConvocados(eventoId, eventoGuardado, "MODALIDADE");
            }
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
        if (SecurityUtils.isAdministrador() && Integer.valueOf(clubeId).equals(SecurityUtils.currentClubeId())) return;
        if (isSecretario() && Integer.valueOf(clubeId).equals(SecurityUtils.currentClubeId())) return;
        String role = SecurityUtils.currentRole();
        if ("ROLE_TREINADOR_PRINCIPAL".equals(role) && Integer.valueOf(clubeId).equals(SecurityUtils.currentClubeId())) return;
        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Sem permissão para aceder ao módulo de treinador deste clube.");
    }

    private void exigirAcessoConvocatorias(int clubeId) {
        boolean perfilPermitido = SecurityUtils.isSuperAdmin()
                || SecurityUtils.isAdministrador()
                || isSecretario()
                || isTreinadorPrincipal();
        if (!perfilPermitido) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Sem permissão para gerir convocatórias.");
        }

        if (SecurityUtils.isSuperAdmin()) return;
        if ((SecurityUtils.isAdministrador() || isSecretario() || isTreinadorPrincipal())
                && Integer.valueOf(clubeId).equals(SecurityUtils.currentClubeId())) {
            return;
        }

        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Sem permissão para gerir convocatórias deste clube.");
    }

    private boolean temGestaoTotalConvocatorias() {
        return SecurityUtils.isSuperAdmin() || SecurityUtils.isAdministrador() || isSecretario();
    }

    private boolean isSecretario() {
        return "ROLE_SECRETARIO".equals(SecurityUtils.currentRole());
    }

    private boolean isTreinadorPrincipal() {
        return "ROLE_TREINADOR_PRINCIPAL".equals(SecurityUtils.currentRole());
    }

    private int exigirUtilizadorAutenticado() {
        Integer utilizadorId = SecurityUtils.currentUserId();
        if (utilizadorId == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Utilizador autenticado inválido.");
        }
        return utilizadorId;
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

    private Integer exigirClubeModalidadeDoClube(int clubeId, Integer clubeModalidadeId) {
        if (clubeModalidadeId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Modalidade é obrigatória para gerir convocatórias.");
        }

        ClubeModalidade clubeModalidade = clubeModalidadeDAO.buscarPorId(clubeModalidadeId);
        if (clubeModalidade == null || clubeModalidade.getClube() == null || clubeModalidade.getClube().getId() != clubeId) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "A modalidade/equipa não pertence ao clube selecionado.");
        }
        return clubeModalidadeId;
    }

    private List<Integer> validarEscalaoGestor(Integer escalaoId) {
        if (escalaoId == null) return Collections.emptyList();
        if (escalaoDAO.buscarPorId(escalaoId) == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Escalão inválido.");
        }
        return List.of(escalaoId);
    }

    /**
     * Validates that the trainer is assigned to {@code escalaoId} and returns
     * the list of allowed escalão IDs (selected + immediately below).
     */
    private List<Integer> validarEEscaloes(int clubeId, int clubeModalidadeId, Integer escalaoId) {
        if (escalaoId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Escalão é obrigatório para convocatórias do treinador.");
        }

        int utilizadorId = SecurityUtils.currentUserId();
        List<Map<String, Object>> treinadorEscaloes = staffAfetacaoEscalaoDAO
                .listarEscaloesPorTreinador(utilizadorId, clubeId, clubeModalidadeId);

        boolean escalaoAtribuido = treinadorEscaloes.stream()
                .anyMatch(e -> escalaoId.equals(((Number) e.get("id")).intValue()));

        if (!escalaoAtribuido) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "O treinador não está afeto ao escalão selecionado.");
        }

        List<Integer> ids = new ArrayList<>();
        ids.add(escalaoId);
        Integer escalaoAbaixo = escalaoDAO.buscarIdEscalaoAbaixo(escalaoId);
        if (escalaoAbaixo != null) ids.add(escalaoAbaixo);
        return ids;
    }

    private List<Integer> idsEscaloesTreinador(int clubeId, int clubeModalidadeId) {
        int utilizadorId = SecurityUtils.currentUserId();
        return staffAfetacaoEscalaoDAO
                .listarEscaloesPorTreinador(utilizadorId, clubeId, clubeModalidadeId)
                .stream()
                .map(e -> ((Number) e.get("id")).intValue())
                .toList();
    }

    /**
     * Resolves allowed escalão IDs for athlete listing (same escalão + one below),
     * without throwing if there are no assigned escalões (just returns all for that escalão).
     */
    private List<Integer> resolverEscaloesPermitidos(int clubeId, int clubeModalidadeId, int escalaoId) {
        int utilizadorId = SecurityUtils.currentUserId();
        List<Map<String, Object>> treinadorEscaloes = staffAfetacaoEscalaoDAO
                .listarEscaloesPorTreinador(utilizadorId, clubeId, clubeModalidadeId);

        boolean escalaoAtribuido = treinadorEscaloes.stream()
                .anyMatch(e -> escalaoId == ((Number) e.get("id")).intValue());

        if (!escalaoAtribuido) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "O treinador não está afeto ao escalão selecionado.");
        }

        List<Integer> ids = new ArrayList<>();
        ids.add(escalaoId);
        Integer escalaoAbaixo = escalaoDAO.buscarIdEscalaoAbaixo(escalaoId);
        if (escalaoAbaixo != null) ids.add(escalaoAbaixo);
        return ids;
    }

    private Map<String, Object> validarEventoGestor(int eventoId, int clubeId) {
        Map<String, Object> existente = eventoDAO.buscarPorId(eventoId);
        if (existente == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Evento não encontrado.");
        }
        validarEventoGestor(existente, clubeId);
        return existente;
    }

    private void validarEventoGestor(Map<String, Object> evento, int clubeId) {
        Integer eventoClubeId = numeroParaInt(evento.get("clubeId"));
        if (!Objects.equals(eventoClubeId, clubeId) || !"MODALIDADE".equals(evento.get("tipo"))) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Não tem permissão para gerir este evento.");
        }
    }

    private void validarEventoVisivelTreinador(Map<String, Object> evento, int clubeId, int clubeModalidadeId) {
        Integer treinadorId = SecurityUtils.currentUserId();
        Integer eventoClubeModalidadeId = numeroParaInt(evento.get("clubeModalidadeId"));
        Integer eventoClubeId = numeroParaInt(evento.get("clubeId"));
        String tipo = Objects.toString(evento.get("tipo"), null);

        if (!Objects.equals(eventoClubeModalidadeId, clubeModalidadeId)
                || !Objects.equals(eventoClubeId, clubeId)
                || !"MODALIDADE".equals(tipo)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Não tem permissão para ver este evento.");
        }

        Integer eventoEscalaoId = numeroParaInt(evento.get("escalaoId"));
        if (eventoEscalaoId == null) {
            Integer criadoPor = numeroParaInt(evento.get("criadoPor"));
            if (Objects.equals(criadoPor, treinadorId)) return;
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Não tem permissão para ver eventos deste escalão.");
        }

        boolean escalaoAtribuido = idsEscaloesTreinador(clubeId, clubeModalidadeId).stream()
                .anyMatch(eventoEscalaoId::equals);
        if (!escalaoAtribuido) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Não tem permissão para ver eventos deste escalão.");
        }
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

        boolean criadoPorTreinador = Objects.equals(criadoPor, treinadorId);
        boolean clubeCorreto = Objects.equals(eventoClubeId, clubeId);
        boolean modalidadeCorreta = Objects.equals(eventoModalidadeId, clubeModalidadeId);
        boolean tipoPermitido = "MODALIDADE".equals(tipo);

        if (!criadoPorTreinador || !clubeCorreto || !modalidadeCorreta || !tipoPermitido) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Não tem permissão para gerir este evento.");
        }

        // Validate escalão ownership if stored on event
        Integer eventoEscalaoId = numeroParaInt(existente.get("escalaoId"));
        if (eventoEscalaoId != null) {
            int utilizadorId = SecurityUtils.currentUserId();
            List<Map<String, Object>> treinadorEscaloes = staffAfetacaoEscalaoDAO
                    .listarEscaloesPorTreinador(utilizadorId, clubeId, clubeModalidadeId);
            boolean escalaoAtribuido = treinadorEscaloes.stream()
                    .anyMatch(e -> eventoEscalaoId.equals(((Number) e.get("id")).intValue()));
            if (!escalaoAtribuido) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                        "Não tem permissão para editar eventos deste escalão.");
            }
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
