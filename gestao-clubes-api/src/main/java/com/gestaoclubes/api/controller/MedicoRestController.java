package com.gestaoclubes.api.controller;

import com.gestaoclubes.api.dao.*;
import com.gestaoclubes.api.security.SecurityUtils;
import com.gestaoclubes.api.service.NotificacaoMedicaService;
import org.springframework.beans.factory.annotation.Autowired;
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

    @Autowired
    private NotificacaoMedicaService notificacaoMedicaService;

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
    public ResponseEntity<?> guardarFichaMedica(
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
        try {
            notificacaoMedicaService.notificarAtleta(clubeId, atletaId,
                    "Ficha Médica", "atualizada",
                    "A sua ficha médica foi atualizada.",
                    "Ficha médica atualizada.", false);
        } catch (Exception ignored) {}
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
                parseDate(body.dataLesao, "dataLesao"),
                parseDate(body.dataRetornoPrevista, "dataRetornoPrevista"),
                parseDate(body.dataRetornoEfetiva, "dataRetornoEfetiva"),
                body.descricao, body.tratamento
        );
        if (id <= 0) throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Não foi possível registar a lesão.");
        try {
            String detalhe = "Lesão: " + body.tipo + (body.parteCorpo != null && !body.parteCorpo.isBlank() ? " (" + body.parteCorpo + ")" : "") +
                    (body.gravidade != null ? " — Gravidade: " + body.gravidade : "");
            notificacaoMedicaService.notificarAtleta(clubeId, body.atletaId,
                    "Registo de Lesão", "registada", detalhe,
                    "Lesão " + body.tipo + " registada.", false);
        } catch (Exception ignored) {}
        return ResponseEntity.ok(Map.of("ok", true, "id", id));
    }

    @PutMapping("/clubes/{clubeId}/medico/lesoes/{id}")
    public ResponseEntity<?> atualizarLesao(
            @PathVariable int clubeId,
            @PathVariable int id,
            @RequestBody RegistoLesaoRequest body
    ) {
        exigirAcessoMedico(clubeId);
        Map<String, Object> registo = registoLesaoDAO.buscarPorId(id);
        verificarPertenceAoClube(registo, clubeId, "Lesão não encontrada.");
        boolean ok = registoLesaoDAO.atualizar(
                id, body.staffId,
                body.tipo, body.parteCorpo, body.gravidade,
                parseDate(body.dataLesao, "dataLesao"),
                parseDate(body.dataRetornoPrevista, "dataRetornoPrevista"),
                parseDate(body.dataRetornoEfetiva, "dataRetornoEfetiva"),
                body.descricao, body.tratamento
        );
        if (ok) {
            try {
                Integer atletaId = registo != null ? (Integer) registo.get("atletaId") : null;
                if (atletaId != null) {
                    String detalhe = "Lesão atualizada: " + (body.tipo != null ? body.tipo : "") +
                            (body.parteCorpo != null && !body.parteCorpo.isBlank() ? " (" + body.parteCorpo + ")" : "");
                    notificacaoMedicaService.notificarAtleta(clubeId, atletaId,
                            "Registo de Lesão", "atualizada", detalhe,
                            "Lesão " + (body.tipo != null ? body.tipo : "") + " atualizada.", false);
                }
            } catch (Exception ignored) {}
        }
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

        Date data = parseDate(body.dataConsulta, "dataConsulta");
        String estado = determinarEstado(body.estado, data);

        int id = consultaMedicaDAO.inserir(
                clubeId, body.atletaId, body.staffId,
                data, estado, body.tipo, body.motivo, body.diagnostico, body.notas
        );
        if (id <= 0) throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Não foi possível registar a consulta.");
        try {
            String detalhe = "Consulta de " + body.tipo + " em " + body.dataConsulta +
                    (body.motivo != null && !body.motivo.isBlank() ? ". Motivo: " + body.motivo : "");
            notificacaoMedicaService.notificarAtleta(clubeId, body.atletaId,
                    "Consulta Médica", "registada", detalhe,
                    "Consulta médica (" + body.tipo + ") registada em " + body.dataConsulta + ".", false);
        } catch (Exception ignored) {}
        return ResponseEntity.ok(Map.of("ok", true, "id", id));
    }

    @PutMapping("/clubes/{clubeId}/medico/consultas/{id}")
    public ResponseEntity<?> atualizarConsulta(
            @PathVariable int clubeId,
            @PathVariable int id,
            @RequestBody ConsultaMedicaRequest body
    ) {
        exigirAcessoMedico(clubeId);
        Map<String, Object> registo = consultaMedicaDAO.buscarPorId(id);
        verificarPertenceAoClube(registo, clubeId, "Consulta não encontrada.");

        Date data = parseDate(body.dataConsulta, "dataConsulta");
        String estado = determinarEstado(body.estado, data);

        boolean ok = consultaMedicaDAO.atualizar(
                id, body.staffId, data,
                estado, body.tipo, body.motivo, body.diagnostico, body.notas
        );
        if (ok) {
            try {
                Integer atletaId = registo != null ? (Integer) registo.get("atletaId") : null;
                if (atletaId != null) {
                    notificacaoMedicaService.notificarAtleta(clubeId, atletaId,
                            "Consulta Médica", "atualizada",
                            "Consulta de " + (body.tipo != null ? body.tipo : "") + " atualizada.",
                            "Consulta médica atualizada.", false);
                }
            } catch (Exception ignored) {}
        }
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
                parseDate(body.dataExame, "dataExame"), body.tipo, body.resultado, null, body.notas
        );
        if (id <= 0) throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Não foi possível registar o exame.");
        try {
            notificacaoMedicaService.notificarAtleta(clubeId, body.atletaId,
                    "Exame Médico", "registado",
                    "Exame de " + body.tipo + " em " + body.dataExame + ".",
                    "Exame médico (" + body.tipo + ") registado em " + body.dataExame + ".", false);
        } catch (Exception ignored) {}
        return ResponseEntity.ok(Map.of("ok", true, "id", id));
    }

    @PutMapping("/clubes/{clubeId}/medico/exames/{id}")
    public ResponseEntity<?> atualizarExame(
            @PathVariable int clubeId,
            @PathVariable int id,
            @RequestBody ExameMedicoRequest body
    ) {
        exigirAcessoMedico(clubeId);
        Map<String, Object> registo = exameMedicoDAO.buscarPorId(id);
        verificarPertenceAoClube(registo, clubeId, "Exame não encontrado.");
        boolean ok = exameMedicoDAO.atualizar(
                id, body.staffId, parseDate(body.dataExame, "dataExame"),
                body.tipo, body.resultado, body.notas
        );
        if (ok) {
            try {
                Integer atletaId = registo != null ? (Integer) registo.get("atletaId") : null;
                if (atletaId != null) {
                    notificacaoMedicaService.notificarAtleta(clubeId, atletaId,
                            "Exame Médico", "atualizado",
                            "Exame de " + (body.tipo != null ? body.tipo : "") + " atualizado.",
                            "Exame médico atualizado.", false);
                }
            } catch (Exception ignored) {}
        }
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
                parseDate(body.dataInicio, "dataInicio"), parseDate(body.dataFim, "dataFim"), body.notas
        );
        if (id <= 0) throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Não foi possível registar a prescrição.");
        try {
            String detalhe = "Prescrição de " + body.medicamento +
                    (body.dosagem != null && !body.dosagem.isBlank() ? " — Dose: " + body.dosagem : "") +
                    (body.frequencia != null && !body.frequencia.isBlank() ? " — Frequência: " + body.frequencia : "");
            notificacaoMedicaService.notificarAtleta(clubeId, body.atletaId,
                    "Prescrição Médica", "registada", detalhe,
                    "Prescrição de " + body.medicamento + " registada.", false);
        } catch (Exception ignored) {}
        return ResponseEntity.ok(Map.of("ok", true, "id", id));
    }

    @PutMapping("/clubes/{clubeId}/medico/prescricoes/{id}")
    public ResponseEntity<?> atualizarPrescricao(
            @PathVariable int clubeId,
            @PathVariable int id,
            @RequestBody PrescricaoRequest body
    ) {
        exigirAcessoMedico(clubeId);
        Map<String, Object> registo = prescricaoDAO.buscarPorId(id);
        verificarPertenceAoClube(registo, clubeId, "Prescrição não encontrada.");
        boolean ok = prescricaoDAO.atualizar(
                id, body.staffId, body.consultaId,
                body.medicamento, body.dosagem, body.frequencia,
                parseDate(body.dataInicio, "dataInicio"), parseDate(body.dataFim, "dataFim"), body.notas
        );
        if (ok) {
            try {
                Integer atletaId = registo != null ? (Integer) registo.get("atletaId") : null;
                if (atletaId != null) {
                    notificacaoMedicaService.notificarAtleta(clubeId, atletaId,
                            "Prescrição Médica", "atualizada",
                            "Prescrição de " + (body.medicamento != null ? body.medicamento : "") + " atualizada.",
                            "Prescrição médica atualizada.", false);
                }
            } catch (Exception ignored) {}
        }
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
        boolean confidencial = Boolean.TRUE.equals(body.confidencial);

        int id = relatorioMedicoDAO.inserir(
                clubeId, body.atletaId, body.staffId,
                parseDate(body.dataRelatorio, "dataRelatorio"), body.tipo, body.conteudo, confidencial
        );
        if (id <= 0) throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Não foi possível registar o relatório.");
        try {
            String detalheAtleta = "Relatório de " + body.tipo + " emitido em " + body.dataRelatorio +
                    (body.conteudo != null && !body.conteudo.isBlank() ? ".\n\n" + body.conteudo : ".");
            notificacaoMedicaService.notificarAtleta(clubeId, body.atletaId,
                    "Relatório Médico", "registado",
                    detalheAtleta,
                    "Relatório médico (" + body.tipo + ") disponível.", confidencial);
        } catch (Exception ignored) {}
        return ResponseEntity.ok(Map.of("ok", true, "id", id));
    }

    @PutMapping("/clubes/{clubeId}/medico/relatorios/{id}")
    public ResponseEntity<?> atualizarRelatorio(
            @PathVariable int clubeId,
            @PathVariable int id,
            @RequestBody RelatorioMedicoRequest body
    ) {
        exigirAcessoMedico(clubeId);
        Map<String, Object> registo = relatorioMedicoDAO.buscarPorId(id);
        verificarPertenceAoClube(registo, clubeId, "Relatório não encontrado.");
        boolean confidencial = Boolean.TRUE.equals(body.confidencial);
        boolean ok = relatorioMedicoDAO.atualizar(
                id, body.staffId, parseDate(body.dataRelatorio, "dataRelatorio"),
                body.tipo, body.conteudo, confidencial
        );
        if (ok) {
            try {
                Integer atletaId = registo != null ? (Integer) registo.get("atletaId") : null;
                if (atletaId != null) {
                    String detalheAtleta = "Relatório de " + (body.tipo != null ? body.tipo : "") + " atualizado." +
                            (body.conteudo != null && !body.conteudo.isBlank() ? "\n\n" + body.conteudo : "");
                    notificacaoMedicaService.notificarAtleta(clubeId, atletaId,
                            "Relatório Médico", "atualizado",
                            detalheAtleta,
                            "Relatório médico atualizado.", confidencial);
                }
            } catch (Exception ignored) {}
        }
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

    private static Date parseDate(String value, String fieldName) {
        if (value == null || value.isBlank()) return null;
        try {
            return Date.valueOf(value.trim());
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "O campo '" + fieldName + "' tem um formato de data inválido. Formato esperado: YYYY-MM-DD. Valor recebido: '" + value.trim() + "'.");
        }
    }

    private static String determinarEstado(String estadoRecebido, Date data) {
        String estado = (estadoRecebido != null && !estadoRecebido.isBlank()) ? estadoRecebido.toUpperCase() : null;
        boolean dataFutura = data != null && data.toLocalDate().isAfter(java.time.LocalDate.now());

        if ("REALIZADA".equals(estado) && dataFutura) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Não é possível registar uma consulta como Realizada com data futura.");
        }
        if (estado == null) {
            return dataFutura ? "AGENDADA" : "REALIZADA";
        }
        return estado;
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
        public String estado;
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
