package com.gestaoclubes.api.dao;

import com.gestaoclubes.api.model.NotificacaoPlataforma;
import com.gestaoclubes.api.util.ConexoBD;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.sql.Timestamp;
import java.sql.Types;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.logging.Logger;

public class NotificacaoPlataformaDAO {

    private static final Logger LOGGER = Logger.getLogger(NotificacaoPlataformaDAO.class.getName());

    public void inserir(NotificacaoPlataforma n) {
        String sql = """
            INSERT INTO notificacao_plataforma
                (utilizador_destino_id, tipo, mensagem, entidade_tipo, entidade_id,
                 registo_pendente_id, clube_id, coletividade_id, lida, resolvida, criada_em, resolvida_em)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """;

        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {

            ps.setInt(1, n.getUtilizadorDestinoId());
            ps.setString(2, n.getTipo());
            ps.setString(3, n.getMensagem());
            setNullableInt(ps, 4, n.getEntidadeTipo(), Types.VARCHAR);
            setNullableInt(ps, 5, n.getEntidadeId(), Types.INTEGER);
            setNullableInt(ps, 6, n.getRegistoPendenteId(), Types.INTEGER);
            setNullableInt(ps, 7, n.getClubeId(), Types.INTEGER);
            setNullableInt(ps, 8, n.getColetividadeId(), Types.INTEGER);
            ps.setBoolean(9, n.isLida());
            ps.setBoolean(10, n.isResolvida());
            ps.setTimestamp(11, Timestamp.valueOf(
                    n.getCriadaEm() != null ? n.getCriadaEm() : LocalDateTime.now()
            ));
            setNullableTimestamp(ps, 12, n.getResolvidaEm());

            ps.executeUpdate();

            try (ResultSet rs = ps.getGeneratedKeys()) {
                if (rs.next()) {
                    n.setId(rs.getLong(1));
                }
            }
        } catch (SQLException e) {
            LOGGER.warning("Erro ao inserir notificação de plataforma: " + e.getMessage());
        }
    }

    public List<Map<String, Object>> listarParaUtilizador(int utilizadorId, boolean apenasNaoResolvidas) {
        List<Map<String, Object>> lista = new ArrayList<>();
        String sql = """
            SELECT id, tipo, mensagem, entidade_tipo, entidade_id, registo_pendente_id,
                   clube_id, coletividade_id, lida, resolvida, criada_em, resolvida_em
            FROM notificacao_plataforma
            WHERE utilizador_destino_id = ?
            """ + (apenasNaoResolvidas ? " AND resolvida = FALSE" : "") + """
            ORDER BY criada_em DESC
        """;

        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setInt(1, utilizadorId);

            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    lista.add(mapRow(rs));
                }
            }
        } catch (SQLException e) {
            LOGGER.warning("Erro ao listar notificações de plataforma: " + e.getMessage());
        }

        return lista;
    }

    public int contarNaoResolvidasParaUtilizador(int utilizadorId) {
        String sql = """
            SELECT COUNT(*)
            FROM notificacao_plataforma
            WHERE utilizador_destino_id = ? AND resolvida = FALSE
        """;

        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setInt(1, utilizadorId);

            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return rs.getInt(1);
                }
            }
        } catch (SQLException e) {
            LOGGER.warning("Erro ao contar notificações de plataforma: " + e.getMessage());
        }

        return 0;
    }

    public boolean marcarLida(long id, int utilizadorId) {
        String sql = """
            UPDATE notificacao_plataforma
            SET lida = TRUE
            WHERE id = ? AND utilizador_destino_id = ?
        """;

        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setLong(1, id);
            ps.setInt(2, utilizadorId);
            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            LOGGER.warning("Erro ao marcar notificação como lida: " + e.getMessage());
            return false;
        }
    }

    public void resolverPorRegistoPendente(int registoPendenteId) {
        String sql = """
            UPDATE notificacao_plataforma
            SET resolvida = TRUE, resolvida_em = NOW()
            WHERE registo_pendente_id = ? AND resolvida = FALSE
        """;

        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setInt(1, registoPendenteId);
            ps.executeUpdate();
        } catch (SQLException e) {
            LOGGER.warning("Erro ao resolver notificações de plataforma: " + e.getMessage());
        }
    }

    public List<Integer> buscarAdminsESecretariosDoClube(int clubeId) {
        String sql = """
            SELECT id
            FROM utilizadores
            WHERE perfil_id IN (
                SELECT id FROM perfis WHERE UPPER(descricao) = 'ADMINISTRADOR'
            )
            AND clube_id = ?
            AND estado_registo = 'APROVADO'
            AND ativo = 1
            AND privilegios_ativos = 1
        """;
        return listarIds(sql, clubeId);
    }

    public List<Integer> buscarAdminsESecretariosDaColetividade(int coletividadeId) {
        String sql = """
            SELECT id
            FROM utilizadores
            WHERE perfil_id IN (
                SELECT id FROM perfis WHERE UPPER(descricao) = 'ADMINISTRADOR'
            )
            AND coletividade_id = ?
            AND estado_registo = 'APROVADO'
            AND ativo = 1
            AND privilegios_ativos = 1
        """;
        return listarIds(sql, coletividadeId);
    }

    public List<Integer> buscarSuperAdmins() {
        String sql = """
            SELECT id
            FROM utilizadores
            WHERE perfil_id IN (
                SELECT id FROM perfis WHERE UPPER(descricao) IN ('SUPER_ADMIN', 'ADMIN')
            )
            AND estado_registo = 'APROVADO'
            AND ativo = 1
        """;
        return listarIds(sql, null);
    }

    private List<Integer> listarIds(String sql, Integer estruturaId) {
        List<Integer> ids = new ArrayList<>();

        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            if (estruturaId != null) {
                ps.setInt(1, estruturaId);
            }

            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    ids.add(rs.getInt("id"));
                }
            }
        } catch (SQLException e) {
            LOGGER.warning("Erro ao listar destinatários de notificações: " + e.getMessage());
        }

        return ids;
    }

    private Map<String, Object> mapRow(ResultSet rs) throws SQLException {
        Map<String, Object> row = new LinkedHashMap<>();
        row.put("id", rs.getLong("id"));
        row.put("tipo", rs.getString("tipo"));
        row.put("mensagem", rs.getString("mensagem"));
        row.put("entidadeTipo", rs.getString("entidade_tipo"));
        row.put("entidadeId", rs.getObject("entidade_id"));
        row.put("registoPendenteId", rs.getObject("registo_pendente_id"));
        row.put("clubeId", rs.getObject("clube_id"));
        row.put("coletividadeId", rs.getObject("coletividade_id"));
        row.put("lida", rs.getBoolean("lida"));
        row.put("resolvida", rs.getBoolean("resolvida"));
        row.put("criadaEm", toLocalDateTime(rs.getTimestamp("criada_em")));
        row.put("resolvidaEm", toLocalDateTime(rs.getTimestamp("resolvida_em")));
        return row;
    }

    private LocalDateTime toLocalDateTime(Timestamp timestamp) {
        return timestamp == null ? null : timestamp.toLocalDateTime();
    }

    private void setNullableInt(PreparedStatement ps, int index, Object value, int sqlType) throws SQLException {
        if (value == null) {
            ps.setNull(index, sqlType);
        } else if (sqlType == Types.INTEGER) {
            ps.setInt(index, (Integer) value);
        } else {
            ps.setString(index, String.valueOf(value));
        }
    }

    private void setNullableTimestamp(PreparedStatement ps, int index, LocalDateTime value) throws SQLException {
        if (value == null) {
            ps.setNull(index, Types.TIMESTAMP);
        } else {
            ps.setTimestamp(index, Timestamp.valueOf(value));
        }
    }
}
