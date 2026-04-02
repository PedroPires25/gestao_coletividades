package com.gestaoclubes.api.dao;

import com.gestaoclubes.api.util.ConexoBD;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class AtletaClubeModalidadeDAO {

    public boolean inserirInscricao(int atletaId, int clubeModalidadeId, Date dataInscricao) {
        String sql = """
            INSERT INTO atleta_clube_modalidade (atleta_id, clube_modalidade_id, data_inscricao, data_fim, ativo)
            VALUES (?, ?, ?, NULL, 1)
        """;

        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, atletaId);
            ps.setInt(2, clubeModalidadeId);
            ps.setDate(3, dataInscricao);
            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            e.printStackTrace();
            return false;
        }
    }

    public boolean desativarInscricoesAtivas(int atletaId, Date dataFim) {
        String sql = """
            UPDATE atleta_clube_modalidade
            SET ativo=0, data_fim=?
            WHERE atleta_id=? AND ativo=1
        """;

        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setDate(1, dataFim);
            ps.setInt(2, atletaId);
            return ps.executeUpdate() >= 0;
        } catch (SQLException e) {
            e.printStackTrace();
            return false;
        }
    }

    public boolean desativarInscricoesAtivas(int atletaId) {
        return desativarInscricoesAtivas(atletaId, new Date(System.currentTimeMillis()));
    }


    public boolean atualizarInscricaoAtiva(int atletaId, int clubeModalidadeId, Date dataInscricao, Date dataFim, boolean ativo) {
        String sql = """
            UPDATE atleta_clube_modalidade
            SET data_inscricao = COALESCE(?, data_inscricao),
                data_fim = ?,
                ativo = ?
            WHERE atleta_id = ? AND clube_modalidade_id = ?
        """;

        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setDate(1, dataInscricao);
            ps.setDate(2, dataFim);
            ps.setBoolean(3, ativo);
            ps.setInt(4, atletaId);
            ps.setInt(5, clubeModalidadeId);
            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            e.printStackTrace();
            return false;
        }
    }

    public List<Object[]> historicoPorAtleta(int atletaId) {
        List<Object[]> rows = new ArrayList<>();
        String sql = """
            SELECT acm.id,
                   c.nome AS clube,
                   m.nome AS modalidade,
                   cm.epoca,
                   acm.data_inscricao,
                   acm.data_fim,
                   acm.ativo
            FROM atleta_clube_modalidade acm
            JOIN clube_modalidade cm ON cm.id = acm.clube_modalidade_id
            JOIN clube c ON c.id = cm.clube_id
            JOIN modalidade m ON m.id = cm.modalidade_id
            WHERE acm.atleta_id = ?
            ORDER BY acm.data_inscricao DESC, c.nome, m.nome
        """;

        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, atletaId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    rows.add(new Object[]{
                            rs.getInt("id"),
                            rs.getString("clube"),
                            rs.getString("modalidade"),
                            rs.getString("epoca"),
                            rs.getDate("data_inscricao"),
                            rs.getDate("data_fim"),
                            rs.getInt("ativo") == 1 ? "Sim" : "Não"
                    });
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return rows;
    }
}