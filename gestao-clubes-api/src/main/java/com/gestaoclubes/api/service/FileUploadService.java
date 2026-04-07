package com.gestaoclubes.api.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Set;
import java.util.UUID;

@Service
public class FileUploadService {

    private static final Set<String> ALLOWED_EXTENSIONS = Set.of("jpg", "jpeg", "png", "gif", "webp");
    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    /**
     * Guarda o ficheiro no disco e devolve o caminho relativo (ex: "clubes/uuid.png").
     */
    public String guardarFicheiro(MultipartFile file, String subpasta) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Ficheiro vazio.");
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            throw new IllegalArgumentException("Ficheiro demasiado grande (máx. 5MB).");
        }

        String originalName = file.getOriginalFilename();
        String extension = getExtension(originalName);

        if (!ALLOWED_EXTENSIONS.contains(extension.toLowerCase())) {
            throw new IllegalArgumentException("Extensão não permitida. Use: " + ALLOWED_EXTENSIONS);
        }

        String uniqueName = UUID.randomUUID() + "." + extension.toLowerCase();
        String relativePath = subpasta + "/" + uniqueName;

        Path destDir = Paths.get(uploadDir, subpasta);
        Files.createDirectories(destDir);

        Path destFile = destDir.resolve(uniqueName);
        Files.copy(file.getInputStream(), destFile, StandardCopyOption.REPLACE_EXISTING);

        return relativePath;
    }

    /**
     * Remove um ficheiro de upload anterior (se existir).
     */
    public void removerFicheiro(String relativePath) {
        if (relativePath == null || relativePath.isBlank()) return;
        try {
            Path filePath = Paths.get(uploadDir, relativePath);
            Files.deleteIfExists(filePath);
        } catch (IOException e) {
            System.err.println("Erro ao remover ficheiro: " + e.getMessage());
        }
    }

    /**
     * Devolve o Path absoluto de um ficheiro relativo.
     */
    public Path resolverCaminho(String relativePath) {
        return Paths.get(uploadDir, relativePath);
    }

    private String getExtension(String filename) {
        if (filename == null || !filename.contains(".")) {
            return "";
        }
        return filename.substring(filename.lastIndexOf('.') + 1);
    }
}
