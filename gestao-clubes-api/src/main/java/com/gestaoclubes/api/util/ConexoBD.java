package com.gestaoclubes.api.util;

import java.io.File;
import java.io.InputStream;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.util.Properties;
import java.util.logging.Logger;

/**
 * Classe utilitária para gerir ligações à base de dados MySQL.
 * As variáveis de ambiente têm prioridade sobre o ficheiro local db.properties.
 */
public class ConexoBD {

    private static final Logger LOGGER = Logger.getLogger(ConexoBD.class.getName());

    private static String URL;
    private static String USERNAME;
    private static String PASSWORD;
    private static String DRIVER;

    private static boolean propertiesLoaded = false;

    private ConexoBD() {
        loadProperties();
    }

    private static void loadProperties() {
        if (propertiesLoaded) return;

        Properties props = new Properties();

        try (InputStream input = ConexoBD.class.getClassLoader()
                .getResourceAsStream("db.properties")) {

            if (input != null) {
                props.load(input);
            }

            URL      = firstNonBlank(System.getenv("DB_URL"), props.getProperty("db.url"));
            USERNAME = firstNonBlank(System.getenv("DB_USERNAME"), props.getProperty("db.username"));
            PASSWORD = firstNonBlank(System.getenv("DB_PASSWORD"), props.getProperty("db.password"));
            DRIVER   = props.getProperty("db.driver", "com.mysql.cj.jdbc.Driver");
            String sslCertPath = props.getProperty("db.ssl.cert.path", "");

            validarConfiguracao();

            if (!URL.contains("serverSslCert") && sslCertPath != null && !sslCertPath.isEmpty()) {
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
                    File certFile = new File("src/" + sslCertPath);
                    if (certFile.exists()) {
                        String certPath = certFile.getAbsolutePath();
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
            LOGGER.info("Configurações da base de dados carregadas.");

        } catch (Exception e) {
            LOGGER.severe("Erro ao carregar configuração da base de dados: " + e.getMessage());
            throw new IllegalStateException("Configuração da base de dados inválida.", e);
        }
    }

    public static Connection getConnection() throws SQLException {
        if (!propertiesLoaded) loadProperties();

        try {
            Class.forName(DRIVER);
        } catch (ClassNotFoundException e) {
            throw new SQLException("Driver MySQL não encontrado: " + e.getMessage());
        }

        return DriverManager.getConnection(URL, USERNAME, PASSWORD);
    }

    public static void closeConnection() {
    }

    public static boolean isConnectionActive() {
        return false;
    }

    private static String firstNonBlank(String first, String second) {
        if (first != null && !first.isBlank()) return first;
        if (second != null && !second.isBlank()) return second;
        return null;
    }

    private static void validarConfiguracao() {
        if (URL == null || USERNAME == null || PASSWORD == null) {
            throw new IllegalStateException("DB_URL, DB_USERNAME e DB_PASSWORD devem estar configurados.");
        }
    }
}