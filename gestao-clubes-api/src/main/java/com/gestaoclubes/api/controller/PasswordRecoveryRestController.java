package com.gestaoclubes.api.controller;

import com.gestaoclubes.api.dao.PasswordResetTokenDAO;
import com.gestaoclubes.api.dao.UtilizadorDAO;
import com.gestaoclubes.api.model.PasswordResetToken;
import com.gestaoclubes.api.model.Utilizador;
import com.gestaoclubes.api.service.EmailService;
import com.gestaoclubes.api.util.PasswordPolicyUtil;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:5173")
public class PasswordRecoveryRestController {

    private final UtilizadorDAO utilizadorDAO;
    private final PasswordResetTokenDAO passwordResetTokenDAO;
    private final EmailService emailService;

    public PasswordRecoveryRestController(
            UtilizadorDAO utilizadorDAO,
            PasswordResetTokenDAO passwordResetTokenDAO,
            EmailService emailService
    ) {
        this.utilizadorDAO = utilizadorDAO;
        this.passwordResetTokenDAO = passwordResetTokenDAO;
        this.emailService = emailService;
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> body) {
        String email = body != null && body.get("email") != null ? body.get("email").trim() : "";

        if (!email.isBlank()) {
            Utilizador u = utilizadorDAO.buscarPorEmail(email);

            if (u != null) {
                passwordResetTokenDAO.invalidarTokensDoUtilizador(u.getId());

                String token = UUID.randomUUID().toString();
                LocalDateTime expiresAt = LocalDateTime.now().plusMinutes(30);

                passwordResetTokenDAO.inserir(u.getId(), token, expiresAt);

                String link = "http://localhost:5173/reset-password?token=" + token;
                emailService.enviarEmailRecuperacao(u.getUtilizador(), link);
            }
        }

        return ResponseEntity.ok("Se o email existir, um link de recuperação foi enviado.");
    }

    @GetMapping("/reset-password/validate")
    public ResponseEntity<?> validateToken(@RequestParam String token) {
        Map<String, Object> response = new LinkedHashMap<>();
        PasswordResetToken t = passwordResetTokenDAO.buscarPorToken(token);

        if (t == null || t.isUsed() || t.getExpiresAt().isBefore(LocalDateTime.now())) {
            response.put("valid", false);
            response.put("message", "O link de recuperação é inválido ou já expirou.");
            return ResponseEntity.ok(response);
        }

        response.put("valid", true);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody ResetPasswordRequest body) {
        if (body == null || body.token == null || body.token.isBlank()) {
            return ResponseEntity.badRequest().body("Token inválido.");
        }

        if (!PasswordPolicyUtil.isValid(body.newPassword)) {
            return ResponseEntity.badRequest().body(
                    String.join(" ", PasswordPolicyUtil.getValidationErrors(body.newPassword))
            );
        }

        if (!body.newPassword.equals(body.confirmPassword)) {
            return ResponseEntity.badRequest().body("A confirmação da palavra-passe não coincide.");
        }

        PasswordResetToken t = passwordResetTokenDAO.buscarPorToken(body.token);
        if (t == null || t.isUsed() || t.getExpiresAt().isBefore(LocalDateTime.now())) {
            return ResponseEntity.badRequest().body("Token inválido ou expirado.");
        }

        boolean ok = utilizadorDAO.atualizarPassword(t.getUserId(), body.newPassword);
        if (!ok) {
            return ResponseEntity.internalServerError().body("Não foi possível atualizar a palavra-passe.");
        }

        passwordResetTokenDAO.marcarComoUsado(body.token);
        passwordResetTokenDAO.invalidarTokensDoUtilizador(t.getUserId());

        try {
            Utilizador u = utilizadorDAO.buscarPorId(t.getUserId());
            if (u != null) {
                emailService.enviarEmailConfirmacaoAlteracao(u.getUtilizador());
            }
        } catch (Exception e) {
            System.err.println("Erro ao enviar email de confirmação: " + e.getMessage());
        }

        return ResponseEntity.ok("Palavra-passe atualizada com sucesso.");
    }

    public static class ResetPasswordRequest {
        public String token;
        public String newPassword;
        public String confirmPassword;
    }
}