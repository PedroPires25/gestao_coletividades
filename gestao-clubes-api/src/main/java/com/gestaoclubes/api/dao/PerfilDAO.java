package com.gestaoclubes.api.dao;

import com.gestaoclubes.api.util.ConexoBD;
import org.springframework.stereotype.Repository;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@Repository
public class PerfilDAO {

    private static final String LEGACY_ADMIN = "ADMIN";
    public static final String SUPER_ADMIN = "SUPER_ADMIN";
    public static final String ADMINISTRADOR = "ADMINISTRADOR";
    public static final String USER = "USER";
    public static final String SECRETARIO = "SECRETARIO";
    public static final String TREINADOR_PRINCIPAL = "TREINADOR_PRINCIPAL";
    public static final String DEPARTAMENTO_MEDICO = "DEPARTAMENTO_MEDICO";
    public static final String STAFF = "STAFF";
    public static final String ATLETA = "ATLETA";
    public static final String PROFESSOR = "PROFESSOR";
    public static final String UTENTE = "UTENTE";

    public String normalizar(String perfil) {
        if (perfil == null) return null;
        String normalizado = perfil.trim().toUpperCase();
        return LEGACY_ADMIN.equals(normalizado) ? SUPER_ADMIN : normalizado;
    }

    public int obterPerfilPorDescricao(String descricao) {
        ensureCoreProfiles();
        String perfil = normalizar(descricao);
        String sql;

        if (SUPER_ADMIN.equals(perfil)) {
            sql = """
                SELECT id
                FROM perfis
                WHERE UPPER(descricao) IN ('SUPER_ADMIN', 'ADMIN')
                ORDER BY CASE WHEN UPPER(descricao) = 'SUPER_ADMIN' THEN 0 ELSE 1 END
                LIMIT 1
            """;
        } else {
            sql = "SELECT id FROM perfis WHERE UPPER(descricao) = UPPER(?) LIMIT 1";
        }

        try (Connection con = ConexoBD.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {

            if (!SUPER_ADMIN.equals(perfil)) {
                ps.setString(1, perfil);
            }

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
        ensureCoreProfiles();
        String sql = "SELECT descricao FROM perfis WHERE id = ? LIMIT 1";

        try (Connection con = ConexoBD.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {

            ps.setInt(1, perfilId);

            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return mapDescricao(rs.getString("descricao"));
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
        ensureCoreProfiles();
        Set<String> perfis = new LinkedHashSet<>();
        String sql = "SELECT descricao FROM perfis ORDER BY descricao";

        try (Connection con = ConexoBD.getConnection();
             PreparedStatement ps = con.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {

            while (rs.next()) {
                perfis.add(mapDescricao(rs.getString("descricao")));
            }

        } catch (Exception e) {
            e.printStackTrace();
        }

        return new ArrayList<>(perfis);
    }

    public boolean isPerfilAutoAprovado(String perfil) {
        String p = normalizar(perfil);
        return USER.equals(p) || UTENTE.equals(p);
    }

    public boolean isPerfilPermitidoNoRegistoPublico(String perfil) {
        String p = normalizar(perfil);
        return !SUPER_ADMIN.equals(p) && existePerfil(p);
    }

    public boolean isSuperAdmin(String perfil) {
        return SUPER_ADMIN.equals(normalizar(perfil));
    }

    public boolean isAdministradorEstrutura(String perfil) {
        return ADMINISTRADOR.equals(normalizar(perfil));
    }

    public boolean isPerfilAdministrativo(String perfil) {
        String p = normalizar(perfil);
        return SUPER_ADMIN.equals(p) || ADMINISTRADOR.equals(p);
    }

    private String mapDescricao(String descricao) {
        if (descricao == null) return null;
        String normalizada = descricao.trim().toUpperCase();
        return LEGACY_ADMIN.equals(normalizada) ? SUPER_ADMIN : normalizada;
    }

    private void ensureCoreProfiles() {
        ensureProfileExists(SUPER_ADMIN, true);
        ensureProfileExists(ADMINISTRADOR, false);
    }

    private void ensureProfileExists(String perfil, boolean allowLegacyAdmin) {
        String existsSql = allowLegacyAdmin
                ? "SELECT 1 FROM perfis WHERE UPPER(descricao) IN ('SUPER_ADMIN', 'ADMIN') LIMIT 1"
                : "SELECT 1 FROM perfis WHERE UPPER(descricao) = UPPER(?) LIMIT 1";
        String insertSql = "INSERT INTO perfis (descricao) VALUES (?)";

        try (Connection con = ConexoBD.getConnection();
             PreparedStatement exists = con.prepareStatement(existsSql)) {

            if (!allowLegacyAdmin) {
                exists.setString(1, perfil);
            }

            try (ResultSet rs = exists.executeQuery()) {
                if (rs.next()) {
                    return;
                }
            }

            try (PreparedStatement insert = con.prepareStatement(insertSql)) {
                insert.setString(1, perfil);
                insert.executeUpdate();
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
