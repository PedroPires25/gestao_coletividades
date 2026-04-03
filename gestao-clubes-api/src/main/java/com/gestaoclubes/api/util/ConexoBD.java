package com.gestaoclubes.api.util;

import java.io.File;
import java.io.InputStream;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.util.Properties;
import java.util.logging.Logger;

/**
 * Classe utilitária para gerir conexões com a base de dados MySQL.
 * Lê as configurações do ficheiro db.properties.
 * Suporta conexões SSL com certificado.
 *
 * ✅ IMPORTANTE:
 * - NÃO usa Connection singleton.
 * - Cada getConnection() devolve uma Connection nova (thread-safe para API).
 */
public class ConexoBD {

    private static final Logger LOGGER = Logger.getLogger(ConexoBD.class.getName());

    // Configurações da base de dados (carregadas do ficheiro properties)
    private static String URL;
    private static String USERNAME;
    private static String PASSWORD;
    private static String DRIVER;

    // Flag para indicar se as propriedades já foram carregadas
    private static boolean propertiesLoaded = false;

    // Construtor privado (utilitário)
    private ConexoBD() {
        loadProperties();
    }

    /**
     * Carrega as propriedades do ficheiro db.properties.
     * Este método é executado apenas uma vez.
     */
    private static void loadProperties() {
        if (propertiesLoaded) return;

        Properties props = new Properties();

        try (InputStream input = ConexoBD.class.getClassLoader()
                .getResourceAsStream("db.properties")) {

            if (input == null) {
                System.err.println("Erro: Ficheiro db.properties não encontrado!");
                // Valores padrão caso o ficheiro não exista
                URL = "jdbc:mysql://localhost:3306/ci-java";
                USERNAME = "root";
                PASSWORD = "";
                DRIVER = "com.mysql.cj.jdbc.Driver";
                propertiesLoaded = true;
                return;
            }

            props.load(input);

            URL = props.getProperty("db.url", "jdbc:mysql://localhost:3306/ci-java");
            USERNAME = props.getProperty("db.username", "root");
            PASSWORD = props.getProperty("db.password", "");
            DRIVER = props.getProperty("db.driver", "com.mysql.cj.jdbc.Driver");
            String sslCertPath = props.getProperty("db.ssl.cert.path", "");

            // Se o certificado não estiver na URL e o caminho estiver definido, adiciona à URL
            if (!URL.contains("serverSslCert") && sslCertPath != null && !sslCertPath.isEmpty()) {
                // Tenta usar o certificado do classpath primeiro
                InputStream certStream = ConexoBD.class.getClassLoader()
                        .getResourceAsStream(sslCertPath);

                if (certStream != null) {
                    try { certStream.close(); } catch (Exception ignored) {}

                    if (!URL.contains("?")) {
                        URL += "?useSSL=true&requireSSL=true&serverSslCert=classpath:" + sslCertPath;
                    } else {
                        URL += "&useSSL=true&requireSSL=true&serverSslCert=classpath:" + sslCertPath;
                    }
                } else {
                    // Tenta usar como arquivo do sistema
                    File certFile = new File("src/" + sslCertPath);
                    if (certFile.exists()) {
                        String certPath = certFile.getAbsolutePath().replace("\\", "/");
                        if (!URL.contains("?")) {
                            URL += "?useSSL=true&requireSSL=true&serverSslCert=" + certPath;
                        } else {
                            URL += "&useSSL=true&requireSSL=true&serverSslCert=" + certPath;
                        }
                    } else {
                        LOGGER.warning("Certificado SSL não encontrado em: " + sslCertPath);
                    }
                }
            }

            propertiesLoaded = true;
            System.out.println("Configurações da base de dados carregadas com sucesso!");
            System.out.println("Conectando a: " + URL.split("\\?")[0]);

        } catch (Exception e) {
            LOGGER.severe("Erro ao carregar db.properties: " + e.getMessage());

            // Valores padrão em caso de erro
            URL = "jdbc:mysql://localhost:3306/ci-java";
            USERNAME = "root";
            PASSWORD = "";
            DRIVER = "com.mysql.cj.jdbc.Driver";
            propertiesLoaded = true;
        }
    }

    /**
     * Obtém uma NOVA conexão com a base de dados (sem singleton).
     * Cada chamada cria uma Connection nova (seguro para múltiplos requests).
     */
    public static Connection getConnection() throws SQLException {
        if (!propertiesLoaded) loadProperties();

        try {
            Class.forName(DRIVER);
        } catch (ClassNotFoundException e) {
            throw new SQLException("Driver MySQL não encontrado: " + e.getMessage());
        }

        // ✅ devolve sempre uma NOVA connection
        return DriverManager.getConnection(URL, USERNAME, PASSWORD);
    }

    /**
     * Mantido por compatibilidade.
     * Como já não existe singleton, este método não é necessário.
     */
    public static void closeConnection() {
        // no-op (as connections são fechadas nos DAOs via try-with-resources)
    }

    /**
     * Mantido por compatibilidade.
     */
    public static boolean isConnectionActive() {
        return false; // já não há singleton para verificar
    }
}