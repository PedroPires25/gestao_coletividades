package com.gestaoclubes.api.dao;

import com.gestaoclubes.api.util.ConexoBD;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class StaffAfetacaoEscalaoDAO {

    public List<Integer> listarIdsPorAfetacao(int afetacaoId) {
        List<Integer> ids = new ArrayList<>();
        String sql = "SELECT escalao_id FROM staff_afetacao_escalao WHERE staff_afetacao_id=?";

        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, afetacaoId);
            ResultSet rs = ps.executeQuery();
            while (rs.next()) ids.add(rs.getInt(1));
        } catch (SQLException e) {
            e.printStackTrace();
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
            e.printStackTrace();
        }
    }
}
