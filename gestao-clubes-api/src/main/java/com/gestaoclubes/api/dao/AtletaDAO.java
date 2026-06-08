package com.gestaoclubes.api.dao;

import com.gestaoclubes.api.model.Atleta;
import com.gestaoclubes.api.util.ConexoBD;

import java.util.logging.Logger;
import java.sql.*;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

public class AtletaDAO {

    private static final Logger LOGGER = Logger.getLogger(AtletaDAO.class.getName());

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
            LOGGER.severe(e.toString());
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
              AND a.estado_id <> 2
            ORDER BY nome
        """;

        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setInt(1, clubeId);
            ps.setInt(2, modalidadeId);

            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    lista.add(mapAthleteRow(rs));
                }
            }

        } catch (SQLException e) {
            LOGGER.severe(e.toString());
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
              AND a.estado_id <> 2
            ORDER BY nome
        """;

        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setInt(1, clubeId);
            ps.setInt(2, clubeModalidadeId);

            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    lista.add(mapAthleteRow(rs));
                }
            }

        } catch (SQLException e) {
            LOGGER.severe(e.toString());
        }

        return lista;
    }

    public List<Map<String, Object>> listarAtivosPorClube(int clubeId) {
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
              AND cm.ativo = 1
              AND acm.ativo = 1
              AND a.estado_id <> 2
            ORDER BY nome
        """;

        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setInt(1, clubeId);

            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    lista.add(mapAthleteRow(rs));
                }
            }

        } catch (SQLException e) {
            LOGGER.severe(e.toString());
        }

        return lista;
    }

    /**
     * Lists athletes in a clube_modalidade filtered to those belonging to one of the given escalão IDs.
     */
    public List<Map<String, Object>> listarPorClubeModalidadeEEscaloes(int clubeId, int clubeModalidadeId, List<Integer> escalaoIds) {
        if (escalaoIds == null || escalaoIds.isEmpty()) return new ArrayList<>();

        String placeholders = escalaoIds.stream().map(i -> "?").collect(java.util.stream.Collectors.joining(","));
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
              AND a.escalao_id IN (%s)
              AND acm.ativo = 1
              AND a.estado_id <> 2
            ORDER BY nome
        """.formatted(placeholders);

        List<Map<String, Object>> lista = new ArrayList<>();
        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            int idx = 1;
            ps.setInt(idx++, clubeId);
            ps.setInt(idx++, clubeModalidadeId);
            for (Integer eid : escalaoIds) ps.setInt(idx++, eid);

            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) lista.add(mapAthleteRow(rs));
            }
        } catch (SQLException e) {
            LOGGER.severe(e.toString());
        }
        return lista;
    }

    /**
     * Returns true if ALL given athlete IDs belong to the clube_modalidade
     * AND have one of the allowed escalão IDs.
     */
    public boolean todosPertencemClubeModalidadeEEscaloes(int clubeModalidadeId, List<Integer> escalaoIds, List<Integer> atletaIds) {
        if (atletaIds == null || atletaIds.isEmpty()) return true;
        if (escalaoIds == null || escalaoIds.isEmpty()) return false;

        Set<Integer> idsUnicos = new HashSet<>(atletaIds);

        String atletaPlaceholders = idsUnicos.stream().map(i -> "?").collect(java.util.stream.Collectors.joining(","));
        String escalaoPlaceholders = escalaoIds.stream().map(i -> "?").collect(java.util.stream.Collectors.joining(","));

        String sql = """
            SELECT COUNT(DISTINCT a.id) AS total
            FROM atleta a
            JOIN atleta_clube_modalidade acm ON acm.atleta_id = a.id
            WHERE acm.clube_modalidade_id = ?
              AND acm.ativo = 1
              AND a.escalao_id IN (%s)
              AND a.id IN (%s)
        """.formatted(escalaoPlaceholders, atletaPlaceholders);

        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            int idx = 1;
            ps.setInt(idx++, clubeModalidadeId);
            for (Integer eid : escalaoIds) ps.setInt(idx++, eid);
            for (Integer aid : idsUnicos) ps.setInt(idx++, aid);

            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) return rs.getInt("total") == idsUnicos.size();
            }
        } catch (SQLException e) {
            LOGGER.severe(e.toString());
        }
        return false;
    }

    public boolean todosPertencemClubeModalidade(int clubeModalidadeId, List<Integer> atletaIds) {
        if (atletaIds == null || atletaIds.isEmpty()) return true;

        Set<Integer> idsUnicos = new HashSet<>(atletaIds);
        if (idsUnicos.contains(null)) return false;

        StringBuilder placeholders = new StringBuilder();
        for (int i = 0; i < idsUnicos.size(); i++) {
            if (i > 0) placeholders.append(",");
            placeholders.append("?");
        }

        String sql = """
            SELECT COUNT(DISTINCT a.id) AS total
            FROM atleta a
            JOIN atleta_clube_modalidade acm ON acm.atleta_id = a.id
            WHERE acm.clube_modalidade_id = ?
              AND acm.ativo = 1
              AND a.id IN (%s)
        """.formatted(placeholders);

        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            int idx = 1;
            ps.setInt(idx++, clubeModalidadeId);
            for (Integer atletaId : idsUnicos) {
                ps.setInt(idx++, atletaId);
            }

            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return rs.getInt("total") == idsUnicos.size();
                }
            }
        } catch (SQLException e) {
            LOGGER.severe(e.toString());
        }

        return false;
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
            LOGGER.severe(e.toString());
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
            LOGGER.severe(e.toString());
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
            LOGGER.severe(e.toString());
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
            LOGGER.severe(e.toString());
        }

        return null;
    }

    public List<Map<String, Object>> listarPorClube(int clubeId) {
        List<Map<String, Object>> lista = new ArrayList<>();
        String sql = """
            SELECT DISTINCT a.id, COALESCE(u.nome, a.nome) AS nome, a.escalao_id,
                   COALESCE(u.logo_path, a.foto_path) AS foto_path
            FROM atleta a
            LEFT JOIN utilizadores u ON u.id = a.utilizador_id
            WHERE a.clube_atual_id = ?
            ORDER BY nome
        """;
        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, clubeId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("id", rs.getInt("id"));
                    row.put("nome", rs.getString("nome"));
                    row.put("escalao_id", rs.getInt("escalao_id"));
                    row.put("fotoPath", rs.getString("foto_path"));
                    lista.add(row);
                }
            }
        } catch (SQLException e) { LOGGER.severe(e.toString()); }
        return lista;
    }

    private Map<String, Object> mapAthleteRow(ResultSet rs) throws SQLException {
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
        return row;
    }

    public boolean atualizarFotoPath(int atletaId, String fotoPath) {
        String sql = "UPDATE atleta SET foto_path=? WHERE id=?";
        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, fotoPath);
            ps.setInt(2, atletaId);
            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            LOGGER.severe(e.toString());
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
            LOGGER.severe(e.toString());
            return false;
        }
    }

    public boolean atualizarEstado(int atletaId, int estadoId) {
        String sql = "UPDATE atleta SET estado_id=? WHERE id=?";
        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, estadoId);
            ps.setInt(2, atletaId);
            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            LOGGER.severe(e.toString());
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
            LOGGER.severe(e.toString());
            return false;
        }
    }

    /**
     * Retorna o email efetivo para notificações de um atleta.
     * Prioridade: email_notificacoes do utilizador ligado → email de login → email do atleta.
     */
    public String obterEmailEfetivo(int atletaId) {
        String sql = """
            SELECT COALESCE(
                NULLIF(TRIM(u.email_notificacoes), ''),
                NULLIF(TRIM(u.utilizador), ''),
                NULLIF(TRIM(a.email), '')
            ) AS email_efetivo
            FROM atleta a
            LEFT JOIN utilizadores u ON u.id = a.utilizador_id
            WHERE a.id = ?
        """;
        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, atletaId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return rs.getString("email_efetivo");
                }
            }
        } catch (SQLException e) {
            LOGGER.severe(e.toString());
        }
        return null;
    }
}