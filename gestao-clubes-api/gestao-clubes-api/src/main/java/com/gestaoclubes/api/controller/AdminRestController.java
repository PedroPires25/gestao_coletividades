package com.gestaoclubes.api.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.gestaoclubes.api.security.SecurityUtils;
import com.gestaoclubes.api.dao.AuditLogDAO;
import com.gestaoclubes.api.dao.PerfilDAO;
import com.gestaoclubes.api.dao.UtilizadorDAO;
import com.gestaoclubes.api.model.Utilizador;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
public class AdminRestController {

    private final UtilizadorDAO utilizadorDAO = new UtilizadorDAO();
    private final PerfilDAO perfilDAO = new PerfilDAO();
    private final AuditLogDAO auditLogDAO = new AuditLogDAO();
    private final ObjectMapper mapper = new ObjectMapper();

    public static class UtilizadorAdminDto {
        public int id;
        public String email;
        public int perfilId;
        public String role; // ADMIN/USER
        public boolean ativo;

        public UtilizadorAdminDto(Utilizador u, String role) {
            this.id = u.getId();
            this.email = u.getUtilizador();
            this.perfilId = u.getPerfilId();
            this.role = role;
            this.ativo = u.isAtivo();
        }
    }

    public static class UpdatePerfilRequest {
        public String perfil; // "ADMIN" ou "USER"
    }

    @GetMapping("/users")
    public List<UtilizadorAdminDto> listarUsers() {
        int adminPerfilId = perfilDAO.obterPerfilAdmin();
        return utilizadorDAO.listarTodos().stream()
                .map(u -> new UtilizadorAdminDto(u, (u.getPerfilId() == adminPerfilId) ? "ADMIN" : "USER"))
                .toList();
    }

    @PutMapping("/users/{id}/perfil")
    public ResponseEntity<?> alterarPerfil(@PathVariable int id, @RequestBody UpdatePerfilRequest body) {
        if (body == null || body.perfil == null || body.perfil.isBlank()) {
            return ResponseEntity.badRequest().body("Perfil é obrigatório (ADMIN/USER).");
        }

        String perfilNovo = body.perfil.trim().toUpperCase();
        int novoPerfilId;
        String acao;

        if ("ADMIN".equals(perfilNovo)) {
            novoPerfilId = perfilDAO.obterPerfilAdmin();
            acao = "PROMOTE";
        } else if ("USER".equals(perfilNovo)) {
            novoPerfilId = perfilDAO.obterPerfilUtilizadorPadrao();
            acao = "DEMOTE";
        } else {
            return ResponseEntity.badRequest().body("Perfil inválido. Use ADMIN ou USER.");
        }

        Utilizador antes = utilizadorDAO.buscarPorId(id);
        if (antes == null) {
            return ResponseEntity.notFound().build();
        }

        boolean ok = utilizadorDAO.atualizarPerfil(id, novoPerfilId);
        if (!ok) {
            return ResponseEntity.badRequest().body("Não foi possível alterar o perfil.");
        }

        Utilizador depois = utilizadorDAO.buscarPorId(id);

        Integer adminId = SecurityUtils.currentUserId();
        if (adminId != null) {
            try {
                String antesJson = mapper.writeValueAsString(antes);
                String depoisJson = mapper.writeValueAsString(depois);
                auditLogDAO.inserir(adminId, acao, "utilizadores", id, antesJson, depoisJson);
            } catch (Exception ignored) {}
        }

        return ResponseEntity.ok("Perfil atualizado.");
    }
}