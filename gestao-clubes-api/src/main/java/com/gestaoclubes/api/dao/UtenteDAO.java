package com.gestaoclubes.api.dao;

import com.gestaoclubes.api.model.Utente;
import com.gestaoclubes.api.util.ConexoBD;
import org.springframework.stereotype.Repository;

import java.sql.*;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.logging.Logger;

@Repository
public class UtenteDAO {

    private static final Logger LOGGER = Logger.getLogger(UtenteDAO.class.getName());

    public List<Utente> listarPorColetividadeAtividade(int coletividadeId, int coletividadeAtividadeId) {
        List<Utente> lista = new ArrayList<>();

        String sql = """
            SELECT ica.id AS inscricao_id, ca.id AS coletividade_atividade_id,
                   i.id, COALESCE(ut.nome, i.nome) AS nome, i.data_nascimento, i.email, i.telefone, i.morada,
                   i.coletividade_atual_id, i.estado_id,
                   ei.descricao AS estado_descricao,
                   a.nome AS atividade_nome,
                   ica.data_inscricao, ica.data_fim, ica.ativo
            FROM inscrito_coletividade_atividade ica
            INNER JOIN inscrito i ON i.id = ica.inscrito_id
            LEFT JOIN utilizadores ut ON ut.id = i.utilizador_id
            INNER JOIN estado_inscrito ei ON ei.id = i.estado_id
            INNER JOIN coletividade_atividade ca ON ca.id = ica.coletividade_atividade_id
            INNER JOIN atividade a ON a.id = ca.atividade_id
            WHERE ca.coletividade_id = ?
              AND ca.id = ?
            ORDER BY nome
        """;

        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setInt(1, coletividadeId);
            ps.setInt(2, coletividadeAtividadeId);

            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    Utente u = new Utente();
                    u.setId(rs.getInt("id"));
                    u.setInscricaoId(rs.getInt("inscricao_id"));
                    u.setColetividadeAtividadeId(rs.getInt("coletividade_atividade_id"));
                    u.setNome(rs.getString("nome"));
                    u.setDataNascimento(rs.getString("data_nascimento"));
                    u.setEmail(rs.getString("email"));
                    u.setTelefone(rs.getString("telefone"));
                    u.setMorada(rs.getString("morada"));
                    u.setColetividadeAtualId(rs.getInt("coletividade_atual_id"));
                    u.setEstadoId(rs.getInt("estado_id"));
                    u.setEstadoDescricao(rs.getString("estado_descricao"));
                    u.setAtividadeNome(rs.getString("atividade_nome"));
                    u.setDataInscricao(rs.getString("data_inscricao"));
                    u.setDataFim(rs.getString("data_fim"));
                    u.setAtivo(rs.getBoolean("ativo"));
                    lista.add(u);
                }
            }
        } catch (Exception e) {
            LOGGER.severe(e.toString());
        }

        return lista;
    }

    public List<Map<String, Object>> listarTodosPorColetividade(int coletividadeId) {
        List<Map<String, Object>> lista = new ArrayList<>();

        String sql = """
            SELECT i.id,
                   COALESCE(ut.nome, i.nome) AS nome,
                   i.data_nascimento,
                   i.email,
                   i.telefone,
                   i.morada,
                   i.coletividade_atual_id,
                   i.estado_id,
                   ei.descricao AS estado_descricao,
                   ica.id AS inscricao_id,
                   ca.id AS coletividade_atividade_id,
                   a.id AS atividade_id,
                   a.nome AS atividade_nome,
                   ica.data_inscricao,
                   ica.data_fim,
                   ica.ativo
            FROM inscrito i
            INNER JOIN inscrito_coletividade_atividade ica ON ica.inscrito_id = i.id
            INNER JOIN coletividade_atividade ca ON ca.id = ica.coletividade_atividade_id
            INNER JOIN atividade a ON a.id = ca.atividade_id
            INNER JOIN estado_inscrito ei ON ei.id = i.estado_id
            LEFT JOIN utilizadores ut ON ut.id = i.utilizador_id
            WHERE ca.coletividade_id = ?
            ORDER BY nome, a.nome, ica.id
        """;

        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setInt(1, coletividadeId);

            Map<Integer, Map<String, Object>> agrupado = new LinkedHashMap<>();

            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    int inscritoId = rs.getInt("id");
                    Map<String, Object> row = agrupado.get(inscritoId);

                    if (row == null) {
                        row = new LinkedHashMap<>();
                        row.put("id", inscritoId);
                        row.put("nome", rs.getString("nome"));
                        row.put("dataNascimento", rs.getString("data_nascimento"));
                        row.put("email", rs.getString("email"));
                        row.put("telefone", rs.getString("telefone"));
                        row.put("morada", rs.getString("morada"));
                        row.put("coletividadeAtualId", rs.getInt("coletividade_atual_id"));
                        row.put("estadoId", rs.getInt("estado_id"));
                        row.put("estadoDescricao", rs.getString("estado_descricao"));
                        row.put("atividades", new ArrayList<Map<String, Object>>());
                        agrupado.put(inscritoId, row);
                    }

                    @SuppressWarnings("unchecked")
                    List<Map<String, Object>> atividades = (List<Map<String, Object>>) row.get("atividades");

                    Map<String, Object> atividade = new LinkedHashMap<>();
                    atividade.put("inscricaoId", rs.getInt("inscricao_id"));
                    atividade.put("coletividadeAtividadeId", rs.getInt("coletividade_atividade_id"));
                    atividade.put("atividadeId", rs.getInt("atividade_id"));
                    atividade.put("atividadeNome", rs.getString("atividade_nome"));
                    atividade.put("dataInscricao", rs.getString("data_inscricao"));
                    atividade.put("dataFim", rs.getString("data_fim"));
                    atividade.put("ativo", rs.getBoolean("ativo"));
                    atividades.add(atividade);
                }
            }

            for (Map<String, Object> row : agrupado.values()) {
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> atividades = (List<Map<String, Object>>) row.get("atividades");
                List<String> nomes = new ArrayList<>();
                for (Map<String, Object> atividade : atividades) {
                    Object nome = atividade.get("atividadeNome");
                    if (nome != null && !nomes.contains(String.valueOf(nome))) {
                        nomes.add(String.valueOf(nome));
                    }
                }
                row.put("atividadesTexto", String.join(", ", nomes));
            }

            lista.addAll(agrupado.values());
        } catch (Exception e) {
            LOGGER.severe(e.toString());
        }

        return lista;
    }

    public Integer criarUtente(Utente u, int coletividadeAtividadeId) {
        Connection conn = null;
        try {
            conn = ConexoBD.getConnection();
            conn.setAutoCommit(false);

            String sqlInscrito = """
                INSERT INTO inscrito (nome, data_nascimento, email, telefone, morada, coletividade_atual_id, estado_id, utilizador_id)
                SELECT ?, ?, ?, ?, ?, ca.coletividade_id, ?,
                       (SELECT id FROM utilizadores WHERE LOWER(utilizador) = LOWER(?) LIMIT 1)
                FROM coletividade_atividade ca
                WHERE ca.id = ?
            """;

            Integer inscritoId = null;

            try (PreparedStatement ps = conn.prepareStatement(sqlInscrito, Statement.RETURN_GENERATED_KEYS)) {
                ps.setString(1, u.getNome());
                setNullableString(ps, 2, u.getDataNascimento());
                setNullableString(ps, 3, u.getEmail());
                setNullableString(ps, 4, u.getTelefone());
                setNullableString(ps, 5, u.getMorada());
                ps.setInt(6, u.getEstadoId() == null ? 1 : u.getEstadoId());
                setNullableString(ps, 7, u.getEmail());
                ps.setInt(8, coletividadeAtividadeId);
                ps.executeUpdate();

                try (ResultSet rs = ps.getGeneratedKeys()) {
                    if (rs.next()) inscritoId = rs.getInt(1);
                }
            }

            if (inscritoId == null) {
                conn.rollback();
                return null;
            }

            Integer ligacaoId = adicionarAtividade(conn, inscritoId, coletividadeAtividadeId, u.getDataInscricao(), u.getDataFim(), u.getAtivo());
            if (ligacaoId == null) {
                conn.rollback();
                return null;
            }

            conn.commit();
            return inscritoId;
        } catch (Exception e) {
            LOGGER.severe(e.toString());
            try {
                if (conn != null) conn.rollback();
            } catch (Exception ignored) {
            }
            return null;
        } finally {
            try {
                if (conn != null) conn.setAutoCommit(true);
            } catch (Exception ignored) {
            }
        }
    }

    public boolean atualizarUtente(int id, String nome, String dataNascimento, String email, String telefone, String morada, int estadoId) {
        String sql = """
            UPDATE inscrito
            SET nome = ?, data_nascimento = ?, email = ?, telefone = ?, morada = ?, estado_id = ?
            WHERE id = ?
        """;

        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setString(1, nome);
            setNullableString(ps, 2, dataNascimento);
            setNullableString(ps, 3, email);
            setNullableString(ps, 4, telefone);
            setNullableString(ps, 5, morada);
            ps.setInt(6, estadoId);
            ps.setInt(7, id);
            return ps.executeUpdate() > 0;
        } catch (Exception e) {
            LOGGER.severe(e.toString());
            return false;
        }
    }

    public boolean removerInscricaoAtividade(int inscricaoId) {
        String sql = "DELETE FROM inscrito_coletividade_atividade WHERE id = ?";
        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, inscricaoId);
            return ps.executeUpdate() > 0;
        } catch (Exception e) {
            LOGGER.severe(e.toString());
            return false;
        }
    }

    public Integer adicionarAtividade(int inscritoId, int coletividadeAtividadeId, String dataInscricao) {
        try (Connection conn = ConexoBD.getConnection()) {
            return adicionarAtividade(conn, inscritoId, coletividadeAtividadeId, dataInscricao, null, true);
        } catch (Exception e) {
            LOGGER.severe(e.toString());
            return null;
        }
    }

    public boolean utentePertenceColetividade(int coletividadeId, int inscritoId) {
        String sql = """
            SELECT 1
            FROM inscrito i
            WHERE i.id = ?
              AND i.coletividade_atual_id = ?
        """;

        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, inscritoId);
            ps.setInt(2, coletividadeId);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next();
            }
        } catch (Exception e) {
            LOGGER.severe(e.toString());
            return false;
        }
    }

    public boolean inscricaoPertenceAoUtente(int coletividadeId, int inscritoId, int inscricaoId) {
        String sql = """
            SELECT 1
            FROM inscrito_coletividade_atividade ica
            INNER JOIN coletividade_atividade ca ON ca.id = ica.coletividade_atividade_id
            WHERE ica.id = ?
              AND ica.inscrito_id = ?
              AND ca.coletividade_id = ?
        """;

        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, inscricaoId);
            ps.setInt(2, inscritoId);
            ps.setInt(3, coletividadeId);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next();
            }
        } catch (Exception e) {
            LOGGER.severe(e.toString());
            return false;
        }
    }

    private Integer adicionarAtividade(Connection conn, int inscritoId, int coletividadeAtividadeId, String dataInscricao, String dataFim, Boolean ativo) throws SQLException {
        String sqlLigacao = """
            INSERT INTO inscrito_coletividade_atividade
            (inscrito_id, coletividade_atividade_id, data_inscricao, data_fim, ativo)
            SELECT ?, ca.id, ?, ?, ?
            FROM coletividade_atividade ca
            INNER JOIN inscrito i ON i.id = ?
            WHERE ca.id = ?
              AND ca.coletividade_id = i.coletividade_atual_id
              AND NOT EXISTS (
                  SELECT 1
                  FROM inscrito_coletividade_atividade x
                  WHERE x.inscrito_id = ?
                    AND x.coletividade_atividade_id = ca.id
              )
        """;

        try (PreparedStatement ps = conn.prepareStatement(sqlLigacao, Statement.RETURN_GENERATED_KEYS)) {
            ps.setInt(1, inscritoId);
            setNullableString(ps, 2, dataInscricao);
            setNullableString(ps, 3, dataFim);
            ps.setBoolean(4, ativo == null || ativo);
            ps.setInt(5, inscritoId);
            ps.setInt(6, coletividadeAtividadeId);
            ps.setInt(7, inscritoId);

            int affected = ps.executeUpdate();
            if (affected <= 0) {
                return null;
            }

            try (ResultSet rs = ps.getGeneratedKeys()) {
                if (rs.next()) return rs.getInt(1);
            }
        }

        return null;
    }

    private void setNullableString(PreparedStatement ps, int index, String value) throws SQLException {
        if (value == null || value.isBlank()) ps.setNull(index, Types.VARCHAR);
        else ps.setString(index, value);
    }
}
