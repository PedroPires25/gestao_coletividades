package com.gestaoclubes.api.dao;

import com.gestaoclubes.api.model.Utente;
import com.gestaoclubes.api.util.ConexoBD;
import org.springframework.stereotype.Repository;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

@Repository
public class UtenteDAO {

    public List<Utente> listarPorColetividadeAtividade(int coletividadeId, int coletividadeAtividadeId) {
        List<Utente> lista = new ArrayList<>();

        String sql = """
            SELECT i.id, COALESCE(ut.nome, i.nome) AS nome, i.data_nascimento, i.email, i.telefone, i.morada,
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
            e.printStackTrace();
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
                ps.setString(2, u.getDataNascimento());
                ps.setString(3, u.getEmail());
                ps.setString(4, u.getTelefone());
                ps.setString(5, u.getMorada());
                ps.setInt(6, u.getEstadoId() == null ? 1 : u.getEstadoId());
                ps.setString(7, u.getEmail());
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

            String sqlLigacao = """
                INSERT INTO inscrito_coletividade_atividade
                (inscrito_id, coletividade_atividade_id, data_inscricao, data_fim, ativo)
                VALUES (?, ?, ?, ?, ?)
            """;

            try (PreparedStatement ps = conn.prepareStatement(sqlLigacao)) {
                ps.setInt(1, inscritoId);
                ps.setInt(2, coletividadeAtividadeId);
                ps.setString(3, u.getDataInscricao());
                ps.setString(4, u.getDataFim());
                ps.setBoolean(5, u.getAtivo() == null || u.getAtivo());
                ps.executeUpdate();
            }

            conn.commit();
            return inscritoId;
        } catch (Exception e) {
            e.printStackTrace();
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
}