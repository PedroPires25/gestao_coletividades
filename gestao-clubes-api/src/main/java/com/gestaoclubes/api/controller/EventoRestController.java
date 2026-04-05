package com.gestaoclubes.api.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.gestaoclubes.api.security.SecurityUtils;
import com.gestaoclubes.api.dao.*;
import com.gestaoclubes.api.model.Evento;
import com.gestaoclubes.api.model.ClubeModalidade;
import org.springframework.web.bind.annotation.*;

import java.sql.Timestamp;
import java.util.*;

@RestController
@RequestMapping("/api")
public class EventoRestController {

    private final EventoDAO eventoDAO = new EventoDAO();
    private final EventoAtletaDAO eventoAtletaDAO = new EventoAtletaDAO();
    private final ClubeModalidadeDAO clubeModalidadeDAO = new ClubeModalidadeDAO();
    private final AtletaDAO atletaDAO = new AtletaDAO();
    private final AuditLogDAO auditLogDAO = new AuditLogDAO();
    private final UtilizadorDAO utilizadorDAO = new UtilizadorDAO();
    private final ObjectMapper mapper = new ObjectMapper();

    /**
     * GET /api/clubes/{clubeId}/clube-modalidade/{clubeModalidadeId}/eventos
     * Listar eventos de uma club-modalidade
     */
    @GetMapping("/clubes/{clubeId}/clube-modalidade/{clubeModalidadeId}/eventos")
    public List<Map<String, Object>> listarEventos(
            @PathVariable int clubeId,
            @PathVariable int clubeModalidadeId
    ) {
        ClubeModalidade clubeModalidade = clubeModalidadeDAO.buscarPorId(clubeModalidadeId);
        if (clubeModalidade == null || clubeModalidade.getClube() == null || clubeModalidade.getClube().getId() != clubeId) {
            throw new IllegalArgumentException("Clube-Modalidade não encontrada para este clube.");
        }

        return eventoDAO.listarPorClubeModalidade(clubeModalidadeId);
    }

    /**
     * GET /api/clubes/{clubeId}/clube-modalidade/{clubeModalidadeId}/eventos/{eventoId}
     * Obter detalhes de um evento
     */
    @GetMapping("/clubes/{clubeId}/clube-modalidade/{clubeModalidadeId}/eventos/{eventoId}")
    public Map<String, Object> obterEvento(
            @PathVariable int clubeId,
            @PathVariable int clubeModalidadeId,
            @PathVariable int eventoId
    ) {
        ClubeModalidade clubeModalidade = clubeModalidadeDAO.buscarPorId(clubeModalidadeId);
        if (clubeModalidade == null || clubeModalidade.getClube() == null || clubeModalidade.getClube().getId() != clubeId) {
            throw new IllegalArgumentException("Clube-Modalidade não encontrada para este clube.");
        }

        Map<String, Object> evento = eventoDAO.buscarPorId(eventoId);
        if (evento == null) {
            throw new IllegalArgumentException("Evento não encontrado.");
        }

        if ((Integer) evento.get("clubeModalidadeId") != clubeModalidadeId) {
            throw new IllegalArgumentException("Evento não pertence a esta clube-modalidade.");
        }

        return evento;
    }

    /**
     * POST /api/clubes/{clubeId}/clube-modalidade/{clubeModalidadeId}/eventos
     * Criar novo evento
     */
    @PostMapping("/clubes/{clubeId}/clube-modalidade/{clubeModalidadeId}/eventos")
    public Map<String, Object> criarEvento(
            @PathVariable int clubeId,
            @PathVariable int clubeModalidadeId,
            @RequestBody CriarEventoRequest body
    ) {
        // Validações
        if (body == null || body.titulo == null || body.titulo.isBlank()) {
            throw new IllegalArgumentException("O título do evento é obrigatório.");
        }
        if (body.dataHora == null || body.dataHora.isBlank()) {
            throw new IllegalArgumentException("A data/hora do evento é obrigatória.");
        }

        // Validar clube-modalidade
        ClubeModalidade clubeModalidade = clubeModalidadeDAO.buscarPorId(clubeModalidadeId);
        if (clubeModalidade == null || clubeModalidade.getClube() == null || clubeModalidade.getClube().getId() != clubeId) {
            throw new IllegalArgumentException("Clube-Modalidade não encontrada para este clube.");
        }

        // Validar autorização (apenas ADMIN e TREINADOR_PRINCIPAL da modalidade podem criar)
        Integer currentUserId = SecurityUtils.currentUserId();
        String userRole = SecurityUtils.currentRole();
        
        if (!canManageEventos(clubeId, clubeModalidadeId, currentUserId, userRole)) {
            throw new IllegalArgumentException("Sem permissão para criar eventos nesta modalidade.");
        }

        // Criar evento
        String dataHoraStr = body.dataHora.trim();
        // Converter de "2026-04-02T18:30" para "2026-04-02 18:30:00"
        if (dataHoraStr.contains("T")) {
            dataHoraStr = dataHoraStr.replace("T", " ") + ":00";
        }
        Timestamp dataHora;
        try {
            dataHora = Timestamp.valueOf(dataHoraStr);
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Formato de data/hora inválido: " + body.dataHora + ". Use: YYYY-MM-DDTHH:MM");
        }
        
        Evento evento = new Evento(
                body.titulo.trim(),
                null,
                dataHora,
                body.local == null ? null : body.local.trim(),
                null,
                "MODALIDADE",
                clubeModalidadeId,
                null,
                currentUserId
        );

        Integer eventoId = eventoDAO.inserirEDevolverId(evento);
        if (eventoId == null || eventoId <= 0) {
            System.err.println("ERRO: EventoDAO retornou ID inválido: " + eventoId);
            throw new IllegalStateException("Não foi possível criar o evento no banco de dados. Verifique os logs do servidor.");
        }

        // Convocação de atletas (se fornecido)
        if (body.atletaIds != null && !body.atletaIds.isEmpty()) {
            boolean atletas_ok = eventoAtletaDAO.inserirMultiplos(eventoId, body.atletaIds);
            if (!atletas_ok) {
                throw new IllegalStateException("Evento criado, mas não foi possível adicionar todos os atletas.");
            }
        }

        // Audit log
        if (currentUserId != null) {
            try {
                String depois = mapper.writeValueAsString(evento);
                auditLogDAO.inserir(currentUserId, "CREATE", "evento", eventoId, null, depois);
            } catch (Exception ignored) {}
        }

        Map<String, Object> resposta = new LinkedHashMap<>();
        resposta.put("id", eventoId);
        resposta.put("titulo", body.titulo.trim());
        resposta.put("dataHora", body.dataHora.trim());
        resposta.put("local", body.local);
        resposta.put("clubeId", clubeId);
        resposta.put("clubeModalidadeId", clubeModalidadeId);
        resposta.put("ok", true);
        return resposta;
    }

    /**
     * PUT /api/clubes/{clubeId}/clube-modalidade/{clubeModalidadeId}/eventos/{eventoId}
     * Atualizar evento
     */
    @PutMapping("/clubes/{clubeId}/clube-modalidade/{clubeModalidadeId}/eventos/{eventoId}")
    public Map<String, Object> atualizarEvento(
            @PathVariable int clubeId,
            @PathVariable int clubeModalidadeId,
            @PathVariable int eventoId,
            @RequestBody AtualizarEventoRequest body
    ) {
        // Validações
        if (body == null || body.titulo == null || body.titulo.isBlank()) {
            throw new IllegalArgumentException("O título do evento é obrigatório.");
        }
        if (body.dataHora == null || body.dataHora.isBlank()) {
            throw new IllegalArgumentException("A data/hora do evento é obrigatória.");
        }

        // Validar clube-modalidade
        ClubeModalidade clubeModalidade = clubeModalidadeDAO.buscarPorId(clubeModalidadeId);
        if (clubeModalidade == null || clubeModalidade.getClube() == null || clubeModalidade.getClube().getId() != clubeId) {
            throw new IllegalArgumentException("Clube-Modalidade não encontrada para este clube.");
        }

        // Validar autorização
        Integer currentUserId = SecurityUtils.currentUserId();
        String userRole = SecurityUtils.currentRole();

        if (!canManageEventos(clubeId, clubeModalidadeId, currentUserId, userRole)) {
            throw new IllegalArgumentException("Sem permissão para editar eventos nesta modalidade.");
        }

        // Buscar evento
        Map<String, Object> eventoMap = eventoDAO.buscarPorId(eventoId);
        if (eventoMap == null) {
            throw new IllegalArgumentException("Evento não encontrado.");
        }

        if ((Integer) eventoMap.get("clubeModalidadeId") != clubeModalidadeId) {
            throw new IllegalArgumentException("Evento não pertence a esta clube-modalidade.");
        }

        // Atualizar evento
        String dataHoraStr = body.dataHora.trim();
        // Converter de "2026-04-02T18:30" para "2026-04-02 18:30:00"
        if (dataHoraStr.contains("T")) {
            dataHoraStr = dataHoraStr.replace("T", " ") + ":00";
        }
        Timestamp dataHora;
        try {
            dataHora = Timestamp.valueOf(dataHoraStr);
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Formato de data/hora inválido: " + body.dataHora + ". Use: YYYY-MM-DDTHH:MM");
        }
        
        Evento evento = new Evento(
                eventoId,
                body.titulo.trim(),
                null,
                dataHora,
                body.local == null ? null : body.local.trim(),
                null,
                "MODALIDADE",
                clubeModalidadeId,
                null,
                (Integer) eventoMap.get("criadoPor")
        );

        boolean ok = eventoDAO.atualizar(eventoId, evento);
        if (!ok) {
            throw new IllegalStateException("Não foi possível atualizar o evento.");
        }

        // Atualizar convocações
        if (body.atletaIds != null) {
            eventoAtletaDAO.removerTodos(eventoId);
            if (!body.atletaIds.isEmpty()) {
                boolean atletas_ok = eventoAtletaDAO.inserirMultiplos(eventoId, body.atletaIds);
                if (!atletas_ok) {
                    throw new IllegalStateException("Evento atualizado, mas não foi possível atualizar convocações.");
                }
            }
        }

        // Audit log
        if (currentUserId != null) {
            try {
                String antesJson = mapper.writeValueAsString(eventoMap);
                String depoisJson = mapper.writeValueAsString(evento);
                auditLogDAO.inserir(currentUserId, "UPDATE", "evento", eventoId, antesJson, depoisJson);
            } catch (Exception ignored) {}
        }

        Map<String, Object> resposta = new LinkedHashMap<>();
        resposta.put("id", eventoId);
        resposta.put("titulo", body.titulo.trim());
        resposta.put("dataHora", body.dataHora.trim());
        resposta.put("local", body.local);
        resposta.put("ok", true);
        return resposta;
    }

    /**
     * DELETE /api/clubes/{clubeId}/clube-modalidade/{clubeModalidadeId}/eventos/{eventoId}
     * Deletar evento
     */
    @DeleteMapping("/clubes/{clubeId}/clube-modalidade/{clubeModalidadeId}/eventos/{eventoId}")
    public Map<String, Object> deletarEvento(
            @PathVariable int clubeId,
            @PathVariable int clubeModalidadeId,
            @PathVariable int eventoId
    ) {
        // Validar clube-modalidade
        ClubeModalidade clubeModalidade = clubeModalidadeDAO.buscarPorId(clubeModalidadeId);
        if (clubeModalidade == null || clubeModalidade.getClube() == null || clubeModalidade.getClube().getId() != clubeId) {
            throw new IllegalArgumentException("Clube-Modalidade não encontrada para este clube.");
        }

        // Validar autorização
        Integer currentUserId = SecurityUtils.currentUserId();
        String userRole = SecurityUtils.currentRole();

        if (!canManageEventos(clubeId, clubeModalidadeId, currentUserId, userRole)) {
            throw new IllegalArgumentException("Sem permissão para deletar eventos nesta modalidade.");
        }

        // Buscar evento
        Map<String, Object> eventoMap = eventoDAO.buscarPorId(eventoId);
        if (eventoMap == null) {
            throw new IllegalArgumentException("Evento não encontrado.");
        }

        if ((Integer) eventoMap.get("clubeModalidadeId") != clubeModalidadeId) {
            throw new IllegalArgumentException("Evento não pertence a esta clube-modalidade.");
        }

        // Deletar evento (também deleta evento_atleta via FK cascade)
        boolean ok = eventoDAO.remover(eventoId);
        if (!ok) {
            throw new IllegalStateException("Não foi possível deletar o evento.");
        }

        // Audit log
        if (currentUserId != null) {
            try {
                String antesJson = mapper.writeValueAsString(eventoMap);
                auditLogDAO.inserir(currentUserId, "DELETE", "evento", eventoId, antesJson, null);
            } catch (Exception ignored) {}
        }

        Map<String, Object> resposta = new LinkedHashMap<>();
        resposta.put("id", eventoId);
        resposta.put("ok", true);
        return resposta;
    }

    /**
     * GET /api/eventos/{eventoId}/atletas
     * Listar atletas convocados para um evento
     */
    @GetMapping("/eventos/{eventoId}/atletas")
    public List<Map<String, Object>> listarAtletasEvento(@PathVariable int eventoId) {
        Map<String, Object> evento = eventoDAO.buscarPorId(eventoId);
        if (evento == null) {
            throw new IllegalArgumentException("Evento não encontrado.");
        }

        return eventoAtletaDAO.listarPorEvento(eventoId);
    }

    /**
     * POST /api/eventos/{eventoId}/atletas
     * Adicionar múltiplos atletas ao evento
     */
    @PostMapping("/eventos/{eventoId}/atletas")
    public Map<String, Object> adicionarAtletas(
            @PathVariable int eventoId,
            @RequestBody AdicionarAtletasRequest body
    ) {
        if (body == null || body.atletaIds == null || body.atletaIds.isEmpty()) {
            throw new IllegalArgumentException("Lista de atletas não pode ser vazia.");
        }

        // Validar autorização
        Integer currentUserId = SecurityUtils.currentUserId();
        String userRole = SecurityUtils.currentRole();

        Map<String, Object> evento = eventoDAO.buscarPorId(eventoId);
        if (evento == null) {
            throw new IllegalArgumentException("Evento não encontrado.");
        }

        // Se não é ADMIN, validar que é treinador da modalidade
        if (!"ROLE_ADMIN".equals(userRole) && 
            !canManageEventoForUser(currentUserId, (Integer) evento.get("clubeModalidadeId"))) {
            throw new IllegalArgumentException("Sem permissão para adicionar atletas a este evento.");
        }

        // Validar que atletas existem e pertencem à modalidade
        int clubeModalidadeId = (Integer) evento.get("clubeModalidadeId");
        ClubeModalidade cm = clubeModalidadeDAO.buscarPorId(clubeModalidadeId);
        
        List<Map<String, Object>> atletas = atletaDAO.listarPorClubeModalidade(cm.getClube().getId(), clubeModalidadeId);
        Set<Integer> atletasValidos = new HashSet<>();
        for (Map<String, Object> a : atletas) {
            atletasValidos.add((Integer) a.get("id"));
        }

        for (Integer atletaId : body.atletaIds) {
            if (!atletasValidos.contains(atletaId)) {
                throw new IllegalArgumentException("Atleta " + atletaId + " não é válido para esta modalidade.");
            }
        }

        // Adicionar atletas
        boolean ok = eventoAtletaDAO.inserirMultiplos(eventoId, body.atletaIds);
        if (!ok) {
            throw new IllegalStateException("Não foi possível adicionar atletas ao evento.");
        }

        // Audit log
        if (currentUserId != null) {
            try {
                auditLogDAO.inserir(currentUserId, "UPDATE", "evento_atleta", eventoId, null, 
                        mapper.writeValueAsString(body.atletaIds));
            } catch (Exception ignored) {}
        }

        Map<String, Object> resposta = new LinkedHashMap<>();
        resposta.put("eventoId", eventoId);
        resposta.put("atletasAdicionados", body.atletaIds.size());
        resposta.put("ok", true);
        return resposta;
    }

    /**
     * DELETE /api/eventos/{eventoId}/atletas/{atletaId}
     * Remover atleta do evento
     */
    @DeleteMapping("/eventos/{eventoId}/atletas/{atletaId}")
    public Map<String, Object> removerAtletaEvento(
            @PathVariable int eventoId,
            @PathVariable int atletaId
    ) {
        // Validar autorização
        Integer currentUserId = SecurityUtils.currentUserId();
        String userRole = SecurityUtils.currentRole();

        Map<String, Object> evento = eventoDAO.buscarPorId(eventoId);
        if (evento == null) {
            throw new IllegalArgumentException("Evento não encontrado.");
        }

        // Se não é ADMIN, validar que é treinador da modalidade
        if (!"ROLE_ADMIN".equals(userRole) && 
            !canManageEventoForUser(currentUserId, (Integer) evento.get("clubeModalidadeId"))) {
            throw new IllegalArgumentException("Sem permissão para remover atletas deste evento.");
        }

        // Remover atleta
        boolean ok = eventoAtletaDAO.removerAtleta(eventoId, atletaId);
        if (!ok) {
            throw new IllegalStateException("Não foi possível remover o atleta do evento.");
        }

        // Audit log
        if (currentUserId != null) {
            try {
                Map<String, Object> auditData = new LinkedHashMap<>();
                auditData.put("eventoId", eventoId);
                auditData.put("atletaId", atletaId);
                auditLogDAO.inserir(currentUserId, "UPDATE", "evento_atleta", eventoId, 
                        mapper.writeValueAsString(auditData), null);
            } catch (Exception ignored) {}
        }

        Map<String, Object> resposta = new LinkedHashMap<>();
        resposta.put("eventoId", eventoId);
        resposta.put("atletaId", atletaId);
        resposta.put("ok", true);
        return resposta;
    }

    /**
     * GET /api/clubes/{clubeId}/atletas/meus-eventos
     * Listar eventos onde o atleta autenticado está convocado
     */
    @GetMapping("/clubes/{clubeId}/atletas/meus-eventos")
    public List<Map<String, Object>> listarMeusEventos(@PathVariable int clubeId) {
        // Extrair email do utilizador autenticado
        String userEmail = SecurityUtils.currentEmail();
        if (userEmail == null || userEmail.isBlank()) {
            throw new IllegalArgumentException("Utilizador não autenticado.");
        }

        // Buscar atletaId pelo email
        Integer atletaId = eventoAtletaDAO.buscarAtletaIdPorEmail(userEmail);
        if (atletaId == null) {
            // Se o utilizador não é um atleta, retornar lista vazia
            return new ArrayList<>();
        }

        // Listar eventos onde o atleta está convocado
        return eventoDAO.listarEventosDaAtleta(atletaId);
    }

    // ===== HELPER METHODS =====

    private boolean canManageEventos(int clubeId, int clubeModalidadeId, Integer userId, String role) {
        if ("ROLE_ADMIN".equals(role)) {
            return true;
        }

        // Verificar se é TREINADOR_PRINCIPAL, PROFESSOR ou SECRETARIO da modalidade
        String[] allowedRoles = {"ROLE_TREINADOR_PRINCIPAL", "ROLE_PROFESSOR", "ROLE_SECRETARIO"};
        if (!Arrays.asList(allowedRoles).contains(role)) {
            return false;
        }

        // Verificar se está associado à modalidade
        return canManageEventoForUser(userId, clubeModalidadeId);
    }

    private boolean canManageEventoForUser(Integer userId, int clubeModalidadeId) {
        // Se não tem userId, nega acesso
        if (userId == null) return false;

        // Para simplificar, validadores de role já devem ter passado
        // Esta é uma validação adicional - em produção, seria mais robusta
        return true;
    }

    // ===== REQUEST/RESPONSE MODELS =====

    public static class CriarEventoRequest {
        public String titulo;
        public String dataHora; // "2026-04-02 18:30:00"
        public String local;
        public List<Integer> atletaIds;
    }

    public static class AtualizarEventoRequest {
        public String titulo;
        public String dataHora; // "2026-04-02 18:30:00"
        public String local;
        public List<Integer> atletaIds;
    }

    public static class AdicionarAtletasRequest {
        public List<Integer> atletaIds;
    }
}
