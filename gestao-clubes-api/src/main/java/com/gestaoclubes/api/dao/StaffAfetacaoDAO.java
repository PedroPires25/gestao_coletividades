package com.gestaoclubes.api.dao;

import com.gestaoclubes.api.util.ConexoBD;

import java.sql.Connection;
import java.sql.Date;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.sql.Types;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public class StaffAfetacaoDAO {

    public boolean inserirPorIds(int staffId, int clubeId, Integer clubeModalidadeId, int cargoId,
                                 java.util.Date dataInicio, java.util.Date dataFim, String observacoes) {
        return inserirPorIdsRetornarId(staffId, clubeId, clubeModalidadeId, cargoId, dataInicio, dataFim, observacoes, dataFim == null) > 0;
    }

    public int inserirPorIdsRetornarId(int staffId, int clubeId, Integer clubeModalidadeId, int cargoId,
                                       java.util.Date dataInicio, java.util.Date dataFim, String observacoes,
                                       boolean ativo) {
        String sql = """
            INSERT INTO staff_afetacao
            (staff_id, clube_id, clube_modalidade_id, cargo_id, data_inicio, data_fim, observacoes)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """;

        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {

            ps.setInt(1, staffId);
            ps.setInt(2, clubeId);

            if (clubeModalidadeId == null) ps.setNull(3, Types.INTEGER);
            else ps.setInt(3, clubeModalidadeId);

            ps.setInt(4, cargoId);

            if (dataInicio == null) ps.setNull(5, Types.DATE);
            else ps.setDate(5, new java.sql.Date(dataInicio.getTime()));

            if (!ativo && dataFim == null) {
                ps.setDate(6, new java.sql.Date(System.currentTimeMillis()));
            } else if (dataFim == null) {
                ps.setNull(6, Types.DATE);
            } else {
                ps.setDate(6, new java.sql.Date(dataFim.getTime()));
            }

            ps.setString(7, observacoes == null ? "" : observacoes);

            int rows = ps.executeUpdate();
            if (rows == 0) return 0;

            try (ResultSet rs = ps.getGeneratedKeys()) {
                if (rs.next()) return rs.getInt(1);
            }
            return 0;

        } catch (SQLException e) {
            e.printStackTrace();
            return 0;
        }
    }

    public List<Object[]> listarPorStaff(int staffId) {
        List<Object[]> rows = new ArrayList<>();

        String sql = """
            SELECT sa.id,
                   c.nome AS clube_nome,
                   cs.nome AS cargo_nome,
                   m.nome AS modalidade_nome,
                   sa.data_inicio, sa.data_fim, sa.observacoes
            FROM staff_afetacao sa
            JOIN clube c ON c.id = sa.clube_id
            JOIN cargo_staff cs ON cs.id = sa.cargo_id
            LEFT JOIN clube_modalidade cm ON cm.id = sa.clube_modalidade_id
            LEFT JOIN modalidade m ON m.id = cm.modalidade_id
            WHERE sa.staff_id = ?
            ORDER BY sa.data_fim IS NULL DESC, sa.data_inicio DESC, c.nome, cs.nome
        """;

        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setInt(1, staffId);
            ResultSet rs = ps.executeQuery();

            while (rs.next()) {
                rows.add(new Object[]{
                        rs.getInt("id"),
                        rs.getString("clube_nome"),
                        rs.getString("cargo_nome"),
                        rs.getString("modalidade_nome"),
                        rs.getDate("data_inicio"),
                        rs.getDate("data_fim"),
                        rs.getString("observacoes")
                });
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }

        return rows;
    }

    public List<Map<String, Object>> listarPorStaffDetalhado(int staffId) {
        List<Map<String, Object>> lista = new ArrayList<>();
        String sql = """
            SELECT sa.id,
                   sa.staff_id,
                   sa.clube_id,
                   sa.clube_modalidade_id,
                   sa.cargo_id,
                   sa.data_inicio,
                   sa.data_fim,
                   sa.observacoes,
                   c.nome AS clube_nome,
                   cs.nome AS cargo_nome,
                   m.nome AS modalidade_nome,
                   cm.epoca
            FROM staff_afetacao sa
            JOIN clube c ON c.id = sa.clube_id
            JOIN cargo_staff cs ON cs.id = sa.cargo_id
            LEFT JOIN clube_modalidade cm ON cm.id = sa.clube_modalidade_id
            LEFT JOIN modalidade m ON m.id = cm.modalidade_id
            WHERE sa.staff_id = ?
            ORDER BY sa.data_fim IS NULL DESC, sa.data_inicio DESC, sa.id DESC
        """;

        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, staffId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("id", rs.getInt("id"));
                    row.put("staffId", rs.getInt("staff_id"));
                    row.put("clubeId", rs.getInt("clube_id"));
                    int cmId = rs.getInt("clube_modalidade_id");
                    row.put("clubeModalidadeId", rs.wasNull() ? null : cmId);
                    row.put("cargoId", rs.getInt("cargo_id"));
                    row.put("cargo", rs.getString("cargo_nome"));
                    row.put("clube", rs.getString("clube_nome"));
                    row.put("modalidade", rs.getString("modalidade_nome"));
                    row.put("epoca", rs.getString("epoca"));
                    row.put("dataInicio", formatDate(rs.getDate("data_inicio")));
                    row.put("dataFim", formatDate(rs.getDate("data_fim")));
                    row.put("observacoes", rs.getString("observacoes"));
                    row.put("ativo", rs.getDate("data_fim") == null || !rs.getDate("data_fim").before(new Date(System.currentTimeMillis())));
                    lista.add(row);
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }

        return lista;
    }

    public Map<String, Object> buscarDetalhePorId(int afetacaoId) {
        String sql = """
            SELECT sa.id,
                   sa.staff_id,
                   sa.clube_id,
                   sa.clube_modalidade_id,
                   sa.cargo_id,
                   sa.data_inicio,
                   sa.data_fim,
                   sa.observacoes
            FROM staff_afetacao sa
            WHERE sa.id = ?
        """;

        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, afetacaoId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("id", rs.getInt("id"));
                    row.put("staffId", rs.getInt("staff_id"));
                    row.put("clubeId", rs.getInt("clube_id"));
                    int cmId = rs.getInt("clube_modalidade_id");
                    row.put("clubeModalidadeId", rs.wasNull() ? null : cmId);
                    row.put("cargoId", rs.getInt("cargo_id"));
                    row.put("dataInicio", rs.getDate("data_inicio"));
                    row.put("dataFim", rs.getDate("data_fim"));
                    row.put("observacoes", rs.getString("observacoes"));
                    row.put("ativo", rs.getDate("data_fim") == null || !rs.getDate("data_fim").before(new Date(System.currentTimeMillis())));
                    return row;
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return null;
    }

    public boolean atualizarAfetacao(int afetacaoId, int clubeId, Integer clubeModalidadeId, int cargoId,
                                     Date dataInicio, Date dataFim, String observacoes, boolean ativo) {
        String sql = """
            UPDATE staff_afetacao
            SET clube_id = ?,
                clube_modalidade_id = ?,
                cargo_id = ?,
                data_inicio = ?,
                data_fim = ?,
                observacoes = ?
            WHERE id = ?
        """;

        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, clubeId);
            if (clubeModalidadeId == null) ps.setNull(2, Types.INTEGER);
            else ps.setInt(2, clubeModalidadeId);
            ps.setInt(3, cargoId);
            if (dataInicio == null) ps.setNull(4, Types.DATE);
            else ps.setDate(4, dataInicio);
            Date finalDate = ativo ? dataFim : (dataFim != null ? dataFim : new Date(System.currentTimeMillis()));
            if (finalDate == null) ps.setNull(5, Types.DATE);
            else ps.setDate(5, finalDate);
            ps.setString(6, observacoes == null ? "" : observacoes);
            ps.setInt(7, afetacaoId);
            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            e.printStackTrace();
            return false;
        }
    }

    public boolean terminar(int afetacaoId) {
        return definirDataFim(afetacaoId, new Date(System.currentTimeMillis()));
    }

    public boolean definirDataFim(int afetacaoId, Date dataFim) {
        String sql = "UPDATE staff_afetacao SET data_fim = ? WHERE id=?";

        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setDate(1, dataFim);
            ps.setInt(2, afetacaoId);
            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            e.printStackTrace();
            return false;
        }
    }

    public boolean atualizarDataInicio(int afetacaoId, Date novaDataInicio) {
        String sql = "UPDATE staff_afetacao SET data_inicio=? WHERE id=?";

        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setDate(1, novaDataInicio);
            ps.setInt(2, afetacaoId);
            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            e.printStackTrace();
            return false;
        }
    }

    private static String formatDate(Date date) {
        return date == null ? null : date.toLocalDate().toString();
    }
}
