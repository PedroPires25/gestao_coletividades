package com.gestaoclubes.api.controller;

import com.gestaoclubes.api.dao.PerfilDAO;
import com.gestaoclubes.api.dao.UtilizadorDAO;
import com.gestaoclubes.api.model.Utilizador;
import com.gestaoclubes.api.security.JwtUtil;
import com.gestaoclubes.api.util.PasswordPolicyUtil;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:5173")
public class AuthRestController {

    private final UtilizadorDAO utilizadorDAO = new UtilizadorDAO();
    private final PerfilDAO perfilDAO = new PerfilDAO();
    private final JwtUtil jwtUtil;

    public AuthRestController(JwtUtil jwtUtil) {
        this.jwtUtil = jwtUtil;
    }

    public static class LoginRequest {
        public String email;
        public String password;
    }

    public static class RegisterRequest {
        public String email;
        public String password;
        public String confirmPassword;
    }

    public static class UserDto {
        public int id;
        public String email;
        public int perfilId;
        public String role;
        public boolean ativo;

        public UserDto(Utilizador u, String role) {
            this.id = u.getId();
            this.email = u.getUtilizador();
            this.perfilId = u.getPerfilId();
            this.role = role;
            this.ativo = u.isAtivo();
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

        int adminPerfilId = perfilDAO.obterPerfilAdmin();
        String rolePlain = (u.getPerfilId() == adminPerfilId) ? "ADMIN" : "USER";
        String roleSpring = "ROLE_" + rolePlain;

        String token = jwtUtil.generateToken(u.getId(), u.getUtilizador(), roleSpring);

        return ResponseEntity.ok(new LoginResponse(token, new UserDto(u, rolePlain)));
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest req) {
        if (req == null || req.email == null || req.password == null || req.confirmPassword == null) {
            return ResponseEntity.badRequest().body("Pedido inválido.");
        }

        String email = req.email.trim();

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

        boolean ok = utilizadorDAO.inserir(email, req.password);
        if (!ok) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body("Não foi possível registar. O email já existe?");
        }

        return ResponseEntity.status(HttpStatus.CREATED).body("Utilizador registado com sucesso!");
    }
}