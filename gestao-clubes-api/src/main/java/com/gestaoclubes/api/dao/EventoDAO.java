package com.gestaoclubes.api.dao;

import com.gestaoclubes.api.model.Evento;
import com.gestaoclubes.api.util.ConexoBD;
import org.springframework.stereotype.Repository;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.logging.Logger;
import java.util.logging.Level;

@Repository
public class EventoDAO {

    private static final Logger logger = Logger.getLogger(EventoDAO.class.getName());

    public List<Evento> listarTodos() {
        List<Evento> lista = new ArrayList<>();

        String sql = """
            SELECT 
                e.id, e.titulo, e.descricao, e.data_hora, e.local, 
                e.observacoes, e.tipo, e.clube_modalidade_id, 
                e.coletividade_atividade_id, e.criado_por
            FROM evento e
            ORDER BY e.data_hora DESC
        """;

        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {

            while (rs.next()) {
                Evento e = mapResultSetToEvento(rs);
                lista.add(e);
            }

        } catch (Exception e) {
            logger.log(Level.SEVERE, "Erro ao listar eventos", e);
        }

        return lista;
    }

    public Evento obterPorId(Integer id) {
        String sql = """
            SELECT 
                e.id, e.titulo, e.descricao, e.data_hora, e.local, 
                e.observacoes, e.tipo, e.clube_modalidade_id, 
                e.coletividade_atividade_id, e.criado_por
            FROM evento e
            WHERE e.id = ?
        """;

        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setInt(1, id);

            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return mapResultSetToEvento(rs);
                }
            }

        } catch (Exception e) {
            logger.log(Level.SEVERE, "Erro ao obter evento por ID", e);
        }

        return null;
    }

    public List<Evento> listarPorClubeModalidade(Integer clubeModalidadeId) {
        List<Evento> lista = new ArrayList<>();

        String sql = """
            SELECT 
                e.id, e.titulo, e.descricao, e.data_hora, e.local, 
                e.observacoes, e.tipo, e.clube_modalidade_id, 
                e.coletividade_atividade_id, e.criado_por
            FROM evento e
            WHERE e.clube_modalidade_id = ?
            ORDER BY e.data_hora DESC
        """;

        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setInt(1, clubeModalidadeId);

            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    Evento e = mapResultSetToEvento(rs);
                    lista.add(e);
                }
            }

        } catch (Exception e) {
            logger.log(Level.SEVERE, "Erro ao listar eventos por clube-modalidade", e);
        }

        return lista;
    }

    public Integer criar(Evento evento) {
        String sql = """
            INSERT INTO evento 
            (titulo, descricao, data_hora, local, observacoes, tipo, clube_modalidade_id, coletividade_atividade_id, criado_por)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """;

        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql, PreparedStatement.RETURN_GENERATED_KEYS)) {

            ps.setString(1, evento.getTitulo());
            ps.setString(2, evento.getDescricao());
            ps.setTimestamp(3, evento.getDataHora() != null ? Timestamp.valueOf(evento.getDataHora()) : null);
            ps.setString(4, evento.getLocal());
            ps.setString(5, evento.getObservacoes());
            ps.setString(6, evento.getTipo());
            ps.setObject(7, evento.getClubeModalidadeId());
            ps.setObject(8, evento.getColetividadeAtividadeId());
            ps.setInt(9, evento.getCriadoPor());

            int affectedRows = ps.executeUpdate();
            if (affectedRows > 0) {
                try (ResultSet generatedKeys = ps.getGeneratedKeys()) {
                    if (generatedKeys.next()) {
                        return generatedKeys.getInt(1);
                    }
                }
            }

        } catch (Exception e) {
            logger.log(Level.SEVERE, "Erro ao criar evento", e);
        }

        return null;
    }

    public boolean editar(Evento evento) {
        String sql = """
            UPDATE evento 
            SET titulo = ?, descricao = ?, data_hora = ?, local = ?, 
                observacoes = ?, tipo = ?, clube_modalidade_id = ?, coletividade_atividade_id = ?
            WHERE id = ?
        """;

        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setString(1, evento.getTitulo());
            ps.setString(2, evento.getDescricao());
            ps.setTimestamp(3, evento.getDataHora() != null ? Timestamp.valueOf(evento.getDataHora()) : null);
            ps.setString(4, evento.getLocal());
            ps.setString(5, evento.getObservacoes());
            ps.setString(6, evento.getTipo());
            ps.setObject(7, evento.getClubeModalidadeId());
            ps.setObject(8, evento.getColetividadeAtividadeId());
            ps.setInt(9, evento.getId());

            return ps.executeUpdate() > 0;

        } catch (Exception e) {
            logger.log(Level.SEVERE, "Erro ao editar evento", e);
        }

        return false;
    }

    public boolean deletar(Integer id) {
        String sql = "DELETE FROM evento WHERE id = ?";

        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setInt(1, id);
            return ps.executeUpdate() > 0;

        } catch (Exception e) {
            logger.log(Level.SEVERE, "Erro ao deletar evento", e);
        }

        return false;
    }

    public List<Map<String, Object>> listarComDetalhes() {
        List<Map<String, Object>> lista = new ArrayList<>();

        String sql = """
            SELECT 
                e.id, e.titulo, e.descricao, e.data_hora, e.local, 
                e.observacoes, e.tipo, e.clube_modalidade_id, 
                e.coletividade_atividade_id,
                cm.id as cm_id, cm.clube_id, cm.modalidade_id, cm.epoca,
                m.id as m_id, m.nome as modalidade_nome,
                c.id as clube_id, c.nome as clube_nome
            FROM evento e
            LEFT JOIN clube_modalidade cm ON e.clube_modalidade_id = cm.id
            LEFT JOIN modalidade m ON cm.modalidade_id = m.id
            LEFT JOIN clube c ON cm.clube_id = c.id
            ORDER BY e.data_hora DESC
        """;

        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {

            while (rs.next()) {
                Map<String, Object> map = new LinkedHashMap<>();
                map.put("id", rs.getInt("id"));
                map.put("titulo", rs.getString("titulo"));
                map.put("descricao", rs.getString("descricao"));
                
                Timestamp ts = rs.getTimestamp("data_hora");
                if (ts != null) {
                    map.put("dataHora", ts.toLocalDateTime());
                }
                
                map.put("local", rs.getString("local"));
                map.put("observacoes", rs.getString("observacoes"));
                map.put("tipo", rs.getString("tipo"));
                
                Integer cmId = rs.getInt("cm_id");
                if (!rs.wasNull()) {
                    Map<String, Object> cmMap = new LinkedHashMap<>();
                    cmMap.put("id", cmId);
                    cmMap.put("clubeId", rs.getInt("clube_id"));
                    cmMap.put("modalidadeId", rs.getInt("modalidade_id"));
                    cmMap.put("epoca", rs.getString("epoca"));
                    
                    Map<String, Object> modalidadeMap = new LinkedHashMap<>();
                    modalidadeMap.put("id", rs.getInt("m_id"));
                    modalidadeMap.put("nome", rs.getString("modalidade_nome"));
                    cmMap.put("modalidade", modalidadeMap);
                    
                    Map<String, Object> clubeMap = new LinkedHashMap<>();
                    clubeMap.put("id", rs.getInt("clube_id"));
                    clubeMap.put("nome", rs.getString("clube_nome"));
                    cmMap.put("clube", clubeMap);
                    
                    map.put("clubeModalidade", cmMap);
                }
                
                lista.add(map);
            }

        } catch (Exception e) {
            logger.log(Level.SEVERE, "Erro ao listar eventos com detalhes", e);
        }

        return lista;
    }

    public Integer obterModalidadeIdPorClubeModalidadeId(Integer clubeModalidadeId) {
        if (clubeModalidadeId == null) {
            return null;
        }
        
        String sql = "SELECT modalidade_id FROM clube_modalidade WHERE id = ?";
        
        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            
            ps.setInt(1, clubeModalidadeId);
            
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return rs.getInt("modalidade_id");
                }
            }
            
        } catch (Exception e) {
            logger.log(Level.SEVERE, "Erro ao obter modalidade ID por clube-modalidade ID", e);
        }

        return null;
    }

    public List<Map<String, Object>> listarPorClube(Integer clubeId) {
        List<Map<String, Object>> lista = new ArrayList<>();

        String sql = """
            SELECT 
                e.id, e.titulo, e.descricao, e.data_hora, e.local, 
                e.observacoes, e.tipo, e.clube_modalidade_id, 
                e.coletividade_atividade_id,
                cm.id as cm_id, cm.clube_id, cm.modalidade_id, cm.epoca,
                m.id as m_id, m.nome as modalidade_nome,
                c.id as clube_id, c.nome as clube_nome
            FROM evento e
            LEFT JOIN clube_modalidade cm ON e.clube_modalidade_id = cm.id
            LEFT JOIN modalidade m ON cm.modalidade_id = m.id
            LEFT JOIN clube c ON cm.clube_id = c.id
            WHERE cm.clube_id = ? OR c.id = ?
            ORDER BY e.data_hora DESC
        """;

        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setInt(1, clubeId);
            ps.setInt(2, clubeId);

            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    Map<String, Object> map = new LinkedHashMap<>();
                    map.put("id", rs.getInt("id"));
                    map.put("titulo", rs.getString("titulo"));
                    map.put("descricao", rs.getString("descricao"));
                    
                    Timestamp ts = rs.getTimestamp("data_hora");
                    if (ts != null) {
                        map.put("dataHora", ts.toLocalDateTime());
                    }
                    
                    map.put("local", rs.getString("local"));
                    map.put("observacoes", rs.getString("observacoes"));
                    map.put("tipo", rs.getString("tipo"));
                    
                    Integer cmId = rs.getInt("cm_id");
                    if (!rs.wasNull()) {
                        Map<String, Object> cmMap = new LinkedHashMap<>();
                        cmMap.put("id", cmId);
                        cmMap.put("clubeId", rs.getInt("clube_id"));
                        cmMap.put("modalidadeId", rs.getInt("modalidade_id"));
                        cmMap.put("epoca", rs.getString("epoca"));
                        
                        Map<String, Object> modalidadeMap = new LinkedHashMap<>();
                        modalidadeMap.put("id", rs.getInt("m_id"));
                        modalidadeMap.put("nome", rs.getString("modalidade_nome"));
                        cmMap.put("modalidade", modalidadeMap);
                        
                        Map<String, Object> clubeMap = new LinkedHashMap<>();
                        clubeMap.put("id", rs.getInt("clube_id"));
                        clubeMap.put("nome", rs.getString("clube_nome"));
                        cmMap.put("clube", clubeMap);
                        
                        map.put("clubeModalidade", cmMap);
                    }
                    
                    lista.add(map);
                }
            }

        } catch (Exception e) {
            logger.log(Level.SEVERE, "Erro ao listar eventos por clube", e);
        }

        return lista;
    }

    private Evento mapResultSetToEvento(ResultSet rs) throws java.sql.SQLException {
        Evento evento = new Evento();
        evento.setId(rs.getInt("id"));
        evento.setTitulo(rs.getString("titulo"));
        evento.setDescricao(rs.getString("descricao"));
        
        Timestamp ts = rs.getTimestamp("data_hora");
        if (ts != null) {
            evento.setDataHora(ts.toLocalDateTime());
        }
        
        evento.setLocal(rs.getString("local"));
        evento.setObservacoes(rs.getString("observacoes"));
        evento.setTipo(rs.getString("tipo"));
        evento.setClubeModalidadeId(rs.getInt("clube_modalidade_id"));
        if (rs.wasNull()) {
            evento.setClubeModalidadeId(null);
        }
        evento.setColetividadeAtividadeId(rs.getInt("coletividade_atividade_id"));
        if (rs.wasNull()) {
            evento.setColetividadeAtividadeId(null);
        }
        evento.setCriadoPor(rs.getInt("criado_por"));
        
        return evento;
    }
}
