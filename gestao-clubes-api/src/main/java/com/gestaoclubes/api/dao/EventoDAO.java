package com.gestaoclubes.api.dao;

import com.gestaoclubes.api.model.Evento;
import com.gestaoclubes.api.util.ConexoBD;

import java.sql.*;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public class EventoDAO {

    public List<Map<String, Object>> listarPorClubeModalidade(int clubeModalidadeId) {
        List<Map<String, Object>> lista = new ArrayList<>();
        String sql = """
            SELECT e.id, e.titulo, e.descricao, e.data_hora, e.local, e.observacoes,
                   e.tipo, e.clube_modalidade_id, e.criado_por,
                   u.utilizador AS criado_por_user, COUNT(ea.atleta_id) AS total_atletas
            FROM evento e
            LEFT JOIN utilizadores u ON u.id = e.criado_por
            LEFT JOIN evento_atleta ea ON ea.evento_id = e.id
            WHERE e.clube_modalidade_id = ?
            GROUP BY e.id
            ORDER BY e.data_hora DESC
        """;

        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setInt(1, clubeModalidadeId);

            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    lista.add(mapRowBasico(rs));
                }
            }

        } catch (SQLException e) {
            e.printStackTrace();
        }

        return lista;
    }

    public List<Map<String, Object>> listarPorColetividadeAtividade(int coletividadeAtividadeId) {
        List<Map<String, Object>> lista = new ArrayList<>();
        String sql = """
            SELECT e.id, e.titulo, e.descricao, e.data_hora, e.local, e.observacoes,
                   e.tipo, e.coletividade_atividade_id, e.criado_por,
                   u.utilizador AS criado_por_user, COUNT(ei.inscrito_id) AS total_atletas
            FROM evento e
            LEFT JOIN utilizadores u ON u.id = e.criado_por
            LEFT JOIN evento_inscrito ei ON ei.evento_id = e.id
            WHERE e.coletividade_atividade_id = ?
            GROUP BY e.id
            ORDER BY e.data_hora DESC
        """;

        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setInt(1, coletividadeAtividadeId);

            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    lista.add(mapRowBasico(rs));
                }
            }

        } catch (SQLException e) {
            e.printStackTrace();
        }

        return lista;
    }

    /** List ALL events (for admin/secretary management page) */
    public List<Map<String, Object>> listarTodos() {
        List<Map<String, Object>> lista = new ArrayList<>();
        String sql = """
            SELECT e.id, e.titulo, e.descricao, e.data_hora, e.local, e.observacoes,
                   e.tipo, e.clube_modalidade_id, e.coletividade_atividade_id, e.criado_por,
                   u.utilizador AS criado_por_user,
                   cl.nome AS clube_nome,
                   m.nome AS modalidade_nome,
                   col.nome AS coletividade_nome,
                   a.nome AS atividade_nome,
                   (SELECT COUNT(*) FROM evento_atleta ea WHERE ea.evento_id = e.id) +
                   (SELECT COUNT(*) FROM evento_inscrito ei WHERE ei.evento_id = e.id) AS total_convocados
            FROM evento e
            LEFT JOIN utilizadores u ON u.id = e.criado_por
            LEFT JOIN clube_modalidade cm ON cm.id = e.clube_modalidade_id
            LEFT JOIN clube cl ON cl.id = cm.clube_id
            LEFT JOIN modalidade m ON m.id = cm.modalidade_id
            LEFT JOIN coletividade_atividade ca ON ca.id = e.coletividade_atividade_id
            LEFT JOIN coletividade col ON col.id = ca.coletividade_id
            LEFT JOIN atividade a ON a.id = ca.atividade_id
            ORDER BY e.data_hora DESC
        """;

        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {

            while (rs.next()) {
                Map<String, Object> row = new LinkedHashMap<>();
                row.put("id", rs.getInt("id"));
                row.put("titulo", rs.getString("titulo"));
                row.put("descricao", rs.getString("descricao"));
                row.put("dataHora", rs.getTimestamp("data_hora"));
                row.put("local", rs.getString("local"));
                row.put("observacoes", rs.getString("observacoes"));
                row.put("tipo", rs.getString("tipo"));
                int cmId = rs.getInt("clube_modalidade_id");
                row.put("clubeModalidadeId", rs.wasNull() ? null : cmId);
                int caId = rs.getInt("coletividade_atividade_id");
                row.put("coletividadeAtividadeId", rs.wasNull() ? null : caId);
                row.put("criadoPor", rs.getInt("criado_por"));
                row.put("criadoPorUser", rs.getString("criado_por_user"));
                row.put("clubeNome", rs.getString("clube_nome"));
                row.put("modalidadeNome", rs.getString("modalidade_nome"));
                row.put("coletividadeNome", rs.getString("coletividade_nome"));
                row.put("atividadeNome", rs.getString("atividade_nome"));
                row.put("totalConvocados", rs.getInt("total_convocados"));
                lista.add(row);
            }

        } catch (SQLException e) {
            e.printStackTrace();
        }

        return lista;
    }

    public Map<String, Object> buscarPorId(int eventoId) {
        String sql = """
            SELECT e.id, e.titulo, e.descricao, e.data_hora, e.local, e.observacoes,
                   e.tipo, e.clube_modalidade_id, e.coletividade_atividade_id, e.criado_por,
                   u.utilizador AS criado_por_user
            FROM evento e
            LEFT JOIN utilizadores u ON u.id = e.criado_por
            WHERE e.id = ?
        """;

        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setInt(1, eventoId);

            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("id", rs.getInt("id"));
                    row.put("titulo", rs.getString("titulo"));
                    row.put("descricao", rs.getString("descricao"));
                    row.put("dataHora", rs.getTimestamp("data_hora"));
                    row.put("local", rs.getString("local"));
                    row.put("observacoes", rs.getString("observacoes"));
                    row.put("tipo", rs.getString("tipo"));
                    int cmId = rs.getInt("clube_modalidade_id");
                    row.put("clubeModalidadeId", rs.wasNull() ? null : cmId);
                    int caId = rs.getInt("coletividade_atividade_id");
                    row.put("coletividadeAtividadeId", rs.wasNull() ? null : caId);
                    row.put("criadoPor", rs.getInt("criado_por"));
                    row.put("criadoPorUser", rs.getString("criado_por_user"));
                    return row;
                }
            }

        } catch (SQLException e) {
            e.printStackTrace();
        }

        return null;
    }

    public Integer inserirEDevolverId(Evento evento) {
        String sql = """
            INSERT INTO evento (titulo, descricao, data_hora, local, observacoes, tipo,
                                clube_modalidade_id, coletividade_atividade_id, criado_por)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """;

        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {

            ps.setString(1, evento.getTitulo());
            ps.setString(2, evento.getDescricao());
            ps.setTimestamp(3, evento.getDataHora());
            ps.setString(4, evento.getLocal());
            ps.setString(5, evento.getObservacoes());
            ps.setString(6, evento.getTipo() != null ? evento.getTipo() : "MODALIDADE");

            if (evento.getClubeModalidadeId() != null) {
                ps.setInt(7, evento.getClubeModalidadeId());
            } else {
                ps.setNull(7, Types.INTEGER);
            }

            if (evento.getColetividadeAtividadeId() != null) {
                ps.setInt(8, evento.getColetividadeAtividadeId());
            } else {
                ps.setNull(8, Types.INTEGER);
            }

            ps.setInt(9, evento.getCriadoPor());

            int updated = ps.executeUpdate();
            if (updated <= 0) return null;

            try (ResultSet keys = ps.getGeneratedKeys()) {
                if (keys.next()) return keys.getInt(1);
            }

        } catch (SQLException e) {
            e.printStackTrace();
        }
        return null;
    }

    public boolean atualizar(int id, Evento evento) {
        String sql = """
            UPDATE evento
            SET titulo = ?, descricao = ?, data_hora = ?, local = ?, observacoes = ?
            WHERE id = ?
        """;

        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setString(1, evento.getTitulo());
            ps.setString(2, evento.getDescricao());
            ps.setTimestamp(3, evento.getDataHora());
            ps.setString(4, evento.getLocal());
            ps.setString(5, evento.getObservacoes());
            ps.setInt(6, id);

            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            e.printStackTrace();
            return false;
        }
    }

    public boolean remover(int id) {
        String sql = "DELETE FROM evento WHERE id = ?";
        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, id);
            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            e.printStackTrace();
            return false;
        }
    }

    public List<Map<String, Object>> listarEventosDaAtleta(Integer atletaId) {
        List<Map<String, Object>> lista = new ArrayList<>();
        String sql = """
            SELECT e.id, e.titulo, e.data_hora, e.local, COUNT(ea2.atleta_id) AS total_atletas
            FROM evento e
            INNER JOIN evento_atleta ea ON ea.evento_id = e.id AND ea.atleta_id = ?
            LEFT JOIN evento_atleta ea2 ON ea2.evento_id = e.id
            WHERE e.data_hora >= NOW()
            GROUP BY e.id
            ORDER BY e.data_hora ASC
        """;

        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setInt(1, atletaId);

            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("id", rs.getInt("id"));
                    row.put("titulo", rs.getString("titulo"));
                    row.put("dataHora", rs.getTimestamp("data_hora"));
                    row.put("local", rs.getString("local"));
                    row.put("totalAtletas", rs.getInt("total_atletas"));
                    lista.add(row);
                }
            }

        } catch (SQLException e) {
            e.printStackTrace();
        }

        return lista;
    }

    private Map<String, Object> mapRowBasico(ResultSet rs) throws SQLException {
        Map<String, Object> row = new LinkedHashMap<>();
        row.put("id", rs.getInt("id"));
        row.put("titulo", rs.getString("titulo"));
        row.put("descricao", rs.getString("descricao"));
        row.put("dataHora", rs.getTimestamp("data_hora"));
        row.put("local", rs.getString("local"));
        row.put("observacoes", rs.getString("observacoes"));
        row.put("tipo", rs.getString("tipo"));
        row.put("criadoPor", rs.getInt("criado_por"));
        row.put("criadoPorUser", rs.getString("criado_por_user"));
        row.put("totalAtletas", rs.getInt("total_atletas"));

        try { int cmId = rs.getInt("clube_modalidade_id"); row.put("clubeModalidadeId", rs.wasNull() ? null : cmId); } catch (SQLException ignored) {}
        try { int caId = rs.getInt("coletividade_atividade_id"); row.put("coletividadeAtividadeId", rs.wasNull() ? null : caId); } catch (SQLException ignored) {}
        return row;
    }
}
