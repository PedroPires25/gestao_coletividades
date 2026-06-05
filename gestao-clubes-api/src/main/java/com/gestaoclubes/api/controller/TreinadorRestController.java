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
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@RestController
@RequestMapping("/api")
public class TreinadorRestController {

    private final TreinadorService treinadorService;
    private final EmailService emailService;
    private final ConvocatoriaNotificacaoService notificacaoService;
    private final AtletaDAO atletaDAO = new AtletaDAO();
    private final EventoDAO eventoDAO = new EventoDAO();
    private final EventoAtletaDAO eventoAtletaDAO = new EventoAtletaDAO();
    private final ClubeModalidadeDAO clubeModalidadeDAO = new ClubeModalidadeDAO();
    private final EscalaoDAO escalaoDAO = new EscalaoDAO();
    private final StaffAfetacaoEscalaoDAO staffAfetacaoEscalaoDAO = new StaffAfetacaoEscalaoDAO();

    public TreinadorRestController(EmailService emailService, ConvocatoriaNotificacaoService notificacaoService) {
        this.treinadorService = new TreinadorService();
        this.emailService = emailService;
        this.notificacaoService = notificacaoService;
    }

    @GetMapping("/clubes/{clubeId}/treinador/atletas")
    public List<Map<String, Object>> listarAtletasDoClube(@PathVariable int clubeId) {
        exigirAcessoTreinador(clubeId);
        return atletaDAO.listarPorClube(clubeId);
    }

    /**
     * Devolve atletas elegíveis para convocatória do treinador na modalidade.
     * Se escalaoId for fornecido, devolve atletas desse escalão e do imediatamente abaixo.
     * Se escalaoId estiver ausente, devolve todos os atletas da modalidade.
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

        // Ordena pela hierarquia canónica
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
        }

        LinkedHashMap<String, Object> resposta = new LinkedHashMap<>();
        resposta.put("id", eventoId);
        if (!atletasConvocados.isEmpty()) {
            Map<String, Object> emailResult = notificacaoService.enviarEmailsConvocados(
                    eventoId, titulo, inicio, local, descricao != null ? descricao : "", subtipo);
            String emailStatus = (String) emailResult.get("status");
            resposta.put("emailStatus", emailStatus);
            if ("SUCESSO".equals(emailStatus) || "SEM_DESTINATARIOS".equals(emailStatus)) {
                resposta.put("mensagem", "Convocatória criada e emails enviados com sucesso.");
            } else {
                resposta.put("mensagem", "Convocatória criada, mas ocorreu um erro no envio de emails.");
            }
        } else {
            resposta.put("emailStatus", "SEM_DESTINATARIOS");
            resposta.put("mensagem", "Evento criado com sucesso.");
        }

        return ResponseEntity.status(HttpStatus.CREATED).body(resposta);
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
        Map<String, Object> eventoExistente;
        Integer clubeModalidadeId;
        if (gestaoTotal) {
            eventoExistente = validarEventoGestor(eventoId, clubeId);
            Integer modalidadePayload = numeroParaInt(payload.get("clubeModalidadeId"));
            clubeModalidadeId = exigirClubeModalidadeDoClube(
                    clubeId,
                    modalidadePayload != null ? modalidadePayload : numeroParaInt(eventoExistente.get("clubeModalidadeId"))
            );
        } else {
            clubeModalidadeId = exigirModalidadeTreinadorNoClube(clubeId);
            eventoExistente = validarEventoTreinador(eventoId, clubeId, clubeModalidadeId, utilizadorId);
        }

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

        List<Integer> convocadosExistentes = eventoAtletaDAO.listarPorEvento(eventoId)
                .stream().map(a -> ((Number) a.get("id")).intValue()).toList();
        eventoAtletaDAO.removerTodos(eventoId);
        if (!atletasConvocados.isEmpty()) {
            eventoAtletaDAO.inserirMultiplos(eventoId, atletasConvocados);
        }

        boolean camposAlterados = camposRelevantesAlterados(eventoExistente, inicio, local,
                descricao != null ? descricao : "", subtipo);
        boolean atletasAdicionados = atletasConvocados.stream()
                .anyMatch(id -> !convocadosExistentes.contains(id));

        LinkedHashMap<String, Object> resposta = new LinkedHashMap<>();
        if ((camposAlterados || atletasAdicionados) && !atletasConvocados.isEmpty()) {
            Map<String, Object> emailResult = notificacaoService.enviarEmailsConvocados(
                    eventoId, titulo, inicio, local, descricao != null ? descricao : "", subtipo);
            String emailStatus = (String) emailResult.get("status");
            resposta.put("emailStatus", emailStatus);
            if ("SUCESSO".equals(emailStatus) || "SEM_DESTINATARIOS".equals(emailStatus)) {
                resposta.put("mensagem", "Email enviado com sucesso.");
            } else {
                resposta.put("mensagem", "Convocatória atualizada, mas ocorreu um erro no envio de emails.");
            }
        } else {
            resposta.put("emailStatus", "NAO_ENVIADO");
            resposta.put("mensagem", "Evento atualizado com sucesso.");
        }

        return ResponseEntity.ok(resposta);
    }

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
     * Valida que o treinador está afeto ao escalaoId e devolve
     * a lista de IDs de escalões permitidos (selecionado + imediatamente abaixo).
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
     * Resolve os IDs de escalões permitidos para listagem de atletas (mesmo escalão + imediatamente abaixo).
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

        // Valida a posse do escalão se presente no evento
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

    private boolean camposRelevantesAlterados(Map<String, Object> existente, LocalDateTime novoInicio,
            String novoLocal, String novaDescricao, String novoSubtipo) {
        java.sql.Timestamp existenteTs = (java.sql.Timestamp) existente.get("dataHora");
        LocalDateTime existenteInicio = existenteTs != null ? existenteTs.toLocalDateTime() : null;
        if (!Objects.equals(existenteInicio, novoInicio)) return true;
        if (!Objects.equals(existente.get("local"), novoLocal)) return true;
        String descricaoExistente = existente.get("descricao") != null ? (String) existente.get("descricao") : "";
        if (!descricaoExistente.equals(novaDescricao)) return true;
        if (!Objects.equals(existente.get("observacoes"), novoSubtipo)) return true;
        return false;
    }
}
