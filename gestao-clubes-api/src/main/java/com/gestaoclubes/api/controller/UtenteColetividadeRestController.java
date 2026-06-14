package com.gestaoclubes.api.controller;

import com.gestaoclubes.api.dao.UtenteDAO;
import com.gestaoclubes.api.model.Utente;
import com.gestaoclubes.api.security.SecurityUtils;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/coletividades")
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

    @GetMapping("/{coletividadeId}/inscritos")
    public ResponseEntity<List<Map<String, Object>>> listarTodosInscritos(@PathVariable int coletividadeId) {
        return ResponseEntity.ok(utenteDAO.listarTodosPorColetividade(coletividadeId));
    }

    @GetMapping("/minhas-atividades")
    public ResponseEntity<List<Map<String, Object>>> getMinhasAtividades() {
        Integer utilizadorId = SecurityUtils.currentUserId();
        if (utilizadorId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(utenteDAO.listarAtividadesPorUtilizador(utilizadorId));
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
        public List<Integer> atividadeIds;
    }

    public static class AdicionarAtividadeRequest {
        public Integer coletividadeAtividadeId;
        public String dataInscricao;
    }

    @PostMapping("/{coletividadeId}/utentes")
    public ResponseEntity<?> criarUtente(
            @PathVariable int coletividadeId,
            @RequestBody CriarUtenteRequest body
    ) {
        exigirGestaoColetividade(coletividadeId);
        if (body == null || body.nome == null || body.nome.isBlank()) {
            return ResponseEntity.badRequest().body("Nome é obrigatório.");
        }
        if (body.atividadeIds == null || body.atividadeIds.isEmpty()) {
            return ResponseEntity.badRequest().body("Deve selecionar pelo menos uma atividade.");
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

        Integer id = utenteDAO.criarUtenteComAtividades(u, body.atividadeIds);
        if (id == null) return ResponseEntity.badRequest().body("Não foi possível criar inscrito.");

        return ResponseEntity.ok(id);
    }

    @PutMapping("/{coletividadeId}/utentes/{utenteId}")
    public ResponseEntity<?> atualizarUtente(
            @PathVariable int coletividadeId,
            @PathVariable int utenteId,
            @RequestBody CriarUtenteRequest body
    ) {
        exigirGestaoColetividade(coletividadeId);

        if (body == null || body.nome == null || body.nome.isBlank()) {
            return ResponseEntity.badRequest().body("Nome é obrigatório.");
        }
        if (!utenteDAO.utentePertenceColetividade(coletividadeId, utenteId)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Inscrito não encontrado.");
        }

        boolean ok = utenteDAO.atualizarUtente(
                utenteId,
                body.nome.trim(),
                body.dataNascimento,
                body.email,
                body.telefone,
                body.morada,
                body.estadoId == null ? 1 : body.estadoId
        );

        return ok
                ? ResponseEntity.ok().body("Inscrito atualizado com sucesso.")
                : ResponseEntity.badRequest().body("Não foi possível atualizar o inscrito.");
    }

    @DeleteMapping("/{coletividadeId}/utentes/{utenteId}/inscricao/{inscricaoId}")
    public ResponseEntity<?> removerInscricaoAtividade(
            @PathVariable int coletividadeId,
            @PathVariable int utenteId,
            @PathVariable int inscricaoId
    ) {
        exigirGestaoColetividade(coletividadeId);

        if (!utenteDAO.inscricaoPertenceAoUtente(coletividadeId, utenteId, inscricaoId)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Inscrição não encontrada.");
        }

        return utenteDAO.removerInscricaoAtividade(inscricaoId)
                ? ResponseEntity.ok().body("Inscrição removida com sucesso.")
                : ResponseEntity.badRequest().body("Não foi possível remover a inscrição.");
    }

    @PostMapping("/{coletividadeId}/utentes/{utenteId}/atividades")
    public ResponseEntity<?> adicionarAtividade(
            @PathVariable int coletividadeId,
            @PathVariable int utenteId,
            @RequestBody AdicionarAtividadeRequest body
    ) {
        exigirGestaoColetividade(coletividadeId);

        if (body == null || body.coletividadeAtividadeId == null) {
            return ResponseEntity.badRequest().body("coletividadeAtividadeId é obrigatório.");
        }
        if (!utenteDAO.utentePertenceColetividade(coletividadeId, utenteId)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Inscrito não encontrado.");
        }

        Integer id = utenteDAO.adicionarAtividade(utenteId, body.coletividadeAtividadeId, body.dataInscricao);
        if (id == null) {
            return ResponseEntity.badRequest().body("Não foi possível adicionar a atividade ao inscrito.");
        }

        return ResponseEntity.ok(id);
    }

    private void exigirGestaoColetividade(int coletividadeId) {
        if (!SecurityUtils.canManageColetividade(coletividadeId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Sem permissão para gerir inscritos desta coletividade.");
        }
    }
}