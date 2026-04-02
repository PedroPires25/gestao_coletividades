package com.gestaoclubes.api.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.gestaoclubes.api.security.SecurityUtils;
import com.gestaoclubes.api.dao.AuditLogDAO;
import com.gestaoclubes.api.dao.ModalidadeDAO;
import com.gestaoclubes.api.model.Modalidade;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/modalidades")
public class ModalidadesRestController {

    private final ModalidadeDAO modalidadeDAO = new ModalidadeDAO();
    private final AuditLogDAO auditLogDAO = new AuditLogDAO();
    private final ObjectMapper mapper = new ObjectMapper();

    @GetMapping
    public List<Modalidade> listar(
            @RequestParam(name = "ativas", defaultValue = "true") boolean ativas
    ) {
        return ativas ? modalidadeDAO.listarAtivas() : modalidadeDAO.listarTodas();
    }

    // POST /api/modalidades
    @PostMapping
    public Modalidade criar(@RequestBody CriarModalidadeRequest body) {
        if (body == null || body.nome == null || body.nome.isBlank()) {
            throw new IllegalArgumentException("O nome da modalidade é obrigatório.");
        }

        String nome = body.nome.trim();
        String descricao = body.descricao == null ? "" : body.descricao.trim();

        Modalidade m = new Modalidade(0, nome, descricao, true);

        int novoId = modalidadeDAO.inserir(m);
        if (novoId <= 0) {
            throw new IllegalStateException("Não foi possível criar a modalidade.");
        }

        Modalidade depoisObj = new Modalidade(novoId, nome, descricao, true);

        Integer adminId = SecurityUtils.currentUserId();
        if (adminId != null) {
            try {
                String depois = mapper.writeValueAsString(depoisObj);
                auditLogDAO.inserir(adminId, "CREATE", "modalidade", novoId, null, depois);
            } catch (Exception ignored) {}
        }

        return depoisObj;
    }

    // PUT /api/modalidades/{id}
    @PutMapping("/{id}")
    public void editar(@PathVariable int id, @RequestBody EditarModalidadeRequest body) {
        if (body == null || body.nome == null || body.nome.isBlank()) {
            throw new IllegalArgumentException("O nome da modalidade é obrigatório.");
        }

        Modalidade antesObj = modalidadeDAO.buscarPorId(id);

        String nome = body.nome.trim();
        String descricao = body.descricao == null ? "" : body.descricao.trim();

        Modalidade m = new Modalidade(id, nome, descricao, true);

        boolean ok = modalidadeDAO.atualizar(id, m);
        if (!ok) {
            throw new IllegalStateException("Não foi possível atualizar a modalidade.");
        }

        Modalidade depoisObj = modalidadeDAO.buscarPorId(id);

        Integer adminId = SecurityUtils.currentUserId();
        if (adminId != null) {
            try {
                String antes = antesObj == null ? null : mapper.writeValueAsString(antesObj);
                String depois = depoisObj == null ? null : mapper.writeValueAsString(depoisObj);
                auditLogDAO.inserir(adminId, "UPDATE", "modalidade", id, antes, depois);
            } catch (Exception ignored) {}
        }
    }

    public static class CriarModalidadeRequest {
        public String nome;
        public String descricao;
    }

    public static class EditarModalidadeRequest {
        public String nome;
        public String descricao;
    }
}