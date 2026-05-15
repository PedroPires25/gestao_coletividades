package com.gestaoclubes.api.controller;

import com.gestaoclubes.api.dao.*;
import com.gestaoclubes.api.security.SecurityUtils;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.sql.Date;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class MedicoRestController {

    private final FichaMedicaDAO fichaMedicaDAO = new FichaMedicaDAO();
    private final RegistoLesaoDAO registoLesaoDAO = new RegistoLesaoDAO();
    private final ConsultaMedicaDAO consultaMedicaDAO = new ConsultaMedicaDAO();
    private final ExameMedicoDAO exameMedicoDAO = new ExameMedicoDAO();
    private final PrescricaoDAO prescricaoDAO = new PrescricaoDAO();
    private final RelatorioMedicoDAO relatorioMedicoDAO = new RelatorioMedicoDAO();
    private final AtletaDAO atletaDAO = new AtletaDAO();

    // ==========================================
    // LISTAR ATLETAS DO CLUBE (para dropdowns)
    // ==========================================

    @GetMapping("/clubes/{clubeId}/medico/atletas")
    public List<Map<String, Object>> listarAtletasDoClube(@PathVariable int clubeId) {
        exigirAcessoMedico(clubeId);
        return atletaDAO.listarPorClube(clubeId);
    }

    // ==========================================
    // FICHA MÉDICA
    // ==========================================

    @GetMapping("/clubes/{clubeId}/medico/atletas/{atletaId}/ficha")
    public ResponseEntity<?> getFichaMedica(
            @PathVariable int clubeId,
            @PathVariable int atletaId
    ) {
        exigirAcessoMedico(clubeId);
        Map<String, Object> ficha = fichaMedicaDAO.buscarPorAtletaEClube(atletaId, clubeId);
        if (ficha == null) return ResponseEntity.noContent().build();
        return ResponseEntity.ok(ficha);
    }

    @PutMapping("/clubes/{clubeId}/medico/atletas/{atletaId}/ficha")
    public ResponseEntity<?> salvarFichaMedica(
            @PathVariable int clubeId,
            @PathVariable int atletaId,
            @RequestBody FichaMedicaRequest body
    ) {
        exigirAcessoMedico(clubeId);
        if (atletaDAO.buscarPorId(atletaId) == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Atleta não encontrado.");
        }
        int id = fichaMedicaDAO.inserirOuAtualizar(
                atletaId, clubeId,
                body.grupoSanguineo, body.alergias, body.condicoesCronicas,
                body.contactoEmergenciaNome, body.contactoEmergenciaTelefone, body.notasGerais
        );
        return ResponseEntity.ok(Map.of("ok", true, "id", id));
    }

    // ==========================================
    // REGISTOS DE LESÃO
    // ==========================================

    @GetMapping("/clubes/{clubeId}/medico/lesoes")
    public List<Map<String, Object>> listarLesoes(@PathVariable int clubeId) {
        exigirAcessoMedico(clubeId);
        return registoLesaoDAO.listarPorClube(clubeId);
    }

    @GetMapping("/clubes/{clubeId}/medico/atletas/{atletaId}/lesoes")
    public List<Map<String, Object>> listarLesoesPorAtleta(
            @PathVariable int clubeId,
            @PathVariable int atletaId
    ) {
        exigirAcessoMedico(clubeId);
        return registoLesaoDAO.listarPorAtleta(clubeId, atletaId);
    }

    @PostMapping("/clubes/{clubeId}/medico/lesoes")
    public ResponseEntity<?> criarLesao(
            @PathVariable int clubeId,
            @RequestBody RegistoLesaoRequest body
    ) {
        exigirAcessoMedico(clubeId);
        if (body.atletaId == null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "atletaId é obrigatório.");
        if (body.tipo == null || body.tipo.isBlank()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "tipo é obrigatório.");
        if (body.dataLesao == null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "dataLesao é obrigatório.");

        int id = registoLesaoDAO.inserir(
                clubeId, body.atletaId, body.staffId,
                body.tipo, body.parteCorpo, body.gravidade,
                parseDate(body.dataLesao), parseDate(body.dataRetornoPrevista), parseDate(body.dataRetornoEfetiva),
                body.descricao, body.tratamento
        );
        if (id <= 0) throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Não foi possível registar a lesão.");
        return ResponseEntity.ok(Map.of("ok", true, "id", id));
    }

    @PutMapping("/clubes/{clubeId}/medico/lesoes/{id}")
    public ResponseEntity<?> atualizarLesao(
            @PathVariable int clubeId,
            @PathVariable int id,
            @RequestBody RegistoLesaoRequest body
    ) {
        exigirAcessoMedico(clubeId);
        verificarPertenceAoClube(registoLesaoDAO.buscarPorId(id), clubeId, "Lesão não encontrada.");
        boolean ok = registoLesaoDAO.atualizar(
                id, body.staffId,
                body.tipo, body.parteCorpo, body.gravidade,
                parseDate(body.dataLesao), parseDate(body.dataRetornoPrevista), parseDate(body.dataRetornoEfetiva),
                body.descricao, body.tratamento
        );
        return ResponseEntity.ok(Map.of("ok", ok));
    }

    // ==========================================
    // CONSULTAS MÉDICAS
    // ==========================================

    @GetMapping("/clubes/{clubeId}/medico/consultas")
    public List<Map<String, Object>> listarConsultas(@PathVariable int clubeId) {
        exigirAcessoMedico(clubeId);
        return consultaMedicaDAO.listarPorClube(clubeId);
    }

    @GetMapping("/clubes/{clubeId}/medico/atletas/{atletaId}/consultas")
    public List<Map<String, Object>> listarConsultasPorAtleta(
            @PathVariable int clubeId,
            @PathVariable int atletaId
    ) {
        exigirAcessoMedico(clubeId);
        return consultaMedicaDAO.listarPorAtleta(clubeId, atletaId);
    }

    @PostMapping("/clubes/{clubeId}/medico/consultas")
    public ResponseEntity<?> criarConsulta(
            @PathVariable int clubeId,
            @RequestBody ConsultaMedicaRequest body
    ) {
        exigirAcessoMedico(clubeId);
        if (body.atletaId == null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "atletaId é obrigatório.");
        if (body.dataConsulta == null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "dataConsulta é obrigatório.");
        if (body.tipo == null || body.tipo.isBlank()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "tipo é obrigatório.");

        int id = consultaMedicaDAO.inserir(
                clubeId, body.atletaId, body.staffId,
                parseDate(body.dataConsulta), body.tipo, body.motivo, body.diagnostico, body.notas
        );
        if (id <= 0) throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Não foi possível registar a consulta.");
        return ResponseEntity.ok(Map.of("ok", true, "id", id));
    }

    @PutMapping("/clubes/{clubeId}/medico/consultas/{id}")
    public ResponseEntity<?> atualizarConsulta(
            @PathVariable int clubeId,
            @PathVariable int id,
            @RequestBody ConsultaMedicaRequest body
    ) {
        exigirAcessoMedico(clubeId);
        verificarPertenceAoClube(consultaMedicaDAO.buscarPorId(id), clubeId, "Consulta não encontrada.");
        boolean ok = consultaMedicaDAO.atualizar(
                id, body.staffId, parseDate(body.dataConsulta),
                body.tipo, body.motivo, body.diagnostico, body.notas
        );
        return ResponseEntity.ok(Map.of("ok", ok));
    }

    // ==========================================
    // EXAMES MÉDICOS
    // ==========================================

    @GetMapping("/clubes/{clubeId}/medico/exames")
    public List<Map<String, Object>> listarExames(@PathVariable int clubeId) {
        exigirAcessoMedico(clubeId);
        return exameMedicoDAO.listarPorClube(clubeId);
    }

    @GetMapping("/clubes/{clubeId}/medico/atletas/{atletaId}/exames")
    public List<Map<String, Object>> listarExamesPorAtleta(
            @PathVariable int clubeId,
            @PathVariable int atletaId
    ) {
        exigirAcessoMedico(clubeId);
        return exameMedicoDAO.listarPorAtleta(clubeId, atletaId);
    }

    @PostMapping("/clubes/{clubeId}/medico/exames")
    public ResponseEntity<?> criarExame(
            @PathVariable int clubeId,
            @RequestBody ExameMedicoRequest body
    ) {
        exigirAcessoMedico(clubeId);
        if (body.atletaId == null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "atletaId é obrigatório.");
        if (body.dataExame == null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "dataExame é obrigatório.");
        if (body.tipo == null || body.tipo.isBlank()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "tipo é obrigatório.");

        int id = exameMedicoDAO.inserir(
                clubeId, body.atletaId, body.staffId,
                parseDate(body.dataExame), body.tipo, body.resultado, null, body.notas
        );
        if (id <= 0) throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Não foi possível registar o exame.");
        return ResponseEntity.ok(Map.of("ok", true, "id", id));
    }

    @PutMapping("/clubes/{clubeId}/medico/exames/{id}")
    public ResponseEntity<?> atualizarExame(
            @PathVariable int clubeId,
            @PathVariable int id,
            @RequestBody ExameMedicoRequest body
    ) {
        exigirAcessoMedico(clubeId);
        verificarPertenceAoClube(exameMedicoDAO.buscarPorId(id), clubeId, "Exame não encontrado.");
        boolean ok = exameMedicoDAO.atualizar(
                id, body.staffId, parseDate(body.dataExame),
                body.tipo, body.resultado, body.notas
        );
        return ResponseEntity.ok(Map.of("ok", ok));
    }

    // ==========================================
    // PRESCRIÇÕES
    // ==========================================

    @GetMapping("/clubes/{clubeId}/medico/prescricoes")
    public List<Map<String, Object>> listarPrescricoes(@PathVariable int clubeId) {
        exigirAcessoMedico(clubeId);
        return prescricaoDAO.listarPorClube(clubeId);
    }

    @GetMapping("/clubes/{clubeId}/medico/atletas/{atletaId}/prescricoes")
    public List<Map<String, Object>> listarPrescricoesPorAtleta(
            @PathVariable int clubeId,
            @PathVariable int atletaId
    ) {
        exigirAcessoMedico(clubeId);
        return prescricaoDAO.listarPorAtleta(clubeId, atletaId);
    }

    @PostMapping("/clubes/{clubeId}/medico/prescricoes")
    public ResponseEntity<?> criarPrescricao(
            @PathVariable int clubeId,
            @RequestBody PrescricaoRequest body
    ) {
        exigirAcessoMedico(clubeId);
        if (body.atletaId == null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "atletaId é obrigatório.");
        if (body.medicamento == null || body.medicamento.isBlank()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "medicamento é obrigatório.");

        int id = prescricaoDAO.inserir(
                clubeId, body.atletaId, body.staffId, body.consultaId,
                body.medicamento, body.dosagem, body.frequencia,
                parseDate(body.dataInicio), parseDate(body.dataFim), body.notas
        );
        if (id <= 0) throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Não foi possível registar a prescrição.");
        return ResponseEntity.ok(Map.of("ok", true, "id", id));
    }

    @PutMapping("/clubes/{clubeId}/medico/prescricoes/{id}")
    public ResponseEntity<?> atualizarPrescricao(
            @PathVariable int clubeId,
            @PathVariable int id,
            @RequestBody PrescricaoRequest body
    ) {
        exigirAcessoMedico(clubeId);
        verificarPertenceAoClube(prescricaoDAO.buscarPorId(id), clubeId, "Prescrição não encontrada.");
        boolean ok = prescricaoDAO.atualizar(
                id, body.staffId, body.consultaId,
                body.medicamento, body.dosagem, body.frequencia,
                parseDate(body.dataInicio), parseDate(body.dataFim), body.notas
        );
        return ResponseEntity.ok(Map.of("ok", ok));
    }

    // ==========================================
    // RELATÓRIOS MÉDICOS
    // ==========================================

    @GetMapping("/clubes/{clubeId}/medico/relatorios")
    public List<Map<String, Object>> listarRelatorios(@PathVariable int clubeId) {
        exigirAcessoMedico(clubeId);
        return relatorioMedicoDAO.listarPorClube(clubeId);
    }

    @GetMapping("/clubes/{clubeId}/medico/atletas/{atletaId}/relatorios")
    public List<Map<String, Object>> listarRelatoriosPorAtleta(
            @PathVariable int clubeId,
            @PathVariable int atletaId
    ) {
        exigirAcessoMedico(clubeId);
        return relatorioMedicoDAO.listarPorAtleta(clubeId, atletaId);
    }

    @PostMapping("/clubes/{clubeId}/medico/relatorios")
    public ResponseEntity<?> criarRelatorio(
            @PathVariable int clubeId,
            @RequestBody RelatorioMedicoRequest body
    ) {
        exigirAcessoMedico(clubeId);
        if (body.atletaId == null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "atletaId é obrigatório.");
        if (body.dataRelatorio == null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "dataRelatorio é obrigatório.");
        if (body.tipo == null || body.tipo.isBlank()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "tipo é obrigatório.");

        int id = relatorioMedicoDAO.inserir(
                clubeId, body.atletaId, body.staffId,
                parseDate(body.dataRelatorio), body.tipo, body.conteudo,
                Boolean.TRUE.equals(body.confidencial)
        );
        if (id <= 0) throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Não foi possível registar o relatório.");
        return ResponseEntity.ok(Map.of("ok", true, "id", id));
    }

    @PutMapping("/clubes/{clubeId}/medico/relatorios/{id}")
    public ResponseEntity<?> atualizarRelatorio(
            @PathVariable int clubeId,
            @PathVariable int id,
            @RequestBody RelatorioMedicoRequest body
    ) {
        exigirAcessoMedico(clubeId);
        verificarPertenceAoClube(relatorioMedicoDAO.buscarPorId(id), clubeId, "Relatório não encontrado.");
        boolean ok = relatorioMedicoDAO.atualizar(
                id, body.staffId, parseDate(body.dataRelatorio),
                body.tipo, body.conteudo, Boolean.TRUE.equals(body.confidencial)
        );
        return ResponseEntity.ok(Map.of("ok", ok));
    }

    // ==========================================
    // Helpers
    // ==========================================

    private void exigirAcessoMedico(int clubeId) {
        if (SecurityUtils.isSuperAdmin()) return;
        if (SecurityUtils.canManageClube(clubeId)) return;
        String role = SecurityUtils.currentRole();
        if ("ROLE_DEPARTAMENTO_MEDICO".equals(role) && Integer.valueOf(clubeId).equals(SecurityUtils.currentClubeId())) return;
        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Sem permissão para aceder ao módulo clínico deste clube.");
    }

    private void verificarPertenceAoClube(Map<String, Object> row, int clubeId, String msg) {
        if (row == null) throw new ResponseStatusException(HttpStatus.NOT_FOUND, msg);
        Object rowClubeId = row.get("clubeId");
        if (rowClubeId == null || ((Number) rowClubeId).intValue() != clubeId) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Registo não pertence a este clube.");
        }
    }

    private static Date parseDate(String value) {
        return value == null || value.isBlank() ? null : Date.valueOf(value.trim());
    }

    // ==========================================
    // Request bodies
    // ==========================================

    public static class FichaMedicaRequest {
        public String grupoSanguineo;
        public String alergias;
        public String condicoesCronicas;
        public String contactoEmergenciaNome;
        public String contactoEmergenciaTelefone;
        public String notasGerais;
    }

    public static class RegistoLesaoRequest {
        public Integer atletaId;
        public Integer staffId;
        public String tipo;
        public String parteCorpo;
        public String gravidade;
        public String dataLesao;
        public String dataRetornoPrevista;
        public String dataRetornoEfetiva;
        public String descricao;
        public String tratamento;
    }

    public static class ConsultaMedicaRequest {
        public Integer atletaId;
        public Integer staffId;
        public String dataConsulta;
        public String tipo;
        public String motivo;
        public String diagnostico;
        public String notas;
    }

    public static class ExameMedicoRequest {
        public Integer atletaId;
        public Integer staffId;
        public String dataExame;
        public String tipo;
        public String resultado;
        public String notas;
    }

    public static class PrescricaoRequest {
        public Integer atletaId;
        public Integer staffId;
        public Integer consultaId;
        public String medicamento;
        public String dosagem;
        public String frequencia;
        public String dataInicio;
        public String dataFim;
        public String notas;
    }

    public static class RelatorioMedicoRequest {
        public Integer atletaId;
        public Integer staffId;
        public String dataRelatorio;
        public String tipo;
        public String conteudo;
        public Boolean confidencial;
    }
}
