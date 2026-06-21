package com.gestaoclubes.api.dao;

import com.gestaoclubes.api.model.Utilizador;
import com.gestaoclubes.api.util.ConexoBD;
import com.gestaoclubes.api.util.PasswordPolicyUtil;
import com.gestaoclubes.api.util.PasswordUtil;
import org.springframework.stereotype.Repository;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;
import java.util.logging.Logger;

@Repository
public class UtilizadorDAO {

    private static final Logger LOGGER = Logger.getLogger(UtilizadorDAO.class.getName());

    /**
     * Devolve todas as contas ativas cujo email e palavra-passe correspondem.
     * Usado quando o mesmo email existe em múltiplas estruturas.
     */
    public List<Utilizador> autenticarTodos(String email, String palavraChave) {
        String sql = "SELECT * FROM utilizadores WHERE LOWER(utilizador) = LOWER(?) AND ativo = 1";
        List<Utilizador> resultado = new ArrayList<>();

        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setString(1, email.trim());

            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    String hash = rs.getString("palavra_chave");
                    if (PasswordUtil.verificarPassword(palavraChave, hash)) {
                        resultado.add(mapUtilizador(rs, false));
                    }
                }
            }

        } catch (SQLException e) {
            LOGGER.warning("Erro ao autenticar todos: " + e.getMessage());
            LOGGER.severe(e.toString());
        }

        return resultado;
    }

    public Utilizador autenticar(String email, String palavraChave) {
        String sql = "SELECT * FROM utilizadores WHERE utilizador = ? AND ativo = 1";

        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setString(1, email);

            try (ResultSet rs = stmt.executeQuery()) {
                if (!rs.next()) {
                    return null;
                }

                String hash = rs.getString("palavra_chave");
                boolean ok = PasswordUtil.verificarPassword(palavraChave, hash);

                if (!ok) {
                    return null;
                }

                return mapUtilizador(rs, false);
            }

        } catch (SQLException e) {
            LOGGER.warning("Erro ao autenticar utilizador: " + e.getMessage());
            LOGGER.severe(e.toString());
            return null;
        }
    }

    public boolean existeEmail(String email) {
        String sql = "SELECT COUNT(*) FROM utilizadores WHERE utilizador = ?";

        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setString(1, email);

            try (ResultSet rs = stmt.executeQuery()) {
                return rs.next() && rs.getInt(1) > 0;
            }

        } catch (SQLException e) {
            LOGGER.warning("Erro ao verificar email: " + e.getMessage());
            LOGGER.severe(e.toString());
            return false;
        }
    }

    /**
     * Verifica se já existe um utilizador com o mesmo email dentro da mesma estrutura.
     * O mesmo email pode existir em clubes ou coletividades diferentes.
     */
    public boolean existeEmailNaEstrutura(String email, Integer clubeId, Integer coletividadeId) {
        if (email == null || email.trim().isEmpty()) return false;

        try (Connection conn = ConexoBD.getConnection()) {
            if (clubeId != null) {
                String sql = "SELECT COUNT(*) FROM utilizadores WHERE LOWER(utilizador) = LOWER(?) AND clube_id = ?";
                try (PreparedStatement stmt = conn.prepareStatement(sql)) {
                    stmt.setString(1, email.trim());
                    stmt.setInt(2, clubeId);
                    try (ResultSet rs = stmt.executeQuery()) {
                        if (rs.next() && rs.getInt(1) > 0) return true;
                    }
                }
            }

            if (coletividadeId != null) {
                String sql = "SELECT COUNT(*) FROM utilizadores WHERE LOWER(utilizador) = LOWER(?) AND coletividade_id = ?";
                try (PreparedStatement stmt = conn.prepareStatement(sql)) {
                    stmt.setString(1, email.trim());
                    stmt.setInt(2, coletividadeId);
                    try (ResultSet rs = stmt.executeQuery()) {
                        if (rs.next() && rs.getInt(1) > 0) return true;
                    }
                }
            }

            // Sem estrutura definida (ex: SUPER_ADMIN): mantém verificação global
            if (clubeId == null && coletividadeId == null) {
                return existeEmail(email.trim());
            }

            return false;

        } catch (SQLException e) {
            LOGGER.warning("Erro ao verificar email na estrutura: " + e.getMessage());
            LOGGER.severe(e.toString());
            return false;
        }
    }

    public boolean inserir(String email, String palavraChave, int perfilId, boolean privilegiosAtivos,
                           String estadoRegisto, Integer clubeId, Integer modalidadeId,
                           Integer coletividadeId, Integer atividadeId, List<Integer> atividadeIds) {

        if (email == null || email.trim().isEmpty()) return false;
        if (palavraChave == null || palavraChave.isEmpty()) return false;
        if (perfilId <= 0) return false;
        if (estadoRegisto == null || estadoRegisto.isBlank()) return false;
        if (existeEmailNaEstrutura(email, clubeId, coletividadeId)) return false;

        if (!PasswordPolicyUtil.isValid(palavraChave)) {
            throw new IllegalArgumentException(
                    String.join(" ", PasswordPolicyUtil.getValidationErrors(palavraChave))
            );
        }

        String hash = PasswordUtil.hashPassword(palavraChave);

        String sql = "INSERT INTO utilizadores " +
                "(utilizador, email_notificacoes, palavra_chave, perfil_id, ativo, privilegios_ativos, estado_registo, " +
                "clube_id, modalidade_id, coletividade_id, atividade_id) " +
                "VALUES (?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?)";

        try (Connection conn = ConexoBD.getConnection()) {
            conn.setAutoCommit(false);

            try (PreparedStatement stmt = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {

                stmt.setString(1, email.trim());
                stmt.setString(2, email.trim());
                stmt.setString(3, hash);
                stmt.setInt(4, perfilId);
                stmt.setBoolean(5, privilegiosAtivos);
                stmt.setString(6, estadoRegisto.trim().toUpperCase());

                setNullableInt(stmt, 7, clubeId);
                setNullableInt(stmt, 8, modalidadeId);
                setNullableInt(stmt, 9, coletividadeId);
                setNullableInt(stmt, 10, atividadeId);

                int affectedRows = stmt.executeUpdate();
                if (affectedRows == 0) {
                    conn.rollback();
                    return false;
                }

                // Fluxo exclusivo de UTENTE: criar inscrito e associar às atividades
                if (atividadeIds != null && !atividadeIds.isEmpty() && coletividadeId != null) {
                    try (ResultSet generatedKeys = stmt.getGeneratedKeys()) {
                        if (generatedKeys.next()) {
                            long utilizadorId = generatedKeys.getLong(1);

                            String sqlInscrito = "INSERT INTO inscrito (nome, email, coletividade_atual_id, utilizador_id) VALUES (?, ?, ?, ?)";
                            try (PreparedStatement stmtInscrito = conn.prepareStatement(sqlInscrito, Statement.RETURN_GENERATED_KEYS)) {
                                stmtInscrito.setString(1, email.trim());
                                stmtInscrito.setString(2, email.trim());
                                stmtInscrito.setInt(3, coletividadeId);
                                stmtInscrito.setLong(4, utilizadorId);
                                stmtInscrito.executeUpdate();

                                try (ResultSet generatedInscritoKeys = stmtInscrito.getGeneratedKeys()) {
                                    if (generatedInscritoKeys.next()) {
                                        long inscritoId = generatedInscritoKeys.getLong(1);

                                        String sqlAtividade = "INSERT INTO inscrito_coletividade_atividade (inscrito_id, coletividade_atividade_id, data_inscricao) VALUES (?, ?, CURDATE())";
                                        try (PreparedStatement stmtAtividade = conn.prepareStatement(sqlAtividade)) {
                                            for (Integer caId : atividadeIds) {
                                                stmtAtividade.setLong(1, inscritoId);
                                                stmtAtividade.setInt(2, caId);
                                                stmtAtividade.addBatch();
                                            }
                                            stmtAtividade.executeBatch();
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                conn.commit();
                return true;

            } catch (SQLException e) {
                conn.rollback();
                LOGGER.severe(e.toString());
                return false;
            }
        } catch (SQLException e) {
            LOGGER.severe(e.toString());
            return false;
        }
    }

    public List<Utilizador> listarTodos() {
        List<Utilizador> lista = new ArrayList<>();
        String sql = "SELECT id, utilizador, perfil_id, ativo, privilegios_ativos, estado_registo, " +
                "clube_id, modalidade_id, coletividade_id, logo_path, nome, email_notificacoes " +
                "FROM utilizadores ORDER BY utilizador";

        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {

            while (rs.next()) {
                lista.add(mapUtilizador(rs, false));
            }

        } catch (SQLException e) {
            LOGGER.severe(e.toString());
        }

        return lista;
    }

    public Utilizador buscarPorId(int id) {
        String sql = "SELECT * FROM utilizadores WHERE id = ?";

        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setInt(1, id);

            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return mapUtilizador(rs, false);
                }
            }

        } catch (SQLException e) {
            LOGGER.severe(e.toString());
        }

        return null;
    }

    public Utilizador buscarPorEmail(String email) {
        String sql = "SELECT * FROM utilizadores WHERE utilizador = ?";

        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setString(1, email);

            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return mapUtilizador(rs, false);
                }
            }

        } catch (SQLException e) {
            LOGGER.warning("Erro ao buscar utilizador por email: " + e.getMessage());
            LOGGER.severe(e.toString());
        }

        return null;
    }

    public boolean atualizarPerfil(int userId, int novoPerfilId) {
        String sql = "UPDATE utilizadores SET perfil_id = ? WHERE id = ?";

        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setInt(1, novoPerfilId);
            ps.setInt(2, userId);
            return ps.executeUpdate() > 0;

        } catch (SQLException e) {
            LOGGER.severe(e.toString());
            return false;
        }
    }

    public boolean atualizarPrivilegios(int userId, boolean privilegiosAtivos) {
        String sql = "UPDATE utilizadores SET privilegios_ativos = ? WHERE id = ?";

        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setBoolean(1, privilegiosAtivos);
            ps.setInt(2, userId);
            return ps.executeUpdate() > 0;

        } catch (SQLException e) {
            LOGGER.severe(e.toString());
            return false;
        }
    }

    public boolean atualizarEstadoRegisto(int userId, String estadoRegisto) {
        String sql = "UPDATE utilizadores SET estado_registo = ? WHERE id = ?";

        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setString(1, estadoRegisto == null ? null : estadoRegisto.trim().toUpperCase());
            ps.setInt(2, userId);
            return ps.executeUpdate() > 0;

        } catch (SQLException e) {
            LOGGER.severe(e.toString());
            return false;
        }
    }

    public boolean atualizarAtivo(int userId, boolean ativo) {
        String sql = "UPDATE utilizadores SET ativo = ? WHERE id = ?";

        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setBoolean(1, ativo);
            ps.setInt(2, userId);
            return ps.executeUpdate() > 0;

        } catch (SQLException e) {
            LOGGER.severe(e.toString());
            return false;
        }
    }

    public boolean atualizarAfetacao(int userId, Integer clubeId, Integer modalidadeId,
                                     Integer coletividadeId, Integer atividadeId) {
        String sql = "UPDATE utilizadores " +
                "SET clube_id = ?, modalidade_id = ?, coletividade_id = ?, atividade_id = ? " +
                "WHERE id = ?";

        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            setNullableInt(ps, 1, clubeId);
            setNullableInt(ps, 2, modalidadeId);
            setNullableInt(ps, 3, coletividadeId);
            setNullableInt(ps, 4, atividadeId);
            ps.setInt(5, userId);

            return ps.executeUpdate() > 0;

        } catch (Exception e) {
            LOGGER.severe(e.toString());
            return false;
        }
    }

    public boolean atualizarPassword(Integer userId, String novaPasswordEmTexto) {
        if (!PasswordPolicyUtil.isValid(novaPasswordEmTexto)) {
            throw new IllegalArgumentException(
                    String.join(" ", PasswordPolicyUtil.getValidationErrors(novaPasswordEmTexto))
            );
        }

        String sql = "UPDATE utilizadores SET palavra_chave = ? WHERE id = ?";

        try (Connection c = ConexoBD.getConnection();
             PreparedStatement ps = c.prepareStatement(sql)) {

            String hash = PasswordUtil.hashPassword(novaPasswordEmTexto);
            ps.setString(1, hash);
            ps.setInt(2, userId);

            return ps.executeUpdate() > 0;

        } catch (Exception e) {
            throw new RuntimeException("Erro ao atualizar palavra-passe.", e);
        }
    }

    public boolean atletaTemAfetacaoValida(String email, Integer clubeId, Integer modalidadeId) {
        if (email == null || email.isBlank() || clubeId == null || modalidadeId == null) {
            return false;
        }

        String sql = "SELECT COUNT(*) " +
                "FROM atleta a " +
                "INNER JOIN atleta_clube_modalidade acm ON acm.atleta_id = a.id AND acm.ativo = 1 " +
                "INNER JOIN clube_modalidade cm ON cm.id = acm.clube_modalidade_id AND cm.ativo = 1 " +
                "WHERE LOWER(a.email) = LOWER(?) " +
                "AND a.clube_atual_id = ? " +
                "AND cm.clube_id = ? " +
                "AND cm.modalidade_id = ?";

        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setString(1, email.trim());
            ps.setInt(2, clubeId);
            ps.setInt(3, clubeId);
            ps.setInt(4, modalidadeId);

            try (ResultSet rs = ps.executeQuery()) {
                return rs.next() && rs.getInt(1) > 0;
            }

        } catch (Exception e) {
            LOGGER.severe(e.toString());
            return false;
        }
    }

    public boolean staffTemAfetacaoValida(String email,
                                          Integer clubeId, Integer modalidadeId,
                                          Integer coletividadeId, Integer atividadeId) {
        return staffNoClube(email, clubeId, modalidadeId) ||
                staffNaColetividade(email, coletividadeId, atividadeId);
    }

    public boolean treinadorPrincipalTemAfetacaoValida(String email, Integer clubeId, Integer modalidadeId) {
        if (email == null || email.isBlank() || clubeId == null) {
            return false;
        }

        String sql = "SELECT COUNT(*) " +
                "FROM staff s " +
                "INNER JOIN staff_afetacao sa ON sa.staff_id = s.id " +
                "INNER JOIN cargo_staff c ON c.id = sa.cargo_id " +
                "WHERE LOWER(s.email) = LOWER(?) " +
                "AND sa.clube_id = ? " +
                "AND UPPER(c.nome) = UPPER('Treinador Principal') " +
                "AND (sa.data_fim IS NULL OR sa.data_fim >= CURDATE()) " +
                "AND (? IS NULL OR sa.clube_modalidade_id IN (" +
                "   SELECT cm.id FROM clube_modalidade cm WHERE cm.clube_id = ? AND cm.modalidade_id = ? AND cm.ativo = 1" +
                "))";

        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setString(1, email.trim());
            ps.setInt(2, clubeId);

            if (modalidadeId == null) {
                ps.setNull(3, Types.INTEGER);
                ps.setInt(4, clubeId);
                ps.setNull(5, Types.INTEGER);
            } else {
                ps.setInt(3, modalidadeId);
                ps.setInt(4, clubeId);
                ps.setInt(5, modalidadeId);
            }

            try (ResultSet rs = ps.executeQuery()) {
                return rs.next() && rs.getInt(1) > 0;
            }

        } catch (Exception e) {
            LOGGER.severe(e.toString());
            return false;
        }
    }

    public boolean departamentoMedicoTemAfetacaoValida(String email, Integer clubeId, Integer modalidadeId) {
        if (email == null || email.isBlank() || clubeId == null) {
            return false;
        }

        String sql = "SELECT COUNT(*) " +
                "FROM staff s " +
                "INNER JOIN staff_afetacao sa ON sa.staff_id = s.id " +
                "INNER JOIN cargo_staff c ON c.id = sa.cargo_id " +
                "WHERE LOWER(s.email) = LOWER(?) " +
                "AND sa.clube_id = ? " +
                "AND UPPER(c.nome) IN (UPPER('Médico'), UPPER('Medico'), UPPER('Enfermeiro'), UPPER('Fisioterapeuta'), UPPER('Massagista')) " +
                "AND (sa.data_fim IS NULL OR sa.data_fim >= CURDATE()) " +
                "AND (? IS NULL OR sa.clube_modalidade_id IN (" +
                "   SELECT cm.id FROM clube_modalidade cm WHERE cm.clube_id = ? AND cm.modalidade_id = ? AND cm.ativo = 1" +
                "))";

        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setString(1, email.trim());
            ps.setInt(2, clubeId);

            if (modalidadeId == null) {
                ps.setNull(3, Types.INTEGER);
                ps.setInt(4, clubeId);
                ps.setNull(5, Types.INTEGER);
            } else {
                ps.setInt(3, modalidadeId);
                ps.setInt(4, clubeId);
                ps.setInt(5, modalidadeId);
            }

            try (ResultSet rs = ps.executeQuery()) {
                return rs.next() && rs.getInt(1) > 0;
            }

        } catch (Exception e) {
            LOGGER.severe(e.toString());
            return false;
        }
    }

    public boolean secretarioTemAfetacaoValida(String email,
                                               Integer clubeId, Integer modalidadeId,
                                               Integer coletividadeId, Integer atividadeId) {
        return secretarioNoClube(email, clubeId, modalidadeId) ||
                secretarioNaColetividade(email, coletividadeId, atividadeId);
    }

    public boolean professorTemAfetacaoValida(String email,
                                              Integer clubeId, Integer modalidadeId,
                                              Integer coletividadeId, Integer atividadeId) {
        return professorNoClube(email, clubeId, modalidadeId) ||
                professorNaColetividade(email, coletividadeId, atividadeId);
    }

    public boolean utenteTemAfetacaoValida(String email, Integer coletividadeId, Integer atividadeId) {
        if (email == null || email.isBlank() || coletividadeId == null) {
            return false;
        }

        String sql = "SELECT COUNT(*) " +
                "FROM inscrito i " +
                "INNER JOIN inscrito_coletividade_atividade ica ON ica.inscrito_id = i.id AND ica.ativo = 1 " +
                "INNER JOIN coletividade_atividade ca ON ca.id = ica.coletividade_atividade_id AND ca.ativo = 1 " +
                "WHERE LOWER(i.email) = LOWER(?) " +
                "AND i.coletividade_atual_id = ? " +
                "AND ca.coletividade_id = ? " +
                "AND (? IS NULL OR ca.atividade_id = ?)";

        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setString(1, email.trim());
            ps.setInt(2, coletividadeId);
            ps.setInt(3, coletividadeId);

            if (atividadeId == null) {
                ps.setNull(4, Types.INTEGER);
                ps.setNull(5, Types.INTEGER);
            } else {
                ps.setInt(4, atividadeId);
                ps.setInt(5, atividadeId);
            }

            try (ResultSet rs = ps.executeQuery()) {
                return rs.next() && rs.getInt(1) > 0;
            }

        } catch (Exception e) {
            LOGGER.severe(e.toString());
            return false;
        }
    }

    private boolean staffNoClube(String email, Integer clubeId, Integer modalidadeId) {
        if (email == null || email.isBlank() || clubeId == null) {
            return false;
        }

        String sql = "SELECT COUNT(*) " +
                "FROM staff s " +
                "INNER JOIN staff_afetacao sa ON sa.staff_id = s.id " +
                "WHERE LOWER(s.email) = LOWER(?) " +
                "AND sa.clube_id = ? " +
                "AND (sa.data_fim IS NULL OR sa.data_fim >= CURDATE()) " +
                "AND (? IS NULL OR sa.clube_modalidade_id IN (" +
                "   SELECT cm.id FROM clube_modalidade cm WHERE cm.clube_id = ? AND cm.modalidade_id = ? AND cm.ativo = 1" +
                "))";

        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setString(1, email.trim());
            ps.setInt(2, clubeId);

            if (modalidadeId == null) {
                ps.setNull(3, Types.INTEGER);
                ps.setInt(4, clubeId);
                ps.setNull(5, Types.INTEGER);
            } else {
                ps.setInt(3, modalidadeId);
                ps.setInt(4, clubeId);
                ps.setInt(5, modalidadeId);
            }

            try (ResultSet rs = ps.executeQuery()) {
                return rs.next() && rs.getInt(1) > 0;
            }

        } catch (Exception e) {
            LOGGER.severe(e.toString());
            return false;
        }
    }

    private boolean staffNaColetividade(String email, Integer coletividadeId, Integer atividadeId) {
        if (email == null || email.isBlank() || coletividadeId == null) {
            return false;
        }

        String sql = "SELECT COUNT(*) " +
                "FROM staff_coletividade s " +
                "INNER JOIN staff_coletividade_afetacao sca ON sca.staff_coletividade_id = s.id " +
                "WHERE LOWER(s.email) = LOWER(?) " +
                "AND sca.coletividade_id = ? " +
                "AND (sca.data_fim IS NULL OR sca.data_fim >= CURDATE()) " +
                "AND (? IS NULL OR sca.coletividade_atividade_id IN (" +
                "   SELECT ca.id FROM coletividade_atividade ca WHERE ca.coletividade_id = ? AND ca.atividade_id = ? AND ca.ativo = 1" +
                "))";

        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setString(1, email.trim());
            ps.setInt(2, coletividadeId);

            if (atividadeId == null) {
                ps.setNull(3, Types.INTEGER);
                ps.setInt(4, coletividadeId);
                ps.setNull(5, Types.INTEGER);
            } else {
                ps.setInt(3, atividadeId);
                ps.setInt(4, coletividadeId);
                ps.setInt(5, atividadeId);
            }

            try (ResultSet rs = ps.executeQuery()) {
                return rs.next() && rs.getInt(1) > 0;
            }

        } catch (Exception e) {
            LOGGER.severe(e.toString());
            return false;
        }
    }

    private boolean secretarioNoClube(String email, Integer clubeId, Integer modalidadeId) {
        if (email == null || email.isBlank() || clubeId == null) {
            return false;
        }

        String sql = "SELECT COUNT(*) " +
                "FROM staff s " +
                "INNER JOIN staff_afetacao sa ON sa.staff_id = s.id " +
                "INNER JOIN cargo_staff c ON c.id = sa.cargo_id " +
                "WHERE LOWER(s.email) = LOWER(?) " +
                "AND sa.clube_id = ? " +
                "AND UPPER(c.nome) IN (UPPER('Secretário'), UPPER('Secretario')) " +
                "AND (sa.data_fim IS NULL OR sa.data_fim >= CURDATE()) " +
                "AND (? IS NULL OR sa.clube_modalidade_id IN (" +
                "   SELECT cm.id FROM clube_modalidade cm WHERE cm.clube_id = ? AND cm.modalidade_id = ? AND cm.ativo = 1" +
                "))";

        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setString(1, email.trim());
            ps.setInt(2, clubeId);

            if (modalidadeId == null) {
                ps.setNull(3, Types.INTEGER);
                ps.setInt(4, clubeId);
                ps.setNull(5, Types.INTEGER);
            } else {
                ps.setInt(3, modalidadeId);
                ps.setInt(4, clubeId);
                ps.setInt(5, modalidadeId);
            }

            try (ResultSet rs = ps.executeQuery()) {
                return rs.next() && rs.getInt(1) > 0;
            }

        } catch (Exception e) {
            LOGGER.severe(e.toString());
            return false;
        }
    }

    private boolean secretarioNaColetividade(String email, Integer coletividadeId, Integer atividadeId) {
        if (email == null || email.isBlank() || coletividadeId == null) {
            return false;
        }

        String sql = "SELECT COUNT(*) " +
                "FROM staff_coletividade s " +
                "INNER JOIN staff_coletividade_afetacao sca ON sca.staff_coletividade_id = s.id " +
                "INNER JOIN cargo_coletividade_staff c ON c.id = sca.cargo_id " +
                "WHERE LOWER(s.email) = LOWER(?) " +
                "AND sca.coletividade_id = ? " +
                "AND UPPER(c.nome) IN (UPPER('Secretário'), UPPER('Secretario')) " +
                "AND (sca.data_fim IS NULL OR sca.data_fim >= CURDATE()) " +
                "AND (? IS NULL OR sca.coletividade_atividade_id IN (" +
                "   SELECT ca.id FROM coletividade_atividade ca WHERE ca.coletividade_id = ? AND ca.atividade_id = ? AND ca.ativo = 1" +
                "))";

        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setString(1, email.trim());
            ps.setInt(2, coletividadeId);

            if (atividadeId == null) {
                ps.setNull(3, Types.INTEGER);
                ps.setInt(4, coletividadeId);
                ps.setNull(5, Types.INTEGER);
            } else {
                ps.setInt(3, atividadeId);
                ps.setInt(4, coletividadeId);
                ps.setInt(5, atividadeId);
            }

            try (ResultSet rs = ps.executeQuery()) {
                return rs.next() && rs.getInt(1) > 0;
            }

        } catch (Exception e) {
            LOGGER.severe(e.toString());
            return false;
        }
    }

    private boolean professorNoClube(String email, Integer clubeId, Integer modalidadeId) {
        if (email == null || email.isBlank() || clubeId == null) {
            return false;
        }

        String sql = "SELECT COUNT(*) " +
                "FROM staff s " +
                "INNER JOIN staff_afetacao sa ON sa.staff_id = s.id " +
                "INNER JOIN cargo_staff c ON c.id = sa.cargo_id " +
                "WHERE LOWER(s.email) = LOWER(?) " +
                "AND sa.clube_id = ? " +
                "AND UPPER(c.nome) = UPPER('Professor') " +
                "AND (sa.data_fim IS NULL OR sa.data_fim >= CURDATE()) " +
                "AND (? IS NULL OR sa.clube_modalidade_id IN (" +
                "   SELECT cm.id FROM clube_modalidade cm WHERE cm.clube_id = ? AND cm.modalidade_id = ? AND cm.ativo = 1" +
                "))";

        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setString(1, email.trim());
            ps.setInt(2, clubeId);

            if (modalidadeId == null) {
                ps.setNull(3, Types.INTEGER);
                ps.setInt(4, clubeId);
                ps.setNull(5, Types.INTEGER);
            } else {
                ps.setInt(3, modalidadeId);
                ps.setInt(4, clubeId);
                ps.setInt(5, modalidadeId);
            }

            try (ResultSet rs = ps.executeQuery()) {
                return rs.next() && rs.getInt(1) > 0;
            }

        } catch (Exception e) {
            LOGGER.severe(e.toString());
            return false;
        }
    }

    private boolean professorNaColetividade(String email, Integer coletividadeId, Integer atividadeId) {
        if (email == null || email.isBlank() || coletividadeId == null) {
            return false;
        }

        String sql = "SELECT COUNT(*) " +
                "FROM staff_coletividade s " +
                "INNER JOIN staff_coletividade_afetacao sca ON sca.staff_coletividade_id = s.id " +
                "INNER JOIN cargo_coletividade_staff c ON c.id = sca.cargo_id " +
                "WHERE LOWER(s.email) = LOWER(?) " +
                "AND sca.coletividade_id = ? " +
                "AND UPPER(c.nome) = UPPER('Professor') " +
                "AND (sca.data_fim IS NULL OR sca.data_fim >= CURDATE()) " +
                "AND (? IS NULL OR sca.coletividade_atividade_id IN (" +
                "   SELECT ca.id FROM coletividade_atividade ca WHERE ca.coletividade_id = ? AND ca.atividade_id = ? AND ca.ativo = 1" +
                "))";

        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setString(1, email.trim());
            ps.setInt(2, coletividadeId);

            if (atividadeId == null) {
                ps.setNull(3, Types.INTEGER);
                ps.setInt(4, coletividadeId);
                ps.setNull(5, Types.INTEGER);
            } else {
                ps.setInt(3, atividadeId);
                ps.setInt(4, coletividadeId);
                ps.setInt(5, atividadeId);
            }

            try (ResultSet rs = ps.executeQuery()) {
                return rs.next() && rs.getInt(1) > 0;
            }

        } catch (Exception e) {
            LOGGER.severe(e.toString());
            return false;
        }
    }

    private Utilizador mapUtilizador(ResultSet rs, boolean incluirPassword) throws SQLException {
        Utilizador u = new Utilizador();
        u.setId(rs.getInt("id"));
        u.setUtilizador(rs.getString("utilizador"));
        u.setPerfilId(rs.getInt("perfil_id"));
        u.setAtivo(rs.getBoolean("ativo"));
        u.setPrivilegiosAtivos(rs.getBoolean("privilegios_ativos"));
        u.setEstadoRegisto(normalizarEstado(rs.getString("estado_registo")));
        u.setClubeId((Integer) rs.getObject("clube_id"));
        u.setModalidadeId((Integer) rs.getObject("modalidade_id"));
        u.setColetividadeId((Integer) rs.getObject("coletividade_id"));
        try { u.setAtividadeId((Integer) rs.getObject("atividade_id")); } catch (Exception ignored) {}
        u.setPalavraChave(incluirPassword ? rs.getString("palavra_chave") : null);
        try { u.setLogoPath(rs.getString("logo_path")); } catch (SQLException ignored) {}
        try { u.setNome(rs.getString("nome")); } catch (SQLException ignored) {}
        try { u.setMorada(rs.getString("morada")); } catch (SQLException ignored) {}
        try { u.setTelefone(rs.getString("telefone")); } catch (SQLException ignored) {}
        try { u.setEmailNotificacoes(rs.getString("email_notificacoes")); } catch (SQLException ignored) {}
        try { u.setTemaPreferido(rs.getString("tema_preferido")); } catch (SQLException ignored) {}
        try { u.setNif(rs.getString("nif")); } catch (SQLException ignored) {}
        try { u.setCodigoPostal(rs.getString("codigo_postal")); } catch (SQLException ignored) {}
        try { u.setNumeroContribuinte(rs.getString("numero_contribuinte")); } catch (SQLException ignored) {}
        return u;
    }

    private String normalizarEstado(String estado) {
        return estado == null ? "APROVADO" : estado.trim().toUpperCase();
    }

    private void setNullableInt(PreparedStatement ps, int idx, Integer valor) throws SQLException {
        if (valor == null) ps.setNull(idx, Types.INTEGER);
        else ps.setInt(idx, valor);
    }

    public List<Utilizador> listarPorEstadoRegisto(String estadoRegisto) {
        List<Utilizador> lista = new ArrayList<>();

        String sql = "SELECT id, utilizador, perfil_id, ativo, privilegios_ativos, estado_registo, " +
                "clube_id, modalidade_id, coletividade_id, atividade_id, logo_path, nome, email_notificacoes " +
                "FROM utilizadores WHERE UPPER(estado_registo) = UPPER(?) ORDER BY utilizador";

        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setString(1, estadoRegisto);

            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    lista.add(mapUtilizador(rs, false));
                }
            }

        } catch (SQLException e) {
            LOGGER.severe(e.toString());
        }

        return lista;
    }

    public boolean atualizarLogoPath(int userId, String logoPath) {
        String sql = "UPDATE utilizadores SET logo_path=? WHERE id=?";

        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setString(1, logoPath);
            ps.setInt(2, userId);
            return ps.executeUpdate() > 0;

        } catch (SQLException e) {
            LOGGER.severe(e.toString());
            return false;
        }
    }

    /**
     * No momento do login, verifica se este email tem inscrições como atleta em clubes
     * que ainda não têm uma linha correspondente em utilizadores. Cria-as automaticamente
     * para que o ecrã de seleção de área apareça.
     *
     * @param email          email da pessoa que está a fazer login
     * @param passwordHash   hash da password copiado da conta existente
     * @param atletaPerfilId perfil_id correspondente a "ATLETA"
     */
    public void sincronizarContasAtletaNoLogin(String email, String passwordHash, int atletaPerfilId) {
        if (email == null || email.isBlank() || passwordHash == null) return;

        // Encontrar todas as inscrições ativas de atleta para este email
        // que ainda não têm uma conta de utilizador no clube correspondente
        String sql = """
            SELECT DISTINCT cm.clube_id, cm.modalidade_id
            FROM atleta a
            JOIN atleta_clube_modalidade acm ON acm.atleta_id = a.id AND acm.ativo = 1
            JOIN clube_modalidade cm ON cm.id = acm.clube_modalidade_id
            WHERE LOWER(a.email) = LOWER(?)
            AND NOT EXISTS (
                SELECT 1 FROM utilizadores u
                WHERE LOWER(u.utilizador) = LOWER(?) AND u.clube_id = cm.clube_id AND u.ativo = 1
            )
        """;

        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setString(1, email.trim());
            ps.setString(2, email.trim());

            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    int clubeId   = rs.getInt("clube_id");
                    int modalidadeId = rs.getInt("modalidade_id");
                    inserirComHashExistente(email, passwordHash, atletaPerfilId,
                            "APROVADO", clubeId, modalidadeId);
                }
            }

        } catch (SQLException e) {
            LOGGER.severe("Erro ao sincronizar contas atleta no login: " + e.getMessage());
        }
    }

    public String buscarHashPorEmail(String email) {
        String sql = "SELECT palavra_chave FROM utilizadores WHERE LOWER(utilizador) = LOWER(?) AND ativo = 1 LIMIT 1";
        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, email.trim());
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) return rs.getString("palavra_chave");
            }
        } catch (SQLException e) {
            LOGGER.severe(e.toString());
        }
        return null;
    }

    /**
     * Cria uma nova linha em utilizadores reutilizando um hash de password já existente.
     * Usado quando um admin regista um atleta com email de utilizador já existente noutro contexto.
     */
    public boolean inserirComHashExistente(String email, String passwordHash, int perfilId,
                                           String estadoRegisto, Integer clubeId, Integer modalidadeId) {
        if (email == null || email.isBlank() || passwordHash == null) return false;
        if (existeEmailNaEstrutura(email, clubeId, null)) return false;

        String sql = "INSERT INTO utilizadores " +
                "(utilizador, email_notificacoes, palavra_chave, perfil_id, ativo, privilegios_ativos, estado_registo, " +
                "clube_id, modalidade_id, coletividade_id) " +
                "VALUES (?, ?, ?, ?, 1, 1, ?, ?, ?, NULL)";

        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, email.trim());
            ps.setString(2, email.trim());
            ps.setString(3, passwordHash);
            ps.setInt(4, perfilId);
            ps.setString(5, estadoRegisto.trim().toUpperCase());
            setNullableInt(ps, 6, clubeId);
            setNullableInt(ps, 7, modalidadeId);
            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            LOGGER.severe(e.toString());
            return false;
        }
    }

    public boolean atualizarNome(int userId, String nome) {
        String sql = "UPDATE utilizadores SET nome=? WHERE id=?";

        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setString(1, nome);
            ps.setInt(2, userId);
            return ps.executeUpdate() > 0;

        } catch (SQLException e) {
            LOGGER.severe(e.toString());
            return false;
        }
    }

    public boolean atualizarDadosPessoais(int userId, String morada, String telefone, String emailNotificacoes,
                                          String nif, String codigoPostal, String numeroContribuinte) {
        String sql = "UPDATE utilizadores SET morada=?, telefone=?, email_notificacoes=?, " +
                     "nif=?, codigo_postal=?, numero_contribuinte=? WHERE id=?";

        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setString(1, morada);
            ps.setString(2, telefone);
            ps.setString(3, emailNotificacoes);
            ps.setString(4, nif);
            ps.setString(5, codigoPostal);
            ps.setString(6, numeroContribuinte);
            ps.setInt(7, userId);
            return ps.executeUpdate() > 0;

        } catch (SQLException e) {
            LOGGER.severe(e.toString());
            return false;
        }
    }

    public boolean atualizarTemaPreferido(int userId, String tema) {
        String sql = "UPDATE utilizadores SET tema_preferido=? WHERE id=?";

        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setString(1, tema);
            ps.setInt(2, userId);
            return ps.executeUpdate() > 0;

        } catch (SQLException e) {
            LOGGER.severe(e.toString());
            return false;
        }
    }
}