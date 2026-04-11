package com.gestaoclubes.api.dao;

import com.gestaoclubes.api.model.Staff;
import com.gestaoclubes.api.util.ConexoBD;

import java.math.BigDecimal;
import java.sql.*;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public class StaffDAO {

    public boolean inserir(Staff s) {
        return inserirRetornarId(s) > 0;
    }

    public int inserirRetornarId(Staff s) {
        String sql = """
            INSERT INTO staff (nome, email, telefone, morada, num_registo, remuneracao, utilizador_id)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """;

        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {

            ps.setString(1, s.getNome());
            ps.setString(2, s.getEmail());
            ps.setString(3, s.getTelefone());
            ps.setString(4, s.getMorada());
            ps.setString(5, s.getNumRegisto());
            ps.setBigDecimal(6, BigDecimal.valueOf(s.getRemuneracao()));
            if (s.getUtilizadorId() != null) {
                ps.setInt(7, s.getUtilizadorId());
            } else {
                ps.setNull(7, java.sql.Types.INTEGER);
            }

            int rows = ps.executeUpdate();
            if (rows == 0) return 0;

            ResultSet keys = ps.getGeneratedKeys();
            if (keys.next()) return keys.getInt(1);
            return 0;

        } catch (SQLException e) {
            e.printStackTrace();
            return 0;
        }
    }

    public List<Staff> listarTodos() {
        List<Staff> lista = new ArrayList<>();
        String sql = """
            SELECT s.*, COALESCE(u.nome, s.nome) AS nome_efetivo,
                   COALESCE(u.logo_path, s.foto_path) AS foto_efetiva
            FROM staff s
            LEFT JOIN utilizadores u ON u.id = s.utilizador_id
            ORDER BY nome_efetivo
        """;

        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {

            while (rs.next()) {
                lista.add(mapStaffComJoin(rs));
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return lista;
    }

    public Staff buscarPorId(int id) {
        String sql = """
            SELECT s.*, COALESCE(u.nome, s.nome) AS nome_efetivo,
                   COALESCE(u.logo_path, s.foto_path) AS foto_efetiva
            FROM staff s
            LEFT JOIN utilizadores u ON u.id = s.utilizador_id
            WHERE s.id=?
        """;

        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setInt(1, id);
            ResultSet rs = ps.executeQuery();

            if (rs.next()) {
                return mapStaffComJoin(rs);
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return null;
    }

    public boolean atualizar(int id, Staff s) {
        String sql = """
            UPDATE staff
            SET nome=?, email=?, telefone=?, morada=?, num_registo=?, remuneracao=?
            WHERE id=?
        """;

        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setString(1, s.getNome());
            ps.setString(2, s.getEmail());
            ps.setString(3, s.getTelefone());
            ps.setString(4, s.getMorada());
            ps.setString(5, s.getNumRegisto());
            ps.setBigDecimal(6, BigDecimal.valueOf(s.getRemuneracao()));
            ps.setInt(7, id);

            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            e.printStackTrace();
            return false;
        }
    }

    public boolean remover(int id) {
        String sql = "DELETE FROM staff WHERE id=?";

        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setInt(1, id);
            return ps.executeUpdate() > 0;

        } catch (SQLException e) {
            e.printStackTrace();
            return false;
        }
    }

    public List<Object[]> listarComAfetacaoAtiva() {
        List<Object[]> rows = new ArrayList<>();

        String sql = """
            SELECT s.id, COALESCE(u.nome, s.nome) AS nome, s.email, s.telefone, s.morada, s.num_registo, s.remuneracao,
                   c.nome AS clube_nome,
                   cs.nome AS cargo_nome,
                   m.nome AS modalidade_nome
            FROM staff s
            LEFT JOIN utilizadores u ON u.id = s.utilizador_id
            LEFT JOIN staff_afetacao sa
                   ON sa.staff_id = s.id AND (sa.data_fim IS NULL OR sa.data_fim >= CURDATE())
            LEFT JOIN clube c ON c.id = sa.clube_id
            LEFT JOIN cargo_staff cs ON cs.id = sa.cargo_id
            LEFT JOIN clube_modalidade cm ON cm.id = sa.clube_modalidade_id
            LEFT JOIN modalidade m ON m.id = cm.modalidade_id
            ORDER BY nome
        """;

        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {

            while (rs.next()) {
                rows.add(new Object[]{
                        rs.getInt("id"),
                        rs.getString("nome"),
                        rs.getString("email"),
                        rs.getString("telefone"),
                        rs.getString("morada"),
                        rs.getString("num_registo"),
                        rs.getBigDecimal("remuneracao"),
                        rs.getString("clube_nome"),
                        rs.getString("cargo_nome"),
                        rs.getString("modalidade_nome")
                });
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }

        return rows;
    }

    public List<Map<String, Object>> listarPorClube(int clubeId) {
        String sql = """
            SELECT s.id,
                   COALESCE(u.nome, s.nome) AS nome,
                   s.email,
                   s.telefone,
                   s.morada,
                   s.num_registo,
                   s.remuneracao,
                   COALESCE(u.logo_path, s.foto_path) AS foto_path,
                   sa.id AS afetacao_id,
                   sa.clube_id,
                   sa.clube_modalidade_id,
                   sa.cargo_id,
                   sa.data_inicio,
                   sa.data_fim,
                   sa.observacoes,
                   CASE
                       WHEN sa.data_fim IS NULL OR sa.data_fim >= CURDATE() THEN 1
                       ELSE 0
                   END AS ativo,
                   cs.nome AS cargo_nome,
                   cm.epoca,
                   m.id AS modalidade_id,
                   m.nome AS modalidade_nome,
                   GROUP_CONCAT(DISTINCT e.id ORDER BY e.nome SEPARATOR ',') AS escaloes_ids,
                   GROUP_CONCAT(DISTINCT e.nome ORDER BY e.nome SEPARATOR ', ') AS escaloes_nomes
            FROM staff s
            LEFT JOIN utilizadores u ON u.id = s.utilizador_id
            JOIN staff_afetacao sa ON sa.staff_id = s.id
            LEFT JOIN cargo_staff cs ON cs.id = sa.cargo_id
            LEFT JOIN clube_modalidade cm ON cm.id = sa.clube_modalidade_id
            LEFT JOIN modalidade m ON m.id = cm.modalidade_id
            LEFT JOIN staff_afetacao_escalao sae ON sae.staff_afetacao_id = sa.id
            LEFT JOIN escalao e ON e.id = sae.escalao_id
            WHERE sa.clube_id = ?
            GROUP BY s.id, nome, s.email, s.telefone, s.morada, s.num_registo, s.remuneracao, foto_path,
                     sa.id, sa.clube_id, sa.clube_modalidade_id, sa.cargo_id, sa.data_inicio, sa.data_fim,
                     sa.observacoes, cs.nome, cm.epoca, m.id, m.nome
            ORDER BY nome, sa.data_inicio DESC, sa.id DESC
        """;
        return listarDetalhado(sql, clubeId);
    }

    public List<Map<String, Object>> listarPorClubeModalidade(int clubeId, int clubeModalidadeId) {
        String sql = """
            SELECT s.id,
                   COALESCE(u.nome, s.nome) AS nome,
                   s.email,
                   s.telefone,
                   s.morada,
                   s.num_registo,
                   s.remuneracao,
                   COALESCE(u.logo_path, s.foto_path) AS foto_path,
                   sa.id AS afetacao_id,
                   sa.clube_id,
                   sa.clube_modalidade_id,
                   sa.cargo_id,
                   sa.data_inicio,
                   sa.data_fim,
                   sa.observacoes,
                   CASE
                       WHEN sa.data_fim IS NULL OR sa.data_fim >= CURDATE() THEN 1
                       ELSE 0
                   END AS ativo,
                   cs.nome AS cargo_nome,
                   cm.epoca,
                   m.id AS modalidade_id,
                   m.nome AS modalidade_nome,
                   GROUP_CONCAT(DISTINCT e.id ORDER BY e.nome SEPARATOR ',') AS escaloes_ids,
                   GROUP_CONCAT(DISTINCT e.nome ORDER BY e.nome SEPARATOR ', ') AS escaloes_nomes
            FROM staff s
            LEFT JOIN utilizadores u ON u.id = s.utilizador_id
            JOIN staff_afetacao sa ON sa.staff_id = s.id
            LEFT JOIN cargo_staff cs ON cs.id = sa.cargo_id
            LEFT JOIN clube_modalidade cm ON cm.id = sa.clube_modalidade_id
            LEFT JOIN modalidade m ON m.id = cm.modalidade_id
            LEFT JOIN staff_afetacao_escalao sae ON sae.staff_afetacao_id = sa.id
            LEFT JOIN escalao e ON e.id = sae.escalao_id
            WHERE sa.clube_id = ?
              AND sa.clube_modalidade_id = ?
            GROUP BY s.id, nome, s.email, s.telefone, s.morada, s.num_registo, s.remuneracao, foto_path,
                     sa.id, sa.clube_id, sa.clube_modalidade_id, sa.cargo_id, sa.data_inicio, sa.data_fim,
                     sa.observacoes, cs.nome, cm.epoca, m.id, m.nome
            ORDER BY nome, sa.data_inicio DESC, sa.id DESC
        """;
        return listarDetalhado(sql, clubeId, clubeModalidadeId);
    }

    private List<Map<String, Object>> listarDetalhado(String sql, Object... params) {
        List<Map<String, Object>> lista = new ArrayList<>();

        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            for (int i = 0; i < params.length; i++) {
                ps.setObject(i + 1, params[i]);
            }

            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("id", rs.getInt("id"));
                    row.put("nome", rs.getString("nome"));
                    row.put("email", rs.getString("email"));
                    row.put("telefone", rs.getString("telefone"));
                    row.put("morada", rs.getString("morada"));
                    row.put("numRegisto", rs.getString("num_registo"));
                    row.put("remuneracao", rs.getBigDecimal("remuneracao"));
                    row.put("afetacaoId", rs.getInt("afetacao_id"));
                    row.put("clubeId", rs.getInt("clube_id"));
                    row.put("clubeModalidadeId", getNullableInt(rs, "clube_modalidade_id"));
                    row.put("cargoId", rs.getInt("cargo_id"));
                    row.put("cargo", rs.getString("cargo_nome"));
                    row.put("modalidadeId", getNullableInt(rs, "modalidade_id"));
                    row.put("modalidade", rs.getString("modalidade_nome"));
                    row.put("epoca", rs.getString("epoca"));
                    row.put("dataInicio", formatDate(rs.getDate("data_inicio")));
                    row.put("dataFim", formatDate(rs.getDate("data_fim")));
                    row.put("observacoes", rs.getString("observacoes"));
                    row.put("ativo", rs.getBoolean("ativo"));
                    row.put("escaloesIds", parseCsvInts(rs.getString("escaloes_ids")));
                    row.put("escaloesNomes", rs.getString("escaloes_nomes"));
                    try { row.put("fotoPath", rs.getString("foto_path")); } catch (SQLException ignored) {}
                    lista.add(row);
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }

        return lista;
    }

    private Staff mapStaff(ResultSet rs) throws SQLException {
        BigDecimal remun = rs.getBigDecimal("remuneracao");
        Staff s = new Staff(
                rs.getInt("id"),
                rs.getString("nome"),
                rs.getString("email"),
                rs.getString("telefone"),
                rs.getString("morada"),
                rs.getString("num_registo"),
                remun == null ? 0.0 : remun.doubleValue()
        );
        try { s.setFotoPath(rs.getString("foto_path")); } catch (SQLException ignored) {}
        try { s.setUtilizadorId((Integer) rs.getObject("utilizador_id")); } catch (SQLException ignored) {}
        return s;
    }

    private Staff mapStaffComJoin(ResultSet rs) throws SQLException {
        BigDecimal remun = rs.getBigDecimal("remuneracao");
        Staff s = new Staff(
                rs.getInt("id"),
                rs.getString("nome_efetivo"),
                rs.getString("email"),
                rs.getString("telefone"),
                rs.getString("morada"),
                rs.getString("num_registo"),
                remun == null ? 0.0 : remun.doubleValue()
        );
        s.setFotoPath(rs.getString("foto_efetiva"));
        try { s.setUtilizadorId((Integer) rs.getObject("utilizador_id")); } catch (SQLException ignored) {}
        return s;
    }

    private static Integer getNullableInt(ResultSet rs, String column) throws SQLException {
        int value = rs.getInt(column);
        return rs.wasNull() ? null : value;
    }

    private static String formatDate(Date date) {
        return date == null ? null : date.toLocalDate().toString();
    }

    private static List<Integer> parseCsvInts(String csv) {
        List<Integer> ids = new ArrayList<>();
        if (csv == null || csv.isBlank()) return ids;
        for (String part : csv.split(",")) {
            try {
                ids.add(Integer.parseInt(part.trim()));
            } catch (NumberFormatException ignored) {
            }
        }
        return ids;
    }

    public boolean atualizarFotoPath(int staffId, String fotoPath) {
        String sql = "UPDATE staff SET foto_path=? WHERE id=?";
        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, fotoPath);
            ps.setInt(2, staffId);
            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            e.printStackTrace();
            return false;
        }
    }
}
