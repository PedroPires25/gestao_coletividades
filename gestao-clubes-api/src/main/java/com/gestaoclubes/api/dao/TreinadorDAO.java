package com.gestaoclubes.api.dao;

import com.gestaoclubes.api.util.ConexoBD;

import java.util.logging.Logger;
import java.sql.*;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

public class TreinadorDAO {

    private static final Logger LOGGER = Logger.getLogger(TreinadorDAO.class.getName());

    public List<Map<String, Object>> listarSessoes(int clubeId) {
        String sql = """
            SELECT st.*, COUNT(pt.id) AS numero_presencas
            FROM sessoes_treino st
            LEFT JOIN presencas_treino pt ON st.id = pt.sessao_treino_id AND pt.presente = 1
            WHERE st.clube_id = ?
            GROUP BY st.id
            ORDER BY st.data_treino DESC, st.hora_treino DESC
        """;
        List<Map<String, Object>> lista = new ArrayList<>();
        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, clubeId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("id", rs.getInt("id"));
                    row.put("clubeId", rs.getInt("clube_id"));
                    row.put("dataTreino", rs.getDate("data_treino"));
                    row.put("horaTreino", rs.getTime("hora_treino"));
                    row.put("observacoes", rs.getString("observacoes"));
                    row.put("numeroPresencas", rs.getInt("numero_presencas"));
                    lista.add(row);
                }
            }
        } catch (SQLException e) {
            LOGGER.severe(e.toString());
        }
        return lista;
    }

    public int inserirSessao(int clubeId, Date dataTreino, Time horaTreino, String observacoes) {
        String sql = "INSERT INTO sessoes_treino (clube_id, data_treino, hora_treino, observacoes) VALUES (?, ?, ?, ?)";
        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            ps.setInt(1, clubeId);
            ps.setDate(2, dataTreino);
            ps.setTime(3, horaTreino);
            ps.setString(4, observacoes);
            ps.executeUpdate();
            try (ResultSet keys = ps.getGeneratedKeys()) {
                if (keys.next()) {
                    return keys.getInt(1);
                }
            }
        } catch (SQLException e) {
            LOGGER.severe(e.toString());
        }
        return 0;
    }

    public void inserirPresencas(int sessaoId, Map<Integer, Boolean> presencas) {
        String sql = "INSERT INTO presencas_treino (sessao_treino_id, atleta_id, presente) VALUES (?, ?, ?)";
        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            for (Map.Entry<Integer, Boolean> entry : presencas.entrySet()) {
                if (entry.getValue()) {
                    ps.setInt(1, sessaoId);
                    ps.setInt(2, entry.getKey());
                    ps.setBoolean(3, entry.getValue());
                    ps.addBatch();
                }
            }
            ps.executeBatch();
        } catch (SQLException e) {
            LOGGER.severe(e.toString());
        }
    }

    public List<Map<String, Object>> obterAssiduidade(int clubeId, Date startDate, Date endDate) {
        String sql = """
            SELECT a.id AS atletaId,
                   COALESCE(u.nome, a.nome) AS nomeAtleta,
                   (SELECT COUNT(*) FROM sessoes_treino WHERE clube_id = ? AND data_treino BETWEEN ? AND ?) AS totalTreinos,
                   COUNT(st.id) AS presencas
            FROM atleta a
            LEFT JOIN utilizadores u ON a.utilizador_id = u.id
            LEFT JOIN presencas_treino pt ON pt.atleta_id = a.id AND pt.presente = 1
            LEFT JOIN sessoes_treino st ON st.id = pt.sessao_treino_id
                AND st.clube_id = ? AND st.data_treino BETWEEN ? AND ?
            WHERE a.clube_atual_id = ?
            GROUP BY a.id, nomeAtleta
            ORDER BY nomeAtleta
        """;
        List<Map<String, Object>> lista = new ArrayList<>();
        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, clubeId);
            ps.setDate(2, startDate);
            ps.setDate(3, endDate);
            ps.setInt(4, clubeId);
            ps.setDate(5, startDate);
            ps.setDate(6, endDate);
            ps.setInt(7, clubeId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("atletaId", rs.getInt("atletaId"));
                    row.put("nomeAtleta", rs.getString("nomeAtleta"));
                    
                    int totalTreinos = rs.getInt("totalTreinos");
                    int presencas = rs.getInt("presencas");
                    double percentagem = totalTreinos > 0 ? ((double) presencas / totalTreinos) * 100 : 0.0;
                    
                    row.put("totalTreinos", totalTreinos);
                    row.put("presencas", presencas);
                    row.put("percentagem", percentagem);
                    lista.add(row);
                }
            }
        } catch (SQLException e) {
            LOGGER.severe(e.toString());
        }
        return lista;
    }

    public int inserirPlanoTreino(int clubeId, int atletaId, String conteudo) {
        String sql = "INSERT INTO planos_treino (clube_id, atleta_id, conteudo) VALUES (?, ?, ?)";
        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            ps.setInt(1, clubeId);
            ps.setInt(2, atletaId);
            ps.setString(3, conteudo);
            ps.executeUpdate();
            try (ResultSet keys = ps.getGeneratedKeys()) {
                if (keys.next()) {
                    return keys.getInt(1);
                }
            }
        } catch (SQLException e) {
            LOGGER.severe(e.toString());
        }
        return 0;
    }

    public List<Map<String, Object>> listarPlanos(int clubeId) {
        String sql = """
            SELECT pt.id, pt.atleta_id, pt.conteudo, pt.data_criacao,
                   COALESCE(u.nome, a.nome) AS nome_atleta
            FROM planos_treino pt
            JOIN atleta a ON a.id = pt.atleta_id
            LEFT JOIN utilizadores u ON u.id = a.utilizador_id
            WHERE pt.clube_id = ?
            ORDER BY pt.data_criacao DESC
        """;
        List<Map<String, Object>> lista = new ArrayList<>();
        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, clubeId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("id", rs.getInt("id"));
                    row.put("atletaId", rs.getInt("atleta_id"));
                    row.put("conteudo", rs.getString("conteudo"));
                    row.put("dataCriacao", rs.getTimestamp("data_criacao"));
                    row.put("nomeAtleta", rs.getString("nome_atleta"));
                    lista.add(row);
                }
            }
        } catch (SQLException e) {
            LOGGER.severe(e.toString());
        }
        return lista;
    }

    public boolean atualizarPlano(int planoId, int atletaId, String conteudo) {
        String sql = "UPDATE planos_treino SET atleta_id = ?, conteudo = ? WHERE id = ?";
        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, atletaId);
            ps.setString(2, conteudo);
            ps.setInt(3, planoId);
            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            LOGGER.severe(e.toString());
            return false;
        }
    }

    public boolean removerPlano(int planoId) {
        String sql = "DELETE FROM planos_treino WHERE id = ?";
        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, planoId);
            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            LOGGER.severe(e.toString());
            return false;
        }
    }

    public List<Map<String, Object>> listarAtletasPorEscaloes(int clubeId, List<Integer> escalaoIds) {
        if (escalaoIds == null || escalaoIds.isEmpty()) {
            return Collections.emptyList();
        }
        
        String placeholders = String.join(",", Collections.nCopies(escalaoIds.size(), "?"));
        String sql = String.format("""
            SELECT a.id, COALESCE(u.nome, a.nome) AS nome
            FROM atleta a
            LEFT JOIN utilizadores u ON u.id = a.utilizador_id
            WHERE a.clube_atual_id = ? AND a.escalao_id IN (%s)
            ORDER BY nome
        """, placeholders);

        List<Map<String, Object>> lista = new ArrayList<>();
        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            
            ps.setInt(1, clubeId);
            int index = 2;
            for (Integer escalaoId : escalaoIds) {
                ps.setInt(index++, escalaoId);
            }

            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("id", rs.getInt("id"));
                    row.put("nome", rs.getString("nome"));
                    lista.add(row);
                }
            }
        } catch (SQLException e) {
            LOGGER.severe(e.toString());
        }
        return lista;
    }
}