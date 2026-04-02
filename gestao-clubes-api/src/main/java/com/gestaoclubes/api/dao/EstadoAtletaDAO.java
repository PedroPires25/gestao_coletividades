package com.gestaoclubes.api.dao;

import com.gestaoclubes.api.model.EstadoAtleta;
import com.gestaoclubes.api.util.ConexoBD;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class EstadoAtletaDAO {

    public List<EstadoAtleta> listarTodos() {
        List<EstadoAtleta> lista = new ArrayList<>();
        String sql = "SELECT * FROM estado_atleta ORDER BY id";

        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {

            while (rs.next()) {
                lista.add(new EstadoAtleta(rs.getInt("id"), rs.getString("descricao")));
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return lista;
    }
}
