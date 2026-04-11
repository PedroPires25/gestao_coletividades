package com.gestaoclubes.api.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.gestaoclubes.api.security.SecurityUtils;
import com.gestaoclubes.api.dao.AuditLogDAO;
import com.gestaoclubes.api.dao.ColetividadeDAO;
import com.gestaoclubes.api.model.Coletividade;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/coletividades")
public class ColetividadeRestController {

    private final ColetividadeDAO coletividadeDAO = new ColetividadeDAO();
    private final AuditLogDAO auditLogDAO = new AuditLogDAO();
    private final ObjectMapper mapper = new ObjectMapper();

    @GetMapping
    public List<Coletividade> listarTodos() {
        return coletividadeDAO.listarTodos();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Coletividade> buscarPorId(@PathVariable int id) {
        Coletividade c = coletividadeDAO.buscarPorId(id);
        if (c == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(c);
    }

    @PostMapping
    public ResponseEntity<String> inserir(@RequestBody Coletividade coletividade) {
        exigirSuperAdmin();
        boolean ok = coletividadeDAO.inserir(coletividade);
        if (!ok) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Não foi possível inserir coletividade.");
        }

        Integer adminId = SecurityUtils.currentUserId();
        if (adminId != null) {
            try {
                String depois = mapper.writeValueAsString(coletividade);
                auditLogDAO.inserir(adminId, "CREATE", "coletividade", null, null, depois);
            } catch (Exception ignored) {}
        }

        return ResponseEntity.status(HttpStatus.CREATED).body("Coletividade inserida com sucesso.");
    }

    @PutMapping("/{id}")
    public ResponseEntity<String> atualizar(@PathVariable int id, @RequestBody Coletividade coletividade) {
        exigirGestaoColetividade(id);
        Coletividade antesObj = coletividadeDAO.buscarPorId(id);

        boolean ok = coletividadeDAO.atualizar(id, coletividade);
        if (!ok) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Não foi possível atualizar coletividade.");
        }

        Coletividade depoisObj = coletividadeDAO.buscarPorId(id);

        Integer adminId = SecurityUtils.currentUserId();
        if (adminId != null) {
            try {
                String antes = antesObj == null ? null : mapper.writeValueAsString(antesObj);
                String depois = depoisObj == null ? null : mapper.writeValueAsString(depoisObj);
                auditLogDAO.inserir(adminId, "UPDATE", "coletividade", id, antes, depois);
            } catch (Exception ignored) {}
        }

        return ResponseEntity.ok("Coletividade atualizada com sucesso.");
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> remover(@PathVariable int id) {
        exigirSuperAdmin();
        Coletividade antesObj = coletividadeDAO.buscarPorId(id);

        boolean ok = coletividadeDAO.remover(id);
        if (!ok) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Não foi possível remover coletividade.");
        }

        Integer adminId = SecurityUtils.currentUserId();
        if (adminId != null) {
            try {
                String antes = antesObj == null ? null : mapper.writeValueAsString(antesObj);
                auditLogDAO.inserir(adminId, "DELETE", "coletividade", id, antes, null);
            } catch (Exception ignored) {}
        }

        return ResponseEntity.status(HttpStatus.NO_CONTENT).body("Coletividade removida com sucesso.");
    }

    private void exigirSuperAdmin() {
        if (!SecurityUtils.isSuperAdmin()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Apenas o super administrador pode criar ou remover coletividades.");
        }
    }

    private void exigirGestaoColetividade(int coletividadeId) {
        if (!SecurityUtils.canManageColetividade(coletividadeId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Sem permissão para gerir esta coletividade.");
        }
    }
}
