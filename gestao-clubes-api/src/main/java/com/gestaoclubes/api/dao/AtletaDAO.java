package com.gestaoclubes.api.dao;

import com.gestaoclubes.api.model.Atleta;
import com.gestaoclubes.api.util.ConexoBD;

import java.sql.*;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public class AtletaDAO {

    private Date toSql(java.util.Date d) {
        return d == null ? null : new Date(d.getTime());
    }

    public List<Object[]> listarCompleto() {
        List<Object[]> rows = new ArrayList<>();
        String sql = """
            SELECT a.id, COALESCE(u.nome, a.nome) AS nome, a.data_nascimento, a.email, a.telefone,
                   c.nome AS clube_atual, ea.descricao AS estado,
                   e.nome AS escalao, a.remuneracao
            FROM atleta a
            LEFT JOIN utilizadores u ON u.id = a.utilizador_id
            JOIN clube c ON c.id = a.clube_atual_id
            JOIN estado_atleta ea ON ea.id = a.estado_id
            JOIN escalao e ON e.id = a.escalao_id
            ORDER BY nome
        """;

        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {

            while (rs.next()) {
                rows.add(new Object[]{
                        rs.getInt("id"),
                        rs.getString("nome"),
                        rs.getDate("data_nascimento"),
                        rs.getString("email"),
                        rs.getString("telefone"),
                        rs.getString("clube_atual"),
                        rs.getString("estado"),
                        rs.getString("escalao"),
                        rs.getBigDecimal("remuneracao")
                });
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return rows;
    }

    public List<Map<String, Object>> listarPorClubeEModalidade(int clubeId, int modalidadeId) {
        List<Map<String, Object>> lista = new ArrayList<>();
        String sql = """
            SELECT a.id,
                   COALESCE(u.nome, a.nome) AS nome,
                   a.data_nascimento,
                   a.email,
                   a.telefone,
                   a.morada,
                   a.remuneracao,
                   a.clube_atual_id,
                   COALESCE(u.logo_path, a.foto_path) AS foto_path,
                   ea.id AS estado_id,
                   ea.descricao AS estado,
                   e.id AS escalao_id,
                   e.nome AS escalao,
                   cm.id AS clube_modalidade_id,
                   cm.epoca,
                   acm.data_inscricao,
                   acm.data_fim,
                   acm.ativo
            FROM atleta a
            LEFT JOIN utilizadores u ON u.id = a.utilizador_id
            JOIN atleta_clube_modalidade acm ON acm.atleta_id = a.id
            JOIN clube_modalidade cm ON cm.id = acm.clube_modalidade_id
            JOIN estado_atleta ea ON ea.id = a.estado_id
            JOIN escalao e ON e.id = a.escalao_id
            WHERE cm.clube_id = ?
              AND cm.modalidade_id = ?
              AND cm.ativo = 1
              AND acm.ativo = 1
            ORDER BY nome
        """;

        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setInt(1, clubeId);
            ps.setInt(2, modalidadeId);

            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("id", rs.getInt("id"));
                    row.put("nome", rs.getString("nome"));
                    row.put("dataNascimento", rs.getDate("data_nascimento"));
                    row.put("email", rs.getString("email"));
                    row.put("telefone", rs.getString("telefone"));
                    row.put("morada", rs.getString("morada"));
                    row.put("remuneracao", rs.getBigDecimal("remuneracao"));
                    row.put("clubeAtualId", rs.getInt("clube_atual_id"));
                    row.put("estadoId", rs.getInt("estado_id"));
                    row.put("estado", rs.getString("estado"));
                    row.put("escalaoId", rs.getInt("escalao_id"));
                    row.put("escalao", rs.getString("escalao"));
                    row.put("clubeModalidadeId", rs.getInt("clube_modalidade_id"));
                    row.put("epoca", rs.getString("epoca"));
                    row.put("dataInscricao", rs.getDate("data_inscricao"));
                    row.put("dataFim", rs.getDate("data_fim"));
                    row.put("ativo", rs.getBoolean("ativo"));
                    row.put("fotoPath", rs.getString("foto_path"));
                    lista.add(row);
                }
            }

        } catch (SQLException e) {
            e.printStackTrace();
        }

        return lista;
    }

    public List<Map<String, Object>> listarPorClubeModalidade(int clubeId, int clubeModalidadeId) {
        List<Map<String, Object>> lista = new ArrayList<>();
        String sql = """
            SELECT a.id,
                   COALESCE(u.nome, a.nome) AS nome,
                   a.data_nascimento,
                   a.email,
                   a.telefone,
                   a.morada,
                   a.remuneracao,
                   a.clube_atual_id,
                   COALESCE(u.logo_path, a.foto_path) AS foto_path,
                   ea.id AS estado_id,
                   ea.descricao AS estado,
                   e.id AS escalao_id,
                   e.nome AS escalao,
                   cm.id AS clube_modalidade_id,
                   cm.epoca,
                   acm.data_inscricao,
                   acm.data_fim,
                   acm.ativo
            FROM atleta a
            LEFT JOIN utilizadores u ON u.id = a.utilizador_id
            JOIN atleta_clube_modalidade acm ON acm.atleta_id = a.id
            JOIN clube_modalidade cm ON cm.id = acm.clube_modalidade_id
            JOIN estado_atleta ea ON ea.id = a.estado_id
            JOIN escalao e ON e.id = a.escalao_id
            WHERE cm.clube_id = ?
              AND cm.id = ?
            ORDER BY nome
        """;

        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setInt(1, clubeId);
            ps.setInt(2, clubeModalidadeId);

            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("id", rs.getInt("id"));
                    row.put("nome", rs.getString("nome"));
                    row.put("dataNascimento", rs.getDate("data_nascimento"));
                    row.put("email", rs.getString("email"));
                    row.put("telefone", rs.getString("telefone"));
                    row.put("morada", rs.getString("morada"));
                    row.put("remuneracao", rs.getBigDecimal("remuneracao"));
                    row.put("clubeAtualId", rs.getInt("clube_atual_id"));
                    row.put("estadoId", rs.getInt("estado_id"));
                    row.put("estado", rs.getString("estado"));
                    row.put("escalaoId", rs.getInt("escalao_id"));
                    row.put("escalao", rs.getString("escalao"));
                    row.put("clubeModalidadeId", rs.getInt("clube_modalidade_id"));
                    row.put("epoca", rs.getString("epoca"));
                    row.put("dataInscricao", rs.getDate("data_inscricao"));
                    row.put("dataFim", rs.getDate("data_fim"));
                    row.put("ativo", rs.getBoolean("ativo"));
                    row.put("fotoPath", rs.getString("foto_path"));
                    lista.add(row);
                }
            }

        } catch (SQLException e) {
            e.printStackTrace();
        }

        return lista;
    }

    public Integer inserirEDevolverId(Atleta a) {
        String sql = """
            INSERT INTO atleta (nome, data_nascimento, email, telefone, morada,
                               clube_atual_id, estado_id, escalao_id, remuneracao, utilizador_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """;

        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {

            ps.setString(1, a.getNome());
            ps.setDate(2, toSql(a.getDataNascimento()));
            ps.setString(3, a.getEmail());
            ps.setString(4, a.getTelefone());
            ps.setString(5, a.getMorada());
            ps.setInt(6, a.getClubeAtualId());
            ps.setInt(7, a.getEstadoId());
            ps.setInt(8, a.getEscalaoId());
            ps.setBigDecimal(9, java.math.BigDecimal.valueOf(a.getRemuneracao()));
            if (a.getUtilizadorId() != null) {
                ps.setInt(10, a.getUtilizadorId());
            } else {
                ps.setNull(10, Types.INTEGER);
            }

            int updated = ps.executeUpdate();
            if (updated <= 0) return null;

            try (ResultSet keys = ps.getGeneratedKeys()) {
                if (keys.next()) return keys.getInt(1);
            }

        } catch (SQLException e) {
            e.printStackTrace();
            return null;
        }
        return null;
    }

    public boolean atualizar(int id, Atleta a) {
        String sql = """
            UPDATE atleta
            SET nome=?, data_nascimento=?, email=?, telefone=?, morada=?,
                estado_id=?, escalao_id=?, remuneracao=?
            WHERE id=?
        """;

        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setString(1, a.getNome());
            ps.setDate(2, toSql(a.getDataNascimento()));
            ps.setString(3, a.getEmail());
            ps.setString(4, a.getTelefone());
            ps.setString(5, a.getMorada());
            ps.setInt(6, a.getEstadoId());
            ps.setInt(7, a.getEscalaoId());
            ps.setBigDecimal(8, java.math.BigDecimal.valueOf(a.getRemuneracao()));
            ps.setInt(9, id);

            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            e.printStackTrace();
            return false;
        }
    }

    public Atleta buscarPorId(int id) {
        String sql = """
            SELECT a.*, COALESCE(u.nome, a.nome) AS nome_efetivo,
                   COALESCE(u.logo_path, a.foto_path) AS foto_efetiva
            FROM atleta a
            LEFT JOIN utilizadores u ON u.id = a.utilizador_id
            WHERE a.id=?
        """;
        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setInt(1, id);

            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    Atleta a = new Atleta(
                            rs.getInt("id"),
                            rs.getString("nome_efetivo"),
                            rs.getDate("data_nascimento"),
                            rs.getString("email"),
                            rs.getString("telefone"),
                            rs.getString("morada"),
                            rs.getInt("clube_atual_id"),
                            rs.getInt("estado_id"),
                            rs.getInt("escalao_id"),
                            rs.getBigDecimal("remuneracao").doubleValue()
                    );
                    a.setFotoPath(rs.getString("foto_efetiva"));
                    try { a.setUtilizadorId((Integer) rs.getObject("utilizador_id")); } catch (SQLException ignored) {}
                    return a;
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return null;
    }

    public Atleta buscarPorEmail(String email) {
        if (email == null || email.isBlank()) return null;

        String sql = """
            SELECT a.*, COALESCE(u.nome, a.nome) AS nome_efetivo,
                   COALESCE(u.logo_path, a.foto_path) AS foto_efetiva
            FROM atleta a
            LEFT JOIN utilizadores u ON u.id = a.utilizador_id
            WHERE LOWER(a.email) = LOWER(?)
            LIMIT 1
        """;

        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setString(1, email.trim());

            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    Atleta a = new Atleta(
                            rs.getInt("id"),
                            rs.getString("nome_efetivo"),
                            rs.getDate("data_nascimento"),
                            rs.getString("email"),
                            rs.getString("telefone"),
                            rs.getString("morada"),
                            rs.getInt("clube_atual_id"),
                            rs.getInt("estado_id"),
                            rs.getInt("escalao_id"),
                            rs.getBigDecimal("remuneracao").doubleValue()
                    );
                    a.setFotoPath(rs.getString("foto_efetiva"));
                    try { a.setUtilizadorId((Integer) rs.getObject("utilizador_id")); } catch (SQLException ignored) {}
                    return a;
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }

        return null;
    }

    public boolean atualizarFotoPath(int atletaId, String fotoPath) {
        String sql = "UPDATE atleta SET foto_path=? WHERE id=?";
        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, fotoPath);
            ps.setInt(2, atletaId);
            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            e.printStackTrace();
            return false;
        }
    }

    public boolean atualizarClubeAtual(int atletaId, int novoClubeId) {
        String sql = "UPDATE atleta SET clube_atual_id=? WHERE id=?";
        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, novoClubeId);
            ps.setInt(2, atletaId);
            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            e.printStackTrace();
            return false;
        }
    }

    public boolean remover(int id) {
        String sql = "DELETE FROM atleta WHERE id=?";
        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, id);
            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            e.printStackTrace();
            return false;
        }
    }
}