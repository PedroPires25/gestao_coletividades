package com.gestaoclubes.api.dao;

import com.gestaoclubes.api.util.ConexoBD;

import java.sql.*;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public class RelatorioMedicoDAO {

    public List<Map<String, Object>> listarPorClube(int clubeId) {
        String sql = """
            SELECT rm.*,
                   COALESCE(ua.nome, a.nome) AS atleta_nome,
                   COALESCE(us.nome, s.nome) AS staff_nome
            FROM relatorio_medico rm
            JOIN atleta a ON a.id = rm.atleta_id
            LEFT JOIN utilizadores ua ON ua.id = a.utilizador_id
            LEFT JOIN staff s ON s.id = rm.staff_id
            LEFT JOIN utilizadores us ON us.id = s.utilizador_id
            WHERE rm.clube_id = ?
            ORDER BY rm.data_relatorio DESC
        """;
        return listar(sql, clubeId);
    }

    public List<Map<String, Object>> listarPorAtleta(int clubeId, int atletaId) {
        String sql = """
            SELECT rm.*,
                   COALESCE(ua.nome, a.nome) AS atleta_nome,
                   COALESCE(us.nome, s.nome) AS staff_nome
            FROM relatorio_medico rm
            JOIN atleta a ON a.id = rm.atleta_id
            LEFT JOIN utilizadores ua ON ua.id = a.utilizador_id
            LEFT JOIN staff s ON s.id = rm.staff_id
            LEFT JOIN utilizadores us ON us.id = s.utilizador_id
            WHERE rm.clube_id = ? AND rm.atleta_id = ?
            ORDER BY rm.data_relatorio DESC
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
            SELECT rm.*,
                   COALESCE(ua.nome, a.nome) AS atleta_nome,
                   COALESCE(us.nome, s.nome) AS staff_nome
            FROM relatorio_medico rm
            JOIN atleta a ON a.id = rm.atleta_id
            LEFT JOIN utilizadores ua ON ua.id = a.utilizador_id
            LEFT JOIN staff s ON s.id = rm.staff_id
            LEFT JOIN utilizadores us ON us.id = s.utilizador_id
            WHERE rm.id = ?
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

    public int inserir(int clubeId, int atletaId, Integer staffId,
                       Date dataRelatorio, String tipo, String conteudo, boolean confidencial) {
        String sql = """
            INSERT INTO relatorio_medico
              (clube_id, atleta_id, staff_id, data_relatorio, tipo, conteudo, confidencial)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """;
        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            ps.setInt(1, clubeId);
            ps.setInt(2, atletaId);
            setNullableInt(ps, 3, staffId);
            ps.setDate(4, dataRelatorio);
            ps.setString(5, tipo);
            ps.setString(6, conteudo);
            ps.setBoolean(7, confidencial);
            ps.executeUpdate();
            try (ResultSet keys = ps.getGeneratedKeys()) {
                if (keys.next()) return keys.getInt(1);
            }
        } catch (SQLException e) { e.printStackTrace(); }
        return 0;
    }

    public boolean atualizar(int id, Integer staffId, Date dataRelatorio,
                             String tipo, String conteudo, boolean confidencial) {
        String sql = """
            UPDATE relatorio_medico SET
              staff_id=?, data_relatorio=?, tipo=?, conteudo=?, confidencial=?
            WHERE id=?
        """;
        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            setNullableInt(ps, 1, staffId);
            ps.setDate(2, dataRelatorio);
            ps.setString(3, tipo);
            ps.setString(4, conteudo);
            ps.setBoolean(5, confidencial);
            ps.setInt(6, id);
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
        m.put("dataRelatorio", rs.getDate("data_relatorio"));
        m.put("tipo", rs.getString("tipo"));
        m.put("conteudo", rs.getString("conteudo"));
        m.put("confidencial", rs.getBoolean("confidencial"));
        m.put("criadoEm", rs.getTimestamp("criado_em"));
        return m;
    }

    private void setNullableInt(PreparedStatement ps, int idx, Integer val) throws SQLException {
        if (val == null) ps.setNull(idx, Types.INTEGER);
        else ps.setInt(idx, val);
    }
}
