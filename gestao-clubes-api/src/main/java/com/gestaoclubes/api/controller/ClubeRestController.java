package com.gestaoclubes.api.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.gestaoclubes.api.security.SecurityUtils;
import com.gestaoclubes.api.dao.AuditLogDAO;
import com.gestaoclubes.api.dao.ClubeDAO;
import com.gestaoclubes.api.model.Clube;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/clubes")
public class ClubeRestController {

    private final ClubeDAO clubeDAO = new ClubeDAO();
    private final AuditLogDAO auditLogDAO = new AuditLogDAO();
    private final ObjectMapper mapper = new ObjectMapper();

    @GetMapping
    public List<Clube> listarTodos() {
        return clubeDAO.listarTodos();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Clube> buscarPorId(@PathVariable int id) {
        Clube c = clubeDAO.buscarPorId(id);
        if (c == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(c);
    }

    @PostMapping
    public ResponseEntity<String> inserir(@RequestBody Clube clube) {
        boolean ok = clubeDAO.inserir(clube);
        if (!ok) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Não foi possível inserir clube.");
        }

        // Auditoria (CREATE) - não sabemos o id criado, então guardamos depois_json sem registo_id
        Integer adminId = SecurityUtils.currentUserId();
        if (adminId != null) {
            try {
                String depois = mapper.writeValueAsString(clube);
                auditLogDAO.inserir(adminId, "CREATE", "clube", null, null, depois);
            } catch (Exception e) {
                e.printStackTrace();
            }
        }

        return ResponseEntity.status(HttpStatus.CREATED).body("Clube inserido com sucesso.");
    }

    @PutMapping("/{id}")
    public ResponseEntity<String> atualizar(@PathVariable int id, @RequestBody Clube clube) {
        Clube antesObj = clubeDAO.buscarPorId(id);

        boolean ok = clubeDAO.atualizar(id, clube);
        if (!ok) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Não foi possível atualizar clube.");
        }

        Clube depoisObj = clubeDAO.buscarPorId(id);

        Integer adminId = SecurityUtils.currentUserId();
        if (adminId != null) {
            try {
                String antes = antesObj == null ? null : mapper.writeValueAsString(antesObj);
                String depois = depoisObj == null ? null : mapper.writeValueAsString(depoisObj);
                auditLogDAO.inserir(adminId, "UPDATE", "clube", id, antes, depois);
            } catch (Exception ignored) {}
        }

        return ResponseEntity.ok("Clube atualizado com sucesso.");
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> remover(@PathVariable int id) {
        Clube antesObj = clubeDAO.buscarPorId(id);

        boolean ok = clubeDAO.remover(id);
        if (!ok) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Não foi possível remover clube.");
        }

        Integer adminId = SecurityUtils.currentUserId();
        if (adminId != null) {
            try {
                String antes = antesObj == null ? null : mapper.writeValueAsString(antesObj);
                auditLogDAO.inserir(adminId, "DELETE", "clube", id, antes, null);
            } catch (Exception ignored) {}
        }

        return ResponseEntity.status(HttpStatus.NO_CONTENT).body("Clube removido com sucesso.");
    }
}