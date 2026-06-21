package com.gestaoclubes.api.dao;

import com.gestaoclubes.api.util.ConexoBD;

import java.util.logging.Logger;
import java.sql.*;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class StaffAfetacaoEscalaoDAO {

    private static final Logger LOGGER = Logger.getLogger(StaffAfetacaoEscalaoDAO.class.getName());

    /**
     * Returns the escalões assigned to the trainer (identified by {@code utilizadorId})
     * in the given clube + clube_modalidade, for active afetações.
     */
    public List<Integer> listarIdsEscaloesPorTreinadorNoClube(int utilizadorId, int clubeId) {
        List<Integer> ids = new ArrayList<>();
        String sql = """
            SELECT DISTINCT sae.escalao_id
            FROM staff s
            JOIN staff_afetacao sa ON sa.staff_id = s.id
            JOIN staff_afetacao_escalao sae ON sae.staff_afetacao_id = sa.id
            WHERE s.utilizador_id = ?
              AND sa.clube_id = ?
              AND (sa.data_fim IS NULL OR sa.data_fim >= CURDATE())
        """;
        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, utilizadorId);
            ps.setInt(2, clubeId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) ids.add(rs.getInt(1));
            }
        } catch (SQLException e) {
            LOGGER.severe(e.toString());
        }
        return ids;
    }

    public List<Map<String, Object>> listarEscaloesPorTreinador(int utilizadorId, int clubeId, int clubeModalidadeId) {
        List<Map<String, Object>> lista = new ArrayList<>();
        String sql = """
            SELECT DISTINCT e.id, e.nome
            FROM staff s
            JOIN staff_afetacao sa ON sa.staff_id = s.id
            JOIN staff_afetacao_escalao sae ON sae.staff_afetacao_id = sa.id
            JOIN escalao e ON e.id = sae.escalao_id
            WHERE s.utilizador_id = ?
              AND sa.clube_id = ?
              AND sa.clube_modalidade_id = ?
              AND (sa.data_fim IS NULL OR sa.data_fim >= CURDATE())
            ORDER BY e.nome
        """;

        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, utilizadorId);
            ps.setInt(2, clubeId);
            ps.setInt(3, clubeModalidadeId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    java.util.LinkedHashMap<String, Object> row = new java.util.LinkedHashMap<>();
                    row.put("id", rs.getInt("id"));
                    row.put("nome", rs.getString("nome"));
                    lista.add(row);
                }
            }
        } catch (SQLException e) {
            LOGGER.severe(e.toString());
        }

        return lista;
    }

    public List<Integer> listarIdsPorAfetacao(int afetacaoId) {
        List<Integer> ids = new ArrayList<>();
        String sql = "SELECT escalao_id FROM staff_afetacao_escalao WHERE staff_afetacao_id=?";

        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, afetacaoId);
            ResultSet rs = ps.executeQuery();
            while (rs.next()) ids.add(rs.getInt(1));
        } catch (SQLException e) {
            LOGGER.severe(e.toString());
        }

        return ids;
    }

    public void substituirTodos(int afetacaoId, List<Integer> escalaoIds) {
        String del = "DELETE FROM staff_afetacao_escalao WHERE staff_afetacao_id=?";
        String ins = "INSERT INTO staff_afetacao_escalao (staff_afetacao_id, escalao_id) VALUES (?, ?)";

        try (Connection conn = ConexoBD.getConnection()) {
            conn.setAutoCommit(false);

            try (PreparedStatement psDel = conn.prepareStatement(del)) {
                psDel.setInt(1, afetacaoId);
                psDel.executeUpdate();
            }

            if (escalaoIds != null && !escalaoIds.isEmpty()) {
                try (PreparedStatement psIns = conn.prepareStatement(ins)) {
                    for (Integer eid : escalaoIds) {
                        psIns.setInt(1, afetacaoId);
                        psIns.setInt(2, eid);
                        psIns.addBatch();
                    }
                    psIns.executeBatch();
                }
            }

            conn.commit();
        } catch (SQLException e) {
            LOGGER.severe(e.toString());
        }
    }
}
