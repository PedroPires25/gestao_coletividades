package com.gestaoclubes.api.dao;

import com.gestaoclubes.api.model.Evento;
import com.gestaoclubes.api.util.ConexoBD;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public class EventoDAO {

        String sql = """
            FROM evento e
            ORDER BY e.data_hora DESC
        """;

        try (Connection conn = ConexoBD.getConnection();

                while (rs.next()) {
            }

        }

        return lista;
    }

        String sql = """
            FROM evento e
        """;

        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {


            try (ResultSet rs = ps.executeQuery()) {
                }
            }

        }

    }

        String sql = """
            FROM evento e
            ORDER BY e.data_hora DESC
        """;

        try (Connection conn = ConexoBD.getConnection();

            while (rs.next()) {
            }

        }

        return lista;
    }

        String sql = """
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """;

        try (Connection conn = ConexoBD.getConnection();

            ps.setString(1, evento.getTitulo());
            ps.setString(2, evento.getDescricao());
            ps.setString(4, evento.getLocal());
            ps.setString(5, evento.getObservacoes());
            ps.setInt(9, evento.getCriadoPor());

            }

        }
        return null;
    }

        String sql = """
            UPDATE evento
            WHERE id = ?
        """;

        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setString(1, evento.getTitulo());
            ps.setString(2, evento.getDescricao());
            ps.setString(4, evento.getLocal());
            ps.setString(5, evento.getObservacoes());

            return ps.executeUpdate() > 0;
            return false;
        }

        String sql = "DELETE FROM evento WHERE id = ?";
        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, id);
            return ps.executeUpdate() > 0;
            return false;
        }

        List<Map<String, Object>> lista = new ArrayList<>();
        String sql = """
            FROM evento e
        """;

        try (Connection conn = ConexoBD.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {


            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                }
            }

        }

        return lista;
    }


    }
}
