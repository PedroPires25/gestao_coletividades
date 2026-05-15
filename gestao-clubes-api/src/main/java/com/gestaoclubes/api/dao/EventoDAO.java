package com.gestaoclubes.api.dao;

import com.gestaoclubes.api.model.Evento;
import com.gestaoclubes.api.util.ConexoBD;

import java.sql.*;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public class EventoDAO {

    public List<Map<String, Object>> listarTodos() {
        List<Map<String, Object>> lista = new ArrayList<>();
        String sql = """
            SELECT e.id, e.titulo, e.descricao, e.data_hora, e.data_hora_fim, e.local, e.observacoes,
                   e.tipo, e.clube_modalidade_id, e.coletividade_atividade_id, e.criado_por,
                    e.latitude, e.longitude,
                    cm.clube_id,
                    c.nome AS clube_nome,
                    m.nome AS modalidade_nome,
                    ca.coletividade_id,
                    col.nome AS coletividade_nome,
                    a.nome AS atividade_nome,
                    (SELECT COUNT(*) FROM evento_atleta ea WHERE ea.evento_id = e.id) +
                    (SELECT COUNT(*) FROM evento_inscrito ei WHERE ei.evento_id = e.id) AS total_convocados
            FROM evento e
            LEFT JOIN clube_modalidade cm ON cm.id = e.clube_modalidade_id
            LEFT JOIN clube c ON c.id = cm.clube_id
            LEFT JOIN modalidade m ON m.id = cm.modalidade_id
            LEFT JOIN coletividade_atividade ca ON ca.id = e.coletividade_atividade_id
            LEFT JOIN coletividade col ON col.id = ca.coletividade_id
            LEFT JOIN atividade a ON a.id = ca.atividade_id
            WHERE COALESCE(e.data_hora_fim, e.data_hora) >= ?
            ORDER BY e.data_hora ASC
        """;

        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setTimestamp(1, new Timestamp(System.currentTimeMillis()));
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    lista.add(mapRow(rs));
                }
            }

        } catch (Exception e) {
            e.printStackTrace();
        }

        return lista;
    }

    public Map<String, Object> buscarPorId(int id) {
        String sql = """
            SELECT e.id, e.titulo, e.descricao, e.data_hora, e.data_hora_fim, e.local, e.observacoes,
                   e.tipo, e.clube_modalidade_id, e.coletividade_atividade_id, e.criado_por,
                    e.latitude, e.longitude,
                    cm.clube_id,
                    c.nome AS clube_nome,
                    m.nome AS modalidade_nome,
                    ca.coletividade_id,
                    col.nome AS coletividade_nome,
                    a.nome AS atividade_nome
            FROM evento e
            LEFT JOIN clube_modalidade cm ON cm.id = e.clube_modalidade_id
            LEFT JOIN clube c ON c.id = cm.clube_id
            LEFT JOIN modalidade m ON m.id = cm.modalidade_id
            LEFT JOIN coletividade_atividade ca ON ca.id = e.coletividade_atividade_id
            LEFT JOIN coletividade col ON col.id = ca.coletividade_id
            LEFT JOIN atividade a ON a.id = ca.atividade_id
            WHERE e.id = ?
        """;

        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setInt(1, id);

            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return mapRow(rs);
                }
            }

        } catch (Exception e) {
            e.printStackTrace();
        }

        return null;
    }

    public List<Map<String, Object>> listarPorClube(int clubeId) {
        List<Map<String, Object>> lista = new ArrayList<>();
        String sql = """
            SELECT e.id, e.titulo, e.descricao, e.data_hora, e.data_hora_fim, e.local, e.observacoes,
                   e.tipo, e.clube_modalidade_id, e.coletividade_atividade_id, e.criado_por,
                    e.latitude, e.longitude,
                    cm.clube_id,
                    c.nome AS clube_nome,
                    m.nome AS modalidade_nome,
                    ca.coletividade_id,
                    col.nome AS coletividade_nome,
                    a.nome AS atividade_nome,
                    (SELECT COUNT(*) FROM evento_atleta ea WHERE ea.evento_id = e.id) +
                    (SELECT COUNT(*) FROM evento_inscrito ei WHERE ei.evento_id = e.id) AS total_convocados
            FROM evento e
            JOIN clube_modalidade cm ON cm.id = e.clube_modalidade_id
            LEFT JOIN clube c ON c.id = cm.clube_id
            LEFT JOIN modalidade m ON m.id = cm.modalidade_id
            LEFT JOIN coletividade_atividade ca ON ca.id = e.coletividade_atividade_id
            LEFT JOIN coletividade col ON col.id = ca.coletividade_id
            LEFT JOIN atividade a ON a.id = ca.atividade_id
            WHERE cm.clube_id = ?
              AND COALESCE(e.data_hora_fim, e.data_hora) >= ?
            ORDER BY e.data_hora ASC
        """;

        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setInt(1, clubeId);
            ps.setTimestamp(2, new Timestamp(System.currentTimeMillis()));

            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    lista.add(mapRow(rs));
                }
            }

        } catch (Exception e) {
            e.printStackTrace();
        }

        return lista;
    }

    public List<Map<String, Object>> listarPorClubeModalidade(int clubeModalidadeId) {
        List<Map<String, Object>> lista = new ArrayList<>();
        String sql = """
            SELECT e.id, e.titulo, e.descricao, e.data_hora, e.data_hora_fim, e.local, e.observacoes,
                   e.tipo, e.clube_modalidade_id, e.coletividade_atividade_id, e.criado_por,
                    e.latitude, e.longitude,
                    cm.clube_id,
                    c.nome AS clube_nome,
                    m.nome AS modalidade_nome,
                    ca.coletividade_id,
                    col.nome AS coletividade_nome,
                    a.nome AS atividade_nome,
                    (SELECT COUNT(*) FROM evento_atleta ea WHERE ea.evento_id = e.id) +
                    (SELECT COUNT(*) FROM evento_inscrito ei WHERE ei.evento_id = e.id) AS total_convocados
            FROM evento e
            LEFT JOIN clube_modalidade cm ON cm.id = e.clube_modalidade_id
            LEFT JOIN clube c ON c.id = cm.clube_id
            LEFT JOIN modalidade m ON m.id = cm.modalidade_id
            LEFT JOIN coletividade_atividade ca ON ca.id = e.coletividade_atividade_id
            LEFT JOIN coletividade col ON col.id = ca.coletividade_id
            LEFT JOIN atividade a ON a.id = ca.atividade_id
            WHERE e.clube_modalidade_id = ?
              AND COALESCE(e.data_hora_fim, e.data_hora) >= ?
            ORDER BY e.data_hora ASC
        """;

        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setInt(1, clubeModalidadeId);
            ps.setTimestamp(2, new Timestamp(System.currentTimeMillis()));

            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    lista.add(mapRow(rs));
                }
            }

        } catch (Exception e) {
            e.printStackTrace();
        }

        return lista;
    }

    public List<Map<String, Object>> listarPorColetividadeAtividade(int coletividadeAtividadeId) {
        List<Map<String, Object>> lista = new ArrayList<>();
        String sql = """
            SELECT e.id, e.titulo, e.descricao, e.data_hora, e.data_hora_fim, e.local, e.observacoes,
                   e.tipo, e.clube_modalidade_id, e.coletividade_atividade_id, e.criado_por,
                    e.latitude, e.longitude,
                    cm.clube_id,
                    c.nome AS clube_nome,
                    m.nome AS modalidade_nome,
                    ca.coletividade_id,
                    col.nome AS coletividade_nome,
                    a.nome AS atividade_nome,
                    (SELECT COUNT(*) FROM evento_atleta ea WHERE ea.evento_id = e.id) +
                    (SELECT COUNT(*) FROM evento_inscrito ei WHERE ei.evento_id = e.id) AS total_convocados
            FROM evento e
            LEFT JOIN clube_modalidade cm ON cm.id = e.clube_modalidade_id
            LEFT JOIN clube c ON c.id = cm.clube_id
            LEFT JOIN modalidade m ON m.id = cm.modalidade_id
            LEFT JOIN coletividade_atividade ca ON ca.id = e.coletividade_atividade_id
            LEFT JOIN coletividade col ON col.id = ca.coletividade_id
            LEFT JOIN atividade a ON a.id = ca.atividade_id
            WHERE e.coletividade_atividade_id = ?
              AND COALESCE(e.data_hora_fim, e.data_hora) >= ?
            ORDER BY e.data_hora ASC
        """;

        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setInt(1, coletividadeAtividadeId);
            ps.setTimestamp(2, new Timestamp(System.currentTimeMillis()));

            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    lista.add(mapRow(rs));
                }
            }

        } catch (Exception e) {
            e.printStackTrace();
        }

        return lista;
    }

    public Integer inserirEDevolverId(Evento evento) {
        String sql = """
            INSERT INTO evento (titulo, descricao, data_hora, data_hora_fim, local, observacoes, tipo,
                                clube_modalidade_id, coletividade_atividade_id, criado_por,
                                latitude, longitude)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """;

        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {

            ps.setString(1, evento.getTitulo());
            ps.setString(2, evento.getDescricao());
            ps.setTimestamp(3, evento.getDataHora());
            if (evento.getDataHoraFim() != null) ps.setTimestamp(4, evento.getDataHoraFim());
            else ps.setNull(4, Types.TIMESTAMP);
            ps.setString(5, evento.getLocal());
            ps.setString(6, evento.getObservacoes());
            ps.setString(7, evento.getTipo());
            if (evento.getClubeModalidadeId() != null) ps.setInt(8, evento.getClubeModalidadeId());
            else ps.setNull(8, Types.INTEGER);
            if (evento.getColetividadeAtividadeId() != null) ps.setInt(9, evento.getColetividadeAtividadeId());
            else ps.setNull(9, Types.INTEGER);
            ps.setInt(10, evento.getCriadoPor());
            if (evento.getLatitude() != null) ps.setDouble(11, evento.getLatitude());
            else ps.setNull(11, Types.DOUBLE);
            if (evento.getLongitude() != null) ps.setDouble(12, evento.getLongitude());
            else ps.setNull(12, Types.DOUBLE);

            ps.executeUpdate();

            try (ResultSet rs = ps.getGeneratedKeys()) {
                if (rs.next()) return rs.getInt(1);
            }

        } catch (Exception e) {
            e.printStackTrace();
        }

        return null;
    }

    public boolean atualizar(int id, Evento evento) {
        String sql = """
            UPDATE evento
            SET titulo = ?, descricao = ?, data_hora = ?, data_hora_fim = ?, local = ?, observacoes = ?,
                latitude = ?, longitude = ?
            WHERE id = ?
        """;

        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setString(1, evento.getTitulo());
            ps.setString(2, evento.getDescricao());
            ps.setTimestamp(3, evento.getDataHora());
            if (evento.getDataHoraFim() != null) ps.setTimestamp(4, evento.getDataHoraFim());
            else ps.setNull(4, Types.TIMESTAMP);
            ps.setString(5, evento.getLocal());
            ps.setString(6, evento.getObservacoes());
            if (evento.getLatitude() != null) ps.setDouble(7, evento.getLatitude());
            else ps.setNull(7, Types.DOUBLE);
            if (evento.getLongitude() != null) ps.setDouble(8, evento.getLongitude());
            else ps.setNull(8, Types.DOUBLE);
            ps.setInt(9, id);

            return ps.executeUpdate() > 0;

        } catch (Exception e) {
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
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

    private Map<String, Object> mapRow(ResultSet rs) throws SQLException {
        Map<String, Object> row = new LinkedHashMap<>();
        row.put("id", rs.getInt("id"));
        row.put("titulo", rs.getString("titulo"));
        row.put("descricao", rs.getString("descricao"));
        row.put("dataHora", rs.getTimestamp("data_hora"));
        row.put("dataHoraFim", rs.getTimestamp("data_hora_fim"));
        row.put("local", rs.getString("local"));
        row.put("observacoes", rs.getString("observacoes"));
        row.put("tipo", rs.getString("tipo"));
        row.put("clubeModalidadeId", rs.getObject("clube_modalidade_id"));
        row.put("coletividadeAtividadeId", rs.getObject("coletividade_atividade_id"));
        row.put("criadoPor", rs.getInt("criado_por"));
        Double lat = rs.getObject("latitude") != null ? rs.getDouble("latitude") : null;
        Double lng = rs.getObject("longitude") != null ? rs.getDouble("longitude") : null;
        row.put("latitude", lat);
        row.put("longitude", lng);
        tryPut(row, rs, "clubeId", "clube_id");
        tryPut(row, rs, "clubeNome", "clube_nome");
        tryPut(row, rs, "modalidadeNome", "modalidade_nome");
        tryPut(row, rs, "coletividadeId", "coletividade_id");
        tryPut(row, rs, "coletividadeNome", "coletividade_nome");
        tryPut(row, rs, "atividadeNome", "atividade_nome");
        tryPut(row, rs, "totalConvocados", "total_convocados");
        return row;
    }

    private void tryPut(Map<String, Object> row, ResultSet rs, String key, String col) {
        try { row.put(key, rs.getObject(col)); } catch (SQLException ignored) {}
    }
}
