package com.gestaoclubes.api.controller;

import com.gestaoclubes.api.dao.UtenteDAO;
import com.gestaoclubes.api.model.Utente;
import com.gestaoclubes.api.security.SecurityUtils;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/coletividades")
@CrossOrigin(origins = "http://localhost:5173")
public class UtenteColetividadeRestController {

    private final UtenteDAO utenteDAO;

    public UtenteColetividadeRestController(UtenteDAO utenteDAO) {
        this.utenteDAO = utenteDAO;
    }

    @GetMapping("/{coletividadeId}/atividades/{coletividadeAtividadeId}/utentes")
    public ResponseEntity<List<Utente>> listarUtentes(
            @PathVariable int coletividadeId,
            @PathVariable int coletividadeAtividadeId
    ) {
        return ResponseEntity.ok(
                utenteDAO.listarPorColetividadeAtividade(coletividadeId, coletividadeAtividadeId)
        );
    }

    public static class CriarUtenteRequest {
        public String nome;
        public String dataNascimento;
        public String email;
        public String telefone;
        public String morada;
        public Integer estadoId;
        public String dataInscricao;
        public String dataFim;
        public Boolean ativo;
    }

    @PostMapping("/{coletividadeId}/utentes")
    public ResponseEntity<?> criarUtente(
            @PathVariable int coletividadeId,
            @RequestParam int coletividadeAtividadeId,
            @RequestBody CriarUtenteRequest body
    ) {
        exigirGestaoColetividade(coletividadeId);
        if (body == null || body.nome == null || body.nome.isBlank()) {
            return ResponseEntity.badRequest().body("Nome é obrigatório.");
        }

        Utente u = new Utente();
        u.setNome(body.nome);
        u.setDataNascimento(body.dataNascimento);
        u.setEmail(body.email);
        u.setTelefone(body.telefone);
        u.setMorada(body.morada);
        u.setEstadoId(body.estadoId == null ? 1 : body.estadoId);
        u.setDataInscricao(body.dataInscricao);
        u.setDataFim(body.dataFim);
        u.setAtivo(body.ativo == null || body.ativo);

        Integer id = utenteDAO.criarUtente(u, coletividadeAtividadeId);
        if (id == null) return ResponseEntity.badRequest().body("Não foi possível criar utente.");

        return ResponseEntity.ok(id);
    }

    private void exigirGestaoColetividade(int coletividadeId) {
        if (!SecurityUtils.canManageColetividade(coletividadeId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Sem permissão para gerir utentes desta coletividade.");
        }
    }
}
