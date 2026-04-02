package com.gestaoclubes.api.dao;

import com.gestaoclubes.api.util.ConexoBD;
import org.springframework.stereotype.Repository;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.util.ArrayList;
import java.util.List;

@Repository
public class PerfilDAO {

    public static final String ADMIN = "ADMIN";
    public static final String USER = "USER";
    public static final String SECRETARIO = "SECRETARIO";
    public static final String TREINADOR_PRINCIPAL = "TREINADOR_PRINCIPAL";
    public static final String DEPARTAMENTO_MEDICO = "DEPARTAMENTO_MEDICO";
    public static final String STAFF = "STAFF";
    public static final String ATLETA = "ATLETA";
    public static final String PROFESSOR = "PROFESSOR";
    public static final String UTENTE = "UTENTE";

    public String normalizar(String perfil) {
        return perfil == null ? null : perfil.trim().toUpperCase();
    }

    public int obterPerfilPorDescricao(String descricao) {
        String sql = "SELECT id FROM perfis WHERE UPPER(descricao) = UPPER(?) LIMIT 1";

        try (Connection con = ConexoBD.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {

            ps.setString(1, normalizar(descricao));

            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return rs.getInt("id");
                }
            }

        } catch (Exception e) {
            e.printStackTrace();
        }

        return -1;
    }

    public String obterDescricaoPerfil(int perfilId) {
        String sql = "SELECT descricao FROM perfis WHERE id = ? LIMIT 1";

        try (Connection con = ConexoBD.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {

            ps.setInt(1, perfilId);

            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return normalizar(rs.getString("descricao"));
                }
            }

        } catch (Exception e) {
            e.printStackTrace();
        }

        return null;
    }

    public boolean existePerfil(String descricao) {
        return obterPerfilPorDescricao(descricao) > 0;
    }

    public List<String> listarPerfisDisponiveis() {
        List<String> lista = new ArrayList<>();
        String sql = "SELECT descricao FROM perfis ORDER BY descricao";

        try (Connection con = ConexoBD.getConnection();
             PreparedStatement ps = con.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {

            while (rs.next()) {
                lista.add(normalizar(rs.getString("descricao")));
            }

        } catch (Exception e) {
            e.printStackTrace();
        }

        return lista;
    }

    public boolean isPerfilAutoAprovado(String perfil) {
        String p = normalizar(perfil);
        return USER.equals(p) || UTENTE.equals(p);
    }

    public boolean isPerfilPermitidoNoRegistoPublico(String perfil) {
        String p = normalizar(perfil);
        return !ADMIN.equals(p) && existePerfil(p);
    }
}