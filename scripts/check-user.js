const admin = require('firebase-admin');

// Inicializar Firebase Admin (usa variáveis de ambiente ou configuração padrão)
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

async function checkUser() {
  const userId = 'lJprMmuNDFezNz44blKZp1TzaIp2';
  
  console.log('='.repeat(60));
  console.log('🔍 Verificando usuário:', userId);
  console.log('='.repeat(60));
  
  try {
    // Verificar no Firestore
    const userDoc = await db.collection('users').doc(userId).get();
    
    if (userDoc.exists) {
      console.log('✅ Usuário EXISTE no Firestore');
      console.log('📄 Dados do documento:');
      console.log(JSON.stringify(userDoc.data(), null, 2));
    } else {
      console.log('❌ Usuário NÃO EXISTE no Firestore');
      
      // Listar todos os usuários
      console.log('\n📋 Listando todos os usuários:');
      const usersSnapshot = await db.collection('users').get();
      console.log(`Total de usuários: ${usersSnapshot.size}`);
      
      usersSnapshot.forEach((doc) => {
        const data = doc.data();
        console.log(`  - ID: ${doc.id}`);
        console.log(`    Email: ${data.email || 'N/A'}`);
        console.log(`    Nome: ${data.displayName || data.name || 'N/A'}`);
        console.log(`    Role: ${data.role || 'N/A'}`);
        console.log('');
      });
    }
    
    // Verificar no Firebase Auth
    console.log('\n🔐 Verificando no Firebase Auth:');
    try {
      const userAuth = await admin.auth().getUser(userId);
      console.log('✅ Usuário EXISTE no Firebase Auth');
      console.log(`  Email: ${userAuth.email}`);
      console.log(`  Display Name: ${userAuth.displayName || 'N/A'}`);
      console.log(`  Email Verified: ${userAuth.emailVerified}`);
      console.log(`  Disabled: ${userAuth.disabled}`);
    } catch (authError) {
      console.log('❌ Usuário NÃO EXISTE no Firebase Auth');
      console.log(`  Erro: ${authError.message}`);
    }
    
  } catch (error) {
    console.error('❌ Erro ao verificar usuário:', error);
  }
  
  console.log('='.repeat(60));
}

checkUser()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Erro fatal:', error);
    process.exit(1);
  });
