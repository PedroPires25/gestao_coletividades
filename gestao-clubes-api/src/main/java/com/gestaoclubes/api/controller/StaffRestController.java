package com.gestaoclubes.api.controller;

import com.gestaoclubes.api.dao.CargoStaffDAO;
import com.gestaoclubes.api.dao.ClubeModalidadeDAO;
import com.gestaoclubes.api.dao.EscalaoDAO;
import com.gestaoclubes.api.dao.StaffAfetacaoDAO;
import com.gestaoclubes.api.dao.StaffAfetacaoEscalaoDAO;
import com.gestaoclubes.api.dao.StaffDAO;
import com.gestaoclubes.api.model.CargoStaff;
import com.gestaoclubes.api.model.ClubeModalidade;
import com.gestaoclubes.api.model.Escalao;
import com.gestaoclubes.api.model.Staff;
import com.gestaoclubes.api.security.SecurityUtils;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.sql.Date;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class StaffRestController {

    private final StaffDAO staffDAO = new StaffDAO();
    private final StaffAfetacaoDAO staffAfetacaoDAO = new StaffAfetacaoDAO();
    private final StaffAfetacaoEscalaoDAO staffAfetacaoEscalaoDAO = new StaffAfetacaoEscalaoDAO();
    private final ClubeModalidadeDAO clubeModalidadeDAO = new ClubeModalidadeDAO();
    private final CargoStaffDAO cargoStaffDAO = new CargoStaffDAO();
    private final EscalaoDAO escalaoDAO = new EscalaoDAO();
    private final com.gestaoclubes.api.dao.UtilizadorDAO utilizadorDAO = new com.gestaoclubes.api.dao.UtilizadorDAO();

    @GetMapping("/staff/cargos")
    public List<CargoStaff> listarCargos() {
        return cargoStaffDAO.listarTodos();
    }

    @GetMapping("/staff/escaloes")
    public List<Escalao> listarEscaloes() {
        return escalaoDAO.listarTodos();
    }

    @GetMapping("/clubes/{clubeId}/staff")
    public List<Map<String, Object>> listarStaffPorClube(@PathVariable int clubeId) {
        return staffDAO.listarPorClube(clubeId);
    }

    @GetMapping("/clubes/{clubeId}/staff/modalidades/{clubeModalidadeId}")
    public List<Map<String, Object>> listarStaffPorClubeModalidade(
            @PathVariable int clubeId,
            @PathVariable int clubeModalidadeId
    ) {
        return staffDAO.listarPorClubeModalidade(clubeId, clubeModalidadeId);
    }

    @PostMapping("/clubes/{clubeId}/staff")
    public Map<String, Object> criarStaff(
            @PathVariable int clubeId,
            @RequestBody CriarStaffRequest body
    ) {
        exigirGestaoClube(clubeId);
        validarCriacao(body);

        ClubeModalidade clubeModalidade = null;
        Integer clubeModalidadeId = null;
        if (body.modalidadeId != null && body.modalidadeId > 0) {
            clubeModalidade = clubeModalidadeDAO.buscarAtivaPorClubeEModalidade(clubeId, body.modalidadeId);
            if (clubeModalidade == null) {
                throw new IllegalArgumentException("O clube não tem essa modalidade ativa.");
            }
            clubeModalidadeId = clubeModalidade.getId();
        }

        Staff staff = new Staff(
                body.nome.trim(),
                blankToNull(body.email),
                blankToNull(body.telefone),
                blankToNull(body.morada),
                blankToNull(body.numRegisto),
                body.remuneracao == null ? 0.0 : body.remuneracao
        );

        // Ligar ao utilizador se o email corresponder
        if (staff.getEmail() != null) {
            var util = utilizadorDAO.buscarPorEmail(staff.getEmail());
            if (util != null) staff.setUtilizadorId(util.getId());
        }

        int staffId = staffDAO.inserirRetornarId(staff);
        if (staffId <= 0) {
            throw new IllegalStateException("Não foi possível criar o membro do staff.");
        }

        int afetacaoId = staffAfetacaoDAO.inserirPorIdsRetornarId(
                staffId,
                clubeId,
                clubeModalidadeId,
                body.cargoId,
                parseDate(body.dataInicio),
                parseDate(body.dataFim),
                body.ativo == null || body.ativo ? blankToNull(body.observacoes) : appendObservacaoInativo(body.observacoes),
                body.ativo == null || body.ativo
        );

        if (afetacaoId <= 0) {
            staffDAO.remover(staffId);
            throw new IllegalStateException("O staff foi criado, mas não foi possível associá-lo ao clube/modalidade.");
        }

        staffAfetacaoEscalaoDAO.substituirTodos(afetacaoId, body.escaloesIds);

        Map<String, Object> resposta = new LinkedHashMap<>();
        resposta.put("id", staffId);
        resposta.put("afetacaoId", afetacaoId);
        resposta.put("clubeId", clubeId);
        resposta.put("clubeModalidadeId", clubeModalidadeId);
        resposta.put("modalidadeId", body.modalidadeId);
        resposta.put("nome", body.nome.trim());
        resposta.put("cargoId", body.cargoId);
        if (clubeModalidade != null) {
            resposta.put("epoca", clubeModalidade.getEpoca());
        }
        return resposta;
    }

    @PutMapping("/clubes/{clubeId}/staff/{staffId}")
    public ResponseEntity<?> atualizarStaff(
            @PathVariable int clubeId,
            @PathVariable int staffId,
            @RequestBody AtualizarStaffRequest body
    ) {
        exigirGestaoClube(clubeId);
        Staff atual = staffDAO.buscarPorId(staffId);
        if (atual == null) {
            throw new IllegalArgumentException("Membro do staff não encontrado.");
        }

        Staff atualizado = new Staff(
                staffId,
                blankToFallback(body.nome, atual.getNome()),
                blankToFallback(body.email, atual.getEmail()),
                blankToFallback(body.telefone, atual.getTelefone()),
                blankToFallback(body.morada, atual.getMorada()),
                blankToFallback(body.numRegisto, atual.getNumRegisto()),
                body.remuneracao == null ? atual.getRemuneracao() : body.remuneracao
        );

        boolean ok = staffDAO.atualizar(staffId, atualizado);
        if (!ok) {
            throw new IllegalStateException("Não foi possível atualizar o staff.");
        }

        return ResponseEntity.ok(Map.of("ok", true, "id", staffId, "clubeId", clubeId));
    }

    @PutMapping("/clubes/{clubeId}/staff/{staffId}/afetacoes/{afetacaoId}")
    public ResponseEntity<?> atualizarAfetacao(
            @PathVariable int clubeId,
            @PathVariable int staffId,
            @PathVariable int afetacaoId,
            @RequestBody AtualizarAfetacaoRequest body
    ) {
        exigirGestaoClube(clubeId);
        Map<String, Object> afetacao = staffAfetacaoDAO.buscarDetalhePorId(afetacaoId);
        if (afetacao == null) {
            throw new IllegalArgumentException("Afetação não encontrada.");
        }
        if (((Number) afetacao.get("staffId")).intValue() != staffId) {
            throw new IllegalArgumentException("A afetação não pertence ao staff indicado.");
        }
        if (((Number) afetacao.get("clubeId")).intValue() != clubeId) {
            throw new IllegalArgumentException("A afetação não pertence ao clube indicado.");
        }

        Integer novoCargoId = body.cargoId != null && body.cargoId > 0
                ? body.cargoId
                : ((Number) afetacao.get("cargoId")).intValue();

        Date dataInicio = body.dataInicio != null
                ? parseDate(body.dataInicio)
                : safeSqlDate(afetacao.get("dataInicio"));

        Date dataFim = body.dataFim != null
                ? parseDate(body.dataFim)
                : safeSqlDate(afetacao.get("dataFim"));

        String observacoes = body.observacoes != null
                ? blankToNull(body.observacoes)
                : (String) afetacao.get("observacoes");

        boolean ativo = body.ativo != null
                ? body.ativo
                : toBoolean(afetacao.get("ativo"));

        boolean ok = staffAfetacaoDAO.atualizarAfetacao(
                afetacaoId,
                clubeId,
                (Integer) afetacao.get("clubeModalidadeId"),
                novoCargoId,
                dataInicio,
                dataFim,
                observacoes,
                ativo
        );

        if (!ok) {
            throw new IllegalStateException("Não foi possível atualizar a afetação do staff.");
        }

        if (body.escaloesIds != null) {
            staffAfetacaoEscalaoDAO.substituirTodos(afetacaoId, body.escaloesIds);
        }

        return ResponseEntity.ok(Map.of("ok", true, "afetacaoId", afetacaoId));
    }

    @GetMapping("/staff/{staffId}/afetacoes")
    public List<Map<String, Object>> listarAfetacoes(@PathVariable int staffId) {
        return staffAfetacaoDAO.listarPorStaffDetalhado(staffId);
    }

    @PutMapping("/staff/afetacoes/{afetacaoId}/terminar")
    public ResponseEntity<?> terminarAfetacao(
            @PathVariable int afetacaoId,
            @RequestBody(required = false) Map<String, String> body
    ) {
        Map<String, Object> afetacao = staffAfetacaoDAO.buscarDetalhePorId(afetacaoId);
        if (afetacao == null) {
            throw new IllegalArgumentException("Afetação não encontrada.");
        }
        exigirGestaoClube(((Number) afetacao.get("clubeId")).intValue());

        Date dataFim = body != null && body.get("dataFim") != null && !body.get("dataFim").isBlank()
                ? Date.valueOf(body.get("dataFim").trim())
                : new Date(System.currentTimeMillis());

        boolean ok = staffAfetacaoDAO.definirDataFim(afetacaoId, dataFim);
        if (!ok) {
            throw new IllegalStateException("Não foi possível terminar a afetação.");
        }
        return ResponseEntity.ok(Map.of("ok", true, "afetacaoId", afetacaoId, "dataFim", dataFim.toString()));
    }

    private void validarCriacao(CriarStaffRequest body) {
        if (body == null || body.nome == null || body.nome.isBlank()) {
            throw new IllegalArgumentException("O nome do staff é obrigatório.");
        }
        if (body.cargoId == null || body.cargoId <= 0) {
            throw new IllegalArgumentException("O cargo é obrigatório.");
        }
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private static String blankToFallback(String value, String fallback) {
        return value == null ? fallback : blankToNull(value);
    }

    private static Date parseDate(String value) {
        return value == null || value.isBlank() ? null : Date.valueOf(value.trim());
    }

    private static Date safeSqlDate(Object value) {
        if (value == null) return null;
        if (value instanceof Date d) return d;
        if (value instanceof java.util.Date d) return new Date(d.getTime());
        return Date.valueOf(String.valueOf(value));
    }

    private static boolean toBoolean(Object value) {
        if (value == null) return true;
        if (value instanceof Boolean b) return b;
        if (value instanceof Number n) return n.intValue() != 0;
        return Boolean.parseBoolean(String.valueOf(value));
    }

    private static String appendObservacaoInativo(String observacoes) {
        String base = blankToNull(observacoes);
        return base == null ? "Afetação inativa." : base;
    }

    public static class CriarStaffRequest {
        public String nome;
        public String email;
        public String telefone;
        public String morada;
        public String numRegisto;
        public Double remuneracao;
        public Integer modalidadeId;
        public Integer cargoId;
        public String dataInicio;
        public String dataFim;
        public String observacoes;
        public Boolean ativo;
        public List<Integer> escaloesIds;
    }

    public static class AtualizarStaffRequest {
        public String nome;
        public String email;
        public String telefone;
        public String morada;
        public String numRegisto;
        public Double remuneracao;
    }

    public static class AtualizarAfetacaoRequest {
        public Integer cargoId;
        public String dataInicio;
        public String dataFim;
        public String observacoes;
        public Boolean ativo;
        public List<Integer> escaloesIds;
    }

    private void exigirGestaoClube(int clubeId) {
        if (!SecurityUtils.canManageClube(clubeId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Sem permissão para gerir staff deste clube.");
        }
    }
}
