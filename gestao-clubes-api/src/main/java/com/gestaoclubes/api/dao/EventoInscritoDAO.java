package com.gestaoclubes.api.dao;

import com.gestaoclubes.api.util.ConexoBD;

import java.sql.*;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public class EventoInscritoDAO {

    public List<Map<String, Object>> listarPorEvento(int eventoId) {
        List<Map<String, Object>> lista = new ArrayList<>();
        String sql = """
            SELECT i.id, COALESCE(u.nome, i.nome) AS nome, i.email, i.data_nascimento,
                   ei.evento_id
            FROM evento_inscrito ei
            INNER JOIN inscrito i ON i.id = ei.inscrito_id
            LEFT JOIN utilizadores u ON u.id = i.utilizador_id
            WHERE ei.evento_id = ?
            ORDER BY nome
        """;

        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setInt(1, eventoId);

            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("id", rs.getInt("id"));
                    row.put("nome", rs.getString("nome"));
                    row.put("email", rs.getString("email"));
                    row.put("dataNascimento", rs.getDate("data_nascimento"));
                    lista.add(row);
                }
            }

        } catch (SQLException e) {
            e.printStackTrace();
        }

        return lista;
    }

    public boolean inserirMultiplos(int eventoId, List<Integer> inscritoIds) {
        if (inscritoIds == null || inscritoIds.isEmpty()) return true;

        String sql = "INSERT IGNORE INTO evento_inscrito (evento_id, inscrito_id) VALUES (?, ?)";

        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            for (int inscritoId : inscritoIds) {
                ps.setInt(1, eventoId);
                ps.setInt(2, inscritoId);
                ps.addBatch();
            }

            ps.executeBatch();
            return true;

        } catch (SQLException e) {
            e.printStackTrace();
            return false;
        }
    }

    public boolean removerTodos(int eventoId) {
        String sql = "DELETE FROM evento_inscrito WHERE evento_id = ?";
        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, eventoId);
            ps.executeUpdate();
            return true;
        } catch (SQLException e) {
            e.printStackTrace();
            return false;
        }
    }
}
