package com.gestaoclubes.api.dao;

import com.gestaoclubes.api.util.ConexoBD;

import java.util.logging.Logger;
import java.sql.*;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public class TransferenciaAtletaDAO {

    private static final Logger LOGGER = Logger.getLogger(TransferenciaAtletaDAO.class.getName());

    /**
     * Regista uma transferência. clubeDestinoId pode ser null se o destino for desconhecido.
     */
    public boolean inserir(int atletaId, int clubeOrigemId, Integer clubeDestinoId, Date data, String obs) {
        String sql = """
            INSERT INTO transferencia_atleta
            (atleta_id, clube_origem_id, clube_destino_id, data_transferencia, observacoes)
            VALUES (?, ?, ?, ?, ?)
        """;

        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, atletaId);
            ps.setInt(2, clubeOrigemId);
            if (clubeDestinoId != null && clubeDestinoId > 0) {
                ps.setInt(3, clubeDestinoId);
            } else {
                ps.setNull(3, Types.INTEGER);
            }
            ps.setDate(4, data);
            ps.setString(5, obs);
            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            LOGGER.severe(e.toString());
            return false;
        }
    }

    /**
     * Lista transferências em que o clube foi origem ou destino,
     * com dados completos do atleta, modalidade e escalão.
     */
    public List<Map<String, Object>> listarPorClube(int clubeId) {
        List<Map<String, Object>> lista = new ArrayList<>();
        String sql = """
            SELECT t.id,
                   COALESCE(u.nome, a.nome) AS atleta_nome,
                   a.id                     AS atleta_id,
                   co.nome                  AS clube_origem,
                   cd.nome                  AS clube_destino,
                   t.clube_origem_id,
                   t.clube_destino_id,
                   t.data_transferencia,
                   t.observacoes,
                   e.nome                   AS escalao,
                   m.nome                   AS modalidade
            FROM transferencia_atleta t
            JOIN atleta a  ON a.id  = t.atleta_id
            LEFT JOIN utilizadores u ON u.id = a.utilizador_id
            JOIN clube co ON co.id  = t.clube_origem_id
            LEFT JOIN clube cd ON cd.id = t.clube_destino_id
            LEFT JOIN escalao e ON e.id = a.escalao_id
            LEFT JOIN atleta_clube_modalidade acm
                   ON acm.atleta_id = a.id
                  AND acm.clube_modalidade_id = (
                          SELECT cm2.id FROM clube_modalidade cm2
                          WHERE cm2.clube_id = t.clube_origem_id
                          ORDER BY cm2.id DESC LIMIT 1
                      )
            LEFT JOIN clube_modalidade cm ON cm.id = acm.clube_modalidade_id
            LEFT JOIN modalidade m ON m.id = cm.modalidade_id
            WHERE t.clube_origem_id = ? OR t.clube_destino_id = ?
            ORDER BY t.data_transferencia DESC, atleta_nome
        """;

        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, clubeId);
            ps.setInt(2, clubeId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("id", rs.getInt("id"));
                    row.put("atletaId", rs.getInt("atleta_id"));
                    row.put("atletaNome", rs.getString("atleta_nome"));
                    row.put("clubeOrigem", rs.getString("clube_origem"));
                    row.put("clubeOrigemId", rs.getInt("clube_origem_id"));
                    row.put("clubeDestino", rs.getString("clube_destino"));
                    int cdId = rs.getInt("clube_destino_id");
                    row.put("clubeDestinoId", rs.wasNull() ? null : cdId);
                    row.put("dataTransferencia", rs.getDate("data_transferencia") != null
                            ? rs.getDate("data_transferencia").toString() : null);
                    row.put("observacoes", rs.getString("observacoes"));
                    row.put("escalao", rs.getString("escalao"));
                    row.put("modalidade", rs.getString("modalidade"));
                    row.put("tipo", "Atleta");
                    lista.add(row);
                }
            }
        } catch (SQLException e) {
            LOGGER.severe(e.toString());
        }
        return lista;
    }
}
