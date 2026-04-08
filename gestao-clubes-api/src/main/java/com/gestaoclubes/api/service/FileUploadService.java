package com.gestaoclubes.api.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.IIOImage;
import javax.imageio.ImageIO;
import javax.imageio.ImageWriteParam;
import javax.imageio.ImageWriter;
import javax.imageio.stream.ImageOutputStream;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.IOException;
import java.io.OutputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Iterator;
import java.util.Set;
import java.util.UUID;

@Service
public class FileUploadService {

    private static final Set<String> ALLOWED_EXTENSIONS = Set.of("jpg", "jpeg", "png", "gif", "webp");
    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    private static final int AVATAR_SIZE = 400;
    private static final float JPEG_QUALITY = 0.80f;

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
            throw new IllegalArgumentException("Ficheiro demasiado grande (máx. 10MB).");
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
     * Guarda uma imagem de avatar: recorta ao centro para ficar quadrada,
     * redimensiona para AVATAR_SIZE x AVATAR_SIZE e comprime como JPEG.
     */
    public String guardarAvatar(MultipartFile file, String subpasta) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Ficheiro vazio.");
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            throw new IllegalArgumentException("Ficheiro demasiado grande (máx. 10MB).");
        }

        String originalName = file.getOriginalFilename();
        String extension = getExtension(originalName);

        if (!ALLOWED_EXTENSIONS.contains(extension.toLowerCase())) {
            throw new IllegalArgumentException("Extensão não permitida. Use: " + ALLOWED_EXTENSIONS);
        }

        BufferedImage original = ImageIO.read(file.getInputStream());
        if (original == null) {
            throw new IllegalArgumentException("Não foi possível ler a imagem.");
        }

        BufferedImage squared = cropToSquare(original);
        BufferedImage resized = resize(squared, AVATAR_SIZE);

        String uniqueName = UUID.randomUUID() + ".jpg";
        String relativePath = subpasta + "/" + uniqueName;

        Path destDir = Paths.get(uploadDir, subpasta);
        Files.createDirectories(destDir);

        Path destFile = destDir.resolve(uniqueName);
        writeCompressedJpeg(resized, destFile, JPEG_QUALITY);

        return relativePath;
    }

    /**
     * Recorta a imagem ao centro para ficar quadrada.
     */
    private BufferedImage cropToSquare(BufferedImage img) {
        int w = img.getWidth();
        int h = img.getHeight();
        int size = Math.min(w, h);
        int x = (w - size) / 2;
        int y = (h - size) / 2;
        return img.getSubimage(x, y, size, size);
    }

    /**
     * Redimensiona a imagem para targetSize x targetSize.
     */
    private BufferedImage resize(BufferedImage img, int targetSize) {
        if (img.getWidth() <= targetSize && img.getHeight() <= targetSize) {
            return img;
        }
        BufferedImage resized = new BufferedImage(targetSize, targetSize, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = resized.createGraphics();
        g.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BICUBIC);
        g.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
        g.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
        g.drawImage(img, 0, 0, targetSize, targetSize, null);
        g.dispose();
        return resized;
    }

    /**
     * Escreve a imagem como JPEG com o nível de qualidade indicado (0.0 – 1.0).
     */
    private void writeCompressedJpeg(BufferedImage img, Path dest, float quality) throws IOException {
        Iterator<ImageWriter> writers = ImageIO.getImageWritersByFormatName("jpg");
        if (!writers.hasNext()) {
            throw new IOException("JPEG writer não disponível.");
        }
        ImageWriter writer = writers.next();
        ImageWriteParam param = writer.getDefaultWriteParam();
        param.setCompressionMode(ImageWriteParam.MODE_EXPLICIT);
        param.setCompressionQuality(quality);

        try (OutputStream os = Files.newOutputStream(dest);
             ImageOutputStream ios = ImageIO.createImageOutputStream(os)) {
            writer.setOutput(ios);
            writer.write(null, new IIOImage(img, null, null), param);
        } finally {
            writer.dispose();
        }
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
