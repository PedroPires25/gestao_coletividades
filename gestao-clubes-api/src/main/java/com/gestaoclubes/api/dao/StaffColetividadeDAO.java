package com.gestaoclubes.api.dao;

import com.gestaoclubes.api.model.StaffColetividadeRow;
import com.gestaoclubes.api.util.ConexoBD;
import org.springframework.stereotype.Repository;

import java.util.logging.Logger;
import java.sql.*;
import java.util.ArrayList;
import java.util.List;
import java.util.logging.Logger;

@Repository
public class StaffColetividadeDAO {

    private static final Logger LOGGER = Logger.getLogger(StaffColetividadeDAO.class.getName());

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
            LOGGER.severe(e.toString());
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
                setNullableString(ps, 2, email);
                setNullableString(ps, 3, telefone);
                setNullableString(ps, 4, morada);
                setNullableString(ps, 5, numRegisto);
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
                if (coletividadeAtividadeId == null) ps.setNull(3, Types.INTEGER);
                else ps.setInt(3, coletividadeAtividadeId);
                ps.setInt(4, cargoId);
                setNullableString(ps, 5, dataInicio);
                setNullableString(ps, 6, dataFim);
                setNullableString(ps, 7, observacoes);
                ps.executeUpdate();
            }

            conn.commit();
            return staffId;
        } catch (Exception e) {
            LOGGER.severe("criarStaff falhou: " + e.getMessage()
                    + (e.getCause() != null ? " | Causa: " + e.getCause().getMessage() : ""));
            if (e instanceof SQLException sqle && sqle.getNextException() != null) {
                LOGGER.severe("SQL nextException: " + sqle.getNextException().getMessage());
            }
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

    public boolean atualizarStaff(
            int staffId,
            String nome,
            String email,
            String telefone,
            String morada,
            String numRegisto,
            Double remuneracao,
            Integer afetacaoId,
            String dataInicio,
            String dataFim,
            String observacoes
    ) {
        Connection conn = null;
        try {
            conn = ConexoBD.getConnection();
            conn.setAutoCommit(false);

            String sqlStaff = """
                UPDATE staff_coletividade
                SET nome = ?, email = ?, telefone = ?, morada = ?, num_registo = ?, remuneracao = ?
                WHERE id = ?
            """;

            try (PreparedStatement ps = conn.prepareStatement(sqlStaff)) {
                ps.setString(1, nome);
                setNullableString(ps, 2, email);
                setNullableString(ps, 3, telefone);
                setNullableString(ps, 4, morada);
                setNullableString(ps, 5, numRegisto);
                ps.setDouble(6, remuneracao == null ? 0.0 : remuneracao);
                ps.setInt(7, staffId);
                ps.executeUpdate();
            }

            if (afetacaoId != null) {
                String sqlAfetacao = """
                    UPDATE staff_coletividade_afetacao
                    SET data_inicio = ?, data_fim = ?, observacoes = ?
                    WHERE id = ? AND staff_coletividade_id = ?
                """;

                try (PreparedStatement ps = conn.prepareStatement(sqlAfetacao)) {
                    setNullableString(ps, 1, dataInicio);
                    setNullableString(ps, 2, dataFim);
                    setNullableString(ps, 3, observacoes);
                    ps.setInt(4, afetacaoId);
                    ps.setInt(5, staffId);
                    ps.executeUpdate();
                }
            }

            conn.commit();
            return true;
        } catch (Exception e) {
            LOGGER.severe(e.toString());
            try {
                if (conn != null) conn.rollback();
            } catch (Exception ignored) {
            }
            return false;
        } finally {
            try {
                if (conn != null) conn.setAutoCommit(true);
            } catch (Exception ignored) {
            }
        }
    }

    /**
     * Devolve o id da afetação ativa de staff na coletividade (independentemente da atividade).
     * Usado para detetar se o staff já existe e deve ser atualizado em vez de criado.
     */
    public Integer buscarAfetacaoIdPorEmailEColetividade(String email, int coletividadeId) {
        String sql = """
            SELECT sca.id
            FROM staff_coletividade_afetacao sca
            INNER JOIN staff_coletividade sc ON sc.id = sca.staff_coletividade_id
            WHERE LOWER(sc.email) = LOWER(?)
              AND sca.coletividade_id = ?
              AND (sca.data_fim IS NULL OR sca.data_fim >= CURDATE())
            ORDER BY sca.id DESC
            LIMIT 1
        """;

        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, email.trim());
            ps.setInt(2, coletividadeId);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next() ? rs.getInt("id") : null;
            }
        } catch (Exception e) {
            LOGGER.severe("buscarAfetacaoIdPorEmailEColetividade: " + e.getMessage());
            return null;
        }
    }

    /**
     * Atualiza apenas o coletividade_atividade_id de uma afetação existente.
     */
    public boolean atualizarColetividadeAtividade(int afetacaoId, Integer coletividadeAtividadeId) {
        String sql = "UPDATE staff_coletividade_afetacao SET coletividade_atividade_id = ? WHERE id = ?";
        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            if (coletividadeAtividadeId == null) ps.setNull(1, Types.INTEGER);
            else ps.setInt(1, coletividadeAtividadeId);
            ps.setInt(2, afetacaoId);
            return ps.executeUpdate() > 0;
        } catch (Exception e) {
            LOGGER.severe("atualizarColetividadeAtividade: " + e.getMessage());
            return false;
        }
    }

    public boolean removerAfetacao(int afetacaoId) {
        String sql = "DELETE FROM staff_coletividade_afetacao WHERE id = ?";
        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, afetacaoId);
            return ps.executeUpdate() > 0;
        } catch (Exception e) {
            LOGGER.severe(e.toString());
            return false;
        }
    }

    public boolean staffPertenceColetividade(int coletividadeId, int staffId) {
        String sql = """
            SELECT 1
            FROM staff_coletividade_afetacao
            WHERE coletividade_id = ?
              AND staff_coletividade_id = ?
            LIMIT 1
        """;

        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, coletividadeId);
            ps.setInt(2, staffId);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next();
            }
        } catch (Exception e) {
            LOGGER.severe(e.toString());
            return false;
        }
    }

    public boolean afetacaoPertenceAoStaff(int coletividadeId, int staffId, int afetacaoId) {
        String sql = """
            SELECT 1
            FROM staff_coletividade_afetacao
            WHERE id = ?
              AND staff_coletividade_id = ?
              AND coletividade_id = ?
        """;

        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, afetacaoId);
            ps.setInt(2, staffId);
            ps.setInt(3, coletividadeId);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next();
            }
        } catch (Exception e) {
            LOGGER.severe(e.toString());
            return false;
        }
    }

    private void setNullableString(PreparedStatement ps, int index, String value) throws SQLException {
        if (value == null || value.isBlank()) ps.setNull(index, Types.VARCHAR);
        else ps.setString(index, value);
    }

    /**
     * Devolve os nomes das atividades atribuídas ao staff (por e-mail) numa coletividade.
     * Suporta múltiplas afetações ativas.
     */
    public List<String> listarNomesAtividadesPorEmailEColetividade(String email, int coletividadeId) {
        List<String> nomes = new ArrayList<>();
        if (email == null || email.isBlank()) return nomes;

        String sql = """
            SELECT DISTINCT a.nome
            FROM staff_coletividade_afetacao sca
            INNER JOIN staff_coletividade sc ON sc.id = sca.staff_coletividade_id
            LEFT JOIN coletividade_atividade ca ON ca.id = sca.coletividade_atividade_id
            LEFT JOIN atividade a ON a.id = ca.atividade_id
            WHERE LOWER(sc.email) = LOWER(?)
              AND sca.coletividade_id = ?
              AND (sca.data_fim IS NULL OR sca.data_fim >= CURDATE())
              AND a.nome IS NOT NULL
            ORDER BY a.nome
        """;

        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, email.trim());
            ps.setInt(2, coletividadeId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    nomes.add(rs.getString("nome"));
                }
            }
        } catch (Exception e) {
            LOGGER.severe("listarNomesAtividadesPorEmailEColetividade (staff): " + e.getMessage());
        }

        return nomes;
    }
}