package com.gestaoclubes.api.dao;

import com.gestaoclubes.api.model.Modalidade;
import com.gestaoclubes.api.util.ConexoBD;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class ModalidadeDAO {

    // Lista apenas modalidades ativas (para combobox, associação a clubes, etc.)
    public List<Modalidade> listarAtivas() {
        List<Modalidade> lista = new ArrayList<>();
        String sql = "SELECT id, nome, descricao, ativo FROM modalidade WHERE ativo=1 ORDER BY nome";

        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {

            while (rs.next()) {
                lista.add(new Modalidade(
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

    // Lista todas (ativas e inativas) para gestão/admin
    public List<Modalidade> listarTodas() {
        List<Modalidade> lista = new ArrayList<>();
        String sql = "SELECT id, nome, descricao, ativo FROM modalidade ORDER BY nome";

        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {

            while (rs.next()) {
                lista.add(new Modalidade(
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

    // ✅ INSERIR devolvendo ID gerado
    public int inserir(Modalidade m) {
        String sql = "INSERT INTO modalidade (nome, descricao, ativo) VALUES (?, ?, 1)";

        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {

            ps.setString(1, m.getNome());
            ps.setString(2, m.getDescricao());

            int affected = ps.executeUpdate();
            if (affected == 0) return -1;

            try (ResultSet keys = ps.getGeneratedKeys()) {
                if (keys.next()) {
                    return keys.getInt(1);
                }
            }

            return -1;

        } catch (SQLException e) {
            e.printStackTrace();
            return -1;
        }
    }

    public Modalidade buscarPorId(int id) {
        String sql = "SELECT id, nome, descricao, ativo FROM modalidade WHERE id=?";

        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setInt(1, id);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return new Modalidade(
                            rs.getInt("id"),
                            rs.getString("nome"),
                            rs.getString("descricao"),
                            rs.getBoolean("ativo")
                    );
                }
            }

        } catch (SQLException e) {
            e.printStackTrace();
        }

        return null;
    }

    public boolean atualizar(int id, Modalidade m) {
        String sql = "UPDATE modalidade SET nome=?, descricao=? WHERE id=?";

        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setString(1, m.getNome());
            ps.setString(2, m.getDescricao());
            ps.setInt(3, id);
            return ps.executeUpdate() > 0;

        } catch (SQLException e) {
            e.printStackTrace();
            return false;
        }
    }

    public boolean setAtivo(Integer id, boolean ativo) {
        String sql = "UPDATE modalidade SET ativo=? WHERE id=?";

        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setBoolean(1, ativo);
            ps.setInt(2, id);
            return ps.executeUpdate() > 0;

        } catch (SQLException e) {
            e.printStackTrace();
            return false;
        }
    }

    // Verifica se modalidade está associada a algum clube (clube_modalidade)
    public boolean estaAssociadaAClubes(Integer modalidadeId) {
        String sql = "SELECT COUNT(*) FROM clube_modalidade WHERE modalidade_id=?";

        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setInt(1, modalidadeId);
            try (ResultSet rs = ps.executeQuery()) {
                rs.next();
                return rs.getInt(1) > 0;
            }

        } catch (SQLException e) {
            // em caso de erro, assume "sim" para impedir remoção por segurança
            e.printStackTrace();
            return true;
        }
    }

    // Apagar "protegido": só apaga se não estiver associada
    public boolean removerSeNaoAssociada(Integer id) {
        if (estaAssociadaAClubes(id)) return false;

        String sql = "DELETE FROM modalidade WHERE id=?";

        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setInt(1, id);
            return ps.executeUpdate() > 0;

        } catch (SQLException e) {
            e.printStackTrace();
            return false;
        }
    }
}