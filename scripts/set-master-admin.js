/**
 * Script para adicionar role MASTER usando Firebase Admin SDK
 * Este script tem permissões totais e funciona direto no servidor
 * 
 * USO: node scripts/set-master-admin.js UID_DO_USUARIO
 */

const admin = require('firebase-admin');

// Inicializar Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: 'studio-8444859572-1c9a4'
  });
}

const db = admin.firestore();

async function setMasterRole() {
  try {
    const userId = process.argv[2];
    
    if (!userId) {
      console.error('❌ Por favor, forneça o UID do usuário!');
      console.log('USO: node scripts/set-master-admin.js UID_DO_USUARIO');
      console.log('\n💡 Para encontrar seu UID:');
      console.log('   1. Faça login na aplicação');
      console.log('   2. Abra o Console do navegador (F12)');
      console.log('   3. Cole este código:');
      console.log('      firebase.auth().currentUser.uid');
      process.exit(1);
    }

    console.log(`\n🔧 Configurando MASTER para UID: ${userId}...\n`);

    // Verificar se usuário existe
    console.log('🔍 Buscando usuário...');
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      console.error('❌ Usuário não encontrado no Firestore!');
      console.log('\n💡 Verifique se:');
      console.log('   1. O UID está correto');
      console.log('   2. O usuário já fez login ao menos uma vez');
      console.log('   3. O documento foi criado em /users/{uid}');
      process.exit(1);
    }

    const userData = userDoc.data();
    console.log(`✅ Usuário encontrado:`);
    console.log(`   - Nome: ${userData.name || 'N/A'}`);
    console.log(`   - Email: ${userData.email || 'N/A'}`);
    console.log(`   - Role atual: ${userData.role || 'nenhuma'}\n`);

    // Adicionar na coleção roles_master
    console.log('📝 Adicionando na coleção roles_master...');
    await db.collection('roles_master').doc(userId).set({
      email: userData.email || '',
      role: 'master',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log('✅ Adicionado em roles_master\n');

    // Atualizar perfil do usuário
    console.log('📝 Atualizando role no perfil do usuário...');
    await userRef.update({
      role: 'master',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log('✅ Role atualizada no perfil\n');

    // Atualizar no Firebase Auth também
    console.log('📝 Atualizando custom claims no Firebase Auth...');
    await admin.auth().setCustomUserClaims(userId, { role: 'master' });
    console.log('✅ Custom claims atualizadas\n');

    console.log('═══════════════════════════════════════════════════');
    console.log('🎉 SUCESSO! Usuário configurado como MASTER!');
    console.log('═══════════════════════════════════════════════════');
    console.log(`✅ Nome: ${userData.name || 'N/A'}`);
    console.log(`✅ Email: ${userData.email}`);
    console.log(`✅ UID: ${userId}`);
    console.log(`✅ Role: MASTER`);
    console.log('═══════════════════════════════════════════════════');
    console.log('\n⚠️  IMPORTANTE: Faça logout e login novamente!');
    console.log('   As permissões só serão aplicadas após novo login.\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ ERRO:', error.message);
    
    if (error.code === 'app/no-app') {
      console.log('\n💡 Firebase Admin não está configurado corretamente.');
      console.log('   Tente usar o método alternativo no arquivo:');
      console.log('   docs/como-ser-master.md');
    }
    
    console.error('\nDetalhes do erro:');
    console.error(error);
    process.exit(1);
  }
}

setMasterRole();
