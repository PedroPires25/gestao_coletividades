package com.gestaoclubes.api.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.gestaoclubes.api.security.SecurityUtils;
import com.gestaoclubes.api.dao.AtletaClubeModalidadeDAO;
import com.gestaoclubes.api.dao.AtletaDAO;
import com.gestaoclubes.api.dao.AuditLogDAO;
import com.gestaoclubes.api.dao.ClubeModalidadeDAO;
import com.gestaoclubes.api.dao.EscalaoDAO;
import com.gestaoclubes.api.dao.EstadoAtletaDAO;
import com.gestaoclubes.api.model.Atleta;
import com.gestaoclubes.api.model.ClubeModalidade;
import com.gestaoclubes.api.model.Escalao;
import com.gestaoclubes.api.model.EstadoAtleta;
import org.springframework.web.bind.annotation.*;

import java.sql.Date;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class AtletasRestController {

    private final AtletaDAO atletaDAO = new AtletaDAO();
    private final AtletaClubeModalidadeDAO atletaClubeModalidadeDAO = new AtletaClubeModalidadeDAO();
    private final ClubeModalidadeDAO clubeModalidadeDAO = new ClubeModalidadeDAO();
    private final EscalaoDAO escalaoDAO = new EscalaoDAO();
    private final EstadoAtletaDAO estadoAtletaDAO = new EstadoAtletaDAO();
    private final AuditLogDAO auditLogDAO = new AuditLogDAO();
    private final ObjectMapper mapper = new ObjectMapper();

    @GetMapping("/clubes/{clubeId}/modalidades/{modalidadeId}/atletas")
    public List<Map<String, Object>> listarPorClubeEModalidade(
            @PathVariable int clubeId,
            @PathVariable int modalidadeId
    ) {
        return atletaDAO.listarPorClubeEModalidade(clubeId, modalidadeId);
    }

    @GetMapping("/clubes/{clubeId}/clube-modalidade/{clubeModalidadeId}/atletas")
    public List<Map<String, Object>> listarPorClubeModalidade(
            @PathVariable int clubeId,
            @PathVariable int clubeModalidadeId
    ) {
        ClubeModalidade clubeModalidade = clubeModalidadeDAO.buscarPorId(clubeModalidadeId);
        if (clubeModalidade == null || clubeModalidade.getClube() == null || clubeModalidade.getClube().getId() != clubeId) {
            throw new IllegalArgumentException("Modalidade não encontrada para este clube.");
        }
        return atletaDAO.listarPorClubeModalidade(clubeId, clubeModalidadeId);
    }

    @PostMapping("/clubes/{clubeId}/modalidades/{modalidadeId}/atletas")
    public Map<String, Object> criarAtleta(
            @PathVariable int clubeId,
            @PathVariable int modalidadeId,
            @RequestBody CriarAtletaRequest body
    ) {
        if (body == null || body.nome == null || body.nome.isBlank()) {
            throw new IllegalArgumentException("O nome do atleta é obrigatório.");
        }
        if (body.escalaoId == null || body.escalaoId <= 0) {
            throw new IllegalArgumentException("O escalão é obrigatório.");
        }
        if (body.estadoId == null || body.estadoId <= 0) {
            throw new IllegalArgumentException("O estado é obrigatório.");
        }

        ClubeModalidade clubeModalidade = clubeModalidadeDAO.buscarAtivaPorClubeEModalidade(clubeId, modalidadeId);
        if (clubeModalidade == null) {
            throw new IllegalArgumentException("O clube não tem essa modalidade ativa.");
        }

        Atleta atleta = new Atleta(
                body.nome.trim(),
                parseDate(body.dataNascimento),
                blankToNull(body.email),
                blankToNull(body.telefone),
                blankToNull(body.morada),
                clubeId,
                body.estadoId,
                body.escalaoId,
                body.remuneracao == null ? 0.0 : body.remuneracao
        );

        Integer atletaId = atletaDAO.inserirEDevolverId(atleta);
        if (atletaId == null || atletaId <= 0) {
            throw new IllegalStateException("Não foi possível criar o atleta.");
        }

        boolean inscricaoOk = atletaClubeModalidadeDAO.inserirInscricao(
                atletaId,
                clubeModalidade.getId(),
                body.dataInscricao == null || body.dataInscricao.isBlank()
                        ? new Date(System.currentTimeMillis())
                        : Date.valueOf(body.dataInscricao.trim())
        );

        if (!inscricaoOk) {
            atletaDAO.remover(atletaId);
            throw new IllegalStateException("O atleta foi criado, mas não foi possível associá-lo à modalidade.");
        }

        Atleta criado = atletaDAO.buscarPorId(atletaId);

        Integer adminId = SecurityUtils.currentUserId();
        if (adminId != null) {
            try {
                String depois = mapper.writeValueAsString(criado);
                auditLogDAO.inserir(adminId, "CREATE", "atleta", atletaId, null, depois);
            } catch (Exception ignored) {}
        }

        Map<String, Object> resposta = new LinkedHashMap<>();
        resposta.put("id", criado.getId());
        resposta.put("nome", criado.getNome());
        resposta.put("clubeId", clubeId);
        resposta.put("modalidadeId", modalidadeId);
        resposta.put("clubeModalidadeId", clubeModalidade.getId());
        resposta.put("epoca", clubeModalidade.getEpoca());
        return resposta;
    }

    @PutMapping("/clubes/{clubeId}/modalidades/{clubeModalidadeId}/atletas/{atletaId}")
    public Map<String, Object> atualizarAtleta(
            @PathVariable int clubeId,
            @PathVariable int clubeModalidadeId,
            @PathVariable int atletaId,
            @RequestBody AtualizarAtletaRequest body
    ) {
        if (body == null || body.nome == null || body.nome.isBlank()) {
            throw new IllegalArgumentException("O nome do atleta é obrigatório.");
        }
        if (body.escalaoId == null || body.escalaoId <= 0) {
            throw new IllegalArgumentException("O escalão é obrigatório.");
        }
        if (body.estadoId == null || body.estadoId <= 0) {
            throw new IllegalArgumentException("O estado é obrigatório.");
        }

        ClubeModalidade clubeModalidade = clubeModalidadeDAO.buscarPorId(clubeModalidadeId);
        if (clubeModalidade == null || clubeModalidade.getClube() == null || clubeModalidade.getClube().getId() != clubeId) {
            throw new IllegalArgumentException("Modalidade não encontrada para este clube.");
        }

        Atleta antes = atletaDAO.buscarPorId(atletaId);
        if (antes == null) {
            throw new IllegalArgumentException("Atleta não encontrado.");
        }

        Atleta atleta = new Atleta(
                atletaId,
                body.nome.trim(),
                parseDate(body.dataNascimento),
                blankToNull(body.email),
                blankToNull(body.telefone),
                blankToNull(body.morada),
                clubeId,
                body.estadoId,
                body.escalaoId,
                body.remuneracao == null ? 0.0 : body.remuneracao
        );

        boolean atletaOk = atletaDAO.atualizar(atletaId, atleta);
        if (!atletaOk) {
            throw new IllegalStateException("Não foi possível atualizar o atleta.");
        }

        boolean inscricaoOk = atletaClubeModalidadeDAO.atualizarInscricaoAtiva(
                atletaId,
                clubeModalidadeId,
                parseDate(body.dataInscricao),
                parseDate(body.dataFim),
                body.ativo == null || body.ativo
        );

        if (!inscricaoOk) {
            throw new IllegalStateException("O atleta foi atualizado, mas não foi possível atualizar a inscrição na modalidade.");
        }

        Atleta depois = atletaDAO.buscarPorId(atletaId);

        Integer adminId = SecurityUtils.currentUserId();
        if (adminId != null) {
            try {
                String antesJson = mapper.writeValueAsString(antes);
                String depoisJson = mapper.writeValueAsString(depois);
                auditLogDAO.inserir(adminId, "UPDATE", "atleta", atletaId, antesJson, depoisJson);
            } catch (Exception ignored) {}
        }

        Map<String, Object> resposta = new LinkedHashMap<>();
        resposta.put("id", atletaId);
        resposta.put("clubeId", clubeId);
        resposta.put("clubeModalidadeId", clubeModalidadeId);
        resposta.put("nome", body.nome.trim());
        resposta.put("ok", true);
        return resposta;
    }

    @GetMapping("/atletas/escaloes")
    public List<Escalao> listarEscaloes() {
        return escalaoDAO.listarTodos();
    }

    @GetMapping("/atletas/estados")
    public List<EstadoAtleta> listarEstados() {
        return estadoAtletaDAO.listarTodos();
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private Date parseDate(String value) {
        if (value == null || value.isBlank()) return null;
        return Date.valueOf(value.trim());
    }

    public static class CriarAtletaRequest {
        public String nome;
        public String dataNascimento;
        public String email;
        public String telefone;
        public String morada;
        public Integer estadoId;
        public Integer escalaoId;
        public Double remuneracao;
        public String dataInscricao;
    }

    public static class AtualizarAtletaRequest {
        public String nome;
        public String dataNascimento;
        public String email;
        public String telefone;
        public String morada;
        public Integer estadoId;
        public Integer escalaoId;
        public Double remuneracao;
        public String dataInscricao;
        public String dataFim;
        public Boolean ativo;
    }
}
