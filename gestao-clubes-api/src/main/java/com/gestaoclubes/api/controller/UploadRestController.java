package com.gestaoclubes.api.controller;

import com.gestaoclubes.api.dao.ClubeDAO;
import com.gestaoclubes.api.dao.ColetividadeDAO;
import com.gestaoclubes.api.dao.UtilizadorDAO;
import com.gestaoclubes.api.dao.AtletaDAO;
import com.gestaoclubes.api.dao.StaffDAO;
import com.gestaoclubes.api.model.Clube;
import com.gestaoclubes.api.model.Coletividade;
import com.gestaoclubes.api.model.Utilizador;
import com.gestaoclubes.api.model.Atleta;
import com.gestaoclubes.api.model.Staff;
import com.gestaoclubes.api.service.FileUploadService;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import jakarta.servlet.http.HttpServletRequest;
import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class UploadRestController {

    private final FileUploadService uploadService;
    private final ClubeDAO clubeDAO = new ClubeDAO();
    private final ColetividadeDAO coletividadeDAO = new ColetividadeDAO();
    private final UtilizadorDAO utilizadorDAO;
    private final AtletaDAO atletaDAO = new AtletaDAO();
    private final StaffDAO staffDAO = new StaffDAO();

    public UploadRestController(FileUploadService uploadService, UtilizadorDAO utilizadorDAO) {
        this.uploadService = uploadService;
        this.utilizadorDAO = utilizadorDAO;
    }

    // ---- UPLOAD DE LOGO PARA CLUBES ----
    @PostMapping("/clubes/{id}/logo")
    public ResponseEntity<?> uploadClubeLogo(@PathVariable int id,
                                             @RequestParam("file") MultipartFile file) {
        Clube clube = clubeDAO.buscarPorId(id);
        if (clube == null) {
            return ResponseEntity.notFound().build();
        }

        try {
            // Remove logo anterior se existir
            if (clube.getLogoPath() != null) {
                uploadService.removerFicheiro(clube.getLogoPath());
            }

            String relativePath = uploadService.guardarFicheiro(file, "clubes");
            clubeDAO.atualizarLogoPath(id, relativePath);

            return ResponseEntity.ok(Map.of(
                    "message", "Logo do clube atualizado com sucesso.",
                    "logoPath", relativePath
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Erro ao guardar ficheiro."));
        }
    }

    // ---- UPLOAD DE LOGO PARA COLETIVIDADES ----
    @PostMapping("/coletividades/{id}/logo")
    public ResponseEntity<?> uploadColetividadeLogo(@PathVariable int id,
                                                    @RequestParam("file") MultipartFile file) {
        Coletividade col = coletividadeDAO.buscarPorId(id);
        if (col == null) {
            return ResponseEntity.notFound().build();
        }

        try {
            if (col.getLogoPath() != null) {
                uploadService.removerFicheiro(col.getLogoPath());
            }

            String relativePath = uploadService.guardarFicheiro(file, "coletividades");
            coletividadeDAO.atualizarLogoPath(id, relativePath);

            return ResponseEntity.ok(Map.of(
                    "message", "Logo da coletividade atualizado com sucesso.",
                    "logoPath", relativePath
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Erro ao guardar ficheiro."));
        }
    }

    // ---- UPLOAD DE AVATAR PARA UTILIZADORES ----
    @PostMapping("/utilizadores/{id}/avatar")
    public ResponseEntity<?> uploadUtilizadorAvatar(@PathVariable int id,
                                                    @RequestParam("file") MultipartFile file) {
        Utilizador user = utilizadorDAO.buscarPorId(id);
        if (user == null) {
            return ResponseEntity.notFound().build();
        }

        try {
            if (user.getLogoPath() != null) {
                uploadService.removerFicheiro(user.getLogoPath());
            }

            String relativePath = uploadService.guardarAvatar(file, "utilizadores");
            utilizadorDAO.atualizarLogoPath(id, relativePath);

            return ResponseEntity.ok(Map.of(
                    "message", "Avatar atualizado com sucesso.",
                    "logoPath", relativePath
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Erro ao guardar ficheiro."));
        }
    }

    // ---- UPLOAD DE FOTO PARA ATLETAS ----
    @PostMapping("/atletas/{id}/foto")
    public ResponseEntity<?> uploadAtletaFoto(@PathVariable int id,
                                              @RequestParam("file") MultipartFile file) {
        Atleta atleta = atletaDAO.buscarPorId(id);
        if (atleta == null) {
            return ResponseEntity.notFound().build();
        }

        try {
            if (atleta.getFotoPath() != null) {
                uploadService.removerFicheiro(atleta.getFotoPath());
            }

            String relativePath = uploadService.guardarAvatar(file, "atletas");
            atletaDAO.atualizarFotoPath(id, relativePath);

            return ResponseEntity.ok(Map.of(
                    "message", "Foto do atleta atualizada com sucesso.",
                    "fotoPath", relativePath
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Erro ao guardar ficheiro."));
        }
    }

    // ---- UPLOAD DE FOTO PARA STAFF ----
    @PostMapping("/staff/{id}/foto")
    public ResponseEntity<?> uploadStaffFoto(@PathVariable int id,
                                             @RequestParam("file") MultipartFile file) {
        Staff staff = staffDAO.buscarPorId(id);
        if (staff == null) {
            return ResponseEntity.notFound().build();
        }

        try {
            if (staff.getFotoPath() != null) {
                uploadService.removerFicheiro(staff.getFotoPath());
            }

            String relativePath = uploadService.guardarAvatar(file, "staff");
            staffDAO.atualizarFotoPath(id, relativePath);

            return ResponseEntity.ok(Map.of(
                    "message", "Foto do staff atualizada com sucesso.",
                    "fotoPath", relativePath
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Erro ao guardar ficheiro."));
        }
    }

    // ---- SERVIR FICHEIROS DE UPLOADS ----
    @GetMapping("/uploads/**")
    public ResponseEntity<Resource> servirFicheiro(HttpServletRequest request) {
        String fullPath = request.getRequestURI();
        String relativePath = fullPath.substring(fullPath.indexOf("/uploads/") + "/uploads/".length());

        try {
            Path filePath = uploadService.resolverCaminho(relativePath);

            if (!Files.exists(filePath) || !Files.isReadable(filePath)) {
                return ResponseEntity.notFound().build();
            }

            Resource resource = new UrlResource(filePath.toUri());
            String contentType = Files.probeContentType(filePath);
            if (contentType == null) {
                contentType = "application/octet-stream";
            }

            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CACHE_CONTROL, "public, max-age=86400")
                    .body(resource);

        } catch (MalformedURLException e) {
            return ResponseEntity.badRequest().build();
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
