-- =========================
--  Gestão de Clubes - DB (FINAL)
-- =========================

CREATE DATABASE IF NOT EXISTS gestao_clubes
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE gestao_clubes;

-- -------------------------
-- LOGIN
-- -------------------------
CREATE TABLE IF NOT EXISTS perfis (
  id INT AUTO_INCREMENT PRIMARY KEY,
  descricao VARCHAR(50) NOT NULL UNIQUE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS utilizadores (
  id INT AUTO_INCREMENT PRIMARY KEY,
  utilizador VARCHAR(120) NOT NULL UNIQUE,
  palavra_chave VARCHAR(255) NOT NULL,
  perfil_id INT NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  CONSTRAINT fk_utilizadores_perfis
    FOREIGN KEY (perfil_id) REFERENCES perfis(id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

INSERT IGNORE INTO perfis (id, descricao) VALUES
  (1, 'ADMIN'),
  (2, 'USER');

-- -------------------------
-- CLUBES
-- -------------------------
CREATE TABLE IF NOT EXISTS clube (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(120) NOT NULL,
  nif VARCHAR(20),
  email VARCHAR(120),
  telefone VARCHAR(30),
  morada VARCHAR(255),
  data_fundacao DATE,
  UNIQUE KEY uq_clube_nome (nome)
) ENGINE=InnoDB;

-- -------------------------
-- MODALIDADES
-- -------------------------
CREATE TABLE IF NOT EXISTS modalidade (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(80) NOT NULL UNIQUE,
  descricao VARCHAR(255)
) ENGINE=InnoDB;

-- -------------------------
-- CLUBE ↔ MODALIDADE
-- -------------------------
CREATE TABLE IF NOT EXISTS clube_modalidade (
  id INT AUTO_INCREMENT PRIMARY KEY,
  clube_id INT NOT NULL,
  modalidade_id INT NOT NULL,
  epoca VARCHAR(20),
  ativo TINYINT(1) NOT NULL DEFAULT 1,

  CONSTRAINT fk_cm_clube
    FOREIGN KEY (clube_id) REFERENCES clube(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,

  CONSTRAINT fk_cm_modalidade
    FOREIGN KEY (modalidade_id) REFERENCES modalidade(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,

  UNIQUE KEY uq_clube_mod_epoca (clube_id, modalidade_id, epoca),
  KEY idx_cm_clube (clube_id),
  KEY idx_cm_modalidade (modalidade_id)
) ENGINE=InnoDB;

-- -------------------------
-- ESTADO DO ATLETA
-- -------------------------
CREATE TABLE IF NOT EXISTS estado_atleta (
  id INT AUTO_INCREMENT PRIMARY KEY,
  descricao VARCHAR(60) NOT NULL UNIQUE
) ENGINE=InnoDB;

INSERT IGNORE INTO estado_atleta (id, descricao) VALUES
  (1, 'Ativo'),
  (2, 'Transferido'),
  (3, 'Suspenso'),
  (4, 'Lesionado');
  

-- -------------------------
-- ATLETAS
-- -------------------------
CREATE TABLE IF NOT EXISTS atleta (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(120) NOT NULL,
  data_nascimento DATE,
  email VARCHAR(120),
  telefone VARCHAR(30),
  morada VARCHAR(255),
  clube_atual_id INT NOT NULL,
  estado_id INT NOT NULL DEFAULT 1,

  CONSTRAINT fk_atleta_clube
    FOREIGN KEY (clube_atual_id) REFERENCES clube(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,

  CONSTRAINT fk_atleta_estado
    FOREIGN KEY (estado_id) REFERENCES estado_atleta(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,

  KEY idx_atleta_clube (clube_atual_id),
  KEY idx_atleta_estado (estado_id)
) ENGINE=InnoDB;

-- -------------------------
-- INSCRIÇÃO ATLETA → MODALIDADE DO CLUBE
-- -------------------------
CREATE TABLE IF NOT EXISTS atleta_clube_modalidade (
  id INT AUTO_INCREMENT PRIMARY KEY,
  atleta_id INT NOT NULL,
  clube_modalidade_id INT NOT NULL,
  data_inscricao DATE NOT NULL,
  ativo TINYINT(1) NOT NULL DEFAULT 1,

  CONSTRAINT fk_acm_atleta
    FOREIGN KEY (atleta_id) REFERENCES atleta(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,

  CONSTRAINT fk_acm_cm
    FOREIGN KEY (clube_modalidade_id) REFERENCES clube_modalidade(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,

  KEY idx_acm_atleta (atleta_id),
  KEY idx_acm_cm (clube_modalidade_id)
) ENGINE=InnoDB;

-- -------------------------
-- STAFF (GENÉRICO) + CARGOS EDITÁVEIS
-- -------------------------
CREATE TABLE IF NOT EXISTS cargo_staff (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(80) NOT NULL UNIQUE,
  descricao VARCHAR(255),
  ativo TINYINT(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB;

INSERT IGNORE INTO cargo_staff (nome) VALUES
 ('Presidente'),
 ('Secretário'),
 ('Delegado'),
 ('Médico'),
 ('Enfermeiro'),
 ('Fisioterapeuta'),
 ('Preparador Físico'),
 ('Treinador Principal'),
 ('Treinador Adjunto'),
 ('Treinador Guarda-Redes');

CREATE TABLE IF NOT EXISTS staff (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(120) NOT NULL,
  email VARCHAR(120),
  telefone VARCHAR(30),
  morada VARCHAR(255),
  num_registo VARCHAR(60)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS staff_afetacao (
  id INT AUTO_INCREMENT PRIMARY KEY,
  staff_id INT NOT NULL,
  clube_id INT NOT NULL,
  clube_modalidade_id INT NULL,
  cargo_id INT NOT NULL,
  data_inicio DATE,
  data_fim DATE,
  observacoes VARCHAR(255),

  CONSTRAINT fk_sa_staff
    FOREIGN KEY (staff_id) REFERENCES staff(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,

  CONSTRAINT fk_sa_clube
    FOREIGN KEY (clube_id) REFERENCES clube(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,

  CONSTRAINT fk_sa_cm
    FOREIGN KEY (clube_modalidade_id) REFERENCES clube_modalidade(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,

  CONSTRAINT fk_sa_cargo
    FOREIGN KEY (cargo_id) REFERENCES cargo_staff(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,

  KEY idx_sa_staff (staff_id),
  KEY idx_sa_clube (clube_id),
  KEY idx_sa_cm (clube_modalidade_id),
  KEY idx_sa_cargo (cargo_id)
) ENGINE=InnoDB;

-- -------------------------
-- TRANSFERÊNCIAS
-- -------------------------
CREATE TABLE IF NOT EXISTS transferencia_atleta (
  id INT AUTO_INCREMENT PRIMARY KEY,
  atleta_id INT NOT NULL,
  clube_origem_id INT NOT NULL,
  clube_destino_id INT NOT NULL,
  data_transferencia DATE NOT NULL,
  observacoes VARCHAR(255),

  CONSTRAINT fk_tr_atleta
    FOREIGN KEY (atleta_id) REFERENCES atleta(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,

  CONSTRAINT fk_tr_origem
    FOREIGN KEY (clube_origem_id) REFERENCES clube(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,

  CONSTRAINT fk_tr_destino
    FOREIGN KEY (clube_destino_id) REFERENCES clube(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,

  KEY idx_tr_origem_data (clube_origem_id, data_transferencia),
  KEY idx_tr_destino_data (clube_destino_id, data_transferencia)
) ENGINE=InnoDB;

-- ---------------------------------
-- ALTERAÇÂO NA TABELA DE MODALIDADE
-- ---------------------------------
USE gestao_clubes;

ALTER TABLE modalidade
  ADD COLUMN ativo TINYINT(1) NOT NULL DEFAULT 1;


UPDATE modalidade SET ativo = 1 WHERE ativo IS NULL;

USE gestao_clubes;
ALTER TABLE atleta_clube_modalidade
  ADD COLUMN data_fim DATE NULL AFTER data_inscricao;

UPDATE estado_atleta SET descricao = 'Transferido' WHERE id = 2;

ALTER TABLE staff
ADD COLUMN remuneracao DECIMAL(10,2) NOT NULL DEFAULT 0.00;

ALTER TABLE atleta
ADD COLUMN remuneracao DECIMAL(10,2) NOT NULL DEFAULT 0.00;

CREATE TABLE IF NOT EXISTS escalao (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(30) NOT NULL UNIQUE
);

INSERT INTO escalao (nome) VALUES
('Petiz'),
('Benjamim'),
('Infantil'),
('Iniciado'),
('Juvenil'),
('Junior'),
('Senior'),
('Veterano');

ALTER TABLE atleta
MODIFY escalao_id INT NOT NULL;

CREATE TABLE staff_afetacao_escalao (
  staff_afetacao_id INT NOT NULL,
  escalao_id INT NOT NULL,

  PRIMARY KEY (staff_afetacao_id, escalao_id),

  CONSTRAINT fk_sae_afetacao
    FOREIGN KEY (staff_afetacao_id)
    REFERENCES staff_afetacao(id)
    ON DELETE CASCADE,

  CONSTRAINT fk_sae_escalao
    FOREIGN KEY (escalao_id)
    REFERENCES escalao(id)
    ON DELETE CASCADE
);

UPDATE estado_atleta
SET descricao = 'Saiu'
WHERE descricao = 'SaíU';

ALTER TABLE atleta ADD COLUMN escalao_id INT NULL;

ALTER TABLE atleta
ADD CONSTRAINT fk_atleta_escalao
FOREIGN KEY (escalao_id)
REFERENCES escalao(id);SELECT * FROM gestao_clubes.modalidade;

ALTER TABLE clubes
  ADD COLUMN codigo_postal VARCHAR(20),
  ADD COLUMN localidade VARCHAR(120);
  
  CREATE TABLE coletividades (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  nome VARCHAR(255) NOT NULL,
  nif VARCHAR(20),
  email VARCHAR(255),
  telefone VARCHAR(30),
  morada VARCHAR(255),
  codigo_postal VARCHAR(20),
  localidade VARCHAR(120),

  -- restantes campos que existem em clubes...
  -- ex: data_criacao DATE, modalidade VARCHAR(100), etc

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

ALTER TABLE clube
MODIFY COLUMN codigo_postal VARCHAR(20) AFTER morada;

ALTER TABLE clube
MODIFY COLUMN localidade VARCHAR(120) AFTER codigo_postal;

ALTER TABLE clube
MODIFY COLUMN data_fundacao DATE AFTER localidade;

CREATE TABLE IF NOT EXISTS audit_log (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,

    admin_user_id INT NOT NULL,

    acao ENUM('CREATE','UPDATE','DELETE','PROMOTE','DEMOTE','ACTIVATE','DEACTIVATE') NOT NULL,

    tabela VARCHAR(64) NOT NULL,
    registo_id INT NULL,

    antes_json JSON NULL,
    depois_json JSON NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_audit_admin
        FOREIGN KEY (admin_user_id) REFERENCES utilizadores(id)
);

CREATE INDEX idx_audit_tabela_registo
ON audit_log(tabela, registo_id);

CREATE INDEX idx_audit_admin_data
ON audit_log(admin_user_id, created_at);

SELECT * 
FROM audit_log
ORDER BY created_at DESC;

SELECT id, utilizador, ativo, palavra_chave
FROM utilizadores
WHERE utilizador = 'joao@hotmail.com';

SELECT * 
FROM audit_log
WHERE tabela='clube';

SELECT *
FROM audit_log;

-- =========================================================
-- COLETIVIDADES
-- Bloco para anexar ao script atual
-- =========================================================

USE gestao_clubes;

-- -------------------------
-- COLETIVIDADE
-- -------------------------
CREATE TABLE IF NOT EXISTS coletividade (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(120) NOT NULL,
  nif VARCHAR(20),
  email VARCHAR(120),
  telefone VARCHAR(30),
  morada VARCHAR(255),
  codigo_postal VARCHAR(20),
  localidade VARCHAR(120),
  data_fundacao DATE,

  UNIQUE KEY uq_coletividade_nome (nome)
) ENGINE=InnoDB;

-- -------------------------
-- ATIVIDADE
-- -------------------------
CREATE TABLE IF NOT EXISTS atividade (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(80) NOT NULL UNIQUE,
  descricao VARCHAR(255),
  ativo TINYINT(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB;

-- -------------------------
-- COLETIVIDADE ↔ ATIVIDADE
-- -------------------------
CREATE TABLE IF NOT EXISTS coletividade_atividade (
  id INT AUTO_INCREMENT PRIMARY KEY,
  coletividade_id INT NOT NULL,
  atividade_id INT NOT NULL,
  ano VARCHAR(20),
  ativo TINYINT(1) NOT NULL DEFAULT 1,

  CONSTRAINT fk_ca_coletividade
    FOREIGN KEY (coletividade_id) REFERENCES coletividade(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,

  CONSTRAINT fk_ca_atividade
    FOREIGN KEY (atividade_id) REFERENCES atividade(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,

  UNIQUE KEY uq_coletividade_atividade_ano (coletividade_id, atividade_id, ano),
  KEY idx_ca_coletividade (coletividade_id),
  KEY idx_ca_atividade (atividade_id)
) ENGINE=InnoDB;

-- -------------------------
-- ESTADO DO INSCRITO
-- -------------------------
CREATE TABLE IF NOT EXISTS estado_inscrito (
  id INT AUTO_INCREMENT PRIMARY KEY,
  descricao VARCHAR(60) NOT NULL UNIQUE
) ENGINE=InnoDB;

INSERT IGNORE INTO estado_inscrito (id, descricao) VALUES
  (1, 'Ativo'),
  (2, 'Matrícula anulada'),
  (3, 'Matrícula suspensa'),
  (4, 'Excluído');

-- -------------------------
-- INSCRITO
-- -------------------------
CREATE TABLE IF NOT EXISTS inscrito (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(120) NOT NULL,
  data_nascimento DATE,
  email VARCHAR(120),
  telefone VARCHAR(30),
  morada VARCHAR(255),
  coletividade_atual_id INT NOT NULL,
  estado_id INT NOT NULL DEFAULT 1,

  CONSTRAINT fk_inscrito_coletividade
    FOREIGN KEY (coletividade_atual_id) REFERENCES coletividade(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,

  CONSTRAINT fk_inscrito_estado
    FOREIGN KEY (estado_id) REFERENCES estado_inscrito(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,

  KEY idx_inscrito_coletividade (coletividade_atual_id),
  KEY idx_inscrito_estado (estado_id)
) ENGINE=InnoDB;

-- -------------------------
-- INSCRITO → ATIVIDADE DA COLETIVIDADE
-- -------------------------
CREATE TABLE IF NOT EXISTS inscrito_coletividade_atividade (
  id INT AUTO_INCREMENT PRIMARY KEY,
  inscrito_id INT NOT NULL,
  coletividade_atividade_id INT NOT NULL,
  data_inscricao DATE NOT NULL,
  data_fim DATE NULL,
  ativo TINYINT(1) NOT NULL DEFAULT 1,

  CONSTRAINT fk_ica_inscrito
    FOREIGN KEY (inscrito_id) REFERENCES inscrito(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,

  CONSTRAINT fk_ica_ca
    FOREIGN KEY (coletividade_atividade_id) REFERENCES coletividade_atividade(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,

  KEY idx_ica_inscrito (inscrito_id),
  KEY idx_ica_ca (coletividade_atividade_id)
) ENGINE=InnoDB;

-- -------------------------
-- CARGOS STAFF COLETIVIDADE
-- -------------------------
CREATE TABLE IF NOT EXISTS cargo_coletividade_staff (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(80) NOT NULL UNIQUE,
  descricao VARCHAR(255),
  ativo TINYINT(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB;

INSERT IGNORE INTO cargo_coletividade_staff (nome) VALUES
  ('Presidente'),
  ('Vice-Presidente'),
  ('Secretário'),
  ('Tesoureiro'),
  ('Rececionista'),
  ('Professor'),
  ('Vogal'),
  ('Auxiliar de Limpeza'),
  ('Técnico de Manutenção'),
  ('Maestro'),
  ('Porteiro'),
  ('Cozinheiro'),
  ('Empregado de Bar'),
  ('Ajudante de Cozinha'),
  ('Monitor'),
  ('Treinador'),
  ('Roupeiro'),
  ('Enfermeiro'),
  ('Fisioterapeuta'),
  ('Administrativo'),
  ('Coordenador');

-- -------------------------
-- STAFF COLETIVIDADE
-- -------------------------
CREATE TABLE IF NOT EXISTS staff_coletividade (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(120) NOT NULL,
  email VARCHAR(120),
  telefone VARCHAR(30),
  morada VARCHAR(255),
  num_registo VARCHAR(60),
  remuneracao DECIMAL(10,2) NOT NULL DEFAULT 0.00
) ENGINE=InnoDB;

-- -------------------------
-- AFETAÇÃO STAFF COLETIVIDADE
-- -------------------------
CREATE TABLE IF NOT EXISTS staff_coletividade_afetacao (
  id INT AUTO_INCREMENT PRIMARY KEY,
  staff_coletividade_id INT NOT NULL,
  coletividade_id INT NOT NULL,
  coletividade_atividade_id INT NULL,
  cargo_id INT NOT NULL,
  data_inicio DATE,
  data_fim DATE,
  observacoes VARCHAR(255),

  CONSTRAINT fk_sca_staff
    FOREIGN KEY (staff_coletividade_id) REFERENCES staff_coletividade(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,

  CONSTRAINT fk_sca_coletividade
    FOREIGN KEY (coletividade_id) REFERENCES coletividade(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,

  CONSTRAINT fk_sca_ca
    FOREIGN KEY (coletividade_atividade_id) REFERENCES coletividade_atividade(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,

  CONSTRAINT fk_sca_cargo
    FOREIGN KEY (cargo_id) REFERENCES cargo_coletividade_staff(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,

  KEY idx_sca_staff (staff_coletividade_id),
  KEY idx_sca_coletividade (coletividade_id),
  KEY idx_sca_ca (coletividade_atividade_id),
  KEY idx_sca_cargo (cargo_id)
) ENGINE=InnoDB;

INSERT INTO escalao (nome)
VALUES ('Traquinas');

CREATE TABLE IF NOT EXISTS staff_afetacao_escalao (
    id INT AUTO_INCREMENT PRIMARY KEY,
    staff_afetacao_id INT NOT NULL,
    escalao_id INT NOT NULL,

    UNIQUE KEY uk_staff_afetacao_escalao (staff_afetacao_id, escalao_id),

    CONSTRAINT fk_staff_afetacao_escalao_afetacao
        FOREIGN KEY (staff_afetacao_id) REFERENCES staff_afetacao(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_staff_afetacao_escalao_escalao
        FOREIGN KEY (escalao_id) REFERENCES escalao(id)
        ON DELETE CASCADE
);

USE gestao_clubes;

-- =========================================================
-- FASE 1 - Perfis, privilégios e estado de registo
-- =========================================================

-- 1) PERFIS
CREATE TABLE IF NOT EXISTS perfis (
  id INT AUTO_INCREMENT PRIMARY KEY,
  descricao VARCHAR(50) NOT NULL UNIQUE
) ENGINE=InnoDB;

INSERT INTO perfis (descricao)
SELECT 'ADMIN'
WHERE NOT EXISTS (
    SELECT 1 FROM perfis WHERE UPPER(descricao) = 'ADMIN'
);

INSERT INTO perfis (descricao)
SELECT 'SECRETARIO'
WHERE NOT EXISTS (
    SELECT 1 FROM perfis WHERE UPPER(descricao) = 'SECRETARIO'
);

INSERT INTO perfis (descricao)
SELECT 'TREINADOR_PRINCIPAL'
WHERE NOT EXISTS (
    SELECT 1 FROM perfis WHERE UPPER(descricao) = 'TREINADOR_PRINCIPAL'
);

INSERT INTO perfis (descricao)
SELECT 'DEPARTAMENTO_MEDICO'
WHERE NOT EXISTS (
    SELECT 1 FROM perfis WHERE UPPER(descricao) = 'DEPARTAMENTO_MEDICO'
);

INSERT INTO perfis (descricao)
SELECT 'STAFF'
WHERE NOT EXISTS (
    SELECT 1 FROM perfis WHERE UPPER(descricao) = 'STAFF'
);

INSERT INTO perfis (descricao)
SELECT 'ATLETA'
WHERE NOT EXISTS (
    SELECT 1 FROM perfis WHERE UPPER(descricao) = 'ATLETA'
);

INSERT INTO perfis (descricao)
SELECT 'PROFESSOR'
WHERE NOT EXISTS (
    SELECT 1 FROM perfis WHERE UPPER(descricao) = 'PROFESSOR'
);

INSERT INTO perfis (descricao)
SELECT 'UTENTE'
WHERE NOT EXISTS (
    SELECT 1 FROM perfis WHERE UPPER(descricao) = 'UTENTE'
);

-- manter USER temporariamente só para compatibilidade / migração
INSERT INTO perfis (descricao)
SELECT 'USER'
WHERE NOT EXISTS (
    SELECT 1 FROM perfis WHERE UPPER(descricao) = 'USER'
);

-- 2) UTILIZADORES - novas colunas da fase 1
ALTER TABLE utilizadores
ADD COLUMN IF NOT EXISTS privilegios_ativos BOOLEAN NOT NULL DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS estado_registo VARCHAR(20) NOT NULL DEFAULT 'APROVADO';

ALTER TABLE utilizadores
ADD COLUMN privilegios_ativos BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE utilizadores
ADD COLUMN estado_registo VARCHAR(20) NOT NULL DEFAULT 'APROVADO';

ALTER TABLE utilizadores
ADD COLUMN clube_id INT NULL,
ADD COLUMN modalidade_id INT NULL;

ALTER TABLE utilizadores
ADD CONSTRAINT fk_utilizadores_clube
FOREIGN KEY (clube_id) REFERENCES clube(id)
ON DELETE SET NULL
ON UPDATE CASCADE;

ALTER TABLE utilizadores
ADD CONSTRAINT fk_utilizadores_modalidade
FOREIGN KEY (modalidade_id) REFERENCES modalidade(id)
ON DELETE SET NULL
ON UPDATE CASCADE;

ALTER TABLE utilizadores
ADD COLUMN coletividade_id INT NULL,
ADD COLUMN atividade_id INT NULL;

ALTER TABLE utilizadores
ADD CONSTRAINT fk_utilizadores_coletividade
FOREIGN KEY (coletividade_id) REFERENCES coletividade(id)
ON DELETE SET NULL
ON UPDATE CASCADE;

ALTER TABLE utilizadores
ADD CONSTRAINT fk_utilizadores_atividade
FOREIGN KEY (atividade_id) REFERENCES atividade(id)
ON DELETE SET NULL
ON UPDATE CASCADE;


-- 3) AUDIT LOG - novas ações administrativas
ALTER TABLE audit_log
MODIFY COLUMN acao ENUM(
    'CREATE',
    'UPDATE',
    'DELETE',
    'PROMOTE',
    'DEMOTE',
    'ACTIVATE',
    'DEACTIVATE',
    'UPDATE_ROLE',
    'UPDATE_PRIVILEGIOS',
    'UPDATE_ESTADO_REGISTO',
    'APPROVE_REGISTO',
    'REJECT_REGISTO'
) NOT NULL;

INSERT INTO cargo_staff (nome, ativo)
VALUES ('Professor', 1);

ALTER TABLE atleta MODIFY COLUMN nome VARCHAR(255) NULL;
ALTER TABLE inscrito MODIFY COLUMN nome VARCHAR(255) NULL;
ALTER TABLE staff MODIFY COLUMN nome VARCHAR(255) NULL;
ALTER TABLE staff_coletividade MODIFY COLUMN nome VARCHAR(255) NULL;

-- -------------------------
-- EVENTOS / CONVOCATÓRIAS
-- -------------------------
CREATE TABLE IF NOT EXISTS evento (
  id INT AUTO_INCREMENT PRIMARY KEY,
  titulo VARCHAR(120) NOT NULL,
  descricao TEXT NULL,
  data_hora DATETIME NOT NULL,
  local VARCHAR(255),
  observacoes TEXT NULL,
  tipo ENUM('MODALIDADE','ATIVIDADE') NOT NULL DEFAULT 'MODALIDADE',
  clube_modalidade_id INT NULL,
  coletividade_atividade_id INT NULL,
  criado_por INT NOT NULL,
  latitude DECIMAL(10,7) NULL,
  longitude DECIMAL(10,7) NULL,

  CONSTRAINT fk_evento_cm
    FOREIGN KEY (clube_modalidade_id) REFERENCES clube_modalidade(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,

  CONSTRAINT fk_evento_ca
    FOREIGN KEY (coletividade_atividade_id) REFERENCES coletividade_atividade(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,

  CONSTRAINT fk_evento_utilizador
    FOREIGN KEY (criado_por) REFERENCES utilizadores(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,

  KEY idx_evento_cm (clube_modalidade_id),
  KEY idx_evento_ca (coletividade_atividade_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS evento_atleta (
  evento_id INT NOT NULL,
  atleta_id INT NOT NULL,

  PRIMARY KEY (evento_id, atleta_id),

  CONSTRAINT fk_ea_evento
    FOREIGN KEY (evento_id) REFERENCES evento(id)
    ON DELETE CASCADE ON UPDATE CASCADE,

  CONSTRAINT fk_ea_atleta
    FOREIGN KEY (atleta_id) REFERENCES atleta(id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS evento_inscrito (
  evento_id INT NOT NULL,
  inscrito_id INT NOT NULL,

  PRIMARY KEY (evento_id, inscrito_id),

  CONSTRAINT fk_ei_evento
    FOREIGN KEY (evento_id) REFERENCES evento(id)
    ON DELETE CASCADE ON UPDATE CASCADE,

  CONSTRAINT fk_ei_inscrito
    FOREIGN KEY (inscrito_id) REFERENCES inscrito(id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

-- 1. Add new columns to existing evento table
ALTER TABLE evento
  ADD COLUMN descricao TEXT NULL AFTER titulo,
  ADD COLUMN observacoes TEXT NULL AFTER local,
  ADD COLUMN tipo ENUM('MODALIDADE','ATIVIDADE') NOT NULL DEFAULT 'MODALIDADE' AFTER observacoes,
  ADD COLUMN coletividade_atividade_id INT NULL AFTER clube_modalidade_id,
  MODIFY COLUMN clube_modalidade_id INT NULL,
  ADD CONSTRAINT fk_evento_ca
    FOREIGN KEY (coletividade_atividade_id) REFERENCES coletividade_atividade(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD KEY idx_evento_ca (coletividade_atividade_id);

-- 2. Add latitude/longitude columns to evento table
ALTER TABLE evento
  ADD COLUMN latitude DECIMAL(10,7) NULL AFTER criado_por,
  ADD COLUMN longitude DECIMAL(10,7) NULL AFTER latitude;

-- 3. Create evento_inscrito table
CREATE TABLE IF NOT EXISTS evento_inscrito (
  evento_id INT NOT NULL,
  inscrito_id INT NOT NULL,
  PRIMARY KEY (evento_id, inscrito_id),
  CONSTRAINT fk_ei_evento
    FOREIGN KEY (evento_id) REFERENCES evento(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_ei_inscrito
    FOREIGN KEY (inscrito_id) REFERENCES inscrito(id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

-- -------------------------
-- LOGO / AVATAR SUPPORT
-- -------------------------
ALTER TABLE clube
  ADD COLUMN logo_path VARCHAR(255) DEFAULT NULL;

ALTER TABLE coletividade
  ADD COLUMN logo_path VARCHAR(255) DEFAULT NULL;

ALTER TABLE utilizadores
  ADD COLUMN logo_path VARCHAR(255) DEFAULT NULL;