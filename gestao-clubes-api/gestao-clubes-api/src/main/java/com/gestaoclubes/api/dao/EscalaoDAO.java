package com.gestaoclubes.api.dao;

import com.gestaoclubes.api.model.Escalao;
import com.gestaoclubes.api.util.ConexoBD;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class EscalaoDAO {

    public List<Escalao> listarTodos() {
        List<Escalao> lista = new ArrayList<>();
        String sql = "SELECT id, nome FROM escalao ORDER BY nome";

        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {

            while (rs.next()) {
                lista.add(new Escalao(rs.getInt("id"), rs.getString("nome")));
            }

        } catch (SQLException e) {
            e.printStackTrace();
        }

        return lista;
    }

    public Escalao buscarPorId(int id) {
        String sql = "SELECT id, nome FROM escalao WHERE id=?";

        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setInt(1, id);
            ResultSet rs = ps.executeQuery();

            if (rs.next()) return new Escalao(rs.getInt("id"), rs.getString("nome"));

        } catch (SQLException e) {
            e.printStackTrace();
        }

        return null;
    }
}
