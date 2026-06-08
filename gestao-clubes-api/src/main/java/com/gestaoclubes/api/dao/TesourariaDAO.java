package com.gestaoclubes.api.dao;

import com.gestaoclubes.api.util.ConexoBD;

import java.sql.*;
import java.util.*;
import java.util.logging.Logger;

public class TesourariaDAO {

    private static final Logger LOGGER = Logger.getLogger(TesourariaDAO.class.getName());

    // ==========================================
    // MENSALIDADES POR ESCALÃO
    // ==========================================

    public List<Map<String, Object>> listarTaxasMensalidade(int clubeId, String epoca) {
        List<Map<String, Object>> list = new ArrayList<>();
        String sql = """
            SELECT me.id, me.clube_id, me.escalao_id, e.nome AS escalao_nome,
                   me.epoca, me.valor_mensal, me.ativo, me.updated_at,
                   u.utilizador AS updated_by_email
            FROM mensalidade_escalao me
            JOIN escalao e ON e.id = me.escalao_id
            LEFT JOIN utilizadores u ON u.id = me.updated_by
            WHERE me.clube_id = ? AND me.epoca = ?
            ORDER BY e.nome
        """;
        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, clubeId);
            ps.setString(2, epoca);
            ResultSet rs = ps.executeQuery();
            while (rs.next()) {
                Map<String, Object> row = new LinkedHashMap<>();
                row.put("id", rs.getInt("id"));
                row.put("clubeId", rs.getInt("clube_id"));
                row.put("escalaoId", rs.getInt("escalao_id"));
                row.put("escalaoNome", rs.getString("escalao_nome"));
                row.put("epoca", rs.getString("epoca"));
                row.put("valorMensal", rs.getDouble("valor_mensal"));
                row.put("ativo", rs.getBoolean("ativo"));
                row.put("updatedAt", rs.getString("updated_at"));
                row.put("updatedByEmail", rs.getString("updated_by_email"));
                list.add(row);
            }
        } catch (Exception e) {
            LOGGER.severe(e.toString());
        }
        return list;
    }

    public boolean upsertTaxaMensalidade(int clubeId, int escalaoId, String epoca, double valor, Integer updatedBy) {
        String sql = """
            INSERT INTO mensalidade_escalao (clube_id, escalao_id, epoca, valor_mensal, updated_by)
            VALUES (?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE valor_mensal = VALUES(valor_mensal), updated_by = VALUES(updated_by)
        """;
        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, clubeId);
            ps.setInt(2, escalaoId);
            ps.setString(3, epoca);
            ps.setDouble(4, valor);
            if (updatedBy == null) ps.setNull(5, Types.INTEGER);
            else ps.setInt(5, updatedBy);
            return ps.executeUpdate() >= 1;
        } catch (Exception e) {
            LOGGER.severe(e.toString());
            return false;
        }
    }

    // ==========================================
    // TAXAS DE INSCRIÇÃO POR ESCALÃO
    // ==========================================

    public List<Map<String, Object>> listarTaxasInscricao(int clubeId, String epoca) {
        List<Map<String, Object>> list = new ArrayList<>();
        String sql = """
            SELECT ie.id, ie.clube_id, ie.escalao_id, e.nome AS escalao_nome,
                   ie.epoca, ie.valor_inscricao, ie.ativo, ie.updated_at,
                   u.utilizador AS updated_by_email
            FROM inscricao_escalao ie
            JOIN escalao e ON e.id = ie.escalao_id
            LEFT JOIN utilizadores u ON u.id = ie.updated_by
            WHERE ie.clube_id = ? AND ie.epoca = ?
            ORDER BY e.nome
        """;
        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, clubeId);
            ps.setString(2, epoca);
            ResultSet rs = ps.executeQuery();
            while (rs.next()) {
                Map<String, Object> row = new LinkedHashMap<>();
                row.put("id", rs.getInt("id"));
                row.put("clubeId", rs.getInt("clube_id"));
                row.put("escalaoId", rs.getInt("escalao_id"));
                row.put("escalaoNome", rs.getString("escalao_nome"));
                row.put("epoca", rs.getString("epoca"));
                row.put("valorInscricao", rs.getDouble("valor_inscricao"));
                row.put("ativo", rs.getBoolean("ativo"));
                row.put("updatedAt", rs.getString("updated_at"));
                row.put("updatedByEmail", rs.getString("updated_by_email"));
                list.add(row);
            }
        } catch (Exception e) {
            LOGGER.severe(e.toString());
        }
        return list;
    }

    public boolean upsertTaxaInscricao(int clubeId, int escalaoId, String epoca, double valor, Integer updatedBy) {
        String sql = """
            INSERT INTO inscricao_escalao (clube_id, escalao_id, epoca, valor_inscricao, updated_by)
            VALUES (?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE valor_inscricao = VALUES(valor_inscricao), updated_by = VALUES(updated_by)
        """;
        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, clubeId);
            ps.setInt(2, escalaoId);
            ps.setString(3, epoca);
            ps.setDouble(4, valor);
            if (updatedBy == null) ps.setNull(5, Types.INTEGER);
            else ps.setInt(5, updatedBy);
            return ps.executeUpdate() >= 1;
        } catch (Exception e) {
            LOGGER.severe(e.toString());
            return false;
        }
    }

    // ==========================================
    // PAGAMENTOS DE MENSALIDADES
    // ==========================================

    public List<Map<String, Object>> listarPagamentos(int clubeId, Integer atletaId, Integer escalaoId,
                                                       Integer mes, Integer ano, String estado) {
        List<Map<String, Object>> list = new ArrayList<>();
        StringBuilder sql = new StringBuilder("""
            SELECT pm.id, pm.clube_id, pm.atleta_id,
                   COALESCE(u.nome, a.nome) AS atleta_nome,
                   pm.escalao_id, e.nome AS escalao_nome,
                   pm.mes, pm.ano,
                   pm.valor_devido, pm.valor_pago,
                   ROUND(pm.valor_devido - pm.valor_pago, 2) AS valor_divida,
                   pm.data_pagamento, pm.metodo_pagamento, pm.estado,
                   pm.observacoes, pm.created_at,
                   reg.utilizador AS registado_por_email
            FROM pagamento_mensalidade pm
            JOIN atleta a ON a.id = pm.atleta_id
            LEFT JOIN utilizadores u ON u.id = a.utilizador_id
            LEFT JOIN escalao e ON e.id = pm.escalao_id
            LEFT JOIN utilizadores reg ON reg.id = pm.registado_por
            WHERE pm.clube_id = ?
        """);
        List<Object> params = new ArrayList<>();
        params.add(clubeId);
        if (atletaId != null) { sql.append(" AND pm.atleta_id = ?"); params.add(atletaId); }
        if (escalaoId != null) { sql.append(" AND pm.escalao_id = ?"); params.add(escalaoId); }
        if (mes != null) { sql.append(" AND pm.mes = ?"); params.add(mes); }
        if (ano != null) { sql.append(" AND pm.ano = ?"); params.add(ano); }
        if (estado != null && !estado.isBlank()) { sql.append(" AND pm.estado = ?"); params.add(estado); }
        sql.append(" ORDER BY pm.ano DESC, pm.mes DESC, atleta_nome");
        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql.toString())) {
            for (int i = 0; i < params.size(); i++) ps.setObject(i + 1, params.get(i));
            ResultSet rs = ps.executeQuery();
            while (rs.next()) {
                Map<String, Object> row = new LinkedHashMap<>();
                row.put("id", rs.getInt("id"));
                row.put("clubeId", rs.getInt("clube_id"));
                row.put("atletaId", rs.getInt("atleta_id"));
                row.put("atletaNome", rs.getString("atleta_nome"));
                row.put("escalaoId", rs.getObject("escalao_id"));
                row.put("escalaoNome", rs.getString("escalao_nome"));
                row.put("mes", rs.getInt("mes"));
                row.put("ano", rs.getInt("ano"));
                row.put("valorDevido", rs.getDouble("valor_devido"));
                row.put("valorPago", rs.getDouble("valor_pago"));
                row.put("valorDivida", rs.getDouble("valor_divida"));
                row.put("dataPagamento", rs.getString("data_pagamento"));
                row.put("metodoPagamento", rs.getString("metodo_pagamento"));
                row.put("estado", rs.getString("estado"));
                row.put("observacoes", rs.getString("observacoes"));
                row.put("createdAt", rs.getString("created_at"));
                row.put("registadoPorEmail", rs.getString("registado_por_email"));
                list.add(row);
            }
        } catch (Exception e) {
            LOGGER.severe(e.toString());
        }
        return list;
    }

    public int inserirPagamento(int clubeId, int atletaId, Integer escalaoId, int mes, int ano,
                                double valorDevido, double valorPago, String dataPagamento,
                                String metodoPagamento, String estado, String observacoes, Integer registadoPor) {
        String sql = """
            INSERT INTO pagamento_mensalidade
              (clube_id, atleta_id, escalao_id, mes, ano, valor_devido, valor_pago,
               data_pagamento, metodo_pagamento, estado, observacoes, registado_por)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
            ON DUPLICATE KEY UPDATE
              valor_devido=VALUES(valor_devido), valor_pago=VALUES(valor_pago),
              data_pagamento=VALUES(data_pagamento), metodo_pagamento=VALUES(metodo_pagamento),
              estado=VALUES(estado), observacoes=VALUES(observacoes), registado_por=VALUES(registado_por)
        """;
        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            ps.setInt(1, clubeId);
            ps.setInt(2, atletaId);
            if (escalaoId == null) ps.setNull(3, Types.INTEGER); else ps.setInt(3, escalaoId);
            ps.setInt(4, mes);
            ps.setInt(5, ano);
            ps.setDouble(6, valorDevido);
            ps.setDouble(7, valorPago);
            if (dataPagamento == null) ps.setNull(8, Types.DATE); else ps.setString(8, dataPagamento);
            if (metodoPagamento == null) ps.setNull(9, Types.VARCHAR); else ps.setString(9, metodoPagamento);
            ps.setString(10, estado);
            if (observacoes == null) ps.setNull(11, Types.VARCHAR); else ps.setString(11, observacoes);
            if (registadoPor == null) ps.setNull(12, Types.INTEGER); else ps.setInt(12, registadoPor);
            ps.executeUpdate();
            ResultSet keys = ps.getGeneratedKeys();
            if (keys.next()) return keys.getInt(1);
        } catch (Exception e) {
            LOGGER.severe(e.toString());
        }
        return -1;
    }

    public boolean atualizarPagamento(int id, double valorDevido, double valorPago, String dataPagamento,
                                      String metodoPagamento, String estado, String observacoes) {
        String sql = """
            UPDATE pagamento_mensalidade
            SET valor_devido=?, valor_pago=?, data_pagamento=?, metodo_pagamento=?, estado=?, observacoes=?
            WHERE id=?
        """;
        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setDouble(1, valorDevido);
            ps.setDouble(2, valorPago);
            if (dataPagamento == null) ps.setNull(3, Types.DATE); else ps.setString(3, dataPagamento);
            if (metodoPagamento == null) ps.setNull(4, Types.VARCHAR); else ps.setString(4, metodoPagamento);
            ps.setString(5, estado);
            if (observacoes == null) ps.setNull(6, Types.VARCHAR); else ps.setString(6, observacoes);
            ps.setInt(7, id);
            return ps.executeUpdate() == 1;
        } catch (Exception e) {
            LOGGER.severe(e.toString());
            return false;
        }
    }

    // ==========================================
    // RELATÓRIO DÍVIDAS
    // ==========================================

    public List<Map<String, Object>> listarDividas(int clubeId, Integer escalaoId, Integer mes, Integer ano, Integer atletaId) {
        List<Map<String, Object>> list = new ArrayList<>();
        StringBuilder sql = new StringBuilder("""
            SELECT pm.id, pm.atleta_id,
                   COALESCE(u.nome, a.nome) AS atleta_nome,
                   a.email AS atleta_email,
                   pm.escalao_id, e.nome AS escalao_nome,
                   pm.mes, pm.ano,
                   pm.valor_devido, pm.valor_pago,
                   ROUND(pm.valor_devido - pm.valor_pago, 2) AS valor_divida,
                   pm.estado
            FROM pagamento_mensalidade pm
            JOIN atleta a ON a.id = pm.atleta_id
            LEFT JOIN utilizadores u ON u.id = a.utilizador_id
            LEFT JOIN escalao e ON e.id = pm.escalao_id
            WHERE pm.clube_id = ? AND pm.estado IN ('Em dívida','Parcial')
        """);
        List<Object> params = new ArrayList<>();
        params.add(clubeId);
        if (escalaoId != null) { sql.append(" AND pm.escalao_id = ?"); params.add(escalaoId); }
        if (mes != null) { sql.append(" AND pm.mes = ?"); params.add(mes); }
        if (ano != null) { sql.append(" AND pm.ano = ?"); params.add(ano); }
        if (atletaId != null) { sql.append(" AND pm.atleta_id = ?"); params.add(atletaId); }
        sql.append(" ORDER BY pm.ano DESC, pm.mes DESC, atleta_nome");
        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql.toString())) {
            for (int i = 0; i < params.size(); i++) ps.setObject(i + 1, params.get(i));
            ResultSet rs = ps.executeQuery();
            while (rs.next()) {
                Map<String, Object> row = new LinkedHashMap<>();
                row.put("id", rs.getInt("id"));
                row.put("atletaId", rs.getInt("atleta_id"));
                row.put("atletaNome", rs.getString("atleta_nome"));
                row.put("atletaEmail", rs.getString("atleta_email"));
                row.put("escalaoId", rs.getObject("escalao_id"));
                row.put("escalaoNome", rs.getString("escalao_nome"));
                row.put("mes", rs.getInt("mes"));
                row.put("ano", rs.getInt("ano"));
                row.put("valorDevido", rs.getDouble("valor_devido"));
                row.put("valorPago", rs.getDouble("valor_pago"));
                row.put("valorDivida", rs.getDouble("valor_divida"));
                row.put("estado", rs.getString("estado"));
                list.add(row);
            }
        } catch (Exception e) {
            LOGGER.severe(e.toString());
        }
        return list;
    }

    // ==========================================
    // RECEBIMENTOS POR ESCALÃO
    // ==========================================

    public List<Map<String, Object>> listarRecebimentosPorEscalao(int clubeId, Integer mes, Integer ano) {
        List<Map<String, Object>> list = new ArrayList<>();
        StringBuilder sql = new StringBuilder("""
            SELECT e.id AS escalao_id, e.nome AS escalao_nome,
                   COUNT(DISTINCT pm.atleta_id) AS num_atletas,
                   COALESCE(SUM(pm.valor_devido), 0) AS total_previsto,
                   COALESCE(SUM(pm.valor_pago), 0) AS total_recebido,
                   COALESCE(SUM(pm.valor_devido - pm.valor_pago), 0) AS total_divida
            FROM escalao e
            LEFT JOIN pagamento_mensalidade pm ON pm.escalao_id = e.id AND pm.clube_id = ?
        """);
        List<Object> params = new ArrayList<>();
        params.add(clubeId);
        if (mes != null) { sql.append(" AND pm.mes = ?"); params.add(mes); }
        if (ano != null) { sql.append(" AND pm.ano = ?"); params.add(ano); }
        sql.append("""
            GROUP BY e.id, e.nome
            HAVING num_atletas > 0
            ORDER BY e.nome
        """);
        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql.toString())) {
            for (int i = 0; i < params.size(); i++) ps.setObject(i + 1, params.get(i));
            ResultSet rs = ps.executeQuery();
            while (rs.next()) {
                Map<String, Object> row = new LinkedHashMap<>();
                row.put("escalaoId", rs.getInt("escalao_id"));
                row.put("escalaoNome", rs.getString("escalao_nome"));
                row.put("numAtletas", rs.getInt("num_atletas"));
                double previsto = rs.getDouble("total_previsto");
                double recebido = rs.getDouble("total_recebido");
                row.put("totalPrevisto", previsto);
                row.put("totalRecebido", recebido);
                row.put("totalDivida", rs.getDouble("total_divida"));
                row.put("percentagemCobranca", previsto > 0 ? Math.round(recebido / previsto * 100.0) : 0);
                list.add(row);
            }
        } catch (Exception e) {
            LOGGER.severe(e.toString());
        }
        return list;
    }

    // ==========================================
    // INSCRIÇÕES DE ATLETAS
    // ==========================================

    public List<Map<String, Object>> listarInscricoes(int clubeId, String epoca, String estado, Integer atletaId) {
        List<Map<String, Object>> list = new ArrayList<>();
        StringBuilder sql = new StringBuilder("""
            SELECT ia.id, ia.clube_id, ia.atleta_id,
                   COALESCE(u.nome, a.nome) AS atleta_nome,
                   a.email AS atleta_email,
                   ia.epoca, ia.valor_inscricao, ia.estado,
                   ia.data_pagamento, ia.metodo_pagamento, ia.observacoes, ia.created_at,
                   reg.utilizador AS registado_por_email
            FROM inscricao_atleta ia
            JOIN atleta a ON a.id = ia.atleta_id
            LEFT JOIN utilizadores u ON u.id = a.utilizador_id
            LEFT JOIN utilizadores reg ON reg.id = ia.registado_por
            WHERE ia.clube_id = ?
        """);
        List<Object> params = new ArrayList<>();
        params.add(clubeId);
        if (epoca != null && !epoca.isBlank()) { sql.append(" AND ia.epoca = ?"); params.add(epoca); }
        if (estado != null && !estado.isBlank()) { sql.append(" AND ia.estado = ?"); params.add(estado); }
        if (atletaId != null) { sql.append(" AND ia.atleta_id = ?"); params.add(atletaId); }
        sql.append(" ORDER BY atleta_nome");
        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql.toString())) {
            for (int i = 0; i < params.size(); i++) ps.setObject(i + 1, params.get(i));
            ResultSet rs = ps.executeQuery();
            while (rs.next()) {
                Map<String, Object> row = new LinkedHashMap<>();
                row.put("id", rs.getInt("id"));
                row.put("clubeId", rs.getInt("clube_id"));
                row.put("atletaId", rs.getInt("atleta_id"));
                row.put("atletaNome", rs.getString("atleta_nome"));
                row.put("atletaEmail", rs.getString("atleta_email"));
                row.put("epoca", rs.getString("epoca"));
                row.put("valorInscricao", rs.getDouble("valor_inscricao"));
                row.put("estado", rs.getString("estado"));
                row.put("dataPagamento", rs.getString("data_pagamento"));
                row.put("metodoPagamento", rs.getString("metodo_pagamento"));
                row.put("observacoes", rs.getString("observacoes"));
                row.put("createdAt", rs.getString("created_at"));
                row.put("registadoPorEmail", rs.getString("registado_por_email"));
                list.add(row);
            }
        } catch (Exception e) {
            LOGGER.severe(e.toString());
        }
        return list;
    }

    public int inserirInscricao(int clubeId, int atletaId, String epoca, double valorInscricao,
                                String estado, String dataPagamento, String metodoPagamento,
                                String observacoes, Integer registadoPor) {
        String sql = """
            INSERT INTO inscricao_atleta
              (clube_id, atleta_id, epoca, valor_inscricao, estado, data_pagamento, metodo_pagamento, observacoes, registado_por)
            VALUES (?,?,?,?,?,?,?,?,?)
            ON DUPLICATE KEY UPDATE
              valor_inscricao=VALUES(valor_inscricao), estado=VALUES(estado),
              data_pagamento=VALUES(data_pagamento), metodo_pagamento=VALUES(metodo_pagamento),
              observacoes=VALUES(observacoes), registado_por=VALUES(registado_por)
        """;
        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            ps.setInt(1, clubeId);
            ps.setInt(2, atletaId);
            ps.setString(3, epoca);
            ps.setDouble(4, valorInscricao);
            ps.setString(5, estado);
            if (dataPagamento == null) ps.setNull(6, Types.DATE); else ps.setString(6, dataPagamento);
            if (metodoPagamento == null) ps.setNull(7, Types.VARCHAR); else ps.setString(7, metodoPagamento);
            if (observacoes == null) ps.setNull(8, Types.VARCHAR); else ps.setString(8, observacoes);
            if (registadoPor == null) ps.setNull(9, Types.INTEGER); else ps.setInt(9, registadoPor);
            ps.executeUpdate();
            ResultSet keys = ps.getGeneratedKeys();
            if (keys.next()) return keys.getInt(1);
        } catch (Exception e) {
            LOGGER.severe(e.toString());
        }
        return -1;
    }

    public boolean atualizarInscricao(int id, double valorInscricao, String estado, String dataPagamento,
                                      String metodoPagamento, String observacoes) {
        String sql = """
            UPDATE inscricao_atleta
            SET valor_inscricao=?, estado=?, data_pagamento=?, metodo_pagamento=?, observacoes=?
            WHERE id=?
        """;
        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setDouble(1, valorInscricao);
            ps.setString(2, estado);
            if (dataPagamento == null) ps.setNull(3, Types.DATE); else ps.setString(3, dataPagamento);
            if (metodoPagamento == null) ps.setNull(4, Types.VARCHAR); else ps.setString(4, metodoPagamento);
            if (observacoes == null) ps.setNull(5, Types.VARCHAR); else ps.setString(5, observacoes);
            ps.setInt(6, id);
            return ps.executeUpdate() == 1;
        } catch (Exception e) {
            LOGGER.severe(e.toString());
            return false;
        }
    }

    // ==========================================
    // OBTER DADOS DO ATLETA PARA AVISO
    // ==========================================

    public Map<String, Object> obterDadosAtletaParaAviso(int atletaId) {
        String sql = """
            SELECT a.id, COALESCE(u.nome, a.nome) AS nome, a.email
            FROM atleta a
            LEFT JOIN utilizadores u ON u.id = a.utilizador_id
            WHERE a.id = ?
        """;
        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, atletaId);
            ResultSet rs = ps.executeQuery();
            if (rs.next()) {
                Map<String, Object> row = new LinkedHashMap<>();
                row.put("id", rs.getInt("id"));
                row.put("nome", rs.getString("nome"));
                row.put("email", rs.getString("email"));
                return row;
            }
        } catch (Exception e) {
            LOGGER.severe(e.toString());
        }
        return null;
    }
}
