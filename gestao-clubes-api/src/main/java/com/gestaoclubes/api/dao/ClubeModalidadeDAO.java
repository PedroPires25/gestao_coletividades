package com.gestaoclubes.api.dao;

import com.gestaoclubes.api.model.Clube;
import com.gestaoclubes.api.model.ClubeModalidade;
import com.gestaoclubes.api.model.Modalidade;
import com.gestaoclubes.api.util.ConexoBD;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class ClubeModalidadeDAO {

    public boolean inserir(int clubeId, int modalidadeId, String epoca) {
        String sql = "INSERT INTO clube_modalidade (clube_id, modalidade_id, epoca, ativo) VALUES (?, ?, ?, 1)";

        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setInt(1, clubeId);
            ps.setInt(2, modalidadeId);
            ps.setString(3, epoca);

            return ps.executeUpdate() > 0;

        } catch (SQLException e) {
            // Pode falhar por UNIQUE (clube_id, modalidade_id, epoca)
            e.printStackTrace();
            return false;
        }
    }

    public List<ClubeModalidade> listarPorClube(int clubeId) {
        List<ClubeModalidade> lista = new ArrayList<>();

        String sql = """
            SELECT cm.id, cm.epoca, cm.ativo,
                   c.id AS clube_id, c.nome AS clube_nome,
                   m.id AS mod_id, m.nome AS mod_nome, m.descricao AS mod_desc, m.ativo AS mod_ativo
            FROM clube_modalidade cm
            JOIN clube c ON c.id = cm.clube_id
            JOIN modalidade m ON m.id = cm.modalidade_id
            WHERE cm.clube_id = ?
            ORDER BY m.nome, cm.epoca
        """;

        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setInt(1, clubeId);
            try (ResultSet rs = ps.executeQuery()) {

                while (rs.next()) {
                    Clube clube = new Clube(
                            rs.getInt("clube_id"),
                            rs.getString("clube_nome"),
                            null, null, null, null, null, null, null
                    );

                    Modalidade mod = new Modalidade(
                            rs.getInt("mod_id"),
                            rs.getString("mod_nome"),
                            rs.getString("mod_desc"),
                            rs.getBoolean("mod_ativo")
                    );

                    lista.add(new ClubeModalidade(
                            rs.getInt("id"),
                            clube,
                            mod,
                            rs.getString("epoca"),
                            rs.getBoolean("ativo")
                    ));
                }
            }

        } catch (SQLException e) {
            e.printStackTrace();
        }

        return lista;
    }

    public List<ClubeModalidade> listarAtivasPorClube(int clubeId) {
        List<ClubeModalidade> lista = new ArrayList<>();

        String sql = """
            SELECT cm.id, cm.epoca, cm.ativo,
                   c.id AS clube_id, c.nome AS clube_nome,
                   m.id AS mod_id, m.nome AS mod_nome, m.descricao AS mod_desc, m.ativo AS mod_ativo
            FROM clube_modalidade cm
            JOIN clube c ON c.id = cm.clube_id
            JOIN modalidade m ON m.id = cm.modalidade_id
            WHERE cm.clube_id = ? AND cm.ativo = 1
            ORDER BY m.nome, cm.epoca
        """;

        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setInt(1, clubeId);
            try (ResultSet rs = ps.executeQuery()) {

                while (rs.next()) {
                    Clube clube = new Clube(
                            rs.getInt("clube_id"),
                            rs.getString("clube_nome"),
                            null, null, null, null, null, null, null
                    );

                    Modalidade mod = new Modalidade(
                            rs.getInt("mod_id"),
                            rs.getString("mod_nome"),
                            rs.getString("mod_desc"),
                            rs.getBoolean("mod_ativo")
                    );

                    lista.add(new ClubeModalidade(
                            rs.getInt("id"),
                            clube,
                            mod,
                            rs.getString("epoca"),
                            rs.getBoolean("ativo")
                    ));
                }
            }

        } catch (SQLException e) {
            e.printStackTrace();
        }

        return lista;
    }

    public ClubeModalidade buscarAtivaPorClubeEModalidade(int clubeId, int modalidadeId) {
        String sql = """
            SELECT cm.id, cm.epoca, cm.ativo,
                   c.id AS clube_id, c.nome AS clube_nome,
                   m.id AS mod_id, m.nome AS mod_nome, m.descricao AS mod_desc, m.ativo AS mod_ativo
            FROM clube_modalidade cm
            JOIN clube c ON c.id = cm.clube_id
            JOIN modalidade m ON m.id = cm.modalidade_id
            WHERE cm.clube_id = ?
              AND cm.modalidade_id = ?
              AND cm.ativo = 1
            ORDER BY cm.epoca DESC, cm.id DESC
            LIMIT 1
        """;

        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setInt(1, clubeId);
            ps.setInt(2, modalidadeId);

            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    Clube clube = new Clube(
                            rs.getInt("clube_id"),
                            rs.getString("clube_nome"),
                            null, null, null, null, null, null, null
                    );

                    Modalidade mod = new Modalidade(
                            rs.getInt("mod_id"),
                            rs.getString("mod_nome"),
                            rs.getString("mod_desc"),
                            rs.getBoolean("mod_ativo")
                    );

                    return new ClubeModalidade(
                            rs.getInt("id"),
                            clube,
                            mod,
                            rs.getString("epoca"),
                            rs.getBoolean("ativo")
                    );
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }

        return null;
    }

    public boolean setAtivo(int clubeModalidadeId, boolean ativo) {
        String sql = "UPDATE clube_modalidade SET ativo=? WHERE id=?";

        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setBoolean(1, ativo);
            ps.setInt(2, clubeModalidadeId);

            return ps.executeUpdate() > 0;

        } catch (SQLException e) {
            e.printStackTrace();
            return false;
        }
    }

    public ClubeModalidade buscarPorId(int id) {
        String sql = """
            SELECT cm.id, cm.epoca, cm.ativo,
                   c.id AS clube_id, c.nome AS clube_nome,
                   m.id AS mod_id, m.nome AS mod_nome, m.descricao AS mod_desc, m.ativo AS mod_ativo
            FROM clube_modalidade cm
            JOIN clube c ON c.id = cm.clube_id
            JOIN modalidade m ON m.id = cm.modalidade_id
            WHERE cm.id = ?
        """;

        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setInt(1, id);

            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    Clube clube = new Clube(
                            rs.getInt("clube_id"),
                            rs.getString("clube_nome"),
                            null, null, null, null, null, null, null
                    );

                    Modalidade mod = new Modalidade(
                            rs.getInt("mod_id"),
                            rs.getString("mod_nome"),
                            rs.getString("mod_desc"),
                            rs.getBoolean("mod_ativo")
                    );

                    return new ClubeModalidade(
                            rs.getInt("id"),
                            clube,
                            mod,
                            rs.getString("epoca"),
                            rs.getBoolean("ativo")
                    );
                }
            }

        } catch (SQLException e) {
            e.printStackTrace();
        }

        return null;
    }

    // ============================================================
    // ATIVA/CRIA associação para uma época (UPSERT)
    // ============================================================
    public boolean ativarOuInserir(int clubeId, int modalidadeId, String epoca) {
        String sql = """
            INSERT INTO clube_modalidade (clube_id, modalidade_id, epoca, ativo)
            VALUES (?, ?, ?, 1)
            ON DUPLICATE KEY UPDATE ativo=1
        """;

        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setInt(1, clubeId);
            ps.setInt(2, modalidadeId);
            ps.setString(3, epoca);

            return ps.executeUpdate() > 0;

        } catch (SQLException e) {
            e.printStackTrace();
            return false;
        }
    }

    public List<Integer> listarModalidadeIdsPorClubeEpoca(int clubeId, String epoca) {
        List<Integer> ids = new ArrayList<>();
        String sql = """
            SELECT modalidade_id
            FROM clube_modalidade
            WHERE clube_id=? AND epoca=? AND ativo=1
        """;

        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, clubeId);
            ps.setString(2, epoca);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) ids.add(rs.getInt("modalidade_id"));
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return ids;
    }

    public boolean desativarNaoSelecionadas(int clubeId, String epoca, List<Integer> idsSelecionados) {
        StringBuilder sb = new StringBuilder();
        sb.append("UPDATE clube_modalidade SET ativo=0 WHERE clube_id=? AND epoca=? ");

        if (idsSelecionados != null && !idsSelecionados.isEmpty()) {
            sb.append("AND modalidade_id NOT IN (");
            for (int i = 0; i < idsSelecionados.size(); i++) {
                sb.append("?");
                if (i < idsSelecionados.size() - 1) sb.append(",");
            }
            sb.append(")");
        }

        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sb.toString())) {

            int idx = 1;
            ps.setInt(idx++, clubeId);
            ps.setString(idx++, epoca);

            if (idsSelecionados != null && !idsSelecionados.isEmpty()) {
                for (Integer id : idsSelecionados) ps.setInt(idx++, id);
            }

            ps.executeUpdate();
            return true;

        } catch (SQLException e) {
            e.printStackTrace();
            return false;
        }
    }

    // ============================================================
    // REMOVER associação clube-modalidade pelo ID da linha
    // ============================================================
    public boolean removerPorId(int id) {
        String sql = "DELETE FROM clube_modalidade WHERE id = ?";

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