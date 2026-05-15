package com.gestaoclubes.api.dao;

import com.gestaoclubes.api.util.ConexoBD;

import java.sql.*;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public class PrescricaoDAO {

    public List<Map<String, Object>> listarPorClube(int clubeId) {
        String sql = """
            SELECT p.*,
                   COALESCE(ua.nome, a.nome) AS atleta_nome,
                   COALESCE(us.nome, s.nome) AS staff_nome
            FROM prescricao p
            JOIN atleta a ON a.id = p.atleta_id
            LEFT JOIN utilizadores ua ON ua.id = a.utilizador_id
            LEFT JOIN staff s ON s.id = p.staff_id
            LEFT JOIN utilizadores us ON us.id = s.utilizador_id
            WHERE p.clube_id = ?
            ORDER BY p.criado_em DESC
        """;
        return listar(sql, clubeId);
    }

    public List<Map<String, Object>> listarPorAtleta(int clubeId, int atletaId) {
        String sql = """
            SELECT p.*,
                   COALESCE(ua.nome, a.nome) AS atleta_nome,
                   COALESCE(us.nome, s.nome) AS staff_nome
            FROM prescricao p
            JOIN atleta a ON a.id = p.atleta_id
            LEFT JOIN utilizadores ua ON ua.id = a.utilizador_id
            LEFT JOIN staff s ON s.id = p.staff_id
            LEFT JOIN utilizadores us ON us.id = s.utilizador_id
            WHERE p.clube_id = ? AND p.atleta_id = ?
            ORDER BY p.criado_em DESC
        """;
        List<Map<String, Object>> lista = new ArrayList<>();
        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, clubeId);
            ps.setInt(2, atletaId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) lista.add(mapRow(rs));
            }
        } catch (SQLException e) { e.printStackTrace(); }
        return lista;
    }

    public Map<String, Object> buscarPorId(int id) {
        String sql = """
            SELECT p.*,
                   COALESCE(ua.nome, a.nome) AS atleta_nome,
                   COALESCE(us.nome, s.nome) AS staff_nome
            FROM prescricao p
            JOIN atleta a ON a.id = p.atleta_id
            LEFT JOIN utilizadores ua ON ua.id = a.utilizador_id
            LEFT JOIN staff s ON s.id = p.staff_id
            LEFT JOIN utilizadores us ON us.id = s.utilizador_id
            WHERE p.id = ?
        """;
        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, id);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) return mapRow(rs);
            }
        } catch (SQLException e) { e.printStackTrace(); }
        return null;
    }

    public int inserir(int clubeId, int atletaId, Integer staffId, Integer consultaId,
                       String medicamento, String dosagem, String frequencia,
                       Date dataInicio, Date dataFim, String notas) {
        String sql = """
            INSERT INTO prescricao
              (clube_id, atleta_id, staff_id, consulta_id, medicamento, dosagem,
               frequencia, data_inicio, data_fim, notas)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """;
        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            ps.setInt(1, clubeId);
            ps.setInt(2, atletaId);
            setNullableInt(ps, 3, staffId);
            setNullableInt(ps, 4, consultaId);
            ps.setString(5, medicamento);
            ps.setString(6, dosagem);
            ps.setString(7, frequencia);
            ps.setDate(8, dataInicio);
            ps.setDate(9, dataFim);
            ps.setString(10, notas);
            ps.executeUpdate();
            try (ResultSet keys = ps.getGeneratedKeys()) {
                if (keys.next()) return keys.getInt(1);
            }
        } catch (SQLException e) { e.printStackTrace(); }
        return 0;
    }

    public boolean atualizar(int id, Integer staffId, Integer consultaId,
                             String medicamento, String dosagem, String frequencia,
                             Date dataInicio, Date dataFim, String notas) {
        String sql = """
            UPDATE prescricao SET
              staff_id=?, consulta_id=?, medicamento=?, dosagem=?,
              frequencia=?, data_inicio=?, data_fim=?, notas=?
            WHERE id=?
        """;
        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            setNullableInt(ps, 1, staffId);
            setNullableInt(ps, 2, consultaId);
            ps.setString(3, medicamento);
            ps.setString(4, dosagem);
            ps.setString(5, frequencia);
            ps.setDate(6, dataInicio);
            ps.setDate(7, dataFim);
            ps.setString(8, notas);
            ps.setInt(9, id);
            return ps.executeUpdate() > 0;
        } catch (SQLException e) { e.printStackTrace(); return false; }
    }

    private List<Map<String, Object>> listar(String sql, int clubeId) {
        List<Map<String, Object>> lista = new ArrayList<>();
        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, clubeId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) lista.add(mapRow(rs));
            }
        } catch (SQLException e) { e.printStackTrace(); }
        return lista;
    }

    private Map<String, Object> mapRow(ResultSet rs) throws SQLException {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", rs.getInt("id"));
        m.put("clubeId", rs.getInt("clube_id"));
        m.put("atletaId", rs.getInt("atleta_id"));
        m.put("atletaNome", rs.getString("atleta_nome"));
        m.put("staffId", rs.getObject("staff_id"));
        m.put("staffNome", rs.getString("staff_nome"));
        m.put("consultaId", rs.getObject("consulta_id"));
        m.put("medicamento", rs.getString("medicamento"));
        m.put("dosagem", rs.getString("dosagem"));
        m.put("frequencia", rs.getString("frequencia"));
        m.put("dataInicio", rs.getDate("data_inicio"));
        m.put("dataFim", rs.getDate("data_fim"));
        m.put("notas", rs.getString("notas"));
        m.put("criadoEm", rs.getTimestamp("criado_em"));
        return m;
    }

    private void setNullableInt(PreparedStatement ps, int idx, Integer val) throws SQLException {
        if (val == null) ps.setNull(idx, Types.INTEGER);
        else ps.setInt(idx, val);
    }
}
