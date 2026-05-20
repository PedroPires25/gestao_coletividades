package com.gestaoclubes.api.controller;

import com.gestaoclubes.api.dao.NotificacaoDAO;
import com.gestaoclubes.api.security.SecurityUtils;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Endpoint para administradores consultarem o log de notificações.
 */
@RestController
@RequestMapping("/api/admin/notificacoes")
public class NotificacaoRestController {

    private final NotificacaoDAO notificacaoDAO = new NotificacaoDAO();

    /** GET /api/admin/notificacoes?eventoId=X&limit=100 */
    @GetMapping
    public ResponseEntity<?> listar(
            @RequestParam(required = false) Integer eventoId,
            @RequestParam(defaultValue = "100") int limit) {

        if (!SecurityUtils.isSuperAdmin() && !SecurityUtils.isAdministradorEstrutura()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("erro", "Acesso negado."));
        }

        List<Map<String, Object>> lista = eventoId != null
                ? notificacaoDAO.listarPorEvento(eventoId)
                : notificacaoDAO.listarTodos(limit);

        return ResponseEntity.ok(lista);
    }
}
