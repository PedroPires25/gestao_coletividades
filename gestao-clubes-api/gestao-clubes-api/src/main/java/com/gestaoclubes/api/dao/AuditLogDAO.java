package com.gestaoclubes.api.dao;

import com.gestaoclubes.api.util.ConexoBD;

import java.sql.Connection;
import java.sql.PreparedStatement;

public class AuditLogDAO {

    public boolean inserir(int adminUserId,
                           String acao,
                           String tabela,
                           Integer registoId,
                           String antesJson,
                           String depoisJson) {

        String sql = "INSERT INTO audit_log (admin_user_id, acao, tabela, registo_id, antes_json, depois_json) " +
                "VALUES (?, ?, ?, ?, ?, ?)";

        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setInt(1, adminUserId);
            ps.setString(2, acao);
            ps.setString(3, tabela);

            if (registoId == null) ps.setNull(4, java.sql.Types.INTEGER);
            else ps.setInt(4, registoId);

            if (antesJson == null) ps.setNull(5, java.sql.Types.VARCHAR);
            else ps.setString(5, antesJson);

            if (depoisJson == null) ps.setNull(6, java.sql.Types.VARCHAR);
            else ps.setString(6, depoisJson);

            return ps.executeUpdate() == 1;

        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }
}