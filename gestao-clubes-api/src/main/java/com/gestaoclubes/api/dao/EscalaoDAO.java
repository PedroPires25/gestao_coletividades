package com.gestaoclubes.api.dao;

import com.gestaoclubes.api.model.Escalao;
import com.gestaoclubes.api.util.ConexoBD;

import java.sql.*;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public class EscalaoDAO {

    /** Canonical hierarchy from youngest (index 0) to oldest. */
    public static final List<String> ESCALAO_ORDEM = List.of(
            "petiz", "traquinas", "benjamim", "infantil",
            "iniciado", "juvenil", "junior", "senior", "veterano"
    );

    /** Returns all escalões sorted by the hierarchy (unknowns appended at the end). */
    public List<Map<String, Object>> listarComOrdem() {
        return listarTodos().stream()
                .sorted((a, b) -> {
                    int posA = ESCALAO_ORDEM.indexOf(a.getNome().toLowerCase());
                    int posB = ESCALAO_ORDEM.indexOf(b.getNome().toLowerCase());
                    if (posA < 0) posA = Integer.MAX_VALUE;
                    if (posB < 0) posB = Integer.MAX_VALUE;
                    return Integer.compare(posA, posB);
                })
                .map(e -> Map.<String, Object>of("id", e.getId(), "nome", e.getNome()))
                .collect(java.util.stream.Collectors.toList());
    }

    /**
     * Returns the id of the escalão immediately below {@code escalaoId} in the hierarchy,
     * or {@code null} if {@code escalaoId} is already the lowest or not recognised.
     */
    public Integer buscarIdEscalaoAbaixo(int escalaoId) {
        List<Escalao> todos = listarTodos();
        Escalao atual = todos.stream().filter(e -> e.getId() == escalaoId).findFirst().orElse(null);
        if (atual == null) return null;

        int pos = ESCALAO_ORDEM.indexOf(atual.getNome().toLowerCase());
        if (pos <= 0) return null;

        String nomeAbaixo = ESCALAO_ORDEM.get(pos - 1);
        return todos.stream()
                .filter(e -> e.getNome().equalsIgnoreCase(nomeAbaixo))
                .mapToInt(Escalao::getId)
                .boxed()
                .findFirst()
                .orElse(null);
    }

    public List<Escalao> listarTodos() {
        List<Escalao> lista = new ArrayList<>();
        String sql = "SELECT id, nome FROM escalao ORDER BY nome";

        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {

            while (rs.next()) {
                lista.add(new Escalao(rs.getInt("id"), rs.getString("nome")));
            }

        } catch (SQLException e) {
            e.printStackTrace();
        }

        return lista;
    }

    public Escalao buscarPorId(int id) {
        String sql = "SELECT id, nome FROM escalao WHERE id=?";

        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setInt(1, id);
            ResultSet rs = ps.executeQuery();

            if (rs.next()) return new Escalao(rs.getInt("id"), rs.getString("nome"));

        } catch (SQLException e) {
            e.printStackTrace();
        }

        return null;
    }
}
