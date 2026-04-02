package com.gestaoclubes.api.dao;

import com.gestaoclubes.api.util.ConexoBD;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;

public class PerfilDAO {

    public int obterPerfilAdmin() {
        return obterPerfilPorDescricao("ADMIN");
    }

    public int obterPerfilUtilizadorPadrao() {
        return obterPerfilPorDescricao("USER");
    }

    private int obterPerfilPorDescricao(String descricao) {

        // ✅ TABELA CERTA: perfis
        String sql = "SELECT id FROM perfis WHERE UPPER(descricao) = UPPER(?) LIMIT 1";

        try (Connection con = ConexoBD.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {

            ps.setString(1, descricao);

            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) return rs.getInt("id");
            }

        } catch (Exception e) {
            e.printStackTrace();
        }

        return -1;
    }
}
