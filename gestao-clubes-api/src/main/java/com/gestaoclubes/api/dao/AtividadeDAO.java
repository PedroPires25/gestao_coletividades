package com.gestaoclubes.api.dao;

import com.gestaoclubes.api.model.Atividade;
import com.gestaoclubes.api.util.ConexoBD;
import org.springframework.stereotype.Repository;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.util.ArrayList;
import java.util.List;

@Repository
public class AtividadeDAO {

    public List<Atividade> listarAtivas() {
        List<Atividade> lista = new ArrayList<>();

        String sql = """
            SELECT id, nome, descricao, ativo
            FROM atividade
            WHERE ativo = 1
            ORDER BY nome
        """;

        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {

            while (rs.next()) {
                Atividade a = new Atividade();
                a.setId(rs.getInt("id"));
                a.setNome(rs.getString("nome"));
                a.setDescricao(rs.getString("descricao"));
                a.setAtivo(rs.getBoolean("ativo"));
                lista.add(a);
            }

        } catch (Exception e) {
            e.printStackTrace();
        }

        return lista;
    }

    public Atividade obterPorId(int id) {
        String sql = """
            SELECT id, nome, descricao, ativo
            FROM atividade
            WHERE id = ?
        """;

        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setInt(1, id);

            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    Atividade a = new Atividade();
                    a.setId(rs.getInt("id"));
                    a.setNome(rs.getString("nome"));
                    a.setDescricao(rs.getString("descricao"));
                    a.setAtivo(rs.getBoolean("ativo"));
                    return a;
                }
            }

        } catch (Exception e) {
            e.printStackTrace();
        }

        return null;
    }

    public Integer criar(String nome, String descricao) {
        String sql = """
            INSERT INTO atividade (nome, descricao, ativo)
            VALUES (?, ?, 1)
        """;

        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql, PreparedStatement.RETURN_GENERATED_KEYS)) {

            ps.setString(1, nome);
            ps.setString(2, descricao);
            ps.executeUpdate();

            try (ResultSet rs = ps.getGeneratedKeys()) {
                if (rs.next()) return rs.getInt(1);
            }

        } catch (Exception e) {
            e.printStackTrace();
        }

        return null;
    }

    public boolean editar(int id, String nome, String descricao) {
        String sql = """
            UPDATE atividade
            SET nome = ?, descricao = ?
            WHERE id = ?
        """;

        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setString(1, nome);
            ps.setString(2, descricao);
            ps.setInt(3, id);

            return ps.executeUpdate() > 0;

        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }
}