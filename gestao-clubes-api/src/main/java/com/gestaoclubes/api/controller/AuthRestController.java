package com.gestaoclubes.api.controller;

import com.gestaoclubes.api.dao.PerfilDAO;
import com.gestaoclubes.api.dao.UtilizadorDAO;
import com.gestaoclubes.api.model.Utilizador;
import com.gestaoclubes.api.security.JwtUtil;
import com.gestaoclubes.api.service.RedirectService;
import com.gestaoclubes.api.util.PasswordPolicyUtil;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:5173")
public class AuthRestController {

    private final UtilizadorDAO utilizadorDAO;
    private final PerfilDAO perfilDAO;
    private final JwtUtil jwtUtil;
    private final RedirectService redirectService;

    public AuthRestController(UtilizadorDAO utilizadorDAO, PerfilDAO perfilDAO, JwtUtil jwtUtil, RedirectService redirectService) {
        this.utilizadorDAO = utilizadorDAO;
        this.perfilDAO = perfilDAO;
        this.jwtUtil = jwtUtil;
        this.redirectService = redirectService;
    }

    public static class LoginRequest {
        public String email;
        public String password;
    }

    public static class RegisterRequest {
        public String email;
        public String password;
        public String confirmPassword;
        public String perfil;

        // "CLUBE" ou "COLETIVIDADE" para perfis mistos
        public String estruturaTipo;

        public Integer clubeId;
        public Integer modalidadeId;
        public Integer coletividadeId;
        public Integer atividadeId;
    }

    public static class UserDto {
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

        public UserDto(Utilizador u, String role) {
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

    public static class LoginResponse {
        public String token;
        public UserDto user;
        public String redirectUrl;

        public LoginResponse(String token, UserDto user, String redirectUrl) {
            this.token = token;
            this.user = user;
            this.redirectUrl = redirectUrl;
        }
    }

    @GetMapping("/profiles")
    public ResponseEntity<?> listarPerfisRegistaveis() {
        return ResponseEntity.ok(
                perfilDAO.listarPerfisDisponiveis().stream()
                        .filter(p -> !PerfilDAO.ADMIN.equals(p))
                        .toList()
        );
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest req) {
        if (req == null || req.email == null || req.password == null) {
            return ResponseEntity.badRequest().body("Pedido inválido.");
        }

        Utilizador u = utilizadorDAO.autenticar(req.email.trim(), req.password);
        if (u == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("Utilizador ou palavra-passe incorretos.");
        }

        if (!"APROVADO".equalsIgnoreCase(u.getEstadoRegisto())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("O registo ainda não foi aprovado.");
        }

        String rolePlain = perfilDAO.obterDescricaoPerfil(u.getPerfilId());
        if (rolePlain == null || rolePlain.isBlank()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("Perfil de utilizador inválido.");
        }

        if (!validarAcessoInterno(rolePlain, u)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("O utilizador não está registado de forma válida na estrutura correspondente.");
        }

        String roleSpring = "ROLE_" + rolePlain;

        String token = jwtUtil.generateToken(
                u.getId(),
                u.getUtilizador(),
                roleSpring,
                u.isPrivilegiosAtivos(),
                u.getClubeId(),
                u.getModalidadeId(),
                u.getColetividadeId(),
                u.getAtividadeId()
        );

        // Calcular URL de redirecionamento automático baseado no perfil e afetação
        String redirectUrl = redirectService.calcularRedirectUrl(u, rolePlain);

        return ResponseEntity.ok(new LoginResponse(token, new UserDto(u, rolePlain), redirectUrl));
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest req) {
        if (req == null || req.email == null || req.password == null || req.confirmPassword == null || req.perfil == null) {
            return ResponseEntity.badRequest().body("Pedido inválido.");
        }

        String email = req.email.trim();
        String perfil = perfilDAO.normalizar(req.perfil);
        String estruturaTipo = normalizarEstruturaTipo(req.estruturaTipo);

        if (email.isEmpty()) {
            return ResponseEntity.badRequest().body("Email obrigatório.");
        }

        if (req.password.isEmpty()) {
            return ResponseEntity.badRequest().body("Password obrigatória.");
        }

        if (!PasswordPolicyUtil.isValid(req.password)) {
            return ResponseEntity.badRequest().body(
                    String.join(" ", PasswordPolicyUtil.getValidationErrors(req.password))
            );
        }

        if (!req.password.equals(req.confirmPassword)) {
            return ResponseEntity.badRequest().body("As passwords não coincidem.");
        }

        if (!perfilDAO.isPerfilPermitidoNoRegistoPublico(perfil)) {
            return ResponseEntity.badRequest().body("Perfil inválido para registo público.");
        }

        if (PerfilDAO.ADMIN.equals(perfil)) {
            return ResponseEntity.badRequest().body("Não é permitido registar administradores publicamente.");
        }

        int perfilId = perfilDAO.obterPerfilPorDescricao(perfil);
        if (perfilId <= 0) {
            return ResponseEntity.badRequest().body("Perfil não encontrado.");
        }

        String erroEstrutura = validarEstruturaNoRegisto(perfil, estruturaTipo, req);
        if (erroEstrutura != null) {
            return ResponseEntity.badRequest().body(erroEstrutura);
        }

        Integer clubeId = req.clubeId;
        Integer modalidadeId = req.modalidadeId;
        Integer coletividadeId = req.coletividadeId;
        Integer atividadeId = req.atividadeId;

        // limpar o contexto oposto para evitar ambiguidade
        if ("CLUBE".equals(estruturaTipo)) {
            coletividadeId = null;
            atividadeId = null;
        } else if ("COLETIVIDADE".equals(estruturaTipo)) {
            clubeId = null;
            modalidadeId = null;
        }

        if (PerfilDAO.USER.equals(perfil)) {
            clubeId = null;
            modalidadeId = null;
            coletividadeId = null;
            atividadeId = null;
        }

        String estadoRegisto = perfilDAO.isPerfilAutoAprovado(perfil) ? "APROVADO" : "PENDENTE";

        boolean ok = utilizadorDAO.inserir(
                email,
                req.password,
                perfilId,
                true,
                estadoRegisto,
                clubeId,
                modalidadeId,
                coletividadeId,
                atividadeId
        );

        if (!ok) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body("Não foi possível registar. O email já existe?");
        }

        if ("PENDENTE".equals(estadoRegisto)) {
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body("Utilizador registado com sucesso. Aguarda aprovação de um administrador.");
        }

        return ResponseEntity.status(HttpStatus.CREATED)
                .body("Utilizador registado com sucesso!");
    }

    private boolean validarAcessoInterno(String rolePlain, Utilizador u) {
        return switch (rolePlain) {
            case PerfilDAO.ADMIN -> true;
            case PerfilDAO.USER -> true;

            case PerfilDAO.ATLETA ->
                    utilizadorDAO.atletaTemAfetacaoValida(
                            u.getUtilizador(),
                            u.getClubeId(),
                            u.getModalidadeId()
                    );

            case PerfilDAO.TREINADOR_PRINCIPAL ->
                    utilizadorDAO.treinadorPrincipalTemAfetacaoValida(
                            u.getUtilizador(),
                            u.getClubeId(),
                            u.getModalidadeId()
                    );

            case PerfilDAO.DEPARTAMENTO_MEDICO ->
                    utilizadorDAO.departamentoMedicoTemAfetacaoValida(
                            u.getUtilizador(),
                            u.getClubeId(),
                            u.getModalidadeId()
                    );

            case PerfilDAO.STAFF ->
                    utilizadorDAO.staffTemAfetacaoValida(
                            u.getUtilizador(),
                            u.getClubeId(),
                            u.getModalidadeId(),
                            u.getColetividadeId(),
                            u.getAtividadeId()
                    );

            case PerfilDAO.SECRETARIO ->
                    utilizadorDAO.secretarioTemAfetacaoValida(
                            u.getUtilizador(),
                            u.getClubeId(),
                            u.getModalidadeId(),
                            u.getColetividadeId(),
                            u.getAtividadeId()
                    );

            case PerfilDAO.PROFESSOR ->
                    utilizadorDAO.professorTemAfetacaoValida(
                            u.getUtilizador(),
                            u.getClubeId(),
                            u.getModalidadeId(),
                            u.getColetividadeId(),
                            u.getAtividadeId()
                    );

            case PerfilDAO.UTENTE ->
                    utilizadorDAO.utenteTemAfetacaoValida(
                            u.getUtilizador(),
                            u.getColetividadeId(),
                            u.getAtividadeId()
                    );

            default -> false;
        };
    }

    private String validarEstruturaNoRegisto(String perfil, String estruturaTipo, RegisterRequest req) {
        switch (perfil) {
            case PerfilDAO.USER:
                return null;

            case PerfilDAO.ATLETA:
                if (!"CLUBE".equals(estruturaTipo)) {
                    return "Atleta tem de escolher a estrutura CLUBE.";
                }
                if (req.clubeId == null) {
                    return "Atleta tem de escolher um clube.";
                }
                if (req.modalidadeId == null) {
                    return "Atleta tem de escolher uma modalidade.";
                }
                return null;

            case PerfilDAO.TREINADOR_PRINCIPAL:
                if (!"CLUBE".equals(estruturaTipo)) {
                    return "Treinador Principal tem de escolher a estrutura CLUBE.";
                }
                if (req.clubeId == null) {
                    return "Treinador Principal tem de escolher um clube.";
                }
                if (req.modalidadeId == null) {
                    return "Treinador Principal tem de escolher uma modalidade.";
                }
                return null;

            case PerfilDAO.DEPARTAMENTO_MEDICO:
                if (!"CLUBE".equals(estruturaTipo)) {
                    return "Departamento Médico tem de escolher a estrutura CLUBE.";
                }
                if (req.clubeId == null) {
                    return "Departamento Médico tem de escolher um clube.";
                }
                return null;

            case PerfilDAO.UTENTE:
                if (!"COLETIVIDADE".equals(estruturaTipo)) {
                    return "Utente tem de escolher a estrutura COLETIVIDADE.";
                }
                if (req.coletividadeId == null) {
                    return "Utente tem de escolher uma coletividade.";
                }
                return null;

            case PerfilDAO.STAFF:
            case PerfilDAO.SECRETARIO:
            case PerfilDAO.PROFESSOR:
                if (!"CLUBE".equals(estruturaTipo) && !"COLETIVIDADE".equals(estruturaTipo)) {
                    return "Selecione CLUBE ou COLETIVIDADE.";
                }
                if ("CLUBE".equals(estruturaTipo) && req.clubeId == null) {
                    return "Tem de escolher um clube.";
                }
                if ("COLETIVIDADE".equals(estruturaTipo) && req.coletividadeId == null) {
                    return "Tem de escolher uma coletividade.";
                }
                return null;

            default:
                return "Perfil inválido.";
        }
    }

    private String normalizarEstruturaTipo(String estruturaTipo) {
        return estruturaTipo == null ? null : estruturaTipo.trim().toUpperCase();
    }
}