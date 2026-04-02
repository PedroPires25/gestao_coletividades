package com.gestaoclubes.api.dao;

import com.gestaoclubes.api.model.Coletividade;
import com.gestaoclubes.api.util.ConexoBD;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class ColetividadeDAO {

    private Date toSql(java.util.Date d) {
        return (d == null) ? null : new Date(d.getTime());
    }

    public boolean inserir(Coletividade c) {
        String sql = "INSERT INTO coletividade (nome, nif, email, telefone, morada, codigo_postal, localidade, data_fundacao) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setString(1, c.getNome());
            ps.setString(2, c.getNif());
            ps.setString(3, c.getEmail());
            ps.setString(4, c.getTelefone());
            ps.setString(5, c.getMorada());
            ps.setString(6, c.getCodigoPostal());
            ps.setString(7, c.getLocalidade());
            ps.setDate(8, toSql(c.getDataFundacao()));

            return ps.executeUpdate() > 0;

        } catch (SQLException e) {
            e.printStackTrace();
            return false;
        }
    }

    public List<Coletividade> listarTodos() {
        List<Coletividade> lista = new ArrayList<>();
        String sql = "SELECT * FROM coletividade ORDER BY nome";

        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {

            while (rs.next()) {
                lista.add(new Coletividade(
                        rs.getInt("id"),
                        rs.getString("nome"),
                        rs.getString("nif"),
                        rs.getString("email"),
                        rs.getString("telefone"),
                        rs.getString("morada"),
                        rs.getString("codigo_postal"),
                        rs.getString("localidade"),
                        rs.getDate("data_fundacao")
                ));
            }

        } catch (SQLException e) {
            e.printStackTrace();
        }

        return lista;
    }

    public Coletividade buscarPorId(int id) {
        String sql = "SELECT * FROM coletividade WHERE id=?";

        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setInt(1, id);

            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return new Coletividade(
                            rs.getInt("id"),
                            rs.getString("nome"),
                            rs.getString("nif"),
                            rs.getString("email"),
                            rs.getString("telefone"),
                            rs.getString("morada"),
                            rs.getString("codigo_postal"),
                            rs.getString("localidade"),
                            rs.getDate("data_fundacao")
                    );
                }
            }

        } catch (SQLException e) {
            e.printStackTrace();
        }

        return null;
    }

    public boolean atualizar(int id, Coletividade c) {
        String sql = "UPDATE coletividade SET nome=?, nif=?, email=?, telefone=?, morada=?, codigo_postal=?, localidade=?, data_fundacao=? WHERE id=?";

        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setString(1, c.getNome());
            ps.setString(2, c.getNif());
            ps.setString(3, c.getEmail());
            ps.setString(4, c.getTelefone());
            ps.setString(5, c.getMorada());
            ps.setString(6, c.getCodigoPostal());
            ps.setString(7, c.getLocalidade());
            ps.setDate(8, toSql(c.getDataFundacao()));
            ps.setInt(9, id);

            return ps.executeUpdate() > 0;

        } catch (SQLException e) {
            e.printStackTrace();
            return false;
        }
    }

    public boolean remover(int id) {
        String sql = "DELETE FROM coletividade WHERE id=?";

        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setInt(1, id);
            return ps.executeUpdate() > 0;

        } catch (SQLException e) {
            return false;
        }
    }
}
