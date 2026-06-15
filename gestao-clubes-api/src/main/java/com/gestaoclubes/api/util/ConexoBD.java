package com.gestaoclubes.api.util;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;

import java.io.File;
import java.io.InputStream;
import java.sql.Connection;
import java.sql.SQLException;
import java.util.Properties;
import java.util.logging.Logger;

/**
 * Classe utilitária para gerir ligações à base de dados MySQL usando HikariCP.
 * As variáveis de ambiente têm prioridade sobre o ficheiro local db.properties.
 */
public class ConexoBD {

    private static final Logger LOGGER = Logger.getLogger(ConexoBD.class.getName());

    private static HikariDataSource dataSource;
    private static boolean propertiesLoaded = false;

    private ConexoBD() {
    }

    private static synchronized void loadProperties() {
        if (propertiesLoaded) return;

        Properties props = new Properties();

        try (InputStream input = ConexoBD.class.getClassLoader()
                .getResourceAsStream("db.properties")) {

            if (input != null) {
                props.load(input);
            }

            String url = firstNonBlank(System.getenv("DB_URL"), props.getProperty("db.url"));
            String username = firstNonBlank(System.getenv("DB_USERNAME"), props.getProperty("db.username"));
            String password = firstNonBlank(System.getenv("DB_PASSWORD"), props.getProperty("db.password"));
            String driver = props.getProperty("db.driver", "com.mysql.cj.jdbc.Driver");
            String sslCertPath = props.getProperty("db.ssl.cert.path", "");

            if (url == null || username == null || password == null) {
                throw new IllegalStateException("DB_URL, DB_USERNAME e DB_PASSWORD devem estar configurados.");
            }

            if (!url.contains("serverSslCert") && sslCertPath != null && !sslCertPath.isEmpty()) {
                InputStream certStream = ConexoBD.class.getClassLoader()
                        .getResourceAsStream(sslCertPath);

                if (certStream != null) {
                    try { certStream.close(); } catch (Exception ignored) {}

                    if (!url.contains("?")) {
                        url += "?useSSL=true&requireSSL=true&serverSslCert=classpath:" + sslCertPath;
                    } else {
                        url += "&useSSL=true&requireSSL=true&serverSslCert=classpath:" + sslCertPath;
                    }
                } else {
                    File certFile = new File("src/" + sslCertPath);
                    if (certFile.exists()) {
                        String certPath = certFile.getAbsolutePath();
                        if (!url.contains("?")) {
                            url += "?useSSL=true&requireSSL=true&serverSslCert=" + certPath;
                        } else {
                            url += "&useSSL=true&requireSSL=true&serverSslCert=" + certPath;
                        }
                    } else {
                        LOGGER.warning("Certificado SSL não encontrado em: " + sslCertPath);
                    }
                }
            }

            HikariConfig config = new HikariConfig();
            config.setJdbcUrl(url);
            config.setUsername(username);
            config.setPassword(password);
            config.setDriverClassName(driver);
            
            // Configurações recomendadas para MySQL
            config.addDataSourceProperty("cachePrepStmts", "true");
            config.addDataSourceProperty("prepStmtCacheSize", "250");
            config.addDataSourceProperty("prepStmtCacheSqlLimit", "2048");
            config.addDataSourceProperty("useServerPrepStmts", "true");
            config.addDataSourceProperty("useLocalSessionState", "true");
            config.addDataSourceProperty("rewriteBatchedStatements", "true");
            config.addDataSourceProperty("cacheResultSetMetadata", "true");
            config.addDataSourceProperty("cacheServerConfiguration", "true");
            config.addDataSourceProperty("elideSetAutoCommits", "true");
            config.addDataSourceProperty("maintainTimeStats", "false");
            
            // Tamanho da pool
            config.setMaximumPoolSize(10);
            config.setMinimumIdle(2);
            config.setIdleTimeout(300000);
            config.setConnectionTimeout(20000);
            config.setMaxLifetime(1200000);

            dataSource = new HikariDataSource(config);
            propertiesLoaded = true;
            LOGGER.info("Configurações da base de dados (HikariCP) carregadas com sucesso.");

        } catch (Exception e) {
            LOGGER.severe("Erro ao carregar configuração da base de dados: " + e.getMessage());
            throw new IllegalStateException("Configuração da base de dados inválida.", e);
        }
    }

    public static Connection getConnection() throws SQLException {
        if (!propertiesLoaded) {
            loadProperties();
        }
        return dataSource.getConnection();
    }

    public static void closeConnection() {
        if (dataSource != null && !dataSource.isClosed()) {
            dataSource.close();
        }
    }

    public static boolean isConnectionActive() {
        return dataSource != null && !dataSource.isClosed() && dataSource.isRunning();
    }

    private static String firstNonBlank(String first, String second) {
        if (first != null && !first.isBlank()) return first;
        if (second != null && !second.isBlank()) return second;
        return null;
    }
}