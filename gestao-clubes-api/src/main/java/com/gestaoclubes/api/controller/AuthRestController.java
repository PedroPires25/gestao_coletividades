package com.gestaoclubes.api.controller;

import com.gestaoclubes.api.dao.ClubeDAO;
import com.gestaoclubes.api.dao.ColetividadeAtividadeDAO;
import com.gestaoclubes.api.dao.ColetividadeDAO;
import com.gestaoclubes.api.dao.PerfilDAO;
import com.gestaoclubes.api.dao.StaffDAO;
import com.gestaoclubes.api.dao.UtilizadorDAO;
import com.gestaoclubes.api.model.Staff;
import com.gestaoclubes.api.model.Utilizador;
import com.gestaoclubes.api.security.JwtUtil;
import com.gestaoclubes.api.service.EmailService;
import com.gestaoclubes.api.util.PasswordPolicyUtil;
import com.gestaoclubes.api.util.ValidationUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/auth")
public class AuthRestController {

    private final UtilizadorDAO utilizadorDAO = new UtilizadorDAO();
    private final PerfilDAO perfilDAO = new PerfilDAO();
    private final ClubeDAO clubeDAO = new ClubeDAO();
    private final ColetividadeDAO coletividadeDAO = new ColetividadeDAO();
    private final ColetividadeAtividadeDAO coletividadeAtividadeDAO = new ColetividadeAtividadeDAO();
    private final StaffDAO staffDAO = new StaffDAO();

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private EmailService emailService;

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
        public List<Integer> atividadeIds;
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
        public String logoPath;
        public String nome;
        public String morada;
        public String telefone;
        public String emailNotificacoes;
        public String temaPreferido;
        public String numRegisto;
        public Integer staffId;
        public String nif;
        public String codigoPostal;
        public String numeroContribuinte;

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
            this.logoPath = u.getLogoPath();
            this.nome = u.getNome();
            this.morada = u.getMorada();
            this.telefone = u.getTelefone();
            this.emailNotificacoes = u.getEmailNotificacoes();
            this.temaPreferido = u.getTemaPreferido();
            this.nif = u.getNif();
            this.codigoPostal = u.getCodigoPostal();
            this.numeroContribuinte = u.getNumeroContribuinte();
        }
    }

    public static class LoginResponse {
        public String token;
        public UserDto user;

        public LoginResponse(String token, UserDto user) {
            this.token = token;
            this.user = user;
        }
    }

    public static class EstruturaRegistoDto {
        public int id;
        public String nome;

        public EstruturaRegistoDto(int id, String nome) {
            this.id = id;
            this.nome = nome;
        }
    }

    public static class RegisterContextResponse {
        public List<String> profiles;
        public List<EstruturaRegistoDto> clubes;
        public List<EstruturaRegistoDto> coletividades;

        public RegisterContextResponse(
                List<String> profiles,
                List<EstruturaRegistoDto> clubes,
                List<EstruturaRegistoDto> coletividades
        ) {
            this.profiles = profiles;
            this.clubes = clubes;
            this.coletividades = coletividades;
        }
    }

    public static class GetRedirectUrlResponse {
        public String redirectUrl;
        public String reason;
        public boolean valid;

        public GetRedirectUrlResponse(String redirectUrl, String reason, boolean valid) {
            this.redirectUrl = redirectUrl;
            this.reason = reason;
            this.valid = valid;
        }
    }

    public static class ContaSelecaoDto {
        public int userId;
        public String estruturaTipo;
        public String estruturaNome;
        public String role;

        public ContaSelecaoDto(int userId, String estruturaTipo, String estruturaNome, String role) {
            this.userId = userId;
            this.estruturaTipo = estruturaTipo;
            this.estruturaNome = estruturaNome;
            this.role = role;
        }
    }

    public static class LoginSelecaoResponse {
        public boolean requiresSelection = true;
        public List<ContaSelecaoDto> contas;

        public LoginSelecaoResponse(List<ContaSelecaoDto> contas) {
            this.contas = contas;
        }
    }

    public static class LoginConfirmRequest {
        public int userId;
        public String email;
        public String password;
    }

    @GetMapping("/profiles")
    public ResponseEntity<?> listarPerfisRegistaveis() {
        return ResponseEntity.ok(
                perfilDAO.listarPerfisDisponiveis().stream()
                        .filter(p -> !PerfilDAO.SUPER_ADMIN.equals(p))
                        .toList()
        );
    }

    @GetMapping("/register/context")
    public ResponseEntity<?> getRegisterContext() {
        List<String> profiles = perfilDAO.listarPerfisDisponiveis().stream()
                .filter(p -> !PerfilDAO.SUPER_ADMIN.equals(p))
                .toList();

        List<EstruturaRegistoDto> clubes = clubeDAO.listarTodos().stream()
                .map(clube -> new EstruturaRegistoDto(clube.getId(), clube.getNome()))
                .toList();

        List<EstruturaRegistoDto> coletividades = coletividadeDAO.listarTodos().stream()
                .map(coletividade -> new EstruturaRegistoDto(coletividade.getId(), coletividade.getNome()))
                .toList();

        return ResponseEntity.ok(new RegisterContextResponse(profiles, clubes, coletividades));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest req) {
        if (req == null || req.email == null || req.password == null) {
            return ResponseEntity.badRequest().body("Pedido inválido.");
        }

        List<Utilizador> contas = utilizadorDAO.autenticarTodos(req.email.trim(), req.password);

        if (contas.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("Utilizador ou palavra-passe incorretos.");
        }

        // Garantir que existem contas de utilizador para todas as inscrições de atleta deste email.
        // Faz-se aqui no login para retrocompatibilidade com atletas criados antes desta lógica.
        {
            String hash = utilizadorDAO.buscarHashPorEmail(req.email.trim());
            if (hash != null) {
                int atletaPerfilId = perfilDAO.obterPerfilPorDescricao(PerfilDAO.ATLETA);
                if (atletaPerfilId > 0) {
                    utilizadorDAO.sincronizarContasAtletaNoLogin(req.email.trim(), hash, atletaPerfilId);
                    // Recarregar contas após eventual criação de novas linhas
                    contas = utilizadorDAO.autenticarTodos(req.email.trim(), req.password);
                }
            }
        }

        // Filtrar apenas contas aprovadas
        List<Utilizador> aprovadas = contas.stream()
                .filter(u -> "APROVADO".equalsIgnoreCase(u.getEstadoRegisto()))
                .toList();

        // Se só existem contas pendentes/rejeitadas
        if (aprovadas.isEmpty()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("O registo ainda não foi aprovado.");
        }

        // Conta única aprovada → login direto
        if (aprovadas.size() == 1) {
            return concluirLogin(aprovadas.get(0));
        }

        // Múltiplas contas aprovadas → devolver lista para seleção
        List<ContaSelecaoDto> opcoes = aprovadas.stream()
                .map(u -> {
                    String role = perfilDAO.obterDescricaoPerfil(u.getPerfilId());
                    String estruturaTipo;
                    String estruturaNome;
                    if (u.getClubeId() != null) {
                        estruturaTipo = "CLUBE";
                        var clube = clubeDAO.buscarPorId(u.getClubeId());
                        estruturaNome = clube != null ? clube.getNome() : "Clube #" + u.getClubeId();
                    } else if (u.getColetividadeId() != null) {
                        estruturaTipo = "COLETIVIDADE";
                        var col = coletividadeDAO.buscarPorId(u.getColetividadeId());
                        estruturaNome = col != null ? col.getNome() : "Coletividade #" + u.getColetividadeId();
                    } else {
                        estruturaTipo = "SISTEMA";
                        estruturaNome = "Administração global";
                    }
                    return new ContaSelecaoDto(u.getId(), estruturaTipo, estruturaNome, role);
                })
                .toList();

        return ResponseEntity.ok(new LoginSelecaoResponse(opcoes));
    }

    @PostMapping("/login/confirm")
    public ResponseEntity<?> loginConfirm(@RequestBody LoginConfirmRequest req) {
        if (req == null || req.email == null || req.password == null || req.userId <= 0) {
            return ResponseEntity.badRequest().body("Pedido inválido.");
        }

        // Revalidar credenciais por segurança
        List<Utilizador> contas = utilizadorDAO.autenticarTodos(req.email.trim(), req.password);
        Utilizador u = contas.stream()
                .filter(c -> c.getId() == req.userId)
                .findFirst()
                .orElse(null);

        if (u == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("Credenciais inválidas.");
        }

        if (!"APROVADO".equalsIgnoreCase(u.getEstadoRegisto())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("O registo ainda não foi aprovado.");
        }

        return concluirLogin(u);
    }

    private ResponseEntity<?> concluirLogin(Utilizador u) {
        String rolePlain = perfilDAO.obterDescricaoPerfil(u.getPerfilId());
        if (rolePlain == null || rolePlain.isBlank()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("Perfil de utilizador inválido.");
        }

        // Corrigir administradores aprovados que não tenham privilégios ativos
        if (PerfilDAO.ADMINISTRADOR.equals(rolePlain) && !u.isPrivilegiosAtivos()) {
            utilizadorDAO.atualizarPrivilegios(u.getId(), true);
            u = utilizadorDAO.buscarPorId(u.getId());
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

        return ResponseEntity.ok(new LoginResponse(token, new UserDto(u, rolePlain)));
    }

    @GetMapping("/redirect-path")
    public ResponseEntity<?> getRedirectPath() {
        JwtUtil.JwtUser jwtUser = getAuthenticatedUser();
        
        if (jwtUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new GetRedirectUrlResponse(null, "Utilizador não autenticado.", false));
        }

        Utilizador utilizador = utilizadorDAO.buscarPorId(jwtUser.id());
        if (utilizador == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new GetRedirectUrlResponse(null, "Utilizador não encontrado.", false));
        }

        if (!"APROVADO".equalsIgnoreCase(utilizador.getEstadoRegisto())) {
            return ResponseEntity.ok(
                    new GetRedirectUrlResponse(null, "Registo pendente de aprovação.", false)
            );
        }

        String rolePlain = perfilDAO.obterDescricaoPerfil(utilizador.getPerfilId());
        String redirectUrl = calcularRedirectUrl(rolePlain, utilizador);

        if (redirectUrl == null || redirectUrl.isBlank()) {
            return ResponseEntity.ok(
                    new GetRedirectUrlResponse("/menu", "Redirecionamento para menu predefinido.", true)
            );
        }

        return ResponseEntity.ok(
                new GetRedirectUrlResponse(redirectUrl, "Redirecionamento calculado.", true)
        );
    }

    // ---- PERFIL DO UTILIZADOR AUTENTICADO ----

    public static class UpdateProfileRequest {
        public String nome;
        public String morada;
        public String telefone;
        public String emailNotificacoes;
        public String temaPreferido;
        public String numRegisto;
        public String nif;
        public String codigoPostal;
        public String numeroContribuinte;
    }

    public static class ChangePasswordRequest {
        public String currentPassword;
        public String newPassword;
        public String confirmNewPassword;
    }

    @GetMapping("/me")
    public ResponseEntity<?> getMyProfile() {
        JwtUtil.JwtUser jwtUser = getAuthenticatedUser();
        if (jwtUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Não autenticado.");
        }

        Utilizador u = utilizadorDAO.buscarPorId(jwtUser.id());
        if (u == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Utilizador não encontrado.");
        }

        String rolePlain = perfilDAO.obterDescricaoPerfil(u.getPerfilId());
        UserDto dto = new UserDto(u, rolePlain);
        if ("DEPARTAMENTO_MEDICO".equals(rolePlain)) {
            Staff staffRecord = staffDAO.buscarPorUtilizadorId(u.getId());
            if (staffRecord != null) {
                dto.numRegisto = staffRecord.getNumRegisto();
                dto.staffId = staffRecord.getId();
            }
        }
        return ResponseEntity.ok(dto);
    }

    @PutMapping("/me")
    public ResponseEntity<?> updateMyProfile(@RequestBody UpdateProfileRequest req) {
        JwtUtil.JwtUser jwtUser = getAuthenticatedUser();
        if (jwtUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Não autenticado.");
        }

        Utilizador u = utilizadorDAO.buscarPorId(jwtUser.id());
        if (u == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Utilizador não encontrado.");
        }

        if (req.nome != null) {
            utilizadorDAO.atualizarNome(u.getId(), req.nome.trim());
        }

        if (req.morada != null || req.telefone != null || req.emailNotificacoes != null
                || req.nif != null || req.codigoPostal != null || req.numeroContribuinte != null) {
            if (req.telefone != null) {
                try {
                    ValidationUtil.validateTelefone(req.telefone.trim());
                } catch (IllegalArgumentException e) {
                    return ResponseEntity.badRequest().body(e.getMessage());
                }
            }
            if (req.nif != null && !req.nif.trim().isEmpty()) {
                try {
                    ValidationUtil.validateNif(req.nif.trim());
                } catch (IllegalArgumentException e) {
                    return ResponseEntity.badRequest().body(e.getMessage());
                }
            }
            if (req.codigoPostal != null && !req.codigoPostal.trim().isEmpty()) {
                try {
                    ValidationUtil.validateCodigoPostal(req.codigoPostal.trim());
                } catch (IllegalArgumentException e) {
                    return ResponseEntity.badRequest().body(e.getMessage());
                }
            }
            if (req.numeroContribuinte != null && !req.numeroContribuinte.trim().isEmpty()) {
                if (!req.numeroContribuinte.trim().matches("\\d{9}")) {
                    return ResponseEntity.badRequest().body("O Nº de Contribuinte deve conter exatamente 9 números.");
                }
            }
            String morada = req.morada != null ? req.morada.trim() : u.getMorada();
            String telefone = req.telefone != null ? req.telefone.trim() : u.getTelefone();
            String emailNotificacoes = req.emailNotificacoes != null
                    ? normalizarCampoOpcional(req.emailNotificacoes)
                    : u.getEmailNotificacoes();
            String nif = req.nif != null ? normalizarCampoOpcional(req.nif) : u.getNif();
            String codigoPostal = req.codigoPostal != null ? normalizarCampoOpcional(req.codigoPostal) : u.getCodigoPostal();
            String numeroContribuinte = req.numeroContribuinte != null ? normalizarCampoOpcional(req.numeroContribuinte) : u.getNumeroContribuinte();

            utilizadorDAO.atualizarDadosPessoais(u.getId(), morada, telefone, emailNotificacoes, nif, codigoPostal, numeroContribuinte);
        }

        if (req.temaPreferido != null) {
            utilizadorDAO.atualizarTemaPreferido(u.getId(), req.temaPreferido.trim());
        }

        // Nº Registo só pode ser alterado pelo próprio utilizador do Departamento Médico
        String rolePlain = perfilDAO.obterDescricaoPerfil(u.getPerfilId());
        if (req.numRegisto != null && "DEPARTAMENTO_MEDICO".equals(rolePlain)) {
            Staff staffRecord = staffDAO.buscarPorUtilizadorId(u.getId());
            if (staffRecord != null) {
                Staff atualizado = new Staff(
                        staffRecord.getId(),
                        staffRecord.getNome(),
                        staffRecord.getEmail(),
                        staffRecord.getTelefone(),
                        staffRecord.getMorada(),
                        req.numRegisto.trim(),
                        staffRecord.getRemuneracao()
                );
                staffDAO.atualizar(staffRecord.getId(), atualizado);
            }
        }

        Utilizador updated = utilizadorDAO.buscarPorId(jwtUser.id());
        String updatedRole = perfilDAO.obterDescricaoPerfil(updated.getPerfilId());
        UserDto dto = new UserDto(updated, updatedRole);
        if ("DEPARTAMENTO_MEDICO".equals(updatedRole)) {
            Staff staffRecord = staffDAO.buscarPorUtilizadorId(updated.getId());
            if (staffRecord != null) {
                dto.numRegisto = staffRecord.getNumRegisto();
                dto.staffId = staffRecord.getId();
            }
        }
        return ResponseEntity.ok(dto);
    }

    @PutMapping("/me/password")
    public ResponseEntity<?> changeMyPassword(@RequestBody ChangePasswordRequest req) {
        JwtUtil.JwtUser jwtUser = getAuthenticatedUser();
        if (jwtUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Não autenticado.");
        }

        if (req == null || req.currentPassword == null || req.newPassword == null || req.confirmNewPassword == null) {
            return ResponseEntity.badRequest().body("Todos os campos são obrigatórios.");
        }

        Utilizador u = utilizadorDAO.autenticar(jwtUser.email(), req.currentPassword);
        if (u == null) {
            return ResponseEntity.badRequest().body("A palavra-passe atual está incorreta.");
        }

        if (!req.newPassword.equals(req.confirmNewPassword)) {
            return ResponseEntity.badRequest().body("As novas palavras-passe não coincidem.");
        }

        if (!PasswordPolicyUtil.isValid(req.newPassword)) {
            return ResponseEntity.badRequest().body(
                    String.join(" ", PasswordPolicyUtil.getValidationErrors(req.newPassword))
            );
        }

        try {
            utilizadorDAO.atualizarPassword(u.getId(), req.newPassword);
            return ResponseEntity.ok("Palavra-passe alterada com sucesso.");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Erro ao alterar a palavra-passe.");
        }
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

        if (PerfilDAO.SUPER_ADMIN.equals(perfil)) {
            return ResponseEntity.badRequest().body("Não é permitido registar super administradores publicamente.");
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
        List<Integer> atividadeIds = req.atividadeIds;

        // limpar o contexto oposto para evitar ambiguidade
        if ("CLUBE".equals(estruturaTipo)) {
            coletividadeId = null;
            atividadeIds = null;
        } else if ("COLETIVIDADE".equals(estruturaTipo)) {
            clubeId = null;
            modalidadeId = null;
        }

        if (PerfilDAO.USER.equals(perfil)) {
            // USER só precisa de clube ou coletividade; limpar modalidade e atividade
            modalidadeId = null;
            atividadeIds = null;
        }

        // Validar duplicação de email dentro da mesma estrutura antes de tentar inserir
        if (utilizadorDAO.existeEmailNaEstrutura(email, clubeId, coletividadeId)) {
            if (clubeId != null) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                        .body("Já existe um utilizador com este email neste clube.");
            } else if (coletividadeId != null) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                        .body("Já existe um utilizador com este email nesta coletividade.");
            } else {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                        .body("Já existe um utilizador com este email no sistema.");
            }
        }

        String estadoRegisto = perfilDAO.isPerfilAutoAprovado(perfil) ? "APROVADO" : "PENDENTE";

        // Para perfis ligados a atividade em coletividade (não UTENTE), resolver atividade.id
        // a partir do primeiro coletividade_atividade.id selecionado.
        boolean criarInscrito = PerfilDAO.UTENTE.equals(perfil);
        Integer atividadeId = null;
        if (!criarInscrito && coletividadeId != null && atividadeIds != null && !atividadeIds.isEmpty()) {
            var ca = coletividadeAtividadeDAO.obterPorId(atividadeIds.get(0));
            atividadeId = (ca != null) ? ca.getAtividadeId() : null;
        }

        boolean ok = utilizadorDAO.inserir(
                email,
                req.password,
                perfilId,
                true,
                estadoRegisto,
                clubeId,
                modalidadeId,
                coletividadeId,
                atividadeId,
                criarInscrito ? atividadeIds : null
        );

        if (!ok) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Não foi possível registar. Tente novamente.");
        }

        if ("PENDENTE".equals(estadoRegisto)) {
            emailService.enviarEmailRegistoPendente(email);
            String mensagemAprovacao = PerfilDAO.ADMINISTRADOR.equals(perfil)
                    ? "Utilizador registado com sucesso. Aguarda aprovação de um super administrador."
                    : "Utilizador registado com sucesso. Aguarda aprovação do administrador da estrutura.";
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(mensagemAprovacao);
        }

        return ResponseEntity.status(HttpStatus.CREATED)
                .body("Utilizador registado com sucesso!");
    }

    private boolean validarAcessoInterno(String rolePlain, Utilizador u) {
        return switch (rolePlain) {
            case PerfilDAO.SUPER_ADMIN -> true;
            case PerfilDAO.ADMINISTRADOR -> u.getClubeId() != null || u.getColetividadeId() != null;
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
                if (!"CLUBE".equals(estruturaTipo) && !"COLETIVIDADE".equals(estruturaTipo)) {
                    return "Utilizador tem de escolher CLUBE ou COLETIVIDADE.";
                }
                if ("CLUBE".equals(estruturaTipo) && req.clubeId == null) {
                    return "Utilizador tem de escolher um clube.";
                }
                if ("COLETIVIDADE".equals(estruturaTipo) && req.coletividadeId == null) {
                    return "Utilizador tem de escolher uma coletividade.";
                }
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
                if (req.atividadeIds == null || req.atividadeIds.isEmpty()) {
                    return "Utente tem de escolher pelo menos uma atividade.";
                }
                return null;

            case PerfilDAO.STAFF:
            case PerfilDAO.SECRETARIO:
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

            case PerfilDAO.PROFESSOR:
            case "TREINADOR_COLETIVIDADE":
                if (!"CLUBE".equals(estruturaTipo) && !"COLETIVIDADE".equals(estruturaTipo)) {
                    return "Selecione CLUBE ou COLETIVIDADE.";
                }
                if ("CLUBE".equals(estruturaTipo) && req.clubeId == null) {
                    return "Tem de escolher um clube.";
                }
                if ("COLETIVIDADE".equals(estruturaTipo) && req.coletividadeId == null) {
                    return "Tem de escolher uma coletividade.";
                }
                if ("COLETIVIDADE".equals(estruturaTipo)
                        && (req.atividadeIds == null || req.atividadeIds.isEmpty())) {
                    return "Para este perfil em coletividade, é obrigatório selecionar uma atividade.";
                }
                return null;

            case PerfilDAO.ADMINISTRADOR:
                if (!"CLUBE".equals(estruturaTipo) && !"COLETIVIDADE".equals(estruturaTipo)) {
                    return "Administrador tem de escolher CLUBE ou COLETIVIDADE.";
                }
                if ("CLUBE".equals(estruturaTipo) && req.clubeId == null) {
                    return "Administrador tem de escolher um clube.";
                }
                if ("COLETIVIDADE".equals(estruturaTipo) && req.coletividadeId == null) {
                    return "Administrador tem de escolher uma coletividade.";
                }
                return null;

            default:
                return "Perfil inválido.";
        }
    }

    private String normalizarEstruturaTipo(String estruturaTipo) {
        return estruturaTipo == null ? null : estruturaTipo.trim().toUpperCase();
    }

    private String normalizarCampoOpcional(String valor) {
        if (valor == null) {
            return null;
        }
        String normalizado = valor.trim();
        return normalizado.isEmpty() ? null : normalizado;
    }

    private JwtUtil.JwtUser getAuthenticatedUser() {
        var auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof JwtUtil.JwtUser jwtUser) {
            return jwtUser;
        }
        return null;
    }

    private String calcularRedirectUrl(String rolePlain, Utilizador u) {
        if (rolePlain == null || rolePlain.isBlank()) {
            return null;
        }

        return switch (rolePlain) {
            case PerfilDAO.SUPER_ADMIN -> "/admin/users";

            case PerfilDAO.ADMINISTRADOR -> {
                if (u.getClubeId() != null) {
                    yield String.format("/clubes/%d", u.getClubeId());
                }
                if (u.getColetividadeId() != null) {
                    yield String.format("/coletividades/%d", u.getColetividadeId());
                }
                yield "/menu";
            }

            case PerfilDAO.ATLETA -> {
                if (u.getClubeId() != null && u.getModalidadeId() != null) {
                    yield String.format("/clubes/%d/atletas/modalidades/%d", u.getClubeId(), u.getModalidadeId());
                }
                yield null;
            }

            case PerfilDAO.TREINADOR_PRINCIPAL -> {
                if (u.getClubeId() != null && u.getModalidadeId() != null) {
                    yield String.format("/clubes/%d/staff/modalidades/%d", u.getClubeId(), u.getModalidadeId());
                }
                yield null;
            }

            case PerfilDAO.DEPARTAMENTO_MEDICO -> {
                if (u.getClubeId() != null) {
                    yield String.format("/clubes/%d", u.getClubeId());
                }
                yield null;
            }

            case PerfilDAO.STAFF, PerfilDAO.SECRETARIO, PerfilDAO.PROFESSOR -> {
                // Prioridade: CLUBE > COLETIVIDADE
                if (u.getClubeId() != null) {
                    yield String.format("/clubes/%d", u.getClubeId());
                }
                if (u.getColetividadeId() != null) {
                    yield String.format("/coletividades/%d", u.getColetividadeId());
                }
                yield null;
            }

            case PerfilDAO.UTENTE -> {
                if (u.getColetividadeId() != null && u.getAtividadeId() != null) {
                    yield String.format("/coletividades/%d/utentes/atividades/%d", u.getColetividadeId(), u.getAtividadeId());
                }
                yield null;
            }

            case PerfilDAO.USER -> {
                if (u.getClubeId() != null) {
                    yield String.format("/minha-area/clube/%d", u.getClubeId());
                }
                if (u.getColetividadeId() != null) {
                    yield String.format("/minha-area/coletividade/%d", u.getColetividadeId());
                }
                yield "/menu";
            }

            default -> null;
        };
    }
}