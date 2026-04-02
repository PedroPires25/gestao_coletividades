package com.gestaoclubes.api.dao;

import com.gestaoclubes.api.model.PasswordResetToken;
import com.gestaoclubes.api.util.ConexoBD;
import org.springframework.stereotype.Repository;

import java.sql.*;
import java.time.LocalDateTime;

@Repository
public class PasswordResetTokenDAO {

    public boolean inserir(Integer userId, String token, LocalDateTime expiresAt) {
        String sql = """
                INSERT INTO password_reset_tokens (user_id, token, expires_at, used)
                VALUES (?, ?, ?, false)
                """;

        try (Connection c = ConexoBD.getConnection();
             PreparedStatement ps = c.prepareStatement(sql)) {

            ps.setInt(1, userId);
            ps.setString(2, token);
            ps.setTimestamp(3, Timestamp.valueOf(expiresAt));
            return ps.executeUpdate() > 0;

        } catch (Exception e) {
            throw new RuntimeException("Erro ao criar token de recuperação.", e);
        }
    }

    public PasswordResetToken buscarPorToken(String token) {
        String sql = """
                SELECT id, user_id, token, expires_at, used, created_at
                FROM password_reset_tokens
                WHERE token = ?
                LIMIT 1
                """;

        try (Connection c = ConexoBD.getConnection();
             PreparedStatement ps = c.prepareStatement(sql)) {

            ps.setString(1, token);

            try (ResultSet rs = ps.executeQuery()) {
                if (!rs.next()) return null;

                PasswordResetToken t = new PasswordResetToken();
                t.setId(rs.getInt("id"));
                t.setUserId(rs.getInt("user_id"));
                t.setToken(rs.getString("token"));
                t.setExpiresAt(rs.getTimestamp("expires_at").toLocalDateTime());
                t.setUsed(rs.getBoolean("used"));

                Timestamp createdAt = rs.getTimestamp("created_at");
                if (createdAt != null) {
                    t.setCreatedAt(createdAt.toLocalDateTime());
                }

                return t;
            }

        } catch (Exception e) {
            throw new RuntimeException("Erro ao procurar token.", e);
        }
    }

    public boolean marcarComoUsado(String token) {
        String sql = "UPDATE password_reset_tokens SET used = true WHERE token = ?";

        try (Connection c = ConexoBD.getConnection();
             PreparedStatement ps = c.prepareStatement(sql)) {

            ps.setString(1, token);
            return ps.executeUpdate() > 0;

        } catch (Exception e) {
            throw new RuntimeException("Erro ao marcar token como usado.", e);
        }
    }

    public int invalidarTokensDoUtilizador(Integer userId) {
        String sql = "UPDATE password_reset_tokens SET used = true WHERE user_id = ? AND used = false";

        try (Connection c = ConexoBD.getConnection();
             PreparedStatement ps = c.prepareStatement(sql)) {

            ps.setInt(1, userId);
            return ps.executeUpdate();

        } catch (Exception e) {
            throw new RuntimeException("Erro ao invalidar tokens antigos.", e);
        }
    }
}