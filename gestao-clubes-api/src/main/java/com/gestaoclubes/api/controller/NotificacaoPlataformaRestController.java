package com.gestaoclubes.api.controller;

import com.gestaoclubes.api.dao.NotificacaoPlataformaDAO;
import com.gestaoclubes.api.security.SecurityUtils;
import com.gestaoclubes.api.service.NotificacaoPlataformaService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notificacoes")
public class NotificacaoPlataformaRestController {

    private final NotificacaoPlataformaDAO dao = new NotificacaoPlataformaDAO();
    private final NotificacaoPlataformaService service = new NotificacaoPlataformaService();

    /** GET /api/notificacoes - all notifications for current user */
    @GetMapping
    public ResponseEntity<?> listar() {
        Integer userId = SecurityUtils.currentUserId();
        if (userId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        List<Map<String, Object>> lista = dao.listarParaUtilizador(userId, false);
        return ResponseEntity.ok(lista);
    }

    /** GET /api/notificacoes/pendentes - count + list of unresolved notifications */
    @GetMapping("/pendentes")
    public ResponseEntity<?> pendentes() {
        Integer userId = SecurityUtils.currentUserId();
        if (userId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        List<Map<String, Object>> lista = dao.listarParaUtilizador(userId, true);
        int count = lista.size();
        return ResponseEntity.ok(Map.of("count", count, "notificacoes", lista));
    }

    /** GET /api/notificacoes/pendentes/count - fast count only */
    @GetMapping("/pendentes/count")
    public ResponseEntity<?> pendenteCount() {
        Integer userId = SecurityUtils.currentUserId();
        if (userId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        List<Map<String, Object>> lista = dao.listarParaUtilizador(userId, true);
        int total = lista.size();
        String tipo = lista.isEmpty() ? null
                : (String) lista.get(0).getOrDefault("tipo", null);
        return ResponseEntity.ok(Map.of("totalPendentes", total, "tipo", tipo != null ? tipo : ""));
    }

    /** PATCH /api/notificacoes/{id}/lida - mark notification as read */
    @PatchMapping("/{id}/lida")
    public ResponseEntity<?> marcarLida(@PathVariable long id) {
        Integer userId = SecurityUtils.currentUserId();
        if (userId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        boolean ok = dao.marcarLida(id, userId);
        if (!ok) return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Notificação não encontrada.");
        return ResponseEntity.ok(Map.of("ok", true));
    }

    /** PATCH /api/notificacoes/resolver-por-registo/{registoId} - resolve notifications for a registration */
    @PatchMapping("/resolver-por-registo/{registoId}")
    public ResponseEntity<?> resolverPorRegisto(@PathVariable int registoId) {
        Integer userId = SecurityUtils.currentUserId();
        if (userId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        if (!SecurityUtils.isSuperAdmin() && !SecurityUtils.isAdministradorEstrutura() && !SecurityUtils.isSecretario()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Sem permissões.");
        }
        service.resolverPorRegistoPendente(registoId);
        return ResponseEntity.ok(Map.of("ok", true));
    }
}
