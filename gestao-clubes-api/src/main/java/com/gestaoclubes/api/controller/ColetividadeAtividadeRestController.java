package com.gestaoclubes.api.controller;

import com.gestaoclubes.api.dao.AtividadeDAO;
import com.gestaoclubes.api.dao.ColetividadeAtividadeDAO;
import com.gestaoclubes.api.model.Atividade;
import com.gestaoclubes.api.model.ColetividadeAtividade;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/coletividades")
@CrossOrigin(origins = "http://localhost:5173")
public class ColetividadeAtividadeRestController {

    private final ColetividadeAtividadeDAO coletividadeAtividadeDAO;
    private final AtividadeDAO atividadeDAO;

    public ColetividadeAtividadeRestController(ColetividadeAtividadeDAO coletividadeAtividadeDAO, AtividadeDAO atividadeDAO) {
        this.coletividadeAtividadeDAO = coletividadeAtividadeDAO;
        this.atividadeDAO = atividadeDAO;
    }

    @GetMapping("/{coletividadeId}/atividades")
    public ResponseEntity<List<ColetividadeAtividade>> listarAtividadesDaColetividade(
            @PathVariable int coletividadeId,
            @RequestParam(defaultValue = "true") boolean ativas,
            @RequestParam(required = false, defaultValue = "") String ano
    ) {
        return ResponseEntity.ok(
                coletividadeAtividadeDAO.listarPorColetividade(coletividadeId, ativas, ano)
        );
    }

    @GetMapping("/atividades-catalogo")
    public ResponseEntity<List<Atividade>> listarAtividadesCatalogo() {
        return ResponseEntity.ok(atividadeDAO.listarAtivas());
    }

    public static class CriarAssociacaoRequest {
        public Integer atividadeId;
        public String ano;
    }

    @PostMapping("/{coletividadeId}/atividades")
    public ResponseEntity<?> anexarAtividade(
            @PathVariable int coletividadeId,
            @RequestBody CriarAssociacaoRequest body
    ) {
        if (body == null || body.atividadeId == null || body.ano == null || body.ano.isBlank()) {
            return ResponseEntity.badRequest().body("atividadeId e ano são obrigatórios.");
        }

        Integer id = coletividadeAtividadeDAO.criarAssociacao(coletividadeId, body.atividadeId, body.ano);
        if (id == null) return ResponseEntity.badRequest().body("Não foi possível anexar atividade.");

        return ResponseEntity.ok(id);
    }

    @DeleteMapping("/atividade-associacao/{id}")
    public ResponseEntity<?> removerAssociacao(@PathVariable int id) {
        return coletividadeAtividadeDAO.removerAssociacao(id)
                ? ResponseEntity.ok().build()
                : ResponseEntity.badRequest().body("Não foi possível remover a associação.");
    }
}