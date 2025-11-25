-- ============================================================================
-- SCHEMA MySQL - Sistema de Controle Financeiro Familiar
-- ============================================================================
-- Este script cria toda a estrutura do banco de dados para migração do Firebase
-- Inclui: Usuários, Roles, Transações, Conversões Wise, Taxas de Câmbio
-- ============================================================================

-- Usar database existente
USE aromac57_cruzeiro;

-- ============================================================================
-- TABELA: users
-- Armazena informações dos usuários do sistema
-- ============================================================================
CREATE TABLE users (
  id VARCHAR(128) PRIMARY KEY COMMENT 'UID do Firebase Auth',
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) DEFAULT NULL,
  cpf VARCHAR(14) DEFAULT NULL,
  role ENUM('master', 'admin', 'viewer') NOT NULL DEFAULT 'viewer',
  avatar_url TEXT DEFAULT NULL,
  
  -- Endereço
  address_street VARCHAR(255) DEFAULT NULL,
  address_number VARCHAR(20) DEFAULT NULL,
  address_complement VARCHAR(100) DEFAULT NULL,
  address_neighborhood VARCHAR(100) DEFAULT NULL,
  address_city VARCHAR(100) DEFAULT NULL,
  address_state VARCHAR(2) DEFAULT NULL,
  address_zip VARCHAR(10) DEFAULT NULL,
  address_country VARCHAR(50) DEFAULT 'Brasil',
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_email (email),
  INDEX idx_role (role),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Tabela principal de usuários';

-- ============================================================================
-- TABELA: roles_master
-- Identifica usuários com privilégios MASTER (controle total)
-- ============================================================================
CREATE TABLE roles_master (
  user_id VARCHAR(128) PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'master',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Usuários com privilégios MASTER';

-- ============================================================================
-- TABELA: roles_admin
-- Identifica usuários com privilégios ADMIN (gerenciamento de conteúdo)
-- ============================================================================
CREATE TABLE roles_admin (
  user_id VARCHAR(128) PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'admin',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Usuários com privilégios ADMIN';

-- ============================================================================
-- TABELA: transactions
-- Armazena todas as transações financeiras dos usuários
-- ============================================================================
CREATE TABLE transactions (
  id VARCHAR(128) PRIMARY KEY,
  user_id VARCHAR(128) NOT NULL,
  
  -- Dados da transação
  description VARCHAR(500) NOT NULL,
  amount DECIMAL(15, 2) NOT NULL COMMENT 'Valor em centavos ou formato decimal',
  category VARCHAR(100) NOT NULL,
  type ENUM('income', 'expense') NOT NULL,
  date DATE NOT NULL,
  
  -- Metadados
  notes TEXT DEFAULT NULL,
  tags JSON DEFAULT NULL COMMENT 'Array de tags para categorização extra',
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_date (date),
  INDEX idx_type (type),
  INDEX idx_category (category),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Transações financeiras dos usuários';

-- ============================================================================
-- TABELA: wise_transactions
-- Armazena conversões de moeda (Wise, C6, Itaú, etc)
-- ============================================================================
CREATE TABLE wise_transactions (
  id VARCHAR(128) PRIMARY KEY,
  user_id VARCHAR(128) NOT NULL,
  
  -- Dados da conversão
  from_currency VARCHAR(3) NOT NULL COMMENT 'Código ISO da moeda origem (BRL, USD, EUR)',
  to_currency VARCHAR(3) NOT NULL COMMENT 'Código ISO da moeda destino',
  amount_sent DECIMAL(15, 2) NOT NULL COMMENT 'Valor enviado na moeda origem',
  amount_received DECIMAL(15, 2) NOT NULL COMMENT 'Valor recebido na moeda destino',
  exchange_rate DECIMAL(10, 6) NOT NULL COMMENT 'Taxa de câmbio aplicada',
  fee DECIMAL(15, 2) NOT NULL DEFAULT 0 COMMENT 'Taxa cobrada pela operação',
  
  -- Banco/Plataforma utilizada
  bank ENUM('Wise', 'C6', 'Itaú', 'Millennium', 'Novobanco') NOT NULL,
  
  -- Metadados
  notes TEXT DEFAULT NULL,
  reference_number VARCHAR(100) DEFAULT NULL COMMENT 'Número de referência da transação',
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_currencies (from_currency, to_currency),
  INDEX idx_bank (bank),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Conversões de moeda e transferências internacionais';

-- ============================================================================
-- TABELA: exchange_rates
-- Armazena taxas de câmbio atualizadas
-- ============================================================================
CREATE TABLE exchange_rates (
  id VARCHAR(128) PRIMARY KEY,
  base_currency VARCHAR(3) NOT NULL COMMENT 'Moeda base (ex: USD)',
  target_currency VARCHAR(3) NOT NULL COMMENT 'Moeda alvo (ex: BRL)',
  rate DECIMAL(10, 6) NOT NULL COMMENT 'Taxa de conversão',
  
  -- Metadados
  source VARCHAR(100) DEFAULT NULL COMMENT 'Fonte da cotação (ex: API XYZ)',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  UNIQUE KEY idx_currency_pair (base_currency, target_currency),
  INDEX idx_base_currency (base_currency),
  INDEX idx_target_currency (target_currency),
  INDEX idx_updated_at (updated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Taxas de câmbio entre moedas';

-- ============================================================================
-- TABELA: user_settings
-- Configurações personalizadas de cada usuário
-- ============================================================================
CREATE TABLE user_settings (
  id VARCHAR(128) PRIMARY KEY,
  user_id VARCHAR(128) NOT NULL,
  
  -- Configurações
  setting_key VARCHAR(100) NOT NULL,
  setting_value TEXT NOT NULL,
  setting_type ENUM('string', 'number', 'boolean', 'json') NOT NULL DEFAULT 'string',
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY idx_user_setting (user_id, setting_key),
  INDEX idx_user_id (user_id),
  INDEX idx_setting_key (setting_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Configurações personalizadas dos usuários';

-- ============================================================================
-- TABELA: categories
-- Categorias padrão e customizadas para transações
-- ============================================================================
CREATE TABLE categories (
  id VARCHAR(128) PRIMARY KEY,
  user_id VARCHAR(128) DEFAULT NULL COMMENT 'NULL = categoria global/padrão',
  
  -- Dados da categoria
  name VARCHAR(100) NOT NULL,
  icon VARCHAR(50) DEFAULT NULL COMMENT 'Nome do ícone (ex: ShoppingCart)',
  color VARCHAR(7) DEFAULT NULL COMMENT 'Cor em hex (ex: #FF5733)',
  type ENUM('income', 'expense', 'both') NOT NULL DEFAULT 'expense',
  
  -- Metadados
  is_default BOOLEAN DEFAULT FALSE COMMENT 'TRUE se for categoria padrão do sistema',
  display_order INT DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_type (type),
  INDEX idx_is_default (is_default)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Categorias de transações';

-- ============================================================================
-- TABELA: audit_log
-- Log de auditoria para ações importantes do sistema
-- ============================================================================
CREATE TABLE audit_log (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(128) NOT NULL,
  
  -- Dados da ação
  action VARCHAR(100) NOT NULL COMMENT 'create_user, delete_transaction, etc',
  entity_type VARCHAR(50) NOT NULL COMMENT 'user, transaction, wise_transaction, etc',
  entity_id VARCHAR(128) DEFAULT NULL COMMENT 'ID da entidade afetada',
  
  -- Detalhes
  old_values JSON DEFAULT NULL COMMENT 'Valores anteriores (para updates/deletes)',
  new_values JSON DEFAULT NULL COMMENT 'Novos valores (para creates/updates)',
  
  -- Metadados
  ip_address VARCHAR(45) DEFAULT NULL,
  user_agent TEXT DEFAULT NULL,
  
  -- Timestamp
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_action (action),
  INDEX idx_entity (entity_type, entity_id),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Log de auditoria de ações do sistema';

-- ============================================================================
-- INSERIR CATEGORIAS PADRÃO
-- ============================================================================
INSERT INTO categories (id, user_id, name, icon, color, type, is_default, display_order) VALUES
  (UUID(), NULL, 'Alimentação', 'Utensils', '#FF6B6B', 'expense', TRUE, 1),
  (UUID(), NULL, 'Transporte', 'Car', '#4ECDC4', 'expense', TRUE, 2),
  (UUID(), NULL, 'Moradia', 'Home', '#95E1D3', 'expense', TRUE, 3),
  (UUID(), NULL, 'Saúde', 'Heart', '#F38181', 'expense', TRUE, 4),
  (UUID(), NULL, 'Educação', 'GraduationCap', '#AA96DA', 'expense', TRUE, 5),
  (UUID(), NULL, 'Lazer', 'Smile', '#FCBAD3', 'expense', TRUE, 6),
  (UUID(), NULL, 'Outros', 'MoreHorizontal', '#A8E6CF', 'expense', TRUE, 7),
  (UUID(), NULL, 'Salário', 'Briefcase', '#81C784', 'income', TRUE, 8),
  (UUID(), NULL, 'Freelance', 'Code', '#64B5F6', 'income', TRUE, 9),
  (UUID(), NULL, 'Investimentos', 'TrendingUp', '#FFD54F', 'income', TRUE, 10);

-- ============================================================================
-- VIEWS ÚTEIS
-- ============================================================================

-- View: Resumo financeiro por usuário
CREATE OR REPLACE VIEW vw_user_financial_summary AS
SELECT 
  u.id AS user_id,
  u.name,
  u.email,
  COUNT(DISTINCT t.id) AS total_transactions,
  SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END) AS total_income,
  SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END) AS total_expenses,
  SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE -t.amount END) AS balance,
  COUNT(DISTINCT wt.id) AS total_conversions,
  SUM(wt.fee) AS total_conversion_fees
FROM users u
LEFT JOIN transactions t ON u.id = t.user_id
LEFT JOIN wise_transactions wt ON u.id = wt.user_id
GROUP BY u.id, u.name, u.email;

-- View: Transações recentes (últimas 100)
CREATE OR REPLACE VIEW vw_recent_transactions AS
SELECT 
  t.id,
  t.user_id,
  u.name AS user_name,
  t.description,
  t.amount,
  t.category,
  t.type,
  t.date,
  t.created_at
FROM transactions t
JOIN users u ON t.user_id = u.id
ORDER BY t.created_at DESC
LIMIT 100;

-- View: Conversões recentes
CREATE OR REPLACE VIEW vw_recent_conversions AS
SELECT 
  wt.id,
  wt.user_id,
  u.name AS user_name,
  wt.from_currency,
  wt.to_currency,
  wt.amount_sent,
  wt.amount_received,
  wt.exchange_rate,
  wt.fee,
  wt.bank,
  wt.created_at
FROM wise_transactions wt
JOIN users u ON wt.user_id = u.id
ORDER BY wt.created_at DESC
LIMIT 100;

-- ============================================================================
-- STORED PROCEDURES ÚTEIS
-- ============================================================================

-- Procedure: Criar transação
DELIMITER //
CREATE PROCEDURE sp_create_transaction(
  IN p_user_id VARCHAR(128),
  IN p_description VARCHAR(500),
  IN p_amount DECIMAL(15,2),
  IN p_category VARCHAR(100),
  IN p_type ENUM('income', 'expense'),
  IN p_date DATE
)
BEGIN
  INSERT INTO transactions (id, user_id, description, amount, category, type, date)
  VALUES (UUID(), p_user_id, p_description, p_amount, p_category, p_type, p_date);
  
  SELECT LAST_INSERT_ID() AS transaction_id;
END //
DELIMITER ;

-- Procedure: Criar conversão Wise
DELIMITER //
CREATE PROCEDURE sp_create_conversion(
  IN p_user_id VARCHAR(128),
  IN p_from_currency VARCHAR(3),
  IN p_to_currency VARCHAR(3),
  IN p_amount_sent DECIMAL(15,2),
  IN p_amount_received DECIMAL(15,2),
  IN p_exchange_rate DECIMAL(10,6),
  IN p_fee DECIMAL(15,2),
  IN p_bank VARCHAR(50)
)
BEGIN
  INSERT INTO wise_transactions (
    id, user_id, from_currency, to_currency, 
    amount_sent, amount_received, exchange_rate, fee, bank
  )
  VALUES (
    UUID(), p_user_id, p_from_currency, p_to_currency,
    p_amount_sent, p_amount_received, p_exchange_rate, p_fee, p_bank
  );
  
  SELECT LAST_INSERT_ID() AS conversion_id;
END //
DELIMITER ;

-- ============================================================================
-- TRIGGERS PARA AUDITORIA
-- ============================================================================

-- Trigger: Log ao deletar usuário
DELIMITER //
CREATE TRIGGER tr_audit_user_delete
BEFORE DELETE ON users
FOR EACH ROW
BEGIN
  INSERT INTO audit_log (user_id, action, entity_type, entity_id, old_values)
  VALUES (
    OLD.id,
    'delete_user',
    'user',
    OLD.id,
    JSON_OBJECT('name', OLD.name, 'email', OLD.email, 'role', OLD.role)
  );
END //
DELIMITER ;

-- Trigger: Log ao deletar transação
DELIMITER //
CREATE TRIGGER tr_audit_transaction_delete
BEFORE DELETE ON transactions
FOR EACH ROW
BEGIN
  INSERT INTO audit_log (user_id, action, entity_type, entity_id, old_values)
  VALUES (
    OLD.user_id,
    'delete_transaction',
    'transaction',
    OLD.id,
    JSON_OBJECT('description', OLD.description, 'amount', OLD.amount, 'category', OLD.category)
  );
END //
DELIMITER ;

-- ============================================================================
-- ÍNDICES ADICIONAIS PARA PERFORMANCE
-- ============================================================================

-- Índices compostos para consultas frequentes
CREATE INDEX idx_user_date ON transactions(user_id, date DESC);
CREATE INDEX idx_user_type_date ON transactions(user_id, type, date DESC);
CREATE INDEX idx_user_category_date ON transactions(user_id, category, date DESC);

-- Índices para conversões
CREATE INDEX idx_wise_user_date ON wise_transactions(user_id, created_at DESC);
CREATE INDEX idx_wise_currencies_date ON wise_transactions(from_currency, to_currency, created_at DESC);

-- ============================================================================
-- GRANTS E PERMISSÕES (AJUSTE CONFORME SEU AMBIENTE)
-- ============================================================================

-- Criar usuário da aplicação (ALTERE A SENHA!)
-- CREATE USER 'finance_app'@'localhost' IDENTIFIED BY 'SUA_SENHA_FORTE_AQUI';
-- GRANT SELECT, INSERT, UPDATE, DELETE ON finance_tracker.* TO 'finance_app'@'localhost';
-- FLUSH PRIVILEGES;

-- ============================================================================
-- SCRIPT COMPLETO!
-- ============================================================================
-- Execute este script no seu MySQL para criar toda a estrutura do banco.
-- Depois, use o script de migração (migration-firebase-to-mysql.js) para 
-- importar os dados do Firebase.
-- ============================================================================

SELECT 'Schema criado com sucesso!' AS status;
