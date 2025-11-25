/**
 * Script de Migração: Firebase → MySQL
 * 
 * Este script exporta todos os dados do Firebase Firestore
 * e importa no MySQL usando o schema criado.
 * 
 * USO:
 * 1. Configure as credenciais do MySQL abaixo
 * 2. Execute: node database/migration-firebase-to-mysql.js
 */

const admin = require('firebase-admin');
const mysql = require('mysql2/promise');

// ============================================================================
// CONFIGURAÇÕES
// ============================================================================

// Configuração Firebase
const firebaseConfig = {
  credential: admin.credential.applicationDefault(),
  projectId: 'studio-8444859572-1c9a4'
};

// Configuração MySQL
const mysqlConfig = {
  host: 'localhost',
  user: 'aromac57_cruzeiro',
  password: '@9M!ws}vvmZ?',
  database: 'aromac57_cruzeiro',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// ============================================================================
// INICIALIZAÇÃO
// ============================================================================

let db;
let pool;

async function initialize() {
  console.log('🔧 Inicializando Firebase Admin...');
  if (!admin.apps.length) {
    admin.initializeApp(firebaseConfig);
  }
  db = admin.firestore();

  console.log('🔧 Conectando ao MySQL...');
  pool = mysql.createPool(mysqlConfig);
  
  // Testar conexão
  const connection = await pool.getConnection();
  console.log('✅ Conectado ao MySQL!');
  connection.release();
}

// ============================================================================
// FUNÇÕES DE MIGRAÇÃO
// ============================================================================

/**
 * Migrar usuários
 */
async function migrateUsers() {
  console.log('\n📦 Migrando usuários...');
  
  const usersSnapshot = await db.collection('users').get();
  console.log(`   Encontrados ${usersSnapshot.size} usuários`);
  
  let migrated = 0;
  let errors = 0;

  for (const doc of usersSnapshot.docs) {
    try {
      const data = doc.data();
      
      await pool.execute(
        `INSERT INTO users (
          id, email, name, phone, cpf, role,
          address_street, address_number, address_complement,
          address_neighborhood, address_city, address_state,
          address_zip, address_country, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          email = VALUES(email),
          name = VALUES(name),
          phone = VALUES(phone),
          cpf = VALUES(cpf),
          role = VALUES(role),
          updated_at = VALUES(updated_at)`,
        [
          doc.id,
          data.email || '',
          data.name || '',
          data.phone || null,
          data.cpf || null,
          data.role || 'viewer',
          data.address?.street || null,
          data.address?.number || null,
          data.address?.complement || null,
          data.address?.neighborhood || null,
          data.address?.city || null,
          data.address?.state || null,
          data.address?.zip || null,
          data.address?.country || 'Brasil',
          data.createdAt || new Date().toISOString(),
          data.updatedAt || new Date().toISOString()
        ]
      );
      
      migrated++;
    } catch (error) {
      console.error(`   ❌ Erro ao migrar usuário ${doc.id}:`, error.message);
      errors++;
    }
  }
  
  console.log(`   ✅ Migrados: ${migrated} | ❌ Erros: ${errors}`);
}

/**
 * Migrar roles master
 */
async function migrateRolesMaster() {
  console.log('\n📦 Migrando roles_master...');
  
  const rolesSnapshot = await db.collection('roles_master').get();
  console.log(`   Encontrados ${rolesSnapshot.size} masters`);
  
  let migrated = 0;

  for (const doc of rolesSnapshot.docs) {
    try {
      const data = doc.data();
      
      await pool.execute(
        `INSERT INTO roles_master (user_id, email, role, created_at)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE email = VALUES(email)`,
        [
          doc.id,
          data.email || '',
          'master',
          data.createdAt || new Date().toISOString()
        ]
      );
      
      migrated++;
    } catch (error) {
      console.error(`   ❌ Erro ao migrar master ${doc.id}:`, error.message);
    }
  }
  
  console.log(`   ✅ Migrados: ${migrated}`);
}

/**
 * Migrar roles admin
 */
async function migrateRolesAdmin() {
  console.log('\n📦 Migrando roles_admin...');
  
  const rolesSnapshot = await db.collection('roles_admin').get();
  console.log(`   Encontrados ${rolesSnapshot.size} admins`);
  
  let migrated = 0;

  for (const doc of rolesSnapshot.docs) {
    try {
      const data = doc.data();
      
      await pool.execute(
        `INSERT INTO roles_admin (user_id, email, role, created_at)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE email = VALUES(email)`,
        [
          doc.id,
          data.email || '',
          'admin',
          data.createdAt || new Date().toISOString()
        ]
      );
      
      migrated++;
    } catch (error) {
      console.error(`   ❌ Erro ao migrar admin ${doc.id}:`, error.message);
    }
  }
  
  console.log(`   ✅ Migrados: ${migrated}`);
}

/**
 * Migrar transações de todos os usuários
 */
async function migrateTransactions() {
  console.log('\n📦 Migrando transações...');
  
  const usersSnapshot = await db.collection('users').get();
  let totalMigrated = 0;
  let totalErrors = 0;

  for (const userDoc of usersSnapshot.docs) {
    const transactionsSnapshot = await db
      .collection('users')
      .doc(userDoc.id)
      .collection('transactions')
      .get();
    
    if (transactionsSnapshot.empty) continue;
    
    console.log(`   👤 ${userDoc.data().name}: ${transactionsSnapshot.size} transações`);

    for (const doc of transactionsSnapshot.docs) {
      try {
        const data = doc.data();
        
        await pool.execute(
          `INSERT INTO transactions (
            id, user_id, description, amount, category, type, date,
            notes, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            description = VALUES(description),
            amount = VALUES(amount),
            category = VALUES(category),
            updated_at = VALUES(updated_at)`,
          [
            doc.id,
            userDoc.id,
            data.description || '',
            data.amount || 0,
            data.category || 'Outros',
            data.type || 'expense',
            data.date || new Date().toISOString().split('T')[0],
            data.notes || null,
            data.createdAt || new Date().toISOString(),
            data.updatedAt || new Date().toISOString()
          ]
        );
        
        totalMigrated++;
      } catch (error) {
        console.error(`   ❌ Erro ao migrar transação ${doc.id}:`, error.message);
        totalErrors++;
      }
    }
  }
  
  console.log(`   ✅ Migrados: ${totalMigrated} | ❌ Erros: ${totalErrors}`);
}

/**
 * Migrar conversões Wise
 */
async function migrateWiseTransactions() {
  console.log('\n📦 Migrando conversões Wise...');
  
  const usersSnapshot = await db.collection('users').get();
  let totalMigrated = 0;
  let totalErrors = 0;

  for (const userDoc of usersSnapshot.docs) {
    const wiseSnapshot = await db
      .collection('users')
      .doc(userDoc.id)
      .collection('wiseTransactions')
      .get();
    
    if (wiseSnapshot.empty) continue;
    
    console.log(`   👤 ${userDoc.data().name}: ${wiseSnapshot.size} conversões`);

    for (const doc of wiseSnapshot.docs) {
      try {
        const data = doc.data();
        
        await pool.execute(
          `INSERT INTO wise_transactions (
            id, user_id, from_currency, to_currency,
            amount_sent, amount_received, exchange_rate, fee, bank,
            notes, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            amount_sent = VALUES(amount_sent),
            amount_received = VALUES(amount_received),
            updated_at = VALUES(updated_at)`,
          [
            doc.id,
            userDoc.id,
            data.fromCurrency || 'BRL',
            data.toCurrency || 'EUR',
            data.amountSent || 0,
            data.amountReceived || 0,
            data.exchangeRate || 0,
            data.fee || 0,
            data.bank || 'Wise',
            data.notes || null,
            data.createdAt || new Date().toISOString(),
            data.updatedAt || new Date().toISOString()
          ]
        );
        
        totalMigrated++;
      } catch (error) {
        console.error(`   ❌ Erro ao migrar conversão ${doc.id}:`, error.message);
        totalErrors++;
      }
    }
  }
  
  console.log(`   ✅ Migrados: ${totalMigrated} | ❌ Erros: ${totalErrors}`);
}

/**
 * Migrar taxas de câmbio
 */
async function migrateExchangeRates() {
  console.log('\n📦 Migrando taxas de câmbio...');
  
  const ratesSnapshot = await db.collection('exchangeRates').get();
  console.log(`   Encontradas ${ratesSnapshot.size} taxas`);
  
  let migrated = 0;

  for (const doc of ratesSnapshot.docs) {
    try {
      const data = doc.data();
      
      // Assumindo que o documento tem estrutura rates: { USD: 1.0, BRL: 5.0, etc }
      if (data.rates) {
        const baseCurrency = data.base || 'USD';
        
        for (const [targetCurrency, rate] of Object.entries(data.rates)) {
          await pool.execute(
            `INSERT INTO exchange_rates (id, base_currency, target_currency, rate, updated_at)
             VALUES (UUID(), ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE rate = VALUES(rate), updated_at = VALUES(updated_at)`,
            [
              baseCurrency,
              targetCurrency,
              rate,
              data.timestamp || new Date().toISOString()
            ]
          );
        }
      }
      
      migrated++;
    } catch (error) {
      console.error(`   ❌ Erro ao migrar taxa ${doc.id}:`, error.message);
    }
  }
  
  console.log(`   ✅ Migrados: ${migrated}`);
}

// ============================================================================
// SCRIPT PRINCIPAL
// ============================================================================

async function main() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('🚀 MIGRAÇÃO FIREBASE → MySQL');
  console.log('═══════════════════════════════════════════════════════\n');

  try {
    await initialize();
    
    console.log('\n📊 Iniciando migração...\n');
    
    await migrateUsers();
    await migrateRolesMaster();
    await migrateRolesAdmin();
    await migrateTransactions();
    await migrateWiseTransactions();
    await migrateExchangeRates();
    
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('✅ MIGRAÇÃO CONCLUÍDA COM SUCESSO!');
    console.log('═══════════════════════════════════════════════════════\n');
    
    // Estatísticas finais
    const [users] = await pool.execute('SELECT COUNT(*) as count FROM users');
    const [transactions] = await pool.execute('SELECT COUNT(*) as count FROM transactions');
    const [conversions] = await pool.execute('SELECT COUNT(*) as count FROM wise_transactions');
    
    console.log('📊 Estatísticas Finais:');
    console.log(`   Usuários: ${users[0].count}`);
    console.log(`   Transações: ${transactions[0].count}`);
    console.log(`   Conversões: ${conversions[0].count}`);
    console.log('');
    
  } catch (error) {
    console.error('\n❌ ERRO NA MIGRAÇÃO:', error);
    process.exit(1);
  } finally {
    if (pool) {
      await pool.end();
      console.log('🔌 Conexão MySQL encerrada.');
    }
  }
}

// Executar
main();
