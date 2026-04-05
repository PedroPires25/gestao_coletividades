package com.gestaoclubes.api.controller;

import com.gestaoclubes.api.dao.EventoDAO;
import com.gestaoclubes.api.model.Evento;
import com.gestaoclubes.api.security.SecurityUtils;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;
import java.util.logging.Logger;

@RestController
@RequestMapping("/api/eventos")
@CrossOrigin(origins = "http://localhost:5173")
public class EventoRestController {

    private static final Logger logger = Logger.getLogger(EventoRestController.class.getName());
    private final EventoDAO eventoDAO;

    public EventoRestController(EventoDAO eventoDAO) {
        this.eventoDAO = eventoDAO;
    }

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> listar() {
        try {
            String currentRole = SecurityUtils.currentRole();
            Integer currentModalidadeId = SecurityUtils.currentModalidadeId();
            
            List<Map<String, Object>> eventos = eventoDAO.listarComDetalhes();
            
            // Filter and add access information
            List<Map<String, Object>> resultado = eventos.stream().map(evento -> {
                Map<String, Object> eventoMap = new LinkedHashMap<>(evento);
                
                // Check if user has access to convocatories
                boolean temAcessoCompleto = verificarAcessoCompleto(currentRole, currentModalidadeId, evento);
                eventoMap.put("temAcessoCompleto", temAcessoCompleto);
                
                // Add modality info for the event
                if (evento.containsKey("clubeModalidade") && evento.get("clubeModalidade") != null) {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> cmMap = (Map<String, Object>) evento.get("clubeModalidade");
                    Integer eventModalidadeId = (Integer) cmMap.get("modalidadeId");
                    eventoMap.put("eventoModalidadeId", eventModalidadeId);
                }
                
                return eventoMap;
            }).collect(Collectors.toList());
            
            return ResponseEntity.ok(resultado);
            
        } catch (Exception e) {
            logger.severe("Erro ao listar eventos: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> obterDetalhes(@PathVariable Integer id) {
        try {
            Evento evento = eventoDAO.obterPorId(id);
            if (evento == null) {
                return ResponseEntity.notFound().build();
            }
            
            String currentRole = SecurityUtils.currentRole();
            Integer currentModalidadeId = SecurityUtils.currentModalidadeId();
            
            boolean temAcessoCompleto = verificarAcessoCompleto(currentRole, currentModalidadeId, evento);
            
            Map<String, Object> response = new LinkedHashMap<>();
            response.put("id", evento.getId());
            response.put("titulo", evento.getTitulo());
            response.put("descricao", evento.getDescricao());
            response.put("dataHora", evento.getDataHora());
            response.put("local", evento.getLocal());
            response.put("observacoes", evento.getObservacoes());
            response.put("tipo", evento.getTipo());
            response.put("clubeModalidadeId", evento.getClubeModalidadeId());
            response.put("temAcessoCompleto", temAcessoCompleto);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.severe("Erro ao obter detalhes do evento: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    public static class CriarEventoRequest {
        public String titulo;
        public String descricao;
        public String dataHora;
        public String local;
        public String observacoes;
        public String tipo;
        public Integer clubeModalidadeId;
        public Integer coletividadeAtividadeId;
    }

    @PostMapping
    public ResponseEntity<?> criar(@RequestBody CriarEventoRequest body) {
        try {
            if (body == null || body.titulo == null || body.titulo.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("erro", "O título do evento é obrigatório."));
            }
            
            if (body.dataHora == null || body.dataHora.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("erro", "A data e hora do evento são obrigatórias."));
            }
            
            Integer userId = SecurityUtils.currentUserId();
            if (userId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }
            
            LocalDateTime dataHora = LocalDateTime.parse(body.dataHora);
            
            Evento evento = new Evento(
                body.titulo.trim(),
                body.descricao == null ? "" : body.descricao.trim(),
                dataHora,
                body.local == null ? "" : body.local.trim(),
                body.observacoes == null ? "" : body.observacoes.trim(),
                body.tipo == null || body.tipo.isBlank() ? "MODALIDADE" : body.tipo.trim(),
                body.clubeModalidadeId,
                body.coletividadeAtividadeId,
                userId
            );
            
            Integer id = eventoDAO.criar(evento);
            if (id == null) {
                return ResponseEntity.badRequest().body(Map.of("erro", "Não foi possível criar o evento."));
            }
            
            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("id", id));
            
        } catch (Exception e) {
            logger.severe("Erro ao criar evento: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("erro", "Erro ao criar o evento: " + e.getMessage()));
        }
    }

    public static class EditarEventoRequest {
        public String titulo;
        public String descricao;
        public String dataHora;
        public String local;
        public String observacoes;
        public String tipo;
        public Integer clubeModalidadeId;
        public Integer coletividadeAtividadeId;
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> editar(@PathVariable Integer id, @RequestBody EditarEventoRequest body) {
        try {
            if (body == null || body.titulo == null || body.titulo.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("erro", "O título do evento é obrigatório."));
            }
            
            Evento evento = eventoDAO.obterPorId(id);
            if (evento == null) {
                return ResponseEntity.notFound().build();
            }
            
            evento.setTitulo(body.titulo.trim());
            evento.setDescricao(body.descricao == null ? "" : body.descricao.trim());
            if (body.dataHora != null && !body.dataHora.isBlank()) {
                evento.setDataHora(LocalDateTime.parse(body.dataHora));
            }
            evento.setLocal(body.local == null ? "" : body.local.trim());
            evento.setObservacoes(body.observacoes == null ? "" : body.observacoes.trim());
            evento.setTipo(body.tipo == null || body.tipo.isBlank() ? "MODALIDADE" : body.tipo.trim());
            evento.setClubeModalidadeId(body.clubeModalidadeId);
            evento.setColetividadeAtividadeId(body.coletividadeAtividadeId);
            
            if (!eventoDAO.editar(evento)) {
                return ResponseEntity.badRequest().body(Map.of("erro", "Não foi possível editar o evento."));
            }
            
            return ResponseEntity.ok().build();
            
        } catch (Exception e) {
            logger.severe("Erro ao editar evento: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("erro", "Erro ao editar o evento: " + e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deletar(@PathVariable Integer id) {
        try {
            Evento evento = eventoDAO.obterPorId(id);
            if (evento == null) {
                return ResponseEntity.notFound().build();
            }
            
            if (!eventoDAO.deletar(id)) {
                return ResponseEntity.badRequest().body(Map.of("erro", "Não foi possível deletar o evento."));
            }
            
            return ResponseEntity.ok().build();
            
        } catch (Exception e) {
            logger.severe("Erro ao deletar evento: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("erro", "Erro ao deletar o evento: " + e.getMessage()));
        }
    }

    /**
     * Verifica se o utilizador tem acesso completo ao evento (incluindo convocatórias)
     * - ADMIN: sempre tem acesso completo
     * - ATLETA/STAFF: tem acesso completo apenas se o evento é da sua modalidade
     */
    private boolean verificarAcessoCompleto(String currentRole, Integer currentModalidadeId, Object evento) {
        if (currentRole == null) {
            return false;
        }
        
        // Admins têm sempre acesso completo
        if ("ROLE_ADMIN".equals(currentRole)) {
            return true;
        }
        
        // Se o utilizador não tem modalidade associada, não tem acesso completo
        if (currentModalidadeId == null || currentModalidadeId <= 0) {
            return false;
        }
        
        // Determinar modalidade do evento
        Integer eventoModalidadeId = null;
        if (evento instanceof Map) {
            @SuppressWarnings("unchecked")
            Map<String, Object> eventoMap = (Map<String, Object>) evento;
            if (eventoMap.containsKey("clubeModalidade") && eventoMap.get("clubeModalidade") != null) {
                @SuppressWarnings("unchecked")
                Map<String, Object> cmMap = (Map<String, Object>) eventoMap.get("clubeModalidade");
                eventoModalidadeId = (Integer) cmMap.get("modalidadeId");
            }
        }
        
        // Comparar modalidades
        if (eventoModalidadeId != null) {
            return eventoModalidadeId.equals(currentModalidadeId);
        }
        
        return false;
    }

    private boolean verificarAcessoCompleto(String currentRole, Integer currentModalidadeId, Evento evento) {
        if (currentRole == null) {
            return false;
        }
        
        // Admins têm sempre acesso completo
        if ("ROLE_ADMIN".equals(currentRole)) {
            return true;
        }
        
        // Se o utilizador não tem modalidade associada, não tem acesso completo
        if (currentModalidadeId == null || currentModalidadeId <= 0) {
            return false;
        }
        
        // Para eventos de modalidade, comparar modalidades
        if ("MODALIDADE".equals(evento.getTipo()) && evento.getClubeModalidadeId() != null) {
            Integer eventoModalidadeId = eventoDAO.obterModalidadeIdPorClubeModalidadeId(evento.getClubeModalidadeId());
            if (eventoModalidadeId != null) {
                return eventoModalidadeId.equals(currentModalidadeId);
            }
        }
        
        return false;
    }
}
