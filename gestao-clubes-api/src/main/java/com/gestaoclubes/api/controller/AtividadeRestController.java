package com.gestaoclubes.api.controller;

import com.gestaoclubes.api.dao.AtividadeDAO;
import com.gestaoclubes.api.model.Atividade;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/atividades")
@CrossOrigin(origins = "http://localhost:5173")
public class AtividadeRestController {

    private final AtividadeDAO atividadeDAO;

    public AtividadeRestController(AtividadeDAO atividadeDAO) {
        this.atividadeDAO = atividadeDAO;
    }

    @GetMapping
    public ResponseEntity<List<Atividade>> listar() {
        return ResponseEntity.ok(atividadeDAO.listarAtivas());
    }

    public static class CriarAtividadeRequest {
        public String nome;
        public String descricao;
    }

    @PostMapping
    public ResponseEntity<?> criar(@RequestBody CriarAtividadeRequest body) {
        if (body == null || body.nome == null || body.nome.isBlank()) {
            return ResponseEntity.badRequest().body("O nome da atividade é obrigatório.");
        }

        Integer id = atividadeDAO.criar(body.nome.trim(), body.descricao == null ? "" : body.descricao.trim());
        if (id == null) {
            return ResponseEntity.badRequest().body("Não foi possível criar a atividade.");
        }

        return ResponseEntity.ok(id);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> editar(@PathVariable int id, @RequestBody CriarAtividadeRequest body) {
        if (body == null || body.nome == null || body.nome.isBlank()) {
            return ResponseEntity.badRequest().body("O nome da atividade é obrigatório.");
        }

        boolean ok = atividadeDAO.editar(id, body.nome.trim(), body.descricao == null ? "" : body.descricao.trim());
        if (!ok) {
            return ResponseEntity.badRequest().body("Não foi possível editar a atividade.");
        }

        return ResponseEntity.ok().build();
    }
}