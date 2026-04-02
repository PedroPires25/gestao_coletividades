package com.gestaoclubes.api.dao;

import com.gestaoclubes.api.model.StaffColetividadeRow;
import com.gestaoclubes.api.util.ConexoBD;
import org.springframework.stereotype.Repository;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

@Repository
public class StaffColetividadeDAO {

    public List<StaffColetividadeRow> listarPorColetividadeAtividade(int coletividadeId, int coletividadeAtividadeId) {
        List<StaffColetividadeRow> lista = new ArrayList<>();

        String sql = """
            SELECT sc.id, sc.nome, sc.email, sc.telefone, sc.morada, sc.num_registo, sc.remuneracao,
                   sca.id AS afetacao_id, sca.cargo_id, ccs.nome AS cargo_nome,
                   a.nome AS atividade_nome, sca.data_inicio, sca.data_fim, sca.observacoes
            FROM staff_coletividade_afetacao sca
            INNER JOIN staff_coletividade sc ON sc.id = sca.staff_coletividade_id
            INNER JOIN cargo_coletividade_staff ccs ON ccs.id = sca.cargo_id
            LEFT JOIN coletividade_atividade ca ON ca.id = sca.coletividade_atividade_id
            LEFT JOIN atividade a ON a.id = ca.atividade_id
            WHERE sca.coletividade_id = ?
              AND sca.coletividade_atividade_id = ?
            ORDER BY sc.nome
        """;

        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setInt(1, coletividadeId);
            ps.setInt(2, coletividadeAtividadeId);

            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    StaffColetividadeRow row = new StaffColetividadeRow();
                    row.setId(rs.getInt("id"));
                    row.setAfetacaoId(rs.getInt("afetacao_id"));
                    row.setNome(rs.getString("nome"));
                    row.setEmail(rs.getString("email"));
                    row.setTelefone(rs.getString("telefone"));
                    row.setMorada(rs.getString("morada"));
                    row.setNumRegisto(rs.getString("num_registo"));
                    row.setRemuneracao(rs.getDouble("remuneracao"));
                    row.setCargoId(rs.getInt("cargo_id"));
                    row.setCargoNome(rs.getString("cargo_nome"));
                    row.setAtividadeNome(rs.getString("atividade_nome"));
                    row.setDataInicio(rs.getString("data_inicio"));
                    row.setDataFim(rs.getString("data_fim"));
                    row.setObservacoes(rs.getString("observacoes"));
                    row.setAtivo(true);
                    lista.add(row);
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }

        return lista;
    }

    public Integer criarStaff(
            String nome,
            String email,
            String telefone,
            String morada,
            String numRegisto,
            Double remuneracao,
            Integer coletividadeId,
            Integer coletividadeAtividadeId,
            Integer cargoId,
            String dataInicio,
            String dataFim,
            String observacoes
    ) {
        Connection conn = null;
        try {
            conn = ConexoBD.getConnection();
            conn.setAutoCommit(false);

            Integer staffId = null;

            String sqlStaff = """
                INSERT INTO staff_coletividade (nome, email, telefone, morada, num_registo, remuneracao)
                VALUES (?, ?, ?, ?, ?, ?)
            """;

            try (PreparedStatement ps = conn.prepareStatement(sqlStaff, Statement.RETURN_GENERATED_KEYS)) {
                ps.setString(1, nome);
                ps.setString(2, email);
                ps.setString(3, telefone);
                ps.setString(4, morada);
                ps.setString(5, numRegisto);
                ps.setDouble(6, remuneracao == null ? 0.0 : remuneracao);
                ps.executeUpdate();

                try (ResultSet rs = ps.getGeneratedKeys()) {
                    if (rs.next()) staffId = rs.getInt(1);
                }
            }

            if (staffId == null) {
                conn.rollback();
                return null;
            }

            String sqlAfetacao = """
                INSERT INTO staff_coletividade_afetacao
                (staff_coletividade_id, coletividade_id, coletividade_atividade_id, cargo_id, data_inicio, data_fim, observacoes)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """;

            try (PreparedStatement ps = conn.prepareStatement(sqlAfetacao)) {
                ps.setInt(1, staffId);
                ps.setInt(2, coletividadeId);
                ps.setInt(3, coletividadeAtividadeId);
                ps.setInt(4, cargoId);
                ps.setString(5, dataInicio);
                ps.setString(6, dataFim);
                ps.setString(7, observacoes);
                ps.executeUpdate();
            }

            conn.commit();
            return staffId;
        } catch (Exception e) {
            e.printStackTrace();
            try {
                if (conn != null) conn.rollback();
            } catch (Exception ignored) {
            }
            return null;
        } finally {
            try {
                if (conn != null) conn.setAutoCommit(true);
            } catch (Exception ignored) {
            }
        }
    }
}