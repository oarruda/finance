/**
 * Script para adicionar role MASTER buscando por email
 * 
 * USO: node scripts/set-master-by-email.js EMAIL
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, where, getDocs, doc, setDoc } = require('firebase/firestore');

const firebaseConfig = {
  projectId: "studio-8444859572-1c9a4",
  appId: "1:192413104190:web:50852c0e04ac05f8a7f96f",
  apiKey: "AIzaSyDinaZcQc5_Q6Fg8YBixq94-CRRBZKRAwM",
  authDomain: "studio-8444859572-1c9a4.firebaseapp.com",
  storageBucket: "studio-8444859572-1c9a4.appspot.com",
  messagingSenderId: "192413104190"
};

async function setMasterByEmail() {
  try {
    const email = process.argv[2] || 'rafael@rafaelarruda.com';
    
    console.log(`\n🔧 Configurando ${email} como MASTER...\n`);

    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    // Buscar usuário pelo email
    console.log('🔍 Buscando usuário no Firestore...');
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', email));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      console.error(`❌ Usuário com email ${email} não encontrado!`);
      console.log('\n💡 O usuário precisa fazer login pelo menos uma vez para ser criado no Firestore.');
      process.exit(1);
    }

    const userDoc = querySnapshot.docs[0];
    const userId = userDoc.id;
    const userData = userDoc.data();

    console.log(`✅ Usuário encontrado:`);
    console.log(`   - Nome: ${userData.name || 'Sem nome'}`);
    console.log(`   - Email: ${userData.email}`);
    console.log(`   - UID: ${userId}`);
    console.log(`   - Role atual: ${userData.role || 'viewer'}\n`);

    // Adicionar documento na coleção roles_master
    console.log('📝 Adicionando documento em roles_master...');
    await setDoc(doc(db, 'roles_master', userId), {
      email: userData.email,
      role: 'master',
      createdAt: new Date().toISOString()
    });
    console.log('✅ Documento roles_master criado!');

    // Atualizar role no perfil do usuário
    console.log('📝 Atualizando role no perfil do usuário...');
    await setDoc(doc(db, 'users', userId), {
      role: 'master',
      updatedAt: new Date().toISOString()
    }, { merge: true });
    console.log('✅ Role atualizada no perfil!');

    console.log('\n═══════════════════════════════════════');
    console.log('✅ SUCESSO! Usuário configurado como MASTER');
    console.log('═══════════════════════════════════════');
    console.log(`👤 ${userData.name || email}`);
    console.log(`📧 ${userData.email}`);
    console.log(`🔑 ${userId}`);
    console.log(`👑 Role: MASTER`);
    console.log('═══════════════════════════════════════\n');
    console.log('💡 Faça logout e login novamente para aplicar as mudanças.\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ ERRO:', error.message);
    console.error(error);
    process.exit(1);
  }
}

setMasterByEmail();
