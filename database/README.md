# 🚀 GUIA RÁPIDO - Configuração MySQL

## ⚡ Setup em 3 Passos

### 1️⃣ Testar Conexão

```bash
npm install mysql2 --save
node database/test-connection.js
```

Se conectar com sucesso, vá para o próximo passo!

### 2️⃣ Criar Estrutura (Schema)

**Opção A - Via Terminal:**
```bash
mysql -u aromac57_cruzeiro -p'@9M!ws}vvmZ?' aromac57_cruzeiro < database/schema.sql
```

**Opção B - Via phpMyAdmin/cPanel:**
1. Acesse phpMyAdmin
2. Selecione banco: `aromac57_cruzeiro`
3. Clique em "SQL"
4. Copie e cole todo o conteúdo de `database/schema.sql`
5. Clique em "Executar"

### 3️⃣ Migrar Dados do Firebase

```bash
node database/migration-firebase-to-mysql.js
```

## ✅ Pronto!

Seu banco está configurado com:
- ✅ 9 tabelas criadas
- ✅ Índices otimizados
- ✅ Dados do Firebase migrados
- ✅ Categorias padrão
- ✅ Sistema de auditoria

## 📊 Verificar Dados

```bash
mysql -u aromac57_cruzeiro -p'@9M!ws}vvmZ?' aromac57_cruzeiro
```

Depois no MySQL:
```sql
-- Ver tabelas
SHOW TABLES;

-- Ver usuários
SELECT id, name, email, role FROM users;

-- Ver total de transações
SELECT COUNT(*) FROM transactions;

-- Ver conversões
SELECT COUNT(*) FROM wise_transactions;
```

## 🔧 Configurar na Aplicação

Copie as credenciais para o `.env`:
```bash
cp .env.mysql .env
```

Ou adicione manualmente no `.env`:
```
DATABASE_URL="mysql://aromac57_cruzeiro:@9M!ws}vvmZ?@localhost:3306/aromac57_cruzeiro"
```

## 📂 Estrutura Criada

```
aromac57_cruzeiro/
├── users                 # Usuários do sistema
├── roles_master          # Usuários MASTER
├── roles_admin           # Usuários ADMIN
├── transactions          # Transações financeiras
├── wise_transactions     # Conversões de moeda
├── exchange_rates        # Taxas de câmbio
├── categories            # Categorias de transações
├── user_settings         # Configurações dos usuários
└── audit_log            # Log de auditoria
```

## 🆘 Problemas?

### "Can't connect to MySQL server"
```bash
# Verificar se MySQL está rodando
# Mac
brew services list

# Linux
sudo systemctl status mysql

# Iniciar MySQL
brew services start mysql  # Mac
sudo systemctl start mysql  # Linux
```

### "Access denied"
Verifique as credenciais:
- User: `aromac57_cruzeiro`
- Password: `@9M!ws}vvmZ?`
- Database: `aromac57_cruzeiro`

### "Unknown database"
Crie o banco:
```sql
CREATE DATABASE aromac57_cruzeiro 
  CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;
```

## 📞 Comandos Úteis

```bash
# Testar conexão
node database/test-connection.js

# Criar estrutura
mysql -u aromac57_cruzeiro -p < database/schema.sql

# Migrar dados
node database/migration-firebase-to-mysql.js

# Backup do banco
mysqldump -u aromac57_cruzeiro -p aromac57_cruzeiro > backup.sql

# Restaurar backup
mysql -u aromac57_cruzeiro -p aromac57_cruzeiro < backup.sql
```

---

**✅ Tudo configurado? Siga para o próximo passo: Atualizar o código da aplicação para usar MySQL!**
