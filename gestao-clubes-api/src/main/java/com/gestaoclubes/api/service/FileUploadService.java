package com.gestaoclubes.api.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import jakarta.annotation.PostConstruct;
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
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Iterator;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.logging.Logger;

@Service
public class FileUploadService {

    private static final Logger LOGGER = Logger.getLogger(FileUploadService.class.getName());

    private static final Set<String> ALLOWED_EXTENSIONS = Set.of("jpg", "jpeg", "png", "gif", "webp");
    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024;
    private static final int AVATAR_SIZE = 400;
    private static final float JPEG_QUALITY = 0.80f;

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    @Value("${cloudinary.cloud-name:}")
    private String cloudName;

    @Value("${cloudinary.api-key:}")
    private String apiKey;

    @Value("${cloudinary.api-secret:}")
    private String apiSecret;

    private Cloudinary cloudinary;
    private boolean useCloudinary;

    @PostConstruct
    public void init() {
        boolean hasCloudName = cloudName != null && !cloudName.isBlank();
        boolean hasApiKey = apiKey != null && !apiKey.isBlank();
        boolean hasApiSecret = apiSecret != null && !apiSecret.isBlank();

        if (hasCloudName || hasApiKey || hasApiSecret) {
            if (!hasCloudName || !hasApiKey || !hasApiSecret) {
                throw new IllegalStateException(
                        "CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY e CLOUDINARY_API_SECRET devem estar todos configurados.");
            }
        }

        useCloudinary = hasCloudName;
        if (useCloudinary) {
            cloudinary = new Cloudinary(ObjectUtils.asMap(
                    "cloud_name", cloudName,
                    "api_key", apiKey,
                    "api_secret", apiSecret,
                    "secure", true
            ));
            LOGGER.info("FileUploadService: Cloudinary configurado (" + cloudName + ")");
        } else {
            LOGGER.info("FileUploadService: Usando armazenamento local ('" + uploadDir + "')");
        }
    }

    public String guardarFicheiro(MultipartFile file, String subpasta) throws IOException {
        validar(file);
        String extension = getExtension(file.getOriginalFilename());
        if (!ALLOWED_EXTENSIONS.contains(extension.toLowerCase())) {
            throw new IllegalArgumentException("Extensão não permitida. Use: " + ALLOWED_EXTENSIONS);
        }
        if (useCloudinary) {
            return uploadParaCloudinary(file.getBytes(), "gestao-clubes/" + subpasta, "auto");
        }
        return guardarLocal(file, subpasta, extension);
    }

    public String guardarAvatar(MultipartFile file, String subpasta) throws IOException {
        validar(file);
        String extension = getExtension(file.getOriginalFilename());
        if (!ALLOWED_EXTENSIONS.contains(extension.toLowerCase())) {
            throw new IllegalArgumentException("Extensão não permitida. Use: " + ALLOWED_EXTENSIONS);
        }
        BufferedImage original = ImageIO.read(file.getInputStream());
        if (original == null) throw new IllegalArgumentException("Não foi possível ler a imagem.");

        BufferedImage processed = resize(cropToSquare(original), AVATAR_SIZE);

        if (useCloudinary) {
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            writeCompressedJpeg(processed, baos, JPEG_QUALITY);
            return uploadParaCloudinary(baos.toByteArray(), "gestao-clubes/" + subpasta, "image");
        }
        return guardarAvatarLocal(processed, subpasta);
    }

    public void removerFicheiro(String path) {
        if (path == null || path.isBlank()) return;
        if (useCloudinary && path.startsWith("http")) {
            try {
                String publicId = extractPublicId(path);
                if (publicId != null) {
                    cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
                }
            } catch (Exception e) {
                LOGGER.warning("Erro ao remover ficheiro do Cloudinary: " + e.getMessage());
            }
        } else {
            try {
                Files.deleteIfExists(Paths.get(uploadDir, path));
            } catch (IOException e) {
                LOGGER.warning("Erro ao remover ficheiro local: " + e.getMessage());
            }
        }
    }

    public Path resolverCaminho(String relativePath) {
        return Paths.get(uploadDir, relativePath);
    }

    private String uploadParaCloudinary(byte[] bytes, String folder, String resourceType) throws IOException {
        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> result = cloudinary.uploader().upload(bytes, ObjectUtils.asMap(
                    "public_id", folder + "/" + UUID.randomUUID(),
                    "resource_type", resourceType
            ));
            return (String) result.get("secure_url");
        } catch (Exception e) {
            throw new IOException("Erro ao fazer upload para o Cloudinary: " + e.getMessage(), e);
        }
    }

    private String extractPublicId(String url) {
        int idx = url.indexOf("/upload/");
        if (idx < 0) return null;
        String after = url.substring(idx + 8);
        if (after.matches("v\\d+/.*")) after = after.substring(after.indexOf('/') + 1);
        int dot = after.lastIndexOf('.');
        if (dot > 0 && dot > after.lastIndexOf('/')) after = after.substring(0, dot);
        return after;
    }

    private String guardarLocal(MultipartFile file, String subpasta, String extension) throws IOException {
        String uniqueName = UUID.randomUUID() + "." + extension.toLowerCase();
        Path destDir = Paths.get(uploadDir, subpasta);
        Files.createDirectories(destDir);
        Files.copy(file.getInputStream(), destDir.resolve(uniqueName), StandardCopyOption.REPLACE_EXISTING);
        return subpasta + "/" + uniqueName;
    }

    private String guardarAvatarLocal(BufferedImage img, String subpasta) throws IOException {
        String uniqueName = UUID.randomUUID() + ".jpg";
        Path destDir = Paths.get(uploadDir, subpasta);
        Files.createDirectories(destDir);
        try (OutputStream os = Files.newOutputStream(destDir.resolve(uniqueName))) {
            writeCompressedJpeg(img, os, JPEG_QUALITY);
        }
        return subpasta + "/" + uniqueName;
    }

    private BufferedImage cropToSquare(BufferedImage img) {
        int w = img.getWidth(), h = img.getHeight(), size = Math.min(w, h);
        return img.getSubimage((w - size) / 2, (h - size) / 2, size, size);
    }

    private BufferedImage resize(BufferedImage img, int targetSize) {
        if (img.getWidth() <= targetSize && img.getHeight() <= targetSize) return img;
        BufferedImage out = new BufferedImage(targetSize, targetSize, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = out.createGraphics();
        g.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BICUBIC);
        g.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
        g.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
        g.drawImage(img, 0, 0, targetSize, targetSize, null);
        g.dispose();
        return out;
    }

    private void writeCompressedJpeg(BufferedImage img, OutputStream os, float quality) throws IOException {
        Iterator<ImageWriter> writers = ImageIO.getImageWritersByFormatName("jpg");
        if (!writers.hasNext()) throw new IOException("JPEG writer não disponível.");
        ImageWriter writer = writers.next();
        ImageWriteParam param = writer.getDefaultWriteParam();
        param.setCompressionMode(ImageWriteParam.MODE_EXPLICIT);
        param.setCompressionQuality(quality);
        try (ImageOutputStream ios = ImageIO.createImageOutputStream(os)) {
            writer.setOutput(ios);
            writer.write(null, new IIOImage(img, null, null), param);
        } finally {
            writer.dispose();
        }
    }

    private void validar(MultipartFile file) {
        if (file == null || file.isEmpty()) throw new IllegalArgumentException("Ficheiro vazio.");
        if (file.getSize() > MAX_FILE_SIZE) throw new IllegalArgumentException("Ficheiro demasiado grande (máx. 10MB).");
    }

    private String getExtension(String filename) {
        if (filename == null || !filename.contains(".")) return "";
        return filename.substring(filename.lastIndexOf('.') + 1);
    }
}
