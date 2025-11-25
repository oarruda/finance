# 🚀 Guia de Migração: Firebase → MySQL

Este guia mostra como migrar completamente seu sistema de Firebase Firestore para MySQL.

## 📋 Pré-requisitos

- MySQL 8.0+ instalado
- Node.js e npm instalados
- Acesso ao Firebase (para exportar dados)
- Acesso ao servidor MySQL

## 🔧 Passo 1: Instalar Dependências

```bash
cd /Users/rafaelarruda/Desktop/Projetos-Ti/finance
npm install mysql2 --save
```

## 📊 Passo 2: Criar o Banco de Dados

### Opção A: Via MySQL Workbench / phpMyAdmin
1. Abra seu cliente MySQL
2. Copie o conteúdo de `database/schema.sql`
3. Execute o script completo

### Opção B: Via Linha de Comando

```bash
# Login no MySQL
mysql -u root -p

# Executar o schema
source /Users/rafaelarruda/Desktop/Projetos-Ti/finance/database/schema.sql

# Ou diretamente
mysql -u root -p < database/schema.sql
```

Isso irá criar:
- ✅ Database `finance_tracker`
- ✅ 9 tabelas (users, transactions, wise_transactions, etc)
- ✅ Índices otimizados
- ✅ Views úteis
- ✅ Stored procedures
- ✅ Triggers de auditoria
- ✅ Categorias padrão

## 📦 Passo 3: Configurar a Migração

Edite o arquivo `database/migration-firebase-to-mysql.js`:

```javascript
// Linha 25 - Configure suas credenciais MySQL
const mysqlConfig = {
  host: 'localhost',           // SEU HOST
  user: 'root',                // SEU USUÁRIO
  password: 'SUA_SENHA_AQUI',  // SUA SENHA
  database: 'finance_tracker',
  // ...
};
```

## 🚀 Passo 4: Executar a Migração

```bash
# Executar o script de migração
node database/migration-firebase-to-mysql.js
```

O script irá:
1. Conectar ao Firebase
2. Conectar ao MySQL
3. Exportar todos os dados do Firebase
4. Importar no MySQL
5. Exibir estatísticas finais

### Saída Esperada:
```
═══════════════════════════════════════════════════════
🚀 MIGRAÇÃO FIREBASE → MySQL
═══════════════════════════════════════════════════════

🔧 Inicializando Firebase Admin...
🔧 Conectando ao MySQL...
✅ Conectado ao MySQL!

📦 Migrando usuários...
   Encontrados 5 usuários
   ✅ Migrados: 5 | ❌ Erros: 0

📦 Migrando roles_master...
   Encontrados 1 masters
   ✅ Migrados: 1

📦 Migrando transações...
   👤 Rafael Arruda: 150 transações
   👤 Maria Silva: 89 transações
   ✅ Migrados: 239 | ❌ Erros: 0

📊 Estatísticas Finais:
   Usuários: 5
   Transações: 239
   Conversões: 12
```

## 🔄 Passo 5: Atualizar a Aplicação

Agora você precisa atualizar o código para usar MySQL ao invés do Firebase.

### 5.1 Instalar Prisma (ORM Recomendado)

```bash
npm install @prisma/client
npm install -D prisma
npx prisma init
```

### 5.2 Configurar Prisma

Edite `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id        String   @id @db.VarChar(128)
  email     String   @unique @db.VarChar(255)
  name      String   @db.VarChar(255)
  phone     String?  @db.VarChar(20)
  cpf       String?  @db.VarChar(14)
  role      UserRole @default(VIEWER)
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")
  
  transactions     Transaction[]
  wiseTransactions WiseTransaction[]
  
  @@map("users")
}

enum UserRole {
  MASTER  @map("master")
  ADMIN   @map("admin")
  VIEWER  @map("viewer")
}

model Transaction {
  id          String   @id @db.VarChar(128)
  userId      String   @map("user_id") @db.VarChar(128)
  description String   @db.VarChar(500)
  amount      Decimal  @db.Decimal(15, 2)
  category    String   @db.VarChar(100)
  type        TransactionType
  date        DateTime @db.Date
  notes       String?  @db.Text
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
  @@index([date])
  @@map("transactions")
}

enum TransactionType {
  INCOME  @map("income")
  EXPENSE @map("expense")
}

model WiseTransaction {
  id              String   @id @db.VarChar(128)
  userId          String   @map("user_id") @db.VarChar(128)
  fromCurrency    String   @map("from_currency") @db.VarChar(3)
  toCurrency      String   @map("to_currency") @db.VarChar(3)
  amountSent      Decimal  @map("amount_sent") @db.Decimal(15, 2)
  amountReceived  Decimal  @map("amount_received") @db.Decimal(15, 2)
  exchangeRate    Decimal  @map("exchange_rate") @db.Decimal(10, 6)
  fee             Decimal  @default(0) @db.Decimal(15, 2)
  bank            Bank
  notes           String?  @db.Text
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
  @@map("wise_transactions")
}

enum Bank {
  WISE        @map("Wise")
  C6          @map("C6")
  ITAU        @map("Itaú")
  MILLENNIUM  @map("Millennium")
  NOVOBANCO   @map("Novobanco")
}
```

### 5.3 Gerar Prisma Client

```bash
npx prisma generate
npx prisma db pull  # Sincronizar com o banco existente
```

### 5.4 Configurar .env

Crie/edite `.env`:

```bash
DATABASE_URL="mysql://root:SUA_SENHA@localhost:3306/finance_tracker"
```

## 🔐 Passo 6: Segurança

### Criar Usuário Específico da Aplicação

```sql
-- No MySQL
CREATE USER 'finance_app'@'localhost' IDENTIFIED BY 'SENHA_FORTE_AQUI';
GRANT SELECT, INSERT, UPDATE, DELETE ON finance_tracker.* TO 'finance_app'@'localhost';
FLUSH PRIVILEGES;
```

Atualize `.env`:
```bash
DATABASE_URL="mysql://finance_app:SENHA_FORTE_AQUI@localhost:3306/finance_tracker"
```

## 📊 Passo 7: Queries Úteis

### Verificar dados migrados

```sql
-- Total de registros
SELECT 
  (SELECT COUNT(*) FROM users) as users,
  (SELECT COUNT(*) FROM transactions) as transactions,
  (SELECT COUNT(*) FROM wise_transactions) as conversions;

-- Usuários e suas transações
SELECT 
  u.name,
  COUNT(t.id) as total_transactions,
  SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END) as income,
  SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END) as expenses
FROM users u
LEFT JOIN transactions t ON u.id = t.user_id
GROUP BY u.id, u.name;

-- Conversões por banco
SELECT 
  bank,
  COUNT(*) as total,
  SUM(fee) as total_fees
FROM wise_transactions
GROUP BY bank;
```

## 🚀 Passo 8: Deploy na Hospedagem

### Para cPanel/Hospedagem Compartilhada

1. **Criar banco via phpMyAdmin:**
   - Acesse phpMyAdmin
   - Crie database `finance_tracker`
   - Execute o `schema.sql`

2. **Fazer upload dos dados:**
   - Export do Firebase via migration script
   - Import via phpMyAdmin ou SQL

3. **Configurar aplicação:**
   - Upload dos arquivos
   - Configure `.env` com credenciais do MySQL da hospedagem
   - Instale dependências: `npm install`
   - Build: `npm run build`

### Para VPS/Servidor Dedicado

```bash
# 1. Instalar MySQL
sudo apt update
sudo apt install mysql-server

# 2. Configurar MySQL
sudo mysql_secure_installation

# 3. Criar database
sudo mysql
CREATE DATABASE finance_tracker;
source /path/to/schema.sql;
exit;

# 4. Deploy da aplicação
cd /var/www/finance
npm install
npm run build
pm2 start npm --name "finance" -- start
```

## 🔄 Passo 9: Backup e Manutenção

### Backup Automático

```bash
#!/bin/bash
# Script: backup-mysql.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/mysql"
DB_NAME="finance_tracker"

mysqldump -u root -p $DB_NAME | gzip > $BACKUP_DIR/backup_$DATE.sql.gz

# Manter apenas últimos 7 dias
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +7 -delete
```

### Agendar no cron

```bash
# Editar crontab
crontab -e

# Adicionar linha (backup diário às 2h)
0 2 * * * /path/to/backup-mysql.sh
```

## ✅ Checklist Final

- [ ] MySQL instalado e configurado
- [ ] Schema criado (`schema.sql` executado)
- [ ] Dados migrados do Firebase
- [ ] Prisma configurado e funcionando
- [ ] Variáveis de ambiente configuradas
- [ ] Aplicação atualizada para usar MySQL
- [ ] Testes realizados
- [ ] Backup configurado
- [ ] Deploy realizado

## 🆘 Troubleshooting

### Erro: "Access denied for user"
```bash
# Resetar senha do root
sudo mysql
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'nova_senha';
FLUSH PRIVILEGES;
```

### Erro: "Can't connect to MySQL server"
```bash
# Verificar se MySQL está rodando
sudo systemctl status mysql

# Iniciar MySQL
sudo systemctl start mysql
```

### Erro: "Table doesn't exist"
```bash
# Verificar se schema foi criado
mysql -u root -p finance_tracker -e "SHOW TABLES;"
```

## 📚 Recursos Adicionais

- [MySQL Documentation](https://dev.mysql.com/doc/)
- [Prisma Documentation](https://www.prisma.io/docs)
- [MySQL Workbench](https://www.mysql.com/products/workbench/)

## 🎉 Pronto!

Seu sistema agora está rodando com MySQL ao invés do Firebase!

Vantagens:
- ✅ Mais controle sobre os dados
- ✅ Hospedagem mais barata
- ✅ Queries SQL poderosas
- ✅ Melhor performance para grandes volumes
- ✅ Backup e restore mais simples
