package com.gestaoclubes.api.dao;

import com.gestaoclubes.api.model.Notificacao;
import com.gestaoclubes.api.util.ConexoBD;

import java.sql.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public class NotificacaoDAO {

    public void inserir(Notificacao n) {
        String sql = """
            INSERT INTO notificacao
                (utilizador_id, evento_id, canal, destino, mensagem, estado, data_criacao, data_envio)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """;
        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {

            if (n.getUtilizadorId() != null) ps.setInt(1, n.getUtilizadorId());
            else ps.setNull(1, Types.INTEGER);

            if (n.getEventoId() != null) ps.setInt(2, n.getEventoId());
            else ps.setNull(2, Types.INTEGER);

            ps.setString(3, n.getCanal().name());
            ps.setString(4, n.getDestino());
            ps.setString(5, n.getMensagem());
            ps.setString(6, n.getEstado().name());
            ps.setTimestamp(7, Timestamp.valueOf(
                n.getDataCriacao() != null ? n.getDataCriacao() : LocalDateTime.now()));

            if (n.getDataEnvio() != null) ps.setTimestamp(8, Timestamp.valueOf(n.getDataEnvio()));
            else ps.setNull(8, Types.TIMESTAMP);

            ps.executeUpdate();

            try (ResultSet rs = ps.getGeneratedKeys()) {
                if (rs.next()) n.setId(rs.getLong(1));
            }

        } catch (SQLException e) {
            System.err.println("NotificacaoDAO.inserir: " + e.getMessage());
        }
    }

    public List<Map<String, Object>> listarPorEvento(int eventoId) {
        return listar("WHERE n.evento_id = ?", eventoId);
    }

    public List<Map<String, Object>> listarTodos(int limit) {
        List<Map<String, Object>> lista = new ArrayList<>();
        String sql = """
            SELECT n.id, n.utilizador_id, n.evento_id, n.canal, n.destino,
                   n.mensagem, n.estado, n.data_criacao, n.data_envio,
                   e.titulo AS evento_titulo
            FROM notificacao n
            LEFT JOIN evento e ON e.id = n.evento_id
            ORDER BY n.data_criacao DESC
            LIMIT ?
        """;
        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, limit);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) lista.add(mapRow(rs));
            }
        } catch (SQLException e) {
            System.err.println("NotificacaoDAO.listarTodos: " + e.getMessage());
        }
        return lista;
    }

    private List<Map<String, Object>> listar(String where, int param) {
        List<Map<String, Object>> lista = new ArrayList<>();
        String sql = """
            SELECT n.id, n.utilizador_id, n.evento_id, n.canal, n.destino,
                   n.mensagem, n.estado, n.data_criacao, n.data_envio,
                   e.titulo AS evento_titulo
            FROM notificacao n
            LEFT JOIN evento e ON e.id = n.evento_id
            """ + where + " ORDER BY n.data_criacao DESC";

        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, param);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) lista.add(mapRow(rs));
            }
        } catch (SQLException e) {
            System.err.println("NotificacaoDAO.listar: " + e.getMessage());
        }
        return lista;
    }

    private Map<String, Object> mapRow(ResultSet rs) throws SQLException {
        Map<String, Object> row = new LinkedHashMap<>();
        row.put("id", rs.getLong("id"));
        row.put("utilizadorId", rs.getObject("utilizador_id"));
        row.put("eventoId", rs.getObject("evento_id"));
        row.put("eventoTitulo", rs.getString("evento_titulo"));
        row.put("canal", rs.getString("canal"));
        row.put("destino", rs.getString("destino"));
        row.put("mensagem", rs.getString("mensagem"));
        row.put("estado", rs.getString("estado"));
        row.put("dataCriacao", rs.getTimestamp("data_criacao"));
        row.put("dataEnvio", rs.getTimestamp("data_envio"));
        return row;
    }
}
