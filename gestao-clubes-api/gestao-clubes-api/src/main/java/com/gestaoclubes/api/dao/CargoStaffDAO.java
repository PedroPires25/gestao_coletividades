package com.gestaoclubes.api.dao;

import com.gestaoclubes.api.model.CargoStaff;
import com.gestaoclubes.api.util.ConexoBD;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class CargoStaffDAO {

    public List<CargoStaff> listarTodos() {
        List<CargoStaff> lista = new ArrayList<>();
        String sql = "SELECT * FROM cargo_staff WHERE ativo=1 ORDER BY nome";

        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {

            while (rs.next()) {
                lista.add(new CargoStaff(
                        rs.getInt("id"),
                        rs.getString("nome"),
                        rs.getString("descricao"),
                        rs.getBoolean("ativo")
                ));
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return lista;
    }

    public boolean inserir(CargoStaff c) {
        String sql = "INSERT INTO cargo_staff (nome, descricao, ativo) VALUES (?, ?, 1)";

        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, c.getNome());
            ps.setString(2, c.getDescricao());
            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            return false;
        }
    }

    public boolean desativar(int id) {
        String sql = "UPDATE cargo_staff SET ativo=0 WHERE id=?";
        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, id);
            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            return false;
        }
    }
}
