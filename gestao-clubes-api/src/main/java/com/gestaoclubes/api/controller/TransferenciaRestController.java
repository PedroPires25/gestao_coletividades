package com.gestaoclubes.api.controller;

import com.gestaoclubes.api.dao.AtletaClubeModalidadeDAO;
import com.gestaoclubes.api.dao.AtletaDAO;
import com.gestaoclubes.api.dao.TransferenciaAtletaDAO;
import com.gestaoclubes.api.model.Atleta;
import com.gestaoclubes.api.security.SecurityUtils;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.sql.Date;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class TransferenciaRestController {

    private static final int ESTADO_TRANSFERIDO = 2;

    private final TransferenciaAtletaDAO transferenciaDAO = new TransferenciaAtletaDAO();
    private final AtletaDAO atletaDAO = new AtletaDAO();
    private final AtletaClubeModalidadeDAO atletaClubeModalidadeDAO = new AtletaClubeModalidadeDAO();

    /**
     * Lista o historial de transferências do clube (como origem ou destino).
     * Acessível a perfis administrativos do clube.
     */
    @GetMapping("/clubes/{clubeId}/transferencias")
    public List<Map<String, Object>> listar(@PathVariable int clubeId) {
        verificarAcessoClube(clubeId);
        return transferenciaDAO.listarPorClube(clubeId);
    }

    /**
     * Regista a transferência de um atleta para fora do clube.
     * Apenas SUPER_ADMIN, ADMINISTRADOR e SECRETÁRIO podem transferir.
     */
    @PostMapping("/clubes/{clubeId}/atletas/{atletaId}/transferir")
    public Map<String, Object> transferir(
            @PathVariable int clubeId,
            @PathVariable int atletaId,
            @RequestBody Map<String, Object> body
    ) {
        verificarPermissaoTransferencia(clubeId);

        Atleta atleta = atletaDAO.buscarPorId(atletaId);
        if (atleta == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Atleta não encontrado.");
        }
        if (atleta.getClubeAtualId() != clubeId) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "O atleta não pertence a este clube.");
        }

        Integer clubeDestinoId = null;
        Object rawDestino = body.get("clubeDestinoId");
        if (rawDestino instanceof Number n && n.intValue() > 0) {
            clubeDestinoId = n.intValue();
        }

        String clubeDestinoNome = body.get("clubeDestinoNome") instanceof String s ? s.trim() : null;
        if (clubeDestinoNome != null && clubeDestinoNome.isBlank()) clubeDestinoNome = null;

        String obs = body.get("observacoes") instanceof String s ? s.trim() : null;
        if (obs != null && obs.isBlank()) obs = null;

        String dataStr = body.get("dataTransferencia") instanceof String s ? s.trim() : null;
        Date dataTransferencia = dataStr != null && !dataStr.isBlank()
                ? Date.valueOf(LocalDate.parse(dataStr))
                : Date.valueOf(LocalDate.now());

        boolean registado = transferenciaDAO.inserir(atletaId, clubeId, clubeDestinoId, clubeDestinoNome, dataTransferencia, obs);
        if (!registado) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "Não foi possível registar a transferência.");
        }

        atletaClubeModalidadeDAO.desativarInscricoesAtivas(atletaId, dataTransferencia);
        atletaDAO.atualizarEstado(atletaId, ESTADO_TRANSFERIDO);

        return Map.of(
                "mensagem", "Atleta transferido com sucesso.",
                "atletaId", atletaId,
                "clubeOrigemId", clubeId
        );
    }

    private void verificarAcessoClube(int clubeId) {
        String role = SecurityUtils.currentRole();
        if (role == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Autenticação necessária.");
        }
        if (SecurityUtils.isSuperAdmin()) return;

        Integer userClubeId = SecurityUtils.currentClubeId();
        boolean pertenceAoClube = userClubeId != null && userClubeId == clubeId;

        if (!pertenceAoClube) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Acesso não autorizado.");
        }
    }

    private void verificarPermissaoTransferencia(int clubeId) {
        String role = SecurityUtils.currentRole();
        if (role == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Autenticação necessária.");
        }
        if (SecurityUtils.isSuperAdmin()) return;

        boolean isAdministrador = "ROLE_ADMINISTRADOR".equals(role) && SecurityUtils.currentPrivilegiosAtivos();
        boolean isSecretario = "ROLE_SECRETARIO".equals(role);

        if (!isAdministrador && !isSecretario) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Não tem permissão para realizar transferências.");
        }

        Integer userClubeId = SecurityUtils.currentClubeId();
        if (userClubeId == null || userClubeId != clubeId) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Acesso não autorizado a este clube.");
        }
    }
}
