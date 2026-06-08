package com.gestaoclubes.api.controller;

import com.gestaoclubes.api.dao.AuditLogDAO;
import com.gestaoclubes.api.dao.TesourariaDAO;
import com.gestaoclubes.api.security.SecurityUtils;
import com.gestaoclubes.api.service.EmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/clubes/{clubeId}/tesouraria")
public class TesourariaRestController {

    private final TesourariaDAO tesourariaDAO = new TesourariaDAO();
    private final AuditLogDAO auditLogDAO = new AuditLogDAO();
    private final EmailService emailService;

    @Autowired
    public TesourariaRestController(EmailService emailService) {
        this.emailService = emailService;
    }

    private void exigirAcessoTesouraria(int clubeId) {
        if (!SecurityUtils.canAccessTesouraria(clubeId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Acesso não autorizado à Tesouraria.");
        }
    }

    // ==========================================
    // MENSALIDADES POR ESCALÃO
    // ==========================================

    @GetMapping("/mensalidades/config")
    public List<Map<String, Object>> listarTaxasMensalidade(
            @PathVariable int clubeId,
            @RequestParam(defaultValue = "2024/2025") String epoca) {
        exigirAcessoTesouraria(clubeId);
        return tesourariaDAO.listarTaxasMensalidade(clubeId, epoca);
    }

    @PutMapping("/mensalidades/config")
    public ResponseEntity<?> upsertTaxaMensalidade(
            @PathVariable int clubeId,
            @RequestBody TaxaMensalidadeRequest body) {
        exigirAcessoTesouraria(clubeId);
        boolean ok = tesourariaDAO.upsertTaxaMensalidade(clubeId, body.escalaoId, body.epoca,
                body.valorMensal, SecurityUtils.currentUserId());
        if (ok) {
            auditLogDAO.inserir(SecurityUtils.currentUserId(), "UPDATE", "mensalidade_escalao", null,
                    null, "{\"escalaoId\":" + body.escalaoId + ",\"valor\":" + body.valorMensal + "}");
        }
        return ok ? ResponseEntity.ok().build() : ResponseEntity.internalServerError().build();
    }

    // ==========================================
    // TAXAS DE INSCRIÇÃO POR ESCALÃO
    // ==========================================

    @GetMapping("/inscricoes/config")
    public List<Map<String, Object>> listarTaxasInscricao(
            @PathVariable int clubeId,
            @RequestParam(defaultValue = "2024/2025") String epoca) {
        exigirAcessoTesouraria(clubeId);
        return tesourariaDAO.listarTaxasInscricao(clubeId, epoca);
    }

    @PutMapping("/inscricoes/config")
    public ResponseEntity<?> upsertTaxaInscricao(
            @PathVariable int clubeId,
            @RequestBody TaxaInscricaoRequest body) {
        exigirAcessoTesouraria(clubeId);
        boolean ok = tesourariaDAO.upsertTaxaInscricao(clubeId, body.escalaoId, body.epoca,
                body.valorInscricao, SecurityUtils.currentUserId());
        if (ok) {
            auditLogDAO.inserir(SecurityUtils.currentUserId(), "UPDATE", "inscricao_escalao", null,
                    null, "{\"escalaoId\":" + body.escalaoId + ",\"valor\":" + body.valorInscricao + "}");
        }
        return ok ? ResponseEntity.ok().build() : ResponseEntity.internalServerError().build();
    }

    // ==========================================
    // PAGAMENTOS
    // ==========================================

    @GetMapping("/pagamentos")
    public List<Map<String, Object>> listarPagamentos(
            @PathVariable int clubeId,
            @RequestParam(required = false) Integer atletaId,
            @RequestParam(required = false) Integer escalaoId,
            @RequestParam(required = false) Integer mes,
            @RequestParam(required = false) Integer ano,
            @RequestParam(required = false) String estado) {
        exigirAcessoTesouraria(clubeId);
        return tesourariaDAO.listarPagamentos(clubeId, atletaId, escalaoId, mes, ano, estado);
    }

    @PostMapping("/pagamentos")
    public ResponseEntity<?> inserirPagamento(
            @PathVariable int clubeId,
            @RequestBody PagamentoRequest body) {
        exigirAcessoTesouraria(clubeId);
        if (body.atletaId <= 0) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "atletaId é obrigatório.");
        if (body.mes < 1 || body.mes > 12) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Mês inválido.");
        if (body.ano < 2000) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ano inválido.");
        int id = tesourariaDAO.inserirPagamento(clubeId, body.atletaId, body.escalaoId, body.mes, body.ano,
                body.valorDevido, body.valorPago, body.dataPagamento, body.metodoPagamento,
                body.estado, body.observacoes, SecurityUtils.currentUserId());
        if (id <= 0) return ResponseEntity.internalServerError().build();
        auditLogDAO.inserir(SecurityUtils.currentUserId(), "CREATE", "pagamento_mensalidade", id,
                null, "{\"atletaId\":" + body.atletaId + ",\"mes\":" + body.mes + ",\"ano\":" + body.ano + "}");
        return ResponseEntity.ok(Map.of("id", id));
    }

    @PutMapping("/pagamentos/{id}")
    public ResponseEntity<?> atualizarPagamento(
            @PathVariable int clubeId,
            @PathVariable int id,
            @RequestBody PagamentoRequest body) {
        exigirAcessoTesouraria(clubeId);
        boolean ok = tesourariaDAO.atualizarPagamento(id, body.valorDevido, body.valorPago,
                body.dataPagamento, body.metodoPagamento, body.estado, body.observacoes);
        if (ok) {
            auditLogDAO.inserir(SecurityUtils.currentUserId(), "UPDATE", "pagamento_mensalidade", id,
                    null, "{\"estado\":\"" + body.estado + "\",\"valorPago\":" + body.valorPago + "}");
        }
        return ok ? ResponseEntity.ok().build() : ResponseEntity.internalServerError().build();
    }

    // ==========================================
    // DÍVIDAS
    // ==========================================

    @GetMapping("/dividas")
    public List<Map<String, Object>> listarDividas(
            @PathVariable int clubeId,
            @RequestParam(required = false) Integer escalaoId,
            @RequestParam(required = false) Integer mes,
            @RequestParam(required = false) Integer ano,
            @RequestParam(required = false) Integer atletaId) {
        exigirAcessoTesouraria(clubeId);
        return tesourariaDAO.listarDividas(clubeId, escalaoId, mes, ano, atletaId);
    }

    // ==========================================
    // RECEBIMENTOS POR ESCALÃO
    // ==========================================

    @GetMapping("/recebimentos")
    public List<Map<String, Object>> listarRecebimentos(
            @PathVariable int clubeId,
            @RequestParam(required = false) Integer mes,
            @RequestParam(required = false) Integer ano) {
        exigirAcessoTesouraria(clubeId);
        return tesourariaDAO.listarRecebimentosPorEscalao(clubeId, mes, ano);
    }

    // ==========================================
    // INSCRIÇÕES
    // ==========================================

    @GetMapping("/inscricoes")
    public List<Map<String, Object>> listarInscricoes(
            @PathVariable int clubeId,
            @RequestParam(required = false) String epoca,
            @RequestParam(required = false) String estado,
            @RequestParam(required = false) Integer atletaId) {
        exigirAcessoTesouraria(clubeId);
        return tesourariaDAO.listarInscricoes(clubeId, epoca, estado, atletaId);
    }

    @PostMapping("/inscricoes")
    public ResponseEntity<?> inserirInscricao(
            @PathVariable int clubeId,
            @RequestBody InscricaoRequest body) {
        exigirAcessoTesouraria(clubeId);
        if (body.atletaId <= 0) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "atletaId é obrigatório.");
        int id = tesourariaDAO.inserirInscricao(clubeId, body.atletaId, body.epoca, body.valorInscricao,
                body.estado, body.dataPagamento, body.metodoPagamento, body.observacoes, SecurityUtils.currentUserId());
        if (id <= 0) return ResponseEntity.internalServerError().build();
        auditLogDAO.inserir(SecurityUtils.currentUserId(), "CREATE", "inscricao_atleta", id,
                null, "{\"atletaId\":" + body.atletaId + ",\"epoca\":\"" + body.epoca + "\"}");
        return ResponseEntity.ok(Map.of("id", id));
    }

    @PutMapping("/inscricoes/{id}")
    public ResponseEntity<?> atualizarInscricao(
            @PathVariable int clubeId,
            @PathVariable int id,
            @RequestBody InscricaoRequest body) {
        exigirAcessoTesouraria(clubeId);
        boolean ok = tesourariaDAO.atualizarInscricao(id, body.valorInscricao, body.estado,
                body.dataPagamento, body.metodoPagamento, body.observacoes);
        if (ok) {
            auditLogDAO.inserir(SecurityUtils.currentUserId(), "UPDATE", "inscricao_atleta", id,
                    null, "{\"estado\":\"" + body.estado + "\"}");
        }
        return ok ? ResponseEntity.ok().build() : ResponseEntity.internalServerError().build();
    }

    // ==========================================
    // AVISOS DE PAGAMENTO
    // ==========================================

    @PostMapping("/avisos")
    public ResponseEntity<?> enviarAvisos(
            @PathVariable int clubeId,
            @RequestBody AvisosRequest body) {
        exigirAcessoTesouraria(clubeId);
        if (body.atletaIds == null || body.atletaIds.isEmpty()) {
            return ResponseEntity.badRequest().body("Selecione pelo menos um atleta.");
        }
        int enviados = 0;
        List<String> erros = new ArrayList<>();
        for (int atletaId : body.atletaIds) {
            try {
                Map<String, Object> atleta = tesourariaDAO.obterDadosAtletaParaAviso(atletaId);
                if (atleta == null) {
                    erros.add("Atleta #" + atletaId + " não encontrado.");
                    continue;
                }
                String email = (String) atleta.get("email");
                if (email == null || email.isBlank()) {
                    erros.add(atleta.get("nome") + ": sem email registado.");
                    continue;
                }
                emailService.enviarAvisoPagamento(email, (String) atleta.get("nome"),
                        body.nomeClube, body.mes, body.ano, body.valorEmDivida);
                enviados++;
                auditLogDAO.inserir(SecurityUtils.currentUserId(), "CREATE", "aviso_pagamento", atletaId,
                        null, "{\"mes\":" + body.mes + ",\"ano\":" + body.ano + "}");
            } catch (Exception e) {
                erros.add("Erro ao enviar para atleta #" + atletaId + ": " + e.getMessage());
            }
        }
        return ResponseEntity.ok(Map.of("enviados", enviados, "erros", erros));
    }

    // ==========================================
    // CLASSES DE REQUEST
    // ==========================================

    static class TaxaMensalidadeRequest {
        public int escalaoId;
        public String epoca;
        public double valorMensal;
    }

    static class TaxaInscricaoRequest {
        public int escalaoId;
        public String epoca;
        public double valorInscricao;
    }

    static class PagamentoRequest {
        public int atletaId;
        public Integer escalaoId;
        public int mes;
        public int ano;
        public double valorDevido;
        public double valorPago;
        public String dataPagamento;
        public String metodoPagamento;
        public String estado;
        public String observacoes;
    }

    static class InscricaoRequest {
        public int atletaId;
        public String epoca;
        public double valorInscricao;
        public String estado;
        public String dataPagamento;
        public String metodoPagamento;
        public String observacoes;
    }

    static class AvisosRequest {
        public List<Integer> atletaIds;
        public String nomeClube;
        public int mes;
        public int ano;
        public double valorEmDivida;
    }
}
