package com.gestaoclubes.api.controller;

import com.gestaoclubes.api.dao.AtletaDAO;
import com.gestaoclubes.api.security.SecurityUtils;
import com.gestaoclubes.api.service.EmailService;
import com.gestaoclubes.api.service.TreinadorService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class TreinadorRestController {

    private final TreinadorService treinadorService;
    private final EmailService emailService;
    private final AtletaDAO atletaDAO = new AtletaDAO();

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
}