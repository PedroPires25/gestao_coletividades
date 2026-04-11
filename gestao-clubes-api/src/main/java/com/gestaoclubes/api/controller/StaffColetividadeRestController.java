package com.gestaoclubes.api.controller;

import com.gestaoclubes.api.dao.StaffColetividadeDAO;
import com.gestaoclubes.api.model.StaffColetividadeRow;
import com.gestaoclubes.api.security.SecurityUtils;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/coletividades")
@CrossOrigin(origins = "http://localhost:5173")
public class StaffColetividadeRestController {

    private final StaffColetividadeDAO staffDAO;

    public StaffColetividadeRestController(StaffColetividadeDAO staffDAO) {
        this.staffDAO = staffDAO;
    }

    @GetMapping("/{coletividadeId}/atividades/{coletividadeAtividadeId}/staff")
    public ResponseEntity<List<StaffColetividadeRow>> listarStaff(
            @PathVariable int coletividadeId,
            @PathVariable int coletividadeAtividadeId
    ) {
        return ResponseEntity.ok(
                staffDAO.listarPorColetividadeAtividade(coletividadeId, coletividadeAtividadeId)
        );
    }

    public static class CriarStaffRequest {
        public String nome;
        public String email;
        public String telefone;
        public String morada;
        public String numRegisto;
        public Double remuneracao;
        public Integer cargoId;
        public Integer coletividadeAtividadeId;
        public String dataInicio;
        public String dataFim;
        public String observacoes;
    }

    @PostMapping("/{coletividadeId}/staff")
    public ResponseEntity<?> criarStaff(
            @PathVariable int coletividadeId,
            @RequestBody CriarStaffRequest body
    ) {
        exigirGestaoColetividade(coletividadeId);
        if (body == null || body.nome == null || body.nome.isBlank()) {
            return ResponseEntity.badRequest().body("Nome é obrigatório.");
        }
        if (body.cargoId == null || body.coletividadeAtividadeId == null) {
            return ResponseEntity.badRequest().body("cargoId e coletividadeAtividadeId são obrigatórios.");
        }

        Integer id = staffDAO.criarStaff(
                body.nome,
                body.email,
                body.telefone,
                body.morada,
                body.numRegisto,
                body.remuneracao,
                coletividadeId,
                body.coletividadeAtividadeId,
                body.cargoId,
                body.dataInicio,
                body.dataFim,
                body.observacoes
        );

        if (id == null) return ResponseEntity.badRequest().body("Não foi possível criar staff.");
        return ResponseEntity.ok(id);
    }

    private void exigirGestaoColetividade(int coletividadeId) {
        if (!SecurityUtils.canManageColetividade(coletividadeId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Sem permissão para gerir staff desta coletividade.");
        }
    }
}
