# 🚀 Configuração Rápida do Banco MySQL

## ℹ️ Informações do Banco

- **Host:** localhost
- **Banco:** aromac57_cruzeiro
- **Usuário:** aromac57_cruzeiro
- **Senha:** @9M!ws}vvmZ?

## 📋 Passo 1: Criar Estrutura do Banco

Execute o schema no seu banco de dados:

```bash
# Via linha de comando
mysql -u aromac57_cruzeiro -p'@9M!ws}vvmZ?' aromac57_cruzeiro < database/schema.sql

# Ou via phpMyAdmin/cPanel
# 1. Acesse phpMyAdmin
# 2. Selecione o banco: aromac57_cruzeiro
# 3. Vá em "SQL" 
# 4. Cole o conteúdo de database/schema.sql
# 5. Clique em "Executar"
```

## 📦 Passo 2: Migrar Dados do Firebase

```bash
# Instalar dependência
npm install mysql2 --save

# Executar migração
node database/migration-firebase-to-mysql.js
```

Isso irá:
- ✅ Conectar ao Firebase
- ✅ Exportar todos os dados
- ✅ Importar no MySQL aromac57_cruzeiro
- ✅ Exibir estatísticas

## 🔧 Passo 3: Configurar a Aplicação

### Opção A: Usar Prisma ORM (Recomendado)

```bash
# Instalar Prisma
npm install @prisma/client
npm install -D prisma

# Inicializar
npx prisma init

# Copiar configuração
cp .env.mysql .env
```

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
  id    String @id @db.VarChar(128)
  email String @unique @db.VarChar(255)
  name  String @db.VarChar(255)
  role  String @db.VarChar(20)
  // ... outros campos
  
  @@map("users")
}

// ... outros models
```

Gerar client:
```bash
npx prisma generate
npx prisma db pull  # Sincronizar com banco existente
```

### Opção B: Usar mysql2 Direto

Criar `src/lib/db.ts`:

```typescript
import mysql from 'mysql2/promise';

export const pool = mysql.createPool({
  host: 'localhost',
  user: 'aromac57_cruzeiro',
  password: '@9M!ws}vvmZ?',
  database: 'aromac57_cruzeiro',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Exemplo de uso
export async function getUsers() {
  const [rows] = await pool.execute('SELECT * FROM users');
  return rows;
}
```

## ✅ Verificar se Funcionou

```bash
# Conectar ao MySQL
mysql -u aromac57_cruzeiro -p'@9M!ws}vvmZ?' aromac57_cruzeiro

# Listar tabelas
SHOW TABLES;

# Ver usuários
SELECT * FROM users;

# Ver transações
SELECT COUNT(*) as total FROM transactions;
```

## 🎯 Próximos Passos

1. ✅ Execute `database/schema.sql` no banco
2. ✅ Execute `node database/migration-firebase-to-mysql.js`
3. ✅ Configure Prisma ou mysql2
4. ✅ Atualize o código para usar MySQL
5. ✅ Teste a aplicação
6. ✅ Faça deploy

## 🔐 Segurança

**IMPORTANTE:** Nunca compartilhe estas credenciais publicamente!

- Mantenha o arquivo `.env` no `.gitignore`
- Use variáveis de ambiente em produção
- Considere criar um usuário com permissões limitadas

## 📞 Suporte

Se tiver problemas:
1. Verifique se o MySQL está rodando
2. Teste a conexão: `mysql -u aromac57_cruzeiro -p`
3. Verifique se o banco existe: `SHOW DATABASES;`
4. Veja os logs de erro da migração
