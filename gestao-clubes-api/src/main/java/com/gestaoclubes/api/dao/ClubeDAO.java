package com.gestaoclubes.api.dao;

import com.gestaoclubes.api.model.Clube;
import com.gestaoclubes.api.util.ConexoBD;

import java.util.logging.Logger;
import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class ClubeDAO {

    private static final Logger LOGGER = Logger.getLogger(ClubeDAO.class.getName());

    private Date toSql(java.util.Date d) {
        return (d == null) ? null : new Date(d.getTime());
    }

    public boolean inserir(Clube c) {
        String sql = "INSERT INTO clube (nome, nif, email, telefone, morada, codigo_postal, localidade, data_fundacao, logo_path) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
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
            ps.setString(9, c.getLogoPath());

            return ps.executeUpdate() > 0;

        } catch (SQLException e) {
            LOGGER.severe(e.toString());
            return false;
        }
    }

    public List<Clube> listarTodos() {
        List<Clube> lista = new ArrayList<>();
        String sql = "SELECT * FROM clube ORDER BY nome";

        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {

            while (rs.next()) {
                Clube clube = new Clube(
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
                clube.setLogoPath(rs.getString("logo_path"));
                lista.add(clube);
            }

        } catch (SQLException e) {
            LOGGER.severe(e.toString());
        }

        return lista;
    }

    public Clube buscarPorId(int id) {
        String sql = "SELECT * FROM clube WHERE id=?";

        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setInt(1, id);

            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    Clube clube = new Clube(
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
                    clube.setLogoPath(rs.getString("logo_path"));
                    return clube;
                }
            }

        } catch (SQLException e) {
            LOGGER.severe(e.toString());
        }

        return null;
    }

    public boolean atualizar(int id, Clube c) {
        String sql = "UPDATE clube SET nome=?, nif=?, email=?, telefone=?, morada=?, codigo_postal=?, localidade=?, data_fundacao=?, logo_path=? WHERE id=?";

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
            ps.setString(9, c.getLogoPath());
            ps.setInt(10, id);

            return ps.executeUpdate() > 0;

        } catch (SQLException e) {
            LOGGER.severe(e.toString());
            return false;
        }
    }

    public boolean remover(int id) {
        String sql = "DELETE FROM clube WHERE id=?";

        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setInt(1, id);
            return ps.executeUpdate() > 0;

        } catch (SQLException e) {
            return false;
        }
    }

    public boolean atualizarLogoPath(int id, String logoPath) {
        String sql = "UPDATE clube SET logo_path=? WHERE id=?";

        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setString(1, logoPath);
            ps.setInt(2, id);
            return ps.executeUpdate() > 0;

        } catch (SQLException e) {
            LOGGER.severe(e.toString());
            return false;
        }
    }

    public List<Clube> pesquisarPorNome(String nome) {
        List<Clube> lista = new ArrayList<>();
        String sql = "SELECT * FROM clube WHERE nome LIKE ? ORDER BY nome LIMIT 20";

        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setString(1, "%" + nome.trim() + "%");

            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    Clube clube = new Clube(
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
                    clube.setLogoPath(rs.getString("logo_path"));
                    lista.add(clube);
                }
            }

        } catch (SQLException e) {
            LOGGER.severe(e.toString());
        }

        return lista;
    }
}