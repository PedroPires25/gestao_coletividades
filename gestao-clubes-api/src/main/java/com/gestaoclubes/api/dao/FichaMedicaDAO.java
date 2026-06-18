package com.gestaoclubes.api.dao;

import com.gestaoclubes.api.util.ConexoBD;

import java.util.logging.Logger;
import java.sql.*;
import java.util.LinkedHashMap;
import java.util.Map;

public class FichaMedicaDAO {

    private static final Logger LOGGER = Logger.getLogger(FichaMedicaDAO.class.getName());

    public Map<String, Object> buscarPorAtletaEClube(int atletaId, int clubeId) {
        String sql = """
            SELECT fm.*, COALESCE(u.nome, a.nome) AS atleta_nome
            FROM ficha_medica fm
            JOIN atleta a ON a.id = fm.atleta_id
            LEFT JOIN utilizadores u ON u.id = a.utilizador_id
            WHERE fm.atleta_id = ? AND fm.clube_id = ?
            LIMIT 1
        """;
        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, atletaId);
            ps.setInt(2, clubeId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) return mapRow(rs);
            }
        } catch (SQLException e) {
            LOGGER.severe(e.toString());
        }
        return null;
    }

    public int inserirOuAtualizar(int atletaId, int clubeId,
                                   String grupoSanguineo, String alergias,
                                   String condicoesCronicas, String contactoEmergenciaNome,
                                   String contactoEmergenciaTelefone, String notasGerais) {
        String sql = """
            INSERT INTO ficha_medica
              (atleta_id, clube_id, grupo_sanguineo, alergias, condicoes_cronicas,
               contacto_emergencia_nome, contacto_emergencia_telefone, notas_gerais)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
              grupo_sanguineo = VALUES(grupo_sanguineo),
              alergias = VALUES(alergias),
              condicoes_cronicas = VALUES(condicoes_cronicas),
              contacto_emergencia_nome = VALUES(contacto_emergencia_nome),
              contacto_emergencia_telefone = VALUES(contacto_emergencia_telefone),
              notas_gerais = VALUES(notas_gerais),
              atualizado_em = CURRENT_TIMESTAMP
        """;
        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            ps.setInt(1, atletaId);
            ps.setInt(2, clubeId);
            ps.setString(3, grupoSanguineo);
            ps.setString(4, alergias);
            ps.setString(5, condicoesCronicas);
            ps.setString(6, contactoEmergenciaNome);
            ps.setString(7, contactoEmergenciaTelefone);
            ps.setString(8, notasGerais);
            ps.executeUpdate();
            try (ResultSet keys = ps.getGeneratedKeys()) {
                if (keys.next()) return keys.getInt(1);
            }
            // Upsert: return existing id
            Map<String, Object> existing = buscarPorAtletaEClube(atletaId, clubeId);
            return existing != null ? ((Number) existing.get("id")).intValue() : 0;
        } catch (SQLException e) {
            LOGGER.severe(e.toString());
            return 0;
        }
    }

    private Map<String, Object> mapRow(ResultSet rs) throws SQLException {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", rs.getInt("id"));
        m.put("atletaId", rs.getInt("atleta_id"));
        m.put("clubeId", rs.getInt("clube_id"));
        m.put("atletaNome", rs.getString("atleta_nome"));
        m.put("grupoSanguineo", rs.getString("grupo_sanguineo"));
        m.put("alergias", rs.getString("alergias"));
        m.put("condicoesCronicas", rs.getString("condicoes_cronicas"));
        m.put("contactoEmergenciaNome", rs.getString("contacto_emergencia_nome"));
        m.put("contactoEmergenciaTelefone", rs.getString("contacto_emergencia_telefone"));
        m.put("notasGerais", rs.getString("notas_gerais"));
        m.put("atualizadoEm", tsStr(rs.getTimestamp("atualizado_em")));
        return m;
    }

    private static String tsStr(java.sql.Timestamp t) {
        return t != null ? t.toString().substring(0, 19) : null;
    }
}
