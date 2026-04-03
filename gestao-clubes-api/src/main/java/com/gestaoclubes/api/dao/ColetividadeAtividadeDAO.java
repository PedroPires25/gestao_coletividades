package com.gestaoclubes.api.dao;

import com.gestaoclubes.api.model.Atividade;
import com.gestaoclubes.api.model.ColetividadeAtividade;
import com.gestaoclubes.api.util.ConexoBD;
import org.springframework.stereotype.Repository;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;

@Repository
public class ColetividadeAtividadeDAO {

    public List<ColetividadeAtividade> listarPorColetividade(int coletividadeId, boolean apenasAtivas, String ano) {
        List<ColetividadeAtividade> lista = new ArrayList<>();

        StringBuilder sql = new StringBuilder("""
            SELECT
                ca.id,
                ca.coletividade_id,
                ca.atividade_id,
                ca.ano,
                ca.ativo,
                a.id AS a_id,
                a.nome AS a_nome,
                a.descricao AS a_descricao,
                a.ativo AS a_ativo
            FROM coletividade_atividade ca
            INNER JOIN atividade a ON a.id = ca.atividade_id
            WHERE ca.coletividade_id = ?
        """);

        if (apenasAtivas) {
            sql.append(" AND ca.ativo = 1 AND a.ativo = 1 ");
        }

        if (ano != null && !ano.isBlank()) {
            sql.append(" AND ca.ano = ? ");
        }

        sql.append(" ORDER BY a.nome ");

        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql.toString())) {

            ps.setInt(1, coletividadeId);

            if (ano != null && !ano.isBlank()) {
                ps.setString(2, ano);
            }

            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    ColetividadeAtividade row = new ColetividadeAtividade();
                    row.setId(rs.getInt("id"));
                    row.setColetividadeId(rs.getInt("coletividade_id"));
                    row.setAtividadeId(rs.getInt("atividade_id"));
                    row.setAno(rs.getString("ano"));
                    row.setAtivo(rs.getBoolean("ativo"));

                    Atividade atividade = new Atividade();
                    atividade.setId(rs.getInt("a_id"));
                    atividade.setNome(rs.getString("a_nome"));
                    atividade.setDescricao(rs.getString("a_descricao"));
                    atividade.setAtivo(rs.getBoolean("a_ativo"));

                    row.setAtividade(atividade);
                    lista.add(row);
                }
            }

        } catch (Exception e) {
            e.printStackTrace();
        }

        return lista;
    }

    public Integer criarAssociacao(int coletividadeId, int atividadeId, String ano) {
        String sql = """
            INSERT INTO coletividade_atividade (coletividade_id, atividade_id, ano, ativo)
            VALUES (?, ?, ?, 1)
        """;

        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {

            ps.setInt(1, coletividadeId);
            ps.setInt(2, atividadeId);
            ps.setString(3, ano);
            ps.executeUpdate();

            try (ResultSet rs = ps.getGeneratedKeys()) {
                if (rs.next()) return rs.getInt(1);
            }

        } catch (Exception e) {
            e.printStackTrace();
        }

        return null;
    }

    public boolean removerAssociacao(int id) {
        String sql = "DELETE FROM coletividade_atividade WHERE id = ?";

        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setInt(1, id);
            return ps.executeUpdate() > 0;

        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

    public ColetividadeAtividade obterPorId(int id) {
        String sql = """
            SELECT
                ca.id,
                ca.coletividade_id,
                ca.atividade_id,
                ca.ano,
                ca.ativo,
                a.id AS a_id,
                a.nome AS a_nome,
                a.descricao AS a_descricao,
                a.ativo AS a_ativo
            FROM coletividade_atividade ca
            INNER JOIN atividade a ON a.id = ca.atividade_id
            WHERE ca.id = ?
        """;

        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setInt(1, id);

            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    ColetividadeAtividade row = new ColetividadeAtividade();
                    row.setId(rs.getInt("id"));
                    row.setColetividadeId(rs.getInt("coletividade_id"));
                    row.setAtividadeId(rs.getInt("atividade_id"));
                    row.setAno(rs.getString("ano"));
                    row.setAtivo(rs.getBoolean("ativo"));

                    Atividade atividade = new Atividade();
                    atividade.setId(rs.getInt("a_id"));
                    atividade.setNome(rs.getString("a_nome"));
                    atividade.setDescricao(rs.getString("a_descricao"));
                    atividade.setAtivo(rs.getBoolean("a_ativo"));

                    row.setAtividade(atividade);
                    return row;
                }
            }

        } catch (Exception e) {
            e.printStackTrace();
        }

        return null;
    }

    /**
     * Busca a associação ativa entre uma coletividade e atividade.
     * Retorna a ColetividadeAtividade com o ID da associação (não o ID da atividade).
     * 
     * @param coletividadeId ID da coletividade
     * @param atividadeId ID da atividade
     * @return ColetividadeAtividade com o ID da associação, ou null se não encontrada
     */
    public ColetividadeAtividade buscarAtivaPorColetividadeEAtividade(int coletividadeId, int atividadeId) {
        String sql = """
            SELECT
                ca.id,
                ca.coletividade_id,
                ca.atividade_id,
                ca.ano,
                ca.ativo,
                a.id AS a_id,
                a.nome AS a_nome,
                a.descricao AS a_descricao,
                a.ativo AS a_ativo
            FROM coletividade_atividade ca
            INNER JOIN atividade a ON a.id = ca.atividade_id
            WHERE ca.coletividade_id = ?
              AND ca.atividade_id = ?
              AND ca.ativo = 1
            ORDER BY ca.ano DESC, ca.id DESC
            LIMIT 1
        """;

        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setInt(1, coletividadeId);
            ps.setInt(2, atividadeId);

            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    ColetividadeAtividade row = new ColetividadeAtividade();
                    row.setId(rs.getInt("id"));
                    row.setColetividadeId(rs.getInt("coletividade_id"));
                    row.setAtividadeId(rs.getInt("atividade_id"));
                    row.setAno(rs.getString("ano"));
                    row.setAtivo(rs.getBoolean("ativo"));

                    Atividade atividade = new Atividade();
                    atividade.setId(rs.getInt("a_id"));
                    atividade.setNome(rs.getString("a_nome"));
                    atividade.setDescricao(rs.getString("a_descricao"));
                    atividade.setAtivo(rs.getBoolean("a_ativo"));

                    row.setAtividade(atividade);
                    return row;
                }
            }

        } catch (Exception e) {
            e.printStackTrace();
        }

        return null;
    }
}