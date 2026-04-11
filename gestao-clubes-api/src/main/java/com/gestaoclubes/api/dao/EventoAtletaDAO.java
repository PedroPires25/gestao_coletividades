package com.gestaoclubes.api.dao;

import com.gestaoclubes.api.model.EventoAtleta;
import com.gestaoclubes.api.util.ConexoBD;

import java.sql.*;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public class EventoAtletaDAO {

    public List<Map<String, Object>> listarPorEvento(int eventoId) {
        List<Map<String, Object>> lista = new ArrayList<>();
        String sql = """
            SELECT a.id, COALESCE(u.nome, a.nome) AS nome, a.data_nascimento, a.email, a.telefone, a.morada, a.remuneracao,
                   a.clube_atual_id, COALESCE(u.logo_path, a.foto_path) AS foto_path, ea.id AS estado_id, ea.descricao AS estado,
                   e.id AS escalao_id, e.nome AS escalao
            FROM evento_atleta evt_a
            JOIN atleta a ON a.id = evt_a.atleta_id
            LEFT JOIN utilizadores u ON u.id = a.utilizador_id
            JOIN estado_atleta ea ON ea.id = a.estado_id
            JOIN escalao e ON e.id = a.escalao_id
            WHERE evt_a.evento_id = ?
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
                    row.put("dataNascimento", rs.getDate("data_nascimento"));
                    row.put("email", rs.getString("email"));
                    row.put("telefone", rs.getString("telefone"));
                    row.put("morada", rs.getString("morada"));
                    row.put("remuneracao", rs.getBigDecimal("remuneracao"));
                    row.put("clubeAtualId", rs.getInt("clube_atual_id"));
                    row.put("fotoPath", rs.getString("foto_path"));
                    row.put("estadoId", rs.getInt("estado_id"));
                    row.put("estado", rs.getString("estado"));
                    row.put("escalaoId", rs.getInt("escalao_id"));
                    row.put("escalao", rs.getString("escalao"));
                    lista.add(row);
                }
            }

        } catch (SQLException e) {
            e.printStackTrace();
        }

        return lista;
    }

    public boolean inserirAtleta(int eventoId, int atletaId) {
        String sql = "INSERT INTO evento_atleta (evento_id, atleta_id) VALUES (?, ?)";

        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setInt(1, eventoId);
            ps.setInt(2, atletaId);

            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            e.printStackTrace();
            return false;
        }
    }

    public boolean inserirMultiplos(int eventoId, List<Integer> atletaIds) {
        String sql = "INSERT INTO evento_atleta (evento_id, atleta_id) VALUES (?, ?)";

        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            for (Integer atletaId : atletaIds) {
                ps.setInt(1, eventoId);
                ps.setInt(2, atletaId);
                ps.addBatch();
            }

            int[] results = ps.executeBatch();
            return results.length == atletaIds.size();
        } catch (SQLException e) {
            e.printStackTrace();
            return false;
        }
    }

    public boolean removerAtleta(int eventoId, int atletaId) {
        String sql = "DELETE FROM evento_atleta WHERE evento_id = ? AND atleta_id = ?";

        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setInt(1, eventoId);
            ps.setInt(2, atletaId);

            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            e.printStackTrace();
            return false;
        }
    }

    public boolean removerTodos(int eventoId) {
        String sql = "DELETE FROM evento_atleta WHERE evento_id = ?";

        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setInt(1, eventoId);

            return ps.executeUpdate() >= 0;
        } catch (SQLException e) {
            e.printStackTrace();
            return false;
        }
    }

    public boolean atletaConvocado(int eventoId, int atletaId) {
        String sql = "SELECT COUNT(*) as count FROM evento_atleta WHERE evento_id = ? AND atleta_id = ?";

        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setInt(1, eventoId);
            ps.setInt(2, atletaId);

            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return rs.getInt("count") > 0;
                }
            }

        } catch (SQLException e) {
            e.printStackTrace();
        }

        return false;
    }

    public Integer buscarAtletaIdPorEmail(String email) {
        String sql = "SELECT a.id FROM atleta a WHERE a.email = ? LIMIT 1";

        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setString(1, email);

            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return rs.getInt("id");
                }
            }

        } catch (SQLException e) {
            e.printStackTrace();
        }

        return null;
    }
}
