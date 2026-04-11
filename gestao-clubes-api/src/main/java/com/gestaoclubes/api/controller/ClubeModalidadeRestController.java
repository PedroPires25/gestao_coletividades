package com.gestaoclubes.api.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.gestaoclubes.api.security.SecurityUtils;
import com.gestaoclubes.api.dao.AuditLogDAO;
import com.gestaoclubes.api.dao.ClubeModalidadeDAO;
import com.gestaoclubes.api.model.ClubeModalidade;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/clubes")
public class ClubeModalidadeRestController {

    private final ClubeModalidadeDAO clubeModalidadeDAO = new ClubeModalidadeDAO();
    private final AuditLogDAO auditLogDAO = new AuditLogDAO();
    private final ObjectMapper mapper = new ObjectMapper();

    // GET /api/clubes/{clubeId}/modalidades?ativas=true&epoca=2024/2025
    @GetMapping("/{clubeId}/modalidades")
    public List<ClubeModalidade> listarModalidadesDoClube(
            @PathVariable int clubeId,
            @RequestParam(name = "ativas", defaultValue = "true") boolean ativas,
            @RequestParam(name = "epoca", required = false) String epoca
    ) {
        List<ClubeModalidade> base = ativas
                ? clubeModalidadeDAO.listarAtivasPorClube(clubeId)
                : clubeModalidadeDAO.listarPorClube(clubeId);

        if (epoca == null || epoca.isBlank()) {
            return base;
        }

        return base.stream()
                .filter(cm -> epoca.equals(cm.getEpoca()))
                .collect(Collectors.toList());
    }

    // POST /api/clubes/{clubeId}/modalidades
    // body: { "modalidadeId": 3, "epoca": "2024/2025" }
    @PostMapping("/{clubeId}/modalidades")
    public void anexarModalidadeAoClube(
            @PathVariable int clubeId,
            @RequestBody AnexarModalidadeRequest body
    ) {
        exigirGestaoClube(clubeId);
        if (body == null || body.modalidadeId <= 0 || body.epoca == null || body.epoca.isBlank()) {
            throw new IllegalArgumentException("modalidadeId e epoca são obrigatórios.");
        }

        String epoca = body.epoca.trim();

        boolean ok = clubeModalidadeDAO.inserir(clubeId, body.modalidadeId, epoca);
        if (!ok) {
            throw new IllegalArgumentException("Não foi possível anexar a modalidade ao clube.");
        }

        Integer adminId = SecurityUtils.currentUserId();
        if (adminId != null) {
            try {
                Map<String, Object> payload = Map.of(
                        "clubeId", clubeId,
                        "modalidadeId", body.modalidadeId,
                        "epoca", epoca
                );
                String depois = mapper.writeValueAsString(payload);
                auditLogDAO.inserir(adminId, "CREATE", "clube_modalidade", null, null, depois);
            } catch (Exception ignored) {}
        }
    }

    // DELETE /api/clubes/clube-modalidade/{id}
    @DeleteMapping("/clube-modalidade/{id}")
    public void removerModalidadeDoClube(@PathVariable int id) {
        ClubeModalidade antesObj = clubeModalidadeDAO.buscarPorId(id);
        if (antesObj == null || antesObj.getClube() == null) {
            throw new IllegalArgumentException("Registo não encontrado.");
        }
        exigirGestaoClube(antesObj.getClube().getId());

        boolean apagado = clubeModalidadeDAO.removerPorId(id);
        if (!apagado) {
            throw new IllegalArgumentException("Registo não encontrado.");
        }

        Integer adminId = SecurityUtils.currentUserId();
        if (adminId != null) {
            try {
                String antes = antesObj == null ? null : mapper.writeValueAsString(antesObj);
                auditLogDAO.inserir(adminId, "DELETE", "clube_modalidade", id, antes, null);
            } catch (Exception ignored) {}
        }
    }

    public static class AnexarModalidadeRequest {
        public int modalidadeId;
        public String epoca;
    }

    private void exigirGestaoClube(int clubeId) {
        if (!SecurityUtils.canManageClube(clubeId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Sem permissão para gerir modalidades deste clube.");
        }
    }
}
