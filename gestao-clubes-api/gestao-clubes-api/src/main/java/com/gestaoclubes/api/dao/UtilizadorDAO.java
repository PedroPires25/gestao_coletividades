package com.gestaoclubes.api.dao;

import com.gestaoclubes.api.model.Utilizador;
import com.gestaoclubes.api.util.ConexoBD;
import com.gestaoclubes.api.util.PasswordUtil;
import com.gestaoclubes.api.util.PasswordPolicyUtil;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

public class UtilizadorDAO {

    public Utilizador autenticar(String email, String palavraChave) {

        String sql = "SELECT id, utilizador, palavra_chave, perfil_id, ativo " +
                "FROM utilizadores " +
                "WHERE utilizador = ? AND ativo = 1";

        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setString(1, email);

            try (ResultSet rs = stmt.executeQuery()) {
                if (!rs.next()) {
                    return null;
                }

                String hash = rs.getString("palavra_chave");
                boolean ok = PasswordUtil.verificarPassword(palavraChave, hash);

                if (!ok) return null;

                Utilizador u = new Utilizador();
                u.setId(rs.getInt("id"));
                u.setUtilizador(rs.getString("utilizador"));
                u.setPerfilId(rs.getInt("perfil_id"));
                u.setAtivo(rs.getInt("ativo") == 1);
                u.setPalavraChave(null);

                return u;
            }

        } catch (SQLException e) {
            System.err.println("Erro ao autenticar utilizador: " + e.getMessage());
            e.printStackTrace();
            return null;
        }
    }

    public boolean existeEmail(String email) {
        String sql = "SELECT COUNT(*) FROM utilizadores WHERE utilizador = ?";

        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setString(1, email);

            try (ResultSet rs = stmt.executeQuery()) {
                return rs.next() && rs.getInt(1) > 0;
            }

        } catch (SQLException e) {
            System.err.println("Erro ao verificar email: " + e.getMessage());
            e.printStackTrace();
            return false;
        }
    }

    public boolean inserir(String email, String palavraChave) {

        if (email == null || email.trim().isEmpty()) return false;
        if (palavraChave == null || palavraChave.isEmpty()) return false;
        if (existeEmail(email)) return false;

        // 🔐 VALIDAÇÃO FORTE DA PASSWORD
        if (!PasswordPolicyUtil.isValid(palavraChave)) {
            throw new IllegalArgumentException(
                    String.join(" ", PasswordPolicyUtil.getValidationErrors(palavraChave))
            );
        }

        int perfilUserId = new PerfilDAO().obterPerfilUtilizadorPadrao();
        if (perfilUserId <= 0) return false;

        String hash = PasswordUtil.hashPassword(palavraChave);

        String sql = "INSERT INTO utilizadores (utilizador, palavra_chave, perfil_id, ativo) " +
                "VALUES (?, ?, ?, 1)";

        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setString(1, email.trim());
            stmt.setString(2, hash);
            stmt.setInt(3, perfilUserId);

            return stmt.executeUpdate() == 1;

        } catch (SQLException e) {
            e.printStackTrace();
            return false;
        }
    }

    public List<Utilizador> listarTodos() {
        List<Utilizador> lista = new ArrayList<>();
        String sql = "SELECT id, utilizador, perfil_id, ativo FROM utilizadores ORDER BY utilizador";

        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {

            while (rs.next()) {
                Utilizador u = new Utilizador();
                u.setId(rs.getInt("id"));
                u.setUtilizador(rs.getString("utilizador"));
                u.setPerfilId(rs.getInt("perfil_id"));
                u.setAtivo(rs.getInt("ativo") == 1);
                u.setPalavraChave(null);
                lista.add(u);
            }

        } catch (SQLException e) {
            e.printStackTrace();
        }

        return lista;
    }

    public Utilizador buscarPorId(int id) {
        String sql = "SELECT id, utilizador, perfil_id, ativo FROM utilizadores WHERE id=?";

        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setInt(1, id);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    Utilizador u = new Utilizador();
                    u.setId(rs.getInt("id"));
                    u.setUtilizador(rs.getString("utilizador"));
                    u.setPerfilId(rs.getInt("perfil_id"));
                    u.setAtivo(rs.getInt("ativo") == 1);
                    u.setPalavraChave(null);
                    return u;
                }
            }

        } catch (SQLException e) {
            e.printStackTrace();
        }

        return null;
    }

    public Utilizador buscarPorEmail(String email) {
        String sql = "SELECT id, utilizador, perfil_id, ativo FROM utilizadores WHERE utilizador = ?";

        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setString(1, email);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    Utilizador u = new Utilizador();
                    u.setId(rs.getInt("id"));
                    u.setUtilizador(rs.getString("utilizador"));
                    u.setPerfilId(rs.getInt("perfil_id"));
                    u.setAtivo(rs.getInt("ativo") == 1);
                    u.setPalavraChave(null);
                    return u;
                }
            }

        } catch (SQLException e) {
            System.err.println("Erro ao buscar utilizador por email: " + e.getMessage());
            e.printStackTrace();
        }

        return null;
    }

    public boolean atualizarPerfil(int userId, int novoPerfilId) {
        String sql = "UPDATE utilizadores SET perfil_id=? WHERE id=?";

        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setInt(1, novoPerfilId);
            ps.setInt(2, userId);
            return ps.executeUpdate() > 0;

        } catch (SQLException e) {
            e.printStackTrace();
            return false;
        }
    }

    public boolean atualizarAtivo(int userId, boolean ativo) {
        String sql = "UPDATE utilizadores SET ativo=? WHERE id=?";

        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setBoolean(1, ativo);
            ps.setInt(2, userId);
            return ps.executeUpdate() > 0;

        } catch (SQLException e) {
            e.printStackTrace();
            return false;
        }
    }

    public boolean atualizarPassword(Integer userId, String novaPasswordEmTexto) {

        // 🔐 VALIDAÇÃO FORTE DA PASSWORD (também aqui!)
        if (!PasswordPolicyUtil.isValid(novaPasswordEmTexto)) {
            throw new IllegalArgumentException(
                    String.join(" ", PasswordPolicyUtil.getValidationErrors(novaPasswordEmTexto))
            );
        }

        String sql = "UPDATE utilizadores SET palavra_chave = ? WHERE id = ?";

        try (Connection c = ConexoBD.getConnection();
             PreparedStatement ps = c.prepareStatement(sql)) {

            String hash = PasswordUtil.hashPassword(novaPasswordEmTexto);
            ps.setString(1, hash);
            ps.setInt(2, userId);

            return ps.executeUpdate() > 0;

        } catch (Exception e) {
            throw new RuntimeException("Erro ao atualizar palavra-passe.", e);
        }
    }
}