package com.gestaoclubes.api.dao;

import com.gestaoclubes.api.util.ConexoBD;

import java.util.logging.Logger;
import java.sql.*;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public class ExameMedicoDAO {

    private static final Logger LOGGER = Logger.getLogger(ExameMedicoDAO.class.getName());

    public List<Map<String, Object>> listarPorClube(int clubeId) {
        String sql = """
            SELECT em.*,
                   COALESCE(ua.nome, a.nome) AS atleta_nome,
                   COALESCE(us.nome, s.nome) AS staff_nome
            FROM exame_medico em
            JOIN atleta a ON a.id = em.atleta_id
            LEFT JOIN utilizadores ua ON ua.id = a.utilizador_id
            LEFT JOIN staff s ON s.id = em.staff_id
            LEFT JOIN utilizadores us ON us.id = s.utilizador_id
            WHERE em.clube_id = ?
            ORDER BY em.data_exame DESC
        """;
        return listar(sql, clubeId);
    }

    public List<Map<String, Object>> listarPorAtleta(int clubeId, int atletaId) {
        String sql = """
            SELECT em.*,
                   COALESCE(ua.nome, a.nome) AS atleta_nome,
                   COALESCE(us.nome, s.nome) AS staff_nome
            FROM exame_medico em
            JOIN atleta a ON a.id = em.atleta_id
            LEFT JOIN utilizadores ua ON ua.id = a.utilizador_id
            LEFT JOIN staff s ON s.id = em.staff_id
            LEFT JOIN utilizadores us ON us.id = s.utilizador_id
            WHERE em.clube_id = ? AND em.atleta_id = ?
            ORDER BY em.data_exame DESC
        """;
        List<Map<String, Object>> lista = new ArrayList<>();
        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, clubeId);
            ps.setInt(2, atletaId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) lista.add(mapRow(rs));
            }
        } catch (SQLException e) { LOGGER.severe(e.toString()); }
        return lista;
    }

    public Map<String, Object> buscarPorId(int id) {
        String sql = """
            SELECT em.*,
                   COALESCE(ua.nome, a.nome) AS atleta_nome,
                   COALESCE(us.nome, s.nome) AS staff_nome
            FROM exame_medico em
            JOIN atleta a ON a.id = em.atleta_id
            LEFT JOIN utilizadores ua ON ua.id = a.utilizador_id
            LEFT JOIN staff s ON s.id = em.staff_id
            LEFT JOIN utilizadores us ON us.id = s.utilizador_id
            WHERE em.id = ?
        """;
        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, id);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) return mapRow(rs);
            }
        } catch (SQLException e) { LOGGER.severe(e.toString()); }
        return null;
    }

    public int inserir(int clubeId, int atletaId, Integer staffId,
                       Date dataExame, String tipo, String resultado,
                       String ficheiroPath, String notas) {
        String sql = """
            INSERT INTO exame_medico
              (clube_id, atleta_id, staff_id, data_exame, tipo, resultado, ficheiro_path, notas)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """;
        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            ps.setInt(1, clubeId);
            ps.setInt(2, atletaId);
            setNullableInt(ps, 3, staffId);
            ps.setDate(4, dataExame);
            ps.setString(5, tipo);
            ps.setString(6, resultado);
            ps.setString(7, ficheiroPath);
            ps.setString(8, notas);
            ps.executeUpdate();
            try (ResultSet keys = ps.getGeneratedKeys()) {
                if (keys.next()) return keys.getInt(1);
            }
        } catch (SQLException e) { LOGGER.severe(e.toString()); }
        return 0;
    }

    public boolean atualizar(int id, Integer staffId, Date dataExame,
                             String tipo, String resultado, String notas) {
        String sql = """
            UPDATE exame_medico SET
              staff_id=?, data_exame=?, tipo=?, resultado=?, notas=?
            WHERE id=?
        """;
        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            setNullableInt(ps, 1, staffId);
            ps.setDate(2, dataExame);
            ps.setString(3, tipo);
            ps.setString(4, resultado);
            ps.setString(5, notas);
            ps.setInt(6, id);
            return ps.executeUpdate() > 0;
        } catch (SQLException e) { LOGGER.severe(e.toString()); return false; }
    }

    public boolean atualizarFicheiro(int id, String ficheiroPath) {
        String sql = "UPDATE exame_medico SET ficheiro_path=? WHERE id=?";
        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, ficheiroPath);
            ps.setInt(2, id);
            return ps.executeUpdate() > 0;
        } catch (SQLException e) { LOGGER.severe(e.toString()); return false; }
    }

    private List<Map<String, Object>> listar(String sql, int clubeId) {
        List<Map<String, Object>> lista = new ArrayList<>();
        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, clubeId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) lista.add(mapRow(rs));
            }
        } catch (SQLException e) { LOGGER.severe(e.toString()); }
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
        m.put("dataExame", rs.getDate("data_exame"));
        m.put("tipo", rs.getString("tipo"));
        m.put("resultado", rs.getString("resultado"));
        m.put("ficheiroPath", rs.getString("ficheiro_path"));
        m.put("notas", rs.getString("notas"));
        m.put("criadoEm", rs.getTimestamp("criado_em"));
        return m;
    }

    private void setNullableInt(PreparedStatement ps, int idx, Integer val) throws SQLException {
        if (val == null) ps.setNull(idx, Types.INTEGER);
        else ps.setInt(idx, val);
    }
}
