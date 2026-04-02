package com.gestaoclubes.api.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.gestaoclubes.api.dao.*;
import com.gestaoclubes.api.model.Atleta;
import com.gestaoclubes.api.model.ClubeModalidade;
import com.gestaoclubes.api.model.Staff;
import com.gestaoclubes.api.model.Utente;
import com.gestaoclubes.api.model.Utilizador;
import com.gestaoclubes.api.security.SecurityUtils;
import com.gestaoclubes.api.util.ConexoBD;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.sql.Connection;
import java.sql.Date;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.util.List;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "http://localhost:5173")
public class AdminRestController {

    private final UtilizadorDAO utilizadorDAO = new UtilizadorDAO();
    private final PerfilDAO perfilDAO = new PerfilDAO();
    private final AuditLogDAO auditLogDAO = new AuditLogDAO();
    private final ObjectMapper mapper = new ObjectMapper();

    private final AtletaDAO atletaDAO = new AtletaDAO();
    private final AtletaClubeModalidadeDAO atletaClubeModalidadeDAO = new AtletaClubeModalidadeDAO();
    private final ClubeModalidadeDAO clubeModalidadeDAO = new ClubeModalidadeDAO();
    private final UtenteDAO utenteDAO = new UtenteDAO();
    private final StaffDAO staffDAO = new StaffDAO();
    private final StaffAfetacaoDAO staffAfetacaoDAO = new StaffAfetacaoDAO();
    private final StaffColetividadeDAO staffColetividadeDAO = new StaffColetividadeDAO();

    public static class UtilizadorAdminDto {
        public int id;
        public String email;
        public int perfilId;
        public String role;
        public boolean ativo;
        public boolean privilegiosAtivos;
        public String estadoRegisto;
        public Integer clubeId;
        public Integer modalidadeId;
        public Integer coletividadeId;
        public Integer atividadeId;

        public UtilizadorAdminDto(Utilizador u, String role) {
            this.id = u.getId();
            this.email = u.getUtilizador();
            this.perfilId = u.getPerfilId();
            this.role = role;
            this.ativo = u.isAtivo();
            this.privilegiosAtivos = u.isPrivilegiosAtivos();
            this.estadoRegisto = u.getEstadoRegisto();
            this.clubeId = u.getClubeId();
            this.modalidadeId = u.getModalidadeId();
            this.coletividadeId = u.getColetividadeId();
            this.atividadeId = u.getAtividadeId();
        }
    }

    public static class UpdatePerfilRequest {
        public String perfil;
    }

    public static class UpdatePrivilegiosRequest {
        public Boolean privilegiosAtivos;
    }

    public static class UpdateEstadoRegistoRequest {
        public String estado;
    }

    public static class UpdateAfetacaoRequest {
        public Integer clubeId;
        public Integer modalidadeId;
        public Integer coletividadeId;
        public Integer atividadeId;
    }

    @GetMapping("/users")
    public List<UtilizadorAdminDto> listarUsers(@RequestParam(value = "estado", required = false) String estado) {
        List<Utilizador> lista;

        if (estado == null || estado.isBlank()) {
            lista = utilizadorDAO.listarTodos();
        } else {
            lista = utilizadorDAO.listarPorEstadoRegisto(estado.trim().toUpperCase());
        }

        return lista.stream()
                .map(u -> new UtilizadorAdminDto(u, perfilDAO.obterDescricaoPerfil(u.getPerfilId())))
                .toList();
    }

    @GetMapping("/profiles")
    public List<String> listarPerfis() {
        return perfilDAO.listarPerfisDisponiveis();
    }

    @PutMapping("/users/{id}/perfil")
    public ResponseEntity<?> alterarPerfil(@PathVariable int id, @RequestBody UpdatePerfilRequest body) {
        if (body == null || body.perfil == null || body.perfil.isBlank()) {
            return ResponseEntity.badRequest().body("Perfil é obrigatório.");
        }

        String perfilNovo = perfilDAO.normalizar(body.perfil);
        if (!perfilDAO.existePerfil(perfilNovo)) {
            return ResponseEntity.badRequest().body("Perfil inválido.");
        }

        Utilizador antes = utilizadorDAO.buscarPorId(id);
        if (antes == null) {
            return ResponseEntity.notFound().build();
        }

        int novoPerfilId = perfilDAO.obterPerfilPorDescricao(perfilNovo);
        boolean ok = utilizadorDAO.atualizarPerfil(id, novoPerfilId);
        if (!ok) {
            return ResponseEntity.badRequest().body("Não foi possível alterar o perfil.");
        }

        if (PerfilDAO.ADMIN.equals(perfilNovo)) {
            utilizadorDAO.atualizarEstadoRegisto(id, "APROVADO");
            utilizadorDAO.atualizarAfetacao(id, null, null, null, null);
        }

        Utilizador depois = utilizadorDAO.buscarPorId(id);
        registarAuditoria("UPDATE_ROLE", id, antes, depois);

        return ResponseEntity.ok("Perfil atualizado.");
    }

    @PutMapping("/users/{id}/privilegios")
    public ResponseEntity<?> alterarPrivilegios(@PathVariable int id, @RequestBody UpdatePrivilegiosRequest body) {
        if (body == null || body.privilegiosAtivos == null) {
            return ResponseEntity.badRequest().body("O campo privilegiosAtivos é obrigatório.");
        }

        Utilizador antes = utilizadorDAO.buscarPorId(id);
        if (antes == null) {
            return ResponseEntity.notFound().build();
        }

        boolean ok = utilizadorDAO.atualizarPrivilegios(id, body.privilegiosAtivos);
        if (!ok) {
            return ResponseEntity.badRequest().body("Não foi possível alterar os privilégios.");
        }

        Utilizador depois = utilizadorDAO.buscarPorId(id);
        registarAuditoria("UPDATE_PRIVILEGIOS", id, antes, depois);

        return ResponseEntity.ok("Privilégios atualizados.");
    }

    @PutMapping("/users/{id}/estado-registo")
    public ResponseEntity<?> alterarEstadoRegisto(@PathVariable int id, @RequestBody UpdateEstadoRegistoRequest body) {
        if (body == null || body.estado == null || body.estado.isBlank()) {
            return ResponseEntity.badRequest().body("O estado é obrigatório.");
        }

        String novoEstado = body.estado.trim().toUpperCase();
        if (!"PENDENTE".equals(novoEstado) && !"APROVADO".equals(novoEstado) && !"REJEITADO".equals(novoEstado)) {
            return ResponseEntity.badRequest().body("Estado inválido. Use PENDENTE, APROVADO ou REJEITADO.");
        }

        Utilizador antes = utilizadorDAO.buscarPorId(id);
        if (antes == null) {
            return ResponseEntity.notFound().build();
        }

        String role = perfilDAO.obterDescricaoPerfil(antes.getPerfilId());

        String erroValidacao = validarMinimosParaMaterializacao(role, antes);
        if ("APROVADO".equals(novoEstado) && erroValidacao != null) {
            return ResponseEntity.badRequest().body(erroValidacao);
        }

        boolean ok = utilizadorDAO.atualizarEstadoRegisto(id, novoEstado);
        if (!ok) {
            return ResponseEntity.badRequest().body("Não foi possível alterar o estado do registo.");
        }

        Utilizador depois = utilizadorDAO.buscarPorId(id);

        if ("APROVADO".equals(novoEstado)) {
            try {
                materializarNoDominioSeNecessario(role, depois);
                depois = utilizadorDAO.buscarPorId(id);
            } catch (IllegalArgumentException e) {
                return ResponseEntity.badRequest().body(e.getMessage());
            } catch (Exception e) {
                return ResponseEntity.internalServerError().body(
                        "O utilizador foi aprovado, mas ocorreu um erro ao colocá-lo no espaço correspondente: " + e.getMessage()
                );
            }
        }

        registarAuditoria("UPDATE_ESTADO_REGISTO", id, antes, depois);
        return ResponseEntity.ok("Estado do registo atualizado.");
    }

    @PutMapping("/users/{id}/afetacao")
    public ResponseEntity<?> alterarAfetacao(@PathVariable int id, @RequestBody UpdateAfetacaoRequest body) {
        if (body == null) {
            return ResponseEntity.badRequest().body("Pedido inválido.");
        }

        Utilizador antes = utilizadorDAO.buscarPorId(id);
        if (antes == null) {
            return ResponseEntity.notFound().build();
        }

        String role = perfilDAO.obterDescricaoPerfil(antes.getPerfilId());
        if (PerfilDAO.ADMIN.equals(role)) {
            return ResponseEntity.badRequest().body("Administradores não precisam de afetação.");
        }

        boolean ok = utilizadorDAO.atualizarAfetacao(
                id,
                body.clubeId,
                body.modalidadeId,
                body.coletividadeId,
                body.atividadeId
        );

        if (!ok) {
            return ResponseEntity.badRequest().body("Não foi possível atualizar a afetação.");
        }

        Utilizador depois = utilizadorDAO.buscarPorId(id);

        if ("APROVADO".equalsIgnoreCase(depois.getEstadoRegisto())) {
            String erroValidacao = validarMinimosParaMaterializacao(role, depois);
            if (erroValidacao != null) {
                return ResponseEntity.badRequest().body(erroValidacao);
            }

            try {
                materializarNoDominioSeNecessario(role, depois);
                depois = utilizadorDAO.buscarPorId(id);
            } catch (IllegalArgumentException e) {
                return ResponseEntity.badRequest().body(e.getMessage());
            } catch (Exception e) {
                return ResponseEntity.internalServerError().body(
                        "A afetação foi guardada, mas ocorreu um erro ao colocá-lo no espaço correspondente: " + e.getMessage()
                );
            }
        }

        registarAuditoria("UPDATE", id, antes, depois);
        return ResponseEntity.ok("Afetação atualizada.");
    }

    private String validarMinimosParaMaterializacao(String role, Utilizador u) {
        if (role == null || u == null) return "Perfil/utilizador inválido.";

        return switch (role) {
            case PerfilDAO.ATLETA -> (u.getClubeId() == null || u.getModalidadeId() == null)
                    ? "Para ATLETA, é obrigatório definir clube e modalidade."
                    : null;

            case PerfilDAO.UTENTE -> (u.getColetividadeId() == null || u.getAtividadeId() == null)
                    ? "Para UTENTE, é obrigatório definir coletividade e atividade."
                    : null;

            case PerfilDAO.TREINADOR_PRINCIPAL,
                 PerfilDAO.DEPARTAMENTO_MEDICO -> (u.getClubeId() == null)
                    ? "Para este perfil, é obrigatório definir pelo menos o clube."
                    : null;

            case PerfilDAO.STAFF,
                 PerfilDAO.SECRETARIO,
                 PerfilDAO.PROFESSOR -> (u.getClubeId() == null && u.getColetividadeId() == null)
                    ? "Para este perfil, é obrigatório definir clube ou coletividade."
                    : null;

            default -> null;
        };
    }

    private void materializarNoDominioSeNecessario(String role, Utilizador u) {
        if (role == null || u == null) return;

        switch (role) {
            case PerfilDAO.ATLETA -> materializarAtleta(u);
            case PerfilDAO.UTENTE -> materializarUtente(u);
            case PerfilDAO.STAFF -> materializarStaffGenerico(u);
            case PerfilDAO.TREINADOR_PRINCIPAL -> materializarTreinadorPrincipal(u);
            case PerfilDAO.DEPARTAMENTO_MEDICO -> materializarDepartamentoMedico(u);
            case PerfilDAO.SECRETARIO -> materializarSecretario(u);
            case PerfilDAO.PROFESSOR -> materializarProfessor(u);
            default -> {
            }
        }
    }

    private void materializarAtleta(Utilizador u) {
        boolean jaValido = utilizadorDAO.atletaTemAfetacaoValida(
                u.getUtilizador(),
                u.getClubeId(),
                u.getModalidadeId()
        );
        if (jaValido) return;

        ClubeModalidade cm = clubeModalidadeDAO.buscarAtivaPorClubeEModalidade(
                u.getClubeId(),
                u.getModalidadeId()
        );
        if (cm == null) {
            throw new IllegalArgumentException("O clube não tem a modalidade ativa selecionada.");
        }

        Atleta atleta = atletaDAO.buscarPorEmail(u.getUtilizador());
        Integer atletaId;

        if (atleta == null) {
            Atleta novo = new Atleta(
                    null,
                    null,
                    u.getUtilizador().trim(),
                    null,
                    null,
                    u.getClubeId(),
                    1,
                    1,
                    0.0
            );

            atletaId = atletaDAO.inserirEDevolverId(novo);
            if (atletaId == null || atletaId <= 0) {
                throw new IllegalStateException("Não foi possível criar automaticamente o atleta.");
            }
        } else {
            atletaId = atleta.getId();
            atletaDAO.atualizarClubeAtual(atletaId, u.getClubeId());
        }

        boolean inscricaoOk = atletaClubeModalidadeDAO.inserirInscricao(
                atletaId,
                cm.getId(),
                new Date(System.currentTimeMillis())
        );

        if (!inscricaoOk) {
            boolean ficouValido = utilizadorDAO.atletaTemAfetacaoValida(
                    u.getUtilizador(),
                    u.getClubeId(),
                    u.getModalidadeId()
            );
            if (!ficouValido) {
                throw new IllegalStateException("Não foi possível associar automaticamente o atleta à modalidade.");
            }
        }
    }

    private void materializarUtente(Utilizador u) {
        boolean jaValido = utilizadorDAO.utenteTemAfetacaoValida(
                u.getUtilizador(),
                u.getColetividadeId(),
                u.getAtividadeId()
        );
        if (jaValido) return;

        Integer coletividadeAtividadeId = buscarColetividadeAtividadeId(u.getColetividadeId(), u.getAtividadeId());
        if (coletividadeAtividadeId == null) {
            throw new IllegalArgumentException("A coletividade não tem a atividade ativa selecionada.");
        }

        Utente utente = new Utente();
        utente.setNome(null);
        utente.setDataNascimento(null);
        utente.setEmail(u.getUtilizador().trim());
        utente.setTelefone(null);
        utente.setMorada(null);
        utente.setEstadoId(1);
        utente.setDataInscricao(new Date(System.currentTimeMillis()).toString());
        utente.setDataFim(null);
        utente.setAtivo(true);

        Integer utenteId = utenteDAO.criarUtente(utente, coletividadeAtividadeId);
        if (utenteId == null || utenteId <= 0) {
            boolean ficouValido = utilizadorDAO.utenteTemAfetacaoValida(
                    u.getUtilizador(),
                    u.getColetividadeId(),
                    u.getAtividadeId()
            );
            if (!ficouValido) {
                throw new IllegalStateException("Não foi possível colocar automaticamente o utente na atividade.");
            }
        }
    }

    private void materializarStaffGenerico(Utilizador u) {
        if (u.getClubeId() != null) {
            materializarStaffClube(u, "Delegado");
        } else if (u.getColetividadeId() != null) {
            materializarStaffColetividade(u, "Administrativo");
        }
    }

    private void materializarTreinadorPrincipal(Utilizador u) {
        materializarStaffClube(u, "Treinador Principal");
    }

    private void materializarDepartamentoMedico(Utilizador u) {
        materializarStaffClube(u, "Médico");
    }

    private void materializarSecretario(Utilizador u) {
        if (u.getClubeId() != null) {
            materializarStaffClube(u, "Secretário");
        } else if (u.getColetividadeId() != null) {
            materializarStaffColetividade(u, "Secretário");
        }
    }

    private void materializarProfessor(Utilizador u) {
        if (u.getClubeId() != null) {
            materializarStaffClube(u, "Professor");
        } else if (u.getColetividadeId() != null) {
            materializarStaffColetividade(u, "Professor");
        }
    }

    private void materializarStaffClube(Utilizador u, String cargoNome) {
        boolean jaValido;

        String role = perfilDAO.obterDescricaoPerfil(u.getPerfilId());
        if (PerfilDAO.TREINADOR_PRINCIPAL.equals(role)) {
            jaValido = utilizadorDAO.treinadorPrincipalTemAfetacaoValida(
                    u.getUtilizador(), u.getClubeId(), u.getModalidadeId()
            );
        } else if (PerfilDAO.DEPARTAMENTO_MEDICO.equals(role)) {
            jaValido = utilizadorDAO.departamentoMedicoTemAfetacaoValida(
                    u.getUtilizador(), u.getClubeId(), u.getModalidadeId()
            );
        } else if (PerfilDAO.SECRETARIO.equals(role)) {
            jaValido = utilizadorDAO.secretarioTemAfetacaoValida(
                    u.getUtilizador(), u.getClubeId(), u.getModalidadeId(), null, null
            );
        } else if (PerfilDAO.PROFESSOR.equals(role)) {
            jaValido = utilizadorDAO.professorTemAfetacaoValida(
                    u.getUtilizador(), u.getClubeId(), u.getModalidadeId(), null, null
            );
        } else {
            jaValido = utilizadorDAO.staffTemAfetacaoValida(
                    u.getUtilizador(), u.getClubeId(), u.getModalidadeId(), null, null
            );
        }

        if (jaValido) return;

        Integer cargoId = buscarCargoStaffIdPorNome(cargoNome);
        if (cargoId == null) {
            throw new IllegalArgumentException("Não existe cargo de staff no clube com o nome '" + cargoNome + "'.");
        }

        Integer clubeModalidadeId = null;
        if (u.getModalidadeId() != null) {
            ClubeModalidade cm = clubeModalidadeDAO.buscarAtivaPorClubeEModalidade(u.getClubeId(), u.getModalidadeId());
            if (cm == null) {
                throw new IllegalArgumentException("O clube não tem a modalidade ativa selecionada.");
            }
            clubeModalidadeId = cm.getId();
        }

        Staff staff = new Staff(
                null,
                u.getUtilizador().trim(),
                null,
                null,
                null,
                0.0
        );

        int staffId = staffDAO.inserirRetornarId(staff);
        if (staffId <= 0) {
            boolean ficouValido = utilizadorDAO.staffTemAfetacaoValida(
                    u.getUtilizador(), u.getClubeId(), u.getModalidadeId(), null, null
            );
            if (!ficouValido) {
                throw new IllegalStateException("Não foi possível criar automaticamente o staff do clube.");
            }
            return;
        }

        int afetacaoId = staffAfetacaoDAO.inserirPorIdsRetornarId(
                staffId,
                u.getClubeId(),
                clubeModalidadeId,
                cargoId,
                new Date(System.currentTimeMillis()),
                null,
                "⚠ Dados por preencher pelo administrador",
                true
        );

        if (afetacaoId <= 0) {
            boolean ficouValido = utilizadorDAO.staffTemAfetacaoValida(
                    u.getUtilizador(), u.getClubeId(), u.getModalidadeId(), null, null
            );
            if (!ficouValido) {
                throw new IllegalStateException("Não foi possível associar automaticamente o staff ao clube/modalidade.");
            }
        }
    }

    private void materializarStaffColetividade(Utilizador u, String cargoNome) {
        boolean jaValido;

        String role = perfilDAO.obterDescricaoPerfil(u.getPerfilId());
        if (PerfilDAO.SECRETARIO.equals(role)) {
            jaValido = utilizadorDAO.secretarioTemAfetacaoValida(
                    u.getUtilizador(), null, null, u.getColetividadeId(), u.getAtividadeId()
            );
        } else if (PerfilDAO.PROFESSOR.equals(role)) {
            jaValido = utilizadorDAO.professorTemAfetacaoValida(
                    u.getUtilizador(), null, null, u.getColetividadeId(), u.getAtividadeId()
            );
        } else {
            jaValido = utilizadorDAO.staffTemAfetacaoValida(
                    u.getUtilizador(), null, null, u.getColetividadeId(), u.getAtividadeId()
            );
        }

        if (jaValido) return;

        Integer coletividadeAtividadeId = null;
        if (u.getAtividadeId() != null) {
            coletividadeAtividadeId = buscarColetividadeAtividadeId(u.getColetividadeId(), u.getAtividadeId());
            if (coletividadeAtividadeId == null) {
                throw new IllegalArgumentException("A coletividade não tem a atividade ativa selecionada.");
            }
        }

        Integer cargoId = buscarCargoColetividadeStaffIdPorNome(cargoNome);
        if (cargoId == null) {
            throw new IllegalArgumentException("Não existe cargo de staff na coletividade com o nome '" + cargoNome + "'.");
        }

        Integer id = staffColetividadeDAO.criarStaff(
                null,
                u.getUtilizador().trim(),
                null,
                null,
                null,
                0.0,
                u.getColetividadeId(),
                coletividadeAtividadeId,
                cargoId,
                new Date(System.currentTimeMillis()).toString(),
                null,
                "⚠ Dados por preencher pelo administrador"
        );

        if (id == null || id <= 0) {
            boolean ficouValido = utilizadorDAO.staffTemAfetacaoValida(
                    u.getUtilizador(), null, null, u.getColetividadeId(), u.getAtividadeId()
            );
            if (!ficouValido) {
                throw new IllegalStateException("Não foi possível associar automaticamente o staff à coletividade/atividade.");
            }
        }
    }

    private Integer buscarColetividadeAtividadeId(Integer coletividadeId, Integer atividadeId) {
        if (coletividadeId == null || atividadeId == null) return null;

        String sql = """
            SELECT id
            FROM coletividade_atividade
            WHERE coletividade_id = ?
              AND atividade_id = ?
              AND ativo = 1
            ORDER BY ano DESC, id DESC
            LIMIT 1
        """;

        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setInt(1, coletividadeId);
            ps.setInt(2, atividadeId);

            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) return rs.getInt("id");
            }
        } catch (Exception e) {
            e.printStackTrace();
        }

        return null;
    }

    private Integer buscarCargoStaffIdPorNome(String nome) {
        String sql = """
            SELECT id
            FROM cargo_staff
            WHERE UPPER(nome) = UPPER(?)
              AND ativo = 1
            LIMIT 1
        """;

        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setString(1, nome);

            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) return rs.getInt("id");
            }
        } catch (Exception e) {
            e.printStackTrace();
        }

        return null;
    }

    private Integer buscarCargoColetividadeStaffIdPorNome(String nome) {
        String sql = """
            SELECT id
            FROM cargo_coletividade_staff
            WHERE UPPER(nome) = UPPER(?)
              AND ativo = 1
            LIMIT 1
        """;

        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setString(1, nome);

            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) return rs.getInt("id");
            }
        } catch (Exception e) {
            e.printStackTrace();
        }

        return null;
    }

    private void registarAuditoria(String acao, int entidadeId, Utilizador antes, Utilizador depois) {
        Integer adminId = SecurityUtils.currentUserId();
        if (adminId == null) return;

        try {
            String antesJson = mapper.writeValueAsString(antes);
            String depoisJson = mapper.writeValueAsString(depois);
            auditLogDAO.inserir(adminId, acao, "utilizadores", entidadeId, antesJson, depoisJson);
        } catch (Exception ignored) {
        }
    }
}