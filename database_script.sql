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
  utilizador VARCHAR(120) NOT NULL,
  palavra_chave VARCHAR(255) NOT NULL,
  perfil_id INT NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  nome VARCHAR(200) DEFAULT NULL,
  clube_id INT NULL,
  modalidade_id INT NULL,
  coletividade_id INT NULL,
  atividade_id INT NULL,
  privilegios_ativos BOOLEAN NOT NULL DEFAULT TRUE,
  estado_registo VARCHAR(20) NOT NULL DEFAULT 'APROVADO',
  logo_path VARCHAR(255) DEFAULT NULL,
  morada VARCHAR(255) DEFAULT NULL,
  telefone VARCHAR(30) DEFAULT NULL,
  email_notificacoes VARCHAR(120) DEFAULT NULL,
  tema_preferido VARCHAR(30) DEFAULT NULL,

  CONSTRAINT fk_utilizadores_perfis
    FOREIGN KEY (perfil_id) REFERENCES perfis(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,

  CONSTRAINT fk_utilizadores_clube
    FOREIGN KEY (clube_id) REFERENCES clube(id)
    ON DELETE SET NULL ON UPDATE CASCADE,

  CONSTRAINT fk_utilizadores_modalidade
    FOREIGN KEY (modalidade_id) REFERENCES modalidade(id)
    ON DELETE SET NULL ON UPDATE CASCADE,

  CONSTRAINT fk_utilizadores_coletividade
    FOREIGN KEY (coletividade_id) REFERENCES coletividade(id)
    ON DELETE SET NULL ON UPDATE CASCADE,

  -- Adicionar chaves compostas para garantir a unicidade por estrutura
  UNIQUE KEY uq_utilizador_clube (utilizador, clube_id),
  UNIQUE KEY uq_utilizador_coletividade (utilizador, coletividade_id)
) ENGINE=InnoDB;

INSERT IGNORE INTO perfis (id, descricao) VALUES
  (1, 'SUPER_ADMIN'),
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
  codigo_postal VARCHAR(20),
  localidade VARCHAR(120),
  data_fundacao DATE,
  logo_path VARCHAR(255) DEFAULT NULL,
  UNIQUE KEY uq_clube_nome (nome)
) ENGINE=InnoDB;

-- -------------------------
-- MODALIDADES
-- -------------------------
CREATE TABLE IF NOT EXISTS modalidade (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(80) NOT NULL UNIQUE,
  descricao VARCHAR(255),
  ativo TINYINT(1) NOT NULL DEFAULT 1
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
  nome VARCHAR(255) NULL,
  data_nascimento DATE,
  email VARCHAR(120),
  telefone VARCHAR(30),
  morada VARCHAR(255),
  clube_atual_id INT NOT NULL,
  estado_id INT NOT NULL DEFAULT 1,
  foto_path VARCHAR(255) DEFAULT NULL,
  utilizador_id INT NULL,
  remuneracao DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  escalao_id INT NULL,

  CONSTRAINT fk_atleta_clube
    FOREIGN KEY (clube_atual_id) REFERENCES clube(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,

  CONSTRAINT fk_atleta_estado
    FOREIGN KEY (estado_id) REFERENCES estado_atleta(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,

  CONSTRAINT fk_atleta_utilizador
    FOREIGN KEY (utilizador_id) REFERENCES utilizadores(id)
    ON DELETE SET NULL ON UPDATE CASCADE,

  CONSTRAINT fk_atleta_escalao
    FOREIGN KEY (escalao_id) REFERENCES escalao(id)
    ON DELETE SET NULL,

  KEY idx_atleta_clube (clube_atual_id),
  KEY idx_atleta_estado (estado_id),
  KEY idx_atleta_utilizador (utilizador_id)
) ENGINE=InnoDB;

-- -------------------------
-- INSCRIÇÃO ATLETA → MODALIDADE DO CLUBE
-- -------------------------
CREATE TABLE IF NOT EXISTS atleta_clube_modalidade (
  id INT AUTO_INCREMENT PRIMARY KEY,
  atleta_id INT NOT NULL,
  clube_modalidade_id INT NOT NULL,
  data_inscricao DATE NOT NULL,
  data_fim DATE NULL,
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
 ('Treinador Guarda-Redes'),
 ('Professor'),
 ('Massagista');

CREATE TABLE IF NOT EXISTS staff (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(255) NULL,
  email VARCHAR(120),
  telefone VARCHAR(30),
  morada VARCHAR(255),
  num_registo VARCHAR(60),
  foto_path VARCHAR(255) DEFAULT NULL,
  utilizador_id INT NULL,
  remuneracao DECIMAL(10,2) NOT NULL DEFAULT 0.00,

  CONSTRAINT fk_staff_utilizador
    FOREIGN KEY (utilizador_id) REFERENCES utilizadores(id)
    ON DELETE SET NULL ON UPDATE CASCADE,

  KEY idx_staff_utilizador (utilizador_id)
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
  clube_destino_id INT NULL,
  clube_destino_nome VARCHAR(120) NULL,
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

-- -------------------------
-- ESCALAO
-- -------------------------
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
('Veterano'),
('Traquinas');

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

-- -------------------------
-- AUDIT LOG
-- -------------------------
CREATE TABLE IF NOT EXISTS audit_log (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    admin_user_id INT NOT NULL,
    acao ENUM(
        'CREATE', 'UPDATE', 'DELETE', 'PROMOTE', 'DEMOTE', 'ACTIVATE', 'DEACTIVATE',
        'UPDATE_ROLE', 'UPDATE_PRIVILEGIOS', 'UPDATE_ESTADO_REGISTO', 'APPROVE_REGISTO', 'REJECT_REGISTO'
    ) NOT NULL,
    tabela VARCHAR(64) NOT NULL,
    registo_id INT NULL,
    antes_json JSON NULL,
    depois_json JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_audit_admin FOREIGN KEY (admin_user_id) REFERENCES utilizadores(id)
);

CREATE INDEX idx_audit_tabela_registo ON audit_log(tabela, registo_id);
CREATE INDEX idx_audit_admin_data ON audit_log(admin_user_id, created_at);

-- =========================================================
-- COLETIVIDADES
-- =========================================================

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
  logo_path VARCHAR(255) DEFAULT NULL,
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
  nome VARCHAR(255) NULL,
  data_nascimento DATE,
  email VARCHAR(120),
  telefone VARCHAR(30),
  morada VARCHAR(255),
  coletividade_atual_id INT NOT NULL,
  estado_id INT NOT NULL DEFAULT 1,
  utilizador_id INT NULL,

  CONSTRAINT fk_inscrito_coletividade
    FOREIGN KEY (coletividade_atual_id) REFERENCES coletividade(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,

  CONSTRAINT fk_inscrito_estado
    FOREIGN KEY (estado_id) REFERENCES estado_inscrito(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,

  CONSTRAINT fk_inscrito_utilizador
    FOREIGN KEY (utilizador_id) REFERENCES utilizadores(id)
    ON DELETE SET NULL ON UPDATE CASCADE,

  KEY idx_inscrito_coletividade (coletividade_atual_id),
  KEY idx_inscrito_estado (estado_id),
  KEY idx_inscrito_utilizador (utilizador_id)
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
  ('Presidente'), ('Vice-Presidente'), ('Secretário'), ('Tesoureiro'), ('Rececionista'),
  ('Professor'), ('Vogal'), ('Auxiliar de Limpeza'), ('Técnico de Manutenção'),
  ('Maestro'), ('Porteiro'), ('Cozinheiro'), ('Empregado de Bar'), ('Ajudante de Cozinha'),
  ('Monitor'), ('Treinador'), ('Roupeiro'), ('Enfermeiro'), ('Fisioterapeuta'),
  ('Administrativo'), ('Coordenador');

-- -------------------------
-- STAFF COLETIVIDADE
-- -------------------------
CREATE TABLE IF NOT EXISTS staff_coletividade (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(255) NULL,
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

-- -------------------------
-- EVENTOS / CONVOCATÓRIAS
-- -------------------------
CREATE TABLE IF NOT EXISTS evento (
  id INT AUTO_INCREMENT PRIMARY KEY,
  titulo VARCHAR(120) NOT NULL,
  descricao TEXT NULL,
  data_hora DATETIME NOT NULL,
  data_hora_fim DATETIME NULL,
  local VARCHAR(255),
  observacoes TEXT NULL,
  tipo ENUM('MODALIDADE','ATIVIDADE') NOT NULL DEFAULT 'MODALIDADE',
  clube_modalidade_id INT NULL,
  coletividade_atividade_id INT NULL,
  criado_por INT NOT NULL,
  latitude DECIMAL(10,7) NULL,
  longitude DECIMAL(10,7) NULL,
  escalao_id INT NULL,

  CONSTRAINT fk_evento_cm
    FOREIGN KEY (clube_modalidade_id) REFERENCES clube_modalidade(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,

  CONSTRAINT fk_evento_ca
    FOREIGN KEY (coletividade_atividade_id) REFERENCES coletividade_atividade(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,

  CONSTRAINT fk_evento_utilizador
    FOREIGN KEY (criado_por) REFERENCES utilizadores(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,

  CONSTRAINT fk_evento_escalao
    FOREIGN KEY (escalao_id) REFERENCES escalao(id)
    ON DELETE SET NULL,

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

-- =========================================================
-- MÓDULO CLÍNICO – DEPARTAMENTO MÉDICO
-- =========================================================

-- -------------------------
-- FICHA MÉDICA DO ATLETA
-- -------------------------
CREATE TABLE IF NOT EXISTS ficha_medica (
  id INT AUTO_INCREMENT PRIMARY KEY,
  atleta_id INT NOT NULL,
  clube_id INT NOT NULL,
  grupo_sanguineo VARCHAR(5),
  alergias TEXT,
  condicoes_cronicas TEXT,
  contacto_emergencia_nome VARCHAR(120),
  contacto_emergencia_telefone VARCHAR(30),
  notas_gerais TEXT,
  criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
  atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE KEY uq_ficha_atleta_clube (atleta_id, clube_id),

  CONSTRAINT fk_fm_atleta
    FOREIGN KEY (atleta_id) REFERENCES atleta(id)
    ON DELETE CASCADE ON UPDATE CASCADE,

  CONSTRAINT fk_fm_clube
    FOREIGN KEY (clube_id) REFERENCES clube(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,

  KEY idx_fm_atleta (atleta_id),
  KEY idx_fm_clube (clube_id)
) ENGINE=InnoDB;

-- -------------------------
-- REGISTO DE LESÃO
-- -------------------------
CREATE TABLE IF NOT EXISTS registo_lesao (
  id INT AUTO_INCREMENT PRIMARY KEY,
  clube_id INT NOT NULL,
  atleta_id INT NOT NULL,
  staff_id INT NULL,
  tipo VARCHAR(100) NOT NULL,
  parte_corpo VARCHAR(100),
  gravidade ENUM('LEVE','MODERADA','GRAVE') NOT NULL DEFAULT 'LEVE',
  data_lesao DATE NOT NULL,
  data_retorno_prevista DATE,
  data_retorno_efetiva DATE,
  descricao TEXT,
  tratamento TEXT,
  criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
  atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_rl_clube
    FOREIGN KEY (clube_id) REFERENCES clube(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,

  CONSTRAINT fk_rl_atleta
    FOREIGN KEY (atleta_id) REFERENCES atleta(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,

  CONSTRAINT fk_rl_staff
    FOREIGN KEY (staff_id) REFERENCES staff(id)
    ON DELETE SET NULL ON UPDATE CASCADE,

  KEY idx_rl_clube (clube_id),
  KEY idx_rl_atleta (atleta_id),
  KEY idx_rl_data (data_lesao)
) ENGINE=InnoDB;

-- -------------------------
-- CONSULTA MÉDICA
-- -------------------------
CREATE TABLE IF NOT EXISTS consulta_medica (
  id INT AUTO_INCREMENT PRIMARY KEY,
  clube_id INT NOT NULL,
  atleta_id INT NOT NULL,
  staff_id INT NULL,
  data_consulta DATE NOT NULL,
  tipo VARCHAR(60) NOT NULL,
  motivo TEXT,
  diagnostico TEXT,
  notas TEXT,
  criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
  atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_cmed_clube
    FOREIGN KEY (clube_id) REFERENCES clube(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,

  CONSTRAINT fk_cmed_atleta
    FOREIGN KEY (atleta_id) REFERENCES atleta(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,

  CONSTRAINT fk_cmed_staff
    FOREIGN KEY (staff_id) REFERENCES staff(id)
    ON DELETE SET NULL ON UPDATE CASCADE,

  KEY idx_cmed_clube (clube_id),
  KEY idx_cmed_atleta (atleta_id),
  KEY idx_cmed_data (data_consulta)
) ENGINE=InnoDB;

-- -------------------------
-- EXAME MÉDICO
-- -------------------------
CREATE TABLE IF NOT EXISTS exame_medico (
  id INT AUTO_INCREMENT PRIMARY KEY,
  clube_id INT NOT NULL,
  atleta_id INT NOT NULL,
  staff_id INT NULL,
  data_exame DATE NOT NULL,
  tipo VARCHAR(100) NOT NULL,
  resultado TEXT,
  ficheiro_path VARCHAR(255),
  notas TEXT,
  criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
  atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_em_clube
    FOREIGN KEY (clube_id) REFERENCES clube(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,

  CONSTRAINT fk_em_atleta
    FOREIGN KEY (atleta_id) REFERENCES atleta(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,

  CONSTRAINT fk_em_staff
    FOREIGN KEY (staff_id) REFERENCES staff(id)
    ON DELETE SET NULL ON UPDATE CASCADE,

  KEY idx_em_clube (clube_id),
  KEY idx_em_atleta (atleta_id),
  KEY idx_em_data (data_exame)
) ENGINE=InnoDB;

-- -------------------------
-- PRESCRIÇÃO
-- -------------------------
CREATE TABLE IF NOT EXISTS prescricao (
  id INT AUTO_INCREMENT PRIMARY KEY,
  clube_id INT NOT NULL,
  atleta_id INT NOT NULL,
  staff_id INT NULL,
  consulta_id INT NULL,
  medicamento VARCHAR(255) NOT NULL,
  dosagem VARCHAR(100),
  frequencia VARCHAR(100),
  data_inicio DATE,
  data_fim DATE,
  notas TEXT,
  criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
  atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_pr_clube
    FOREIGN KEY (clube_id) REFERENCES clube(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,

  CONSTRAINT fk_pr_atleta
    FOREIGN KEY (atleta_id) REFERENCES atleta(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,

  CONSTRAINT fk_pr_staff
    FOREIGN KEY (staff_id) REFERENCES staff(id)
    ON DELETE SET NULL ON UPDATE CASCADE,

  CONSTRAINT fk_pr_consulta
    FOREIGN KEY (consulta_id) REFERENCES consulta_medica(id)
    ON DELETE SET NULL ON UPDATE CASCADE,

  KEY idx_pr_clube (clube_id),
  KEY idx_pr_atleta (atleta_id)
) ENGINE=InnoDB;

-- -------------------------
-- RELATÓRIO MÉDICO
-- -------------------------
CREATE TABLE IF NOT EXISTS relatorio_medico (
  id INT AUTO_INCREMENT PRIMARY KEY,
  clube_id INT NOT NULL,
  atleta_id INT NOT NULL,
  staff_id INT NULL,
  data_relatorio DATE NOT NULL,
  tipo VARCHAR(100) NOT NULL,
  conteudo TEXT,
  confidencial TINYINT(1) NOT NULL DEFAULT 0,
  criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
  atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_rm_clube
    FOREIGN KEY (clube_id) REFERENCES clube(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,

  CONSTRAINT fk_rm_atleta
    FOREIGN KEY (atleta_id) REFERENCES atleta(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,

  CONSTRAINT fk_rm_staff
    FOREIGN KEY (staff_id) REFERENCES staff(id)
    ON DELETE SET NULL ON UPDATE CASCADE,

  KEY idx_rm_clube (clube_id),
  KEY idx_rm_atleta (atleta_id),
  KEY idx_rm_data (data_relatorio)
) ENGINE=InnoDB;

-- -------------------------
-- NOTIFICAÇÕES
-- -------------------------
CREATE TABLE IF NOT EXISTS notificacao (
  id          BIGINT AUTO_INCREMENT PRIMARY KEY,
  utilizador_id INT NULL,
  evento_id   INT NULL,
  canal       VARCHAR(20)  NOT NULL,   -- EMAIL, SMS, WHATSAPP
  destino     VARCHAR(100) NOT NULL,
  mensagem    TEXT         NOT NULL,
  estado      VARCHAR(20)  NOT NULL,   -- PENDENTE, ENVIADA, ERRO, SIMULADA
  data_criacao DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  data_envio  DATETIME     NULL,

  KEY idx_notif_evento (evento_id),
  KEY idx_notif_estado (estado)
) ENGINE=InnoDB;

-- =========================================================
-- MÓDULO TESOURARIA
-- =========================================================

CREATE TABLE IF NOT EXISTS mensalidade_escalao (
    id INT AUTO_INCREMENT PRIMARY KEY,
    clube_id INT NOT NULL,
    escalao_id INT NOT NULL,
    epoca VARCHAR(20) NOT NULL DEFAULT '2024/2025',
    valor_mensal DECIMAL(8,2) NOT NULL DEFAULT 0.00,
    ativo TINYINT(1) NOT NULL DEFAULT 1,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updated_by INT NULL,
    UNIQUE KEY uq_mensalidade_escalao (clube_id, escalao_id, epoca),
    CONSTRAINT fk_me_clube FOREIGN KEY (clube_id) REFERENCES clube(id) ON DELETE CASCADE,
    CONSTRAINT fk_me_escalao FOREIGN KEY (escalao_id) REFERENCES escalao(id) ON DELETE CASCADE,
    CONSTRAINT fk_me_user FOREIGN KEY (updated_by) REFERENCES utilizadores(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS inscricao_escalao (
    id INT AUTO_INCREMENT PRIMARY KEY,
    clube_id INT NOT NULL,
    escalao_id INT NOT NULL,
    epoca VARCHAR(20) NOT NULL DEFAULT '2024/2025',
    valor_inscricao DECIMAL(8,2) NOT NULL DEFAULT 0.00,
    ativo TINYINT(1) NOT NULL DEFAULT 1,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updated_by INT NULL,
    UNIQUE KEY uq_inscricao_escalao (clube_id, escalao_id, epoca),
    CONSTRAINT fk_ie_clube FOREIGN KEY (clube_id) REFERENCES clube(id) ON DELETE CASCADE,
    CONSTRAINT fk_ie_escalao FOREIGN KEY (escalao_id) REFERENCES escalao(id) ON DELETE CASCADE,
    CONSTRAINT fk_ie_user FOREIGN KEY (updated_by) REFERENCES utilizadores(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS pagamento_mensalidade (
    id INT AUTO_INCREMENT PRIMARY KEY,
    clube_id INT NOT NULL,
    atleta_id INT NOT NULL,
    escalao_id INT NULL,
    mes TINYINT NOT NULL,
    ano SMALLINT NOT NULL,
    valor_devido DECIMAL(8,2) NOT NULL DEFAULT 0.00,
    valor_pago DECIMAL(8,2) NOT NULL DEFAULT 0.00,
    data_pagamento DATE NULL,
    metodo_pagamento ENUM('Dinheiro','Transferência bancária','MB Way','Cartão','Outro') NULL,
    estado ENUM('Pago','Parcial','Em dívida') NOT NULL DEFAULT 'Em dívida',
    observacoes TEXT NULL,
    registado_por INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_pagamento (clube_id, atleta_id, mes, ano),
    CONSTRAINT fk_pm_clube FOREIGN KEY (clube_id) REFERENCES clube(id) ON DELETE CASCADE,
    CONSTRAINT fk_pm_atleta FOREIGN KEY (atleta_id) REFERENCES atleta(id) ON DELETE CASCADE,
    CONSTRAINT fk_pm_reg FOREIGN KEY (registado_por) REFERENCES utilizadores(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS inscricao_atleta (
    id INT AUTO_INCREMENT PRIMARY KEY,
    clube_id INT NOT NULL,
    atleta_id INT NOT NULL,
    epoca VARCHAR(20) NOT NULL DEFAULT '2024/2025',
    valor_inscricao DECIMAL(8,2) NOT NULL DEFAULT 0.00,
    estado ENUM('Pago','Em dívida','Isento') NOT NULL DEFAULT 'Em dívida',
    data_pagamento DATE NULL,
    metodo_pagamento ENUM('Dinheiro','Transferência bancária','MB Way','Cartão','Outro') NULL,
    observacoes TEXT NULL,
    registado_por INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_inscricao_atleta (clube_id, atleta_id, epoca),
    CONSTRAINT fk_ia_clube FOREIGN KEY (clube_id) REFERENCES clube(id) ON DELETE CASCADE,
    CONSTRAINT fk_ia_atleta FOREIGN KEY (atleta_id) REFERENCES atleta(id) ON DELETE CASCADE,
    CONSTRAINT fk_ia_reg FOREIGN KEY (registado_por) REFERENCES utilizadores(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS seguro_escalao (
    id INT AUTO_INCREMENT PRIMARY KEY,
    clube_id INT NOT NULL,
    escalao_id INT NOT NULL,
    epoca VARCHAR(20) NOT NULL DEFAULT '2024/2025',
    valor_seguro DECIMAL(8,2) NOT NULL DEFAULT 0.00,
    ativo TINYINT(1) NOT NULL DEFAULT 1,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updated_by INT NULL,
    UNIQUE KEY uq_seguro_escalao (clube_id, escalao_id, epoca),
    CONSTRAINT fk_se_clube FOREIGN KEY (clube_id) REFERENCES clube(id) ON DELETE CASCADE,
    CONSTRAINT fk_se_escalao FOREIGN KEY (escalao_id) REFERENCES escalao(id) ON DELETE CASCADE,
    CONSTRAINT fk_se_user FOREIGN KEY (updated_by) REFERENCES utilizadores(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS pagamento_seguro (
    id INT AUTO_INCREMENT PRIMARY KEY,
    clube_id INT NOT NULL,
    atleta_id INT NOT NULL,
    escalao_id INT NULL,
    epoca VARCHAR(20) NOT NULL DEFAULT '2024/2025',
    valor_devido DECIMAL(8,2) NOT NULL DEFAULT 0.00,
    valor_pago DECIMAL(8,2) NOT NULL DEFAULT 0.00,
    estado ENUM('Pago','Em dívida','Isento') NOT NULL DEFAULT 'Em dívida',
    data_pagamento DATE NULL,
    metodo_pagamento ENUM('Dinheiro','Transferência bancária','MB Way','Cartão','Outro') NULL,
    observacoes TEXT NULL,
    registado_por INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_pagamento_seguro (clube_id, atleta_id, epoca),
    CONSTRAINT fk_ps_clube FOREIGN KEY (clube_id) REFERENCES clube(id) ON DELETE CASCADE,
    CONSTRAINT fk_ps_atleta FOREIGN KEY (atleta_id) REFERENCES atleta(id) ON DELETE CASCADE,
    CONSTRAINT fk_ps_escalao FOREIGN KEY (escalao_id) REFERENCES escalao(id) ON DELETE SET NULL,
    CONSTRAINT fk_ps_reg FOREIGN KEY (registado_por) REFERENCES utilizadores(id) ON DELETE SET NULL
);

-- =========================================================
-- UNICIDADE DE EMAIL POR ESTRUTURA (CLUBE / COLETIVIDADE)
-- Permite o mesmo email em clubes/coletividades diferentes,
-- mas impede duplicação dentro da mesma estrutura.
-- =========================================================

-- Remover restrição global de unicidade do email (se existir em bases de dados antigas)
ALTER TABLE utilizadores DROP INDEX IF EXISTS utilizador;

-- Unicidade composta: mesmo email não pode ser registado duas vezes no mesmo clube
ALTER TABLE utilizadores
  ADD UNIQUE KEY IF NOT EXISTS uq_utilizador_clube (utilizador, clube_id);

-- Unicidade composta: mesmo email não pode ser registado duas vezes na mesma coletividade
ALTER TABLE utilizadores
  ADD UNIQUE KEY IF NOT EXISTS uq_utilizador_coletividade (utilizador, coletividade_id);

-- Nota: Em MySQL, valores NULL em índices UNIQUE são tratados como distintos,
-- pelo que a validação de unicidade para utilizadores sem estrutura (ex: SUPER_ADMIN)
-- é assegurada ao nível da aplicação em UtilizadorDAO.existeEmailNaEstrutura().

-- Adicionar campos fiscais e morada ao perfil do utilizador
ALTER TABLE utilizadores
ADD COLUMN nif VARCHAR(9) DEFAULT NULL;

ALTER TABLE utilizadores
ADD COLUMN codigo_postal VARCHAR(8) DEFAULT NULL;

ALTER TABLE utilizadores
ADD COLUMN numero_contribuinte VARCHAR(9) DEFAULT NULL;