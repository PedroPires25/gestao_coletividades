package com.gestaoclubes.api.dao;

import com.gestaoclubes.api.util.ConexoBD;
import org.springframework.stereotype.Repository;

import java.sql.*;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.logging.Logger;

@Repository
public class EventoColetividadeDAO {

    private static final Logger LOGGER = Logger.getLogger(EventoColetividadeDAO.class.getName());

    public List<Map<String, Object>> listarEventos(int coletividadeId, String estado, Integer coletividadeAtividadeId) {
        List<Map<String, Object>> lista = new ArrayList<>();
        StringBuilder sql = new StringBuilder("""
            SELECT ce.id, ce.coletividade_id, ce.coletividade_atividade_id, ce.titulo, ce.descricao,
                   ce.data_evento, ce.hora_inicio, ce.hora_fim, ce.local_evento, ce.responsavel,
                   ce.max_participantes, ce.permite_inscricao, ce.estado, ce.criado_por,
                   ce.created_at, ce.updated_at,
                   a.nome AS atividade_nome,
                   (
                       SELECT COUNT(*)
                       FROM coletividade_evento_inscricao cei
                       WHERE cei.evento_id = ce.id
                         AND cei.estado = 'Confirmado'
                   ) AS participantes_confirmados
            FROM coletividade_evento ce
            LEFT JOIN coletividade_atividade ca ON ca.id = ce.coletividade_atividade_id
            LEFT JOIN atividade a ON a.id = ca.atividade_id
            WHERE ce.coletividade_id = ?
        """);

        List<Object> params = new ArrayList<>();
        params.add(coletividadeId);

        if (estado != null && !estado.isBlank()) {
            sql.append(" AND ce.estado = ?");
            params.add(estado);
        }
        if (coletividadeAtividadeId != null) {
            sql.append(" AND ce.coletividade_atividade_id = ?");
            params.add(coletividadeAtividadeId);
        }

        sql.append(" ORDER BY ce.data_evento DESC, ce.hora_inicio DESC, ce.titulo");

        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql.toString())) {

            for (int i = 0; i < params.size(); i++) {
                ps.setObject(i + 1, params.get(i));
            }

            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    lista.add(mapEvento(rs));
                }
            }
        } catch (Exception e) {
            LOGGER.severe(e.toString());
        }

        return lista;
    }

    public List<Map<String, Object>> listarTodosEventos(String estado) {
        List<Map<String, Object>> lista = new ArrayList<>();
        StringBuilder sql = new StringBuilder("""
            SELECT ce.id, ce.coletividade_id, ce.coletividade_atividade_id, ce.titulo, ce.descricao,
                   ce.data_evento, ce.hora_inicio, ce.hora_fim, ce.local_evento, ce.responsavel,
                   ce.max_participantes, ce.permite_inscricao, ce.estado, ce.criado_por,
                   ce.created_at, ce.updated_at,
                   a.nome AS atividade_nome,
                   (
                       SELECT COUNT(*)
                       FROM coletividade_evento_inscricao cei
                       WHERE cei.evento_id = ce.id
                         AND cei.estado = 'Confirmado'
                   ) AS participantes_confirmados
            FROM coletividade_evento ce
            LEFT JOIN coletividade_atividade ca ON ca.id = ce.coletividade_atividade_id
            LEFT JOIN atividade a ON a.id = ca.atividade_id
            WHERE ce.data_evento >= CURRENT_DATE
        """);

        List<Object> params = new ArrayList<>();

        if (estado != null && !estado.isBlank()) {
            sql.append(" AND ce.estado = ?");
            params.add(estado);
        }

        sql.append(" ORDER BY ce.data_evento ASC, ce.hora_inicio ASC, ce.titulo");

        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql.toString())) {

            for (int i = 0; i < params.size(); i++) {
                ps.setObject(i + 1, params.get(i));
            }

            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    lista.add(mapEvento(rs));
                }
            }
        } catch (Exception e) {
            LOGGER.severe(e.toString());
        }

        return lista;
    }

    public Map<String, Object> obterEvento(int id) {
        String sql = """
            SELECT ce.id, ce.coletividade_id, ce.coletividade_atividade_id, ce.titulo, ce.descricao,
                   ce.data_evento, ce.hora_inicio, ce.hora_fim, ce.local_evento, ce.responsavel,
                   ce.max_participantes, ce.permite_inscricao, ce.estado, ce.criado_por,
                   ce.created_at, ce.updated_at,
                   a.nome AS atividade_nome,
                   (
                       SELECT COUNT(*)
                       FROM coletividade_evento_inscricao cei
                       WHERE cei.evento_id = ce.id
                         AND cei.estado = 'Confirmado'
                   ) AS participantes_confirmados
            FROM coletividade_evento ce
            LEFT JOIN coletividade_atividade ca ON ca.id = ce.coletividade_atividade_id
            LEFT JOIN atividade a ON a.id = ca.atividade_id
            WHERE ce.id = ?
        """;

        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, id);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return mapEvento(rs);
                }
            }
        } catch (Exception e) {
            LOGGER.severe(e.toString());
        }

        return null;
    }

    public int criarEvento(int coletividadeId, Integer coletividadeAtividadeId, String titulo, String descricao,
                           String dataEvento, String horaInicio, String horaFim, String localEvento, String responsavel,
                           Integer maxParticipantes, boolean permiteInscricao, String estado, Integer criadoPor) {
        String sql = """
            INSERT INTO coletividade_evento
            (coletividade_id, coletividade_atividade_id, titulo, descricao, data_evento, hora_inicio, hora_fim,
             local_evento, responsavel, max_participantes, permite_inscricao, estado, criado_por)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """;

        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            ps.setInt(1, coletividadeId);
            setNullableInteger(ps, 2, coletividadeAtividadeId);
            ps.setString(3, titulo);
            setNullableText(ps, 4, descricao);
            ps.setString(5, dataEvento);
            setNullableTime(ps, 6, horaInicio);
            setNullableTime(ps, 7, horaFim);
            setNullableText(ps, 8, localEvento);
            setNullableText(ps, 9, responsavel);
            setNullableInteger(ps, 10, maxParticipantes);
            ps.setBoolean(11, permiteInscricao);
            ps.setString(12, estado == null || estado.isBlank() ? "Aberto" : estado);
            setNullableInteger(ps, 13, criadoPor);
            ps.executeUpdate();

            try (ResultSet rs = ps.getGeneratedKeys()) {
                if (rs.next()) return rs.getInt(1);
            }
        } catch (Exception e) {
            LOGGER.severe(e.toString());
        }

        return 0;
    }

    public boolean atualizarEvento(int id, String titulo, String descricao, String dataEvento, String horaInicio,
                                   String horaFim, String localEvento, String responsavel, Integer maxParticipantes,
                                   boolean permiteInscricao, String estado) {
        String sql = """
            UPDATE coletividade_evento
            SET titulo = ?, descricao = ?, data_evento = ?, hora_inicio = ?, hora_fim = ?, local_evento = ?,
                responsavel = ?, max_participantes = ?, permite_inscricao = ?, estado = ?
            WHERE id = ?
        """;

        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, titulo);
            setNullableText(ps, 2, descricao);
            ps.setString(3, dataEvento);
            setNullableTime(ps, 4, horaInicio);
            setNullableTime(ps, 5, horaFim);
            setNullableText(ps, 6, localEvento);
            setNullableText(ps, 7, responsavel);
            setNullableInteger(ps, 8, maxParticipantes);
            ps.setBoolean(9, permiteInscricao);
            ps.setString(10, estado == null || estado.isBlank() ? "Aberto" : estado);
            ps.setInt(11, id);
            return ps.executeUpdate() > 0;
        } catch (Exception e) {
            LOGGER.severe(e.toString());
            return false;
        }
    }

    public boolean eliminarEvento(int id) {
        String sql = "DELETE FROM coletividade_evento WHERE id = ?";
        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, id);
            return ps.executeUpdate() > 0;
        } catch (Exception e) {
            LOGGER.severe(e.toString());
            return false;
        }
    }

    public List<Map<String, Object>> listarInscricoes(int eventoId) {
        List<Map<String, Object>> lista = new ArrayList<>();
        String sql = """
            SELECT cei.id, cei.evento_id, cei.inscrito_id, cei.utilizador_id, cei.nome_participante,
                   cei.estado, cei.data_inscricao,
                   COALESCE(i.nome, cei.nome_participante, u.nome, u.utilizador) AS participante_nome,
                   i.email AS inscrito_email,
                   i.telefone AS inscrito_telefone
            FROM coletividade_evento_inscricao cei
            LEFT JOIN inscrito i ON i.id = cei.inscrito_id
            LEFT JOIN utilizadores u ON u.id = cei.utilizador_id
            WHERE cei.evento_id = ?
            ORDER BY FIELD(cei.estado, 'Confirmado', 'Lista de espera', 'Cancelado'), participante_nome
        """;

        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, eventoId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("id", rs.getInt("id"));
                    row.put("eventoId", rs.getInt("evento_id"));
                    row.put("inscritoId", rs.getObject("inscrito_id"));
                    row.put("utilizadorId", rs.getObject("utilizador_id"));
                    row.put("nomeParticipante", rs.getString("nome_participante"));
                    row.put("participanteNome", rs.getString("participante_nome"));
                    row.put("estado", rs.getString("estado"));
                    row.put("dataInscricao", rs.getString("data_inscricao"));
                    row.put("email", rs.getString("inscrito_email"));
                    row.put("telefone", rs.getString("inscrito_telefone"));
                    lista.add(row);
                }
            }
        } catch (Exception e) {
            LOGGER.severe(e.toString());
        }
        return lista;
    }

    public int inscreverParticipante(int eventoId, Integer inscritoId, Integer utilizadorId, String nomeParticipante) {
        String sql = """
            INSERT INTO coletividade_evento_inscricao
            (evento_id, inscrito_id, utilizador_id, nome_participante, estado)
            SELECT ce.id, ?, ?, ?,
                   CASE
                       WHEN ce.max_participantes IS NOT NULL
                        AND (
                            SELECT COUNT(*)
                            FROM coletividade_evento_inscricao cei2
                            WHERE cei2.evento_id = ce.id
                              AND cei2.estado = 'Confirmado'
                        ) >= ce.max_participantes
                       THEN 'Lista de espera'
                       ELSE 'Confirmado'
                   END
            FROM coletividade_evento ce
            WHERE ce.id = ?
        """;

        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            setNullableInteger(ps, 1, inscritoId);
            setNullableInteger(ps, 2, utilizadorId);
            setNullableText(ps, 3, nomeParticipante);
            ps.setInt(4, eventoId);
            ps.executeUpdate();

            try (ResultSet rs = ps.getGeneratedKeys()) {
                if (rs.next()) return rs.getInt(1);
            }
        } catch (Exception e) {
            LOGGER.severe(e.toString());
        }

        return 0;
    }

    public boolean cancelarInscricao(int eventoId, Integer inscritoId) {
        String sql = """
            UPDATE coletividade_evento_inscricao
            SET estado = 'Cancelado'
            WHERE evento_id = ?
              AND inscrito_id = ?
        """;

        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, eventoId);
            setNullableInteger(ps, 2, inscritoId);
            return ps.executeUpdate() > 0;
        } catch (Exception e) {
            LOGGER.severe(e.toString());
            return false;
        }
    }

    public int contarParticipantes(int eventoId) {
        String sql = """
            SELECT COUNT(*)
            FROM coletividade_evento_inscricao
            WHERE evento_id = ?
              AND estado = 'Confirmado'
        """;

        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, eventoId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) return rs.getInt(1);
            }
        } catch (Exception e) {
            LOGGER.severe(e.toString());
        }

        return 0;
    }

    public boolean eventoPertenceColetividade(int coletividadeId, int eventoId) {
        String sql = "SELECT 1 FROM coletividade_evento WHERE id = ? AND coletividade_id = ?";
        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, eventoId);
            ps.setInt(2, coletividadeId);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next();
            }
        } catch (Exception e) {
            LOGGER.severe(e.toString());
            return false;
        }
    }

    public boolean cancelarInscricaoPorId(int eventoId, int inscricaoId) {
        String sql = """
            UPDATE coletividade_evento_inscricao
            SET estado = 'Cancelado'
            WHERE id = ?
              AND evento_id = ?
        """;
        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, inscricaoId);
            ps.setInt(2, eventoId);
            return ps.executeUpdate() > 0;
        } catch (Exception e) {
            LOGGER.severe(e.toString());
            return false;
        }
    }

    public Map<String, Object> obterInscricao(int eventoId, int inscricaoId) {
        String sql = """
            SELECT id, evento_id, inscrito_id, utilizador_id, nome_participante, estado, data_inscricao
            FROM coletividade_evento_inscricao
            WHERE id = ?
              AND evento_id = ?
        """;
        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, inscricaoId);
            ps.setInt(2, eventoId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("id", rs.getInt("id"));
                    row.put("eventoId", rs.getInt("evento_id"));
                    row.put("inscritoId", rs.getObject("inscrito_id"));
                    row.put("utilizadorId", rs.getObject("utilizador_id"));
                    row.put("nomeParticipante", rs.getString("nome_participante"));
                    row.put("estado", rs.getString("estado"));
                    row.put("dataInscricao", rs.getString("data_inscricao"));
                    return row;
                }
            }
        } catch (Exception e) {
            LOGGER.severe(e.toString());
        }
        return null;
    }

    private Map<String, Object> mapEvento(ResultSet rs) throws SQLException {
        Map<String, Object> row = new LinkedHashMap<>();
        row.put("id", rs.getInt("id"));
        row.put("coletividadeId", rs.getInt("coletividade_id"));
        row.put("coletividadeAtividadeId", rs.getObject("coletividade_atividade_id"));
        row.put("titulo", rs.getString("titulo"));
        row.put("descricao", rs.getString("descricao"));
        row.put("dataEvento", rs.getString("data_evento"));
        row.put("horaInicio", rs.getString("hora_inicio"));
        row.put("horaFim", rs.getString("hora_fim"));
        row.put("localEvento", rs.getString("local_evento"));
        row.put("responsavel", rs.getString("responsavel"));
        row.put("maxParticipantes", rs.getObject("max_participantes"));
        row.put("permiteInscricao", rs.getBoolean("permite_inscricao"));
        row.put("estado", rs.getString("estado"));
        row.put("criadoPor", rs.getObject("criado_por"));
        row.put("createdAt", rs.getString("created_at"));
        row.put("updatedAt", rs.getString("updated_at"));
        row.put("atividadeNome", rs.getString("atividade_nome"));
        row.put("participantesConfirmados", rs.getInt("participantes_confirmados"));
        return row;
    }

    private void setNullableText(PreparedStatement ps, int index, String value) throws SQLException {
        if (value == null || value.isBlank()) ps.setNull(index, Types.VARCHAR);
        else ps.setString(index, value);
    }

    private void setNullableTime(PreparedStatement ps, int index, String value) throws SQLException {
        if (value == null || value.isBlank()) ps.setNull(index, Types.TIME);
        else ps.setString(index, value);
    }

    private void setNullableInteger(PreparedStatement ps, int index, Integer value) throws SQLException {
        if (value == null) ps.setNull(index, Types.INTEGER);
        else ps.setInt(index, value);
    }
}
