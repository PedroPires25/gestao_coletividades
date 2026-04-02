package com.gestaoclubes.api.dao;

import com.gestaoclubes.api.util.ConexoBD;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class TransferenciaAtletaDAO {

    public boolean inserir(int atletaId, int clubeOrigemId, int clubeDestinoId, Date data, String obs) {
        String sql = """
            INSERT INTO transferencia_atleta
            (atleta_id, clube_origem_id, clube_destino_id, data_transferencia, observacoes)
            VALUES (?, ?, ?, ?, ?)
        """;

        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, atletaId);
            ps.setInt(2, clubeOrigemId);
            ps.setInt(3, clubeDestinoId);
            ps.setDate(4, data);
            ps.setString(5, obs);
            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            return false;
        }
    }

    public List<Object[]> listarPorClube(int clubeId) {
        List<Object[]> rows = new ArrayList<>();
        String sql = """
            SELECT t.id, a.nome AS atleta, co.nome AS origem, cd.nome AS destino,
                   t.data_transferencia, t.observacoes
            FROM transferencia_atleta t
            JOIN atleta a ON a.id = t.atleta_id
            JOIN clube co ON co.id = t.clube_origem_id
            JOIN clube cd ON cd.id = t.clube_destino_id
            WHERE t.clube_origem_id=? OR t.clube_destino_id=?
            ORDER BY t.data_transferencia DESC, a.nome
        """;

        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, clubeId);
            ps.setInt(2, clubeId);
            ResultSet rs = ps.executeQuery();
            while (rs.next()) {
                rows.add(new Object[]{
                        rs.getInt("id"),
                        rs.getString("atleta"),
                        rs.getString("origem"),
                        rs.getString("destino"),
                        rs.getDate("data_transferencia"),
                        rs.getString("observacoes")
                });
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return rows;
    }
}
