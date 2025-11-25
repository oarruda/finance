/**
 * Script de Teste de Conexão MySQL
 * Verifica se consegue conectar ao banco aromac57_cruzeiro
 */

const mysql = require('mysql2/promise');

const config = {
  host: 'localhost',
  user: 'aromac57_cruzeiro',
  password: '@9M!ws}vvmZ?',
  database: 'aromac57_cruzeiro'
};

async function testConnection() {
  console.log('🔧 Testando conexão com MySQL...\n');
  console.log('Configuração:');
  console.log(`   Host: ${config.host}`);
  console.log(`   Database: ${config.database}`);
  console.log(`   User: ${config.user}`);
  console.log('');

  let connection;
  
  try {
    // Tentar conectar
    console.log('📡 Conectando...');
    connection = await mysql.createConnection(config);
    console.log('✅ Conexão estabelecida com sucesso!\n');

    // Testar consulta
    console.log('📊 Testando consulta...');
    const [rows] = await connection.execute('SELECT DATABASE() as db, VERSION() as version');
    console.log(`✅ Banco ativo: ${rows[0].db}`);
    console.log(`✅ Versão MySQL: ${rows[0].version}\n`);

    // Listar tabelas
    console.log('📋 Verificando tabelas...');
    const [tables] = await connection.execute('SHOW TABLES');
    
    if (tables.length === 0) {
      console.log('⚠️  Nenhuma tabela encontrada!');
      console.log('💡 Execute o schema.sql primeiro:\n');
      console.log('   mysql -u aromac57_cruzeiro -p aromac57_cruzeiro < database/schema.sql\n');
    } else {
      console.log(`✅ Encontradas ${tables.length} tabelas:`);
      tables.forEach((table, i) => {
        const tableName = Object.values(table)[0];
        console.log(`   ${i + 1}. ${tableName}`);
      });
    }

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('✅ TESTE DE CONEXÃO BEM-SUCEDIDO!');
    console.log('═══════════════════════════════════════════════════════\n');
    console.log('Próximos passos:');
    console.log('1. Se não tem tabelas, execute: mysql -u aromac57_cruzeiro -p < database/schema.sql');
    console.log('2. Execute a migração: node database/migration-firebase-to-mysql.js');
    console.log('3. Configure o Prisma: npx prisma init');
    console.log('');

  } catch (error) {
    console.error('\n❌ ERRO NA CONEXÃO!\n');
    
    if (error.code === 'ECONNREFUSED') {
      console.error('💡 O MySQL não está rodando ou não está acessível em localhost.');
      console.error('   Verifique se o serviço MySQL está ativo:');
      console.error('   - Linux: sudo systemctl status mysql');
      console.error('   - Mac: brew services list');
      console.error('');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('💡 Credenciais incorretas!');
      console.error('   Verifique o usuário e senha.');
      console.error('');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.error('💡 Banco de dados não encontrado!');
      console.error('   Crie o banco primeiro:');
      console.error('   CREATE DATABASE aromac57_cruzeiro CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;');
      console.error('');
    } else {
      console.error('Detalhes do erro:');
      console.error(error.message);
      console.error('');
    }
    
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Executar teste
testConnection();
