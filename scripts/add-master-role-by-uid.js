/**
 * Script para adicionar role MASTER a um usuário existente usando UID
 * 
 * USO: node scripts/add-master-role-by-uid.js UID_DO_USUARIO
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc, getDoc, serverTimestamp } = require('firebase/firestore');

const firebaseConfig = {
  projectId: "studio-8444859572-1c9a4",
  appId: "1:192413104190:web:50852c0e04ac05f8a7f96f",
  apiKey: "AIzaSyDinaZcQc5_Q6Fg8YBixq94-CRRBZKRAwM",
  authDomain: "studio-8444859572-1c9a4.firebaseapp.com",
  storageBucket: "studio-8444859572-1c9a4.appspot.com",
  messagingSenderId: "192413104190"
};

async function addMasterRoleByUid() {
  try {
    const userId = process.argv[2];
    
    if (!userId) {
      console.error('❌ Por favor, forneça o UID do usuário!');
      console.log('USO: node scripts/add-master-role-by-uid.js UID_DO_USUARIO');
      process.exit(1);
    }

    console.log(`🔧 Adicionando role MASTER para UID ${userId}...\n`);

    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    // Verificar se usuário existe
    console.log('🔍 Verificando usuário...');
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      console.error('❌ Usuário não encontrado no Firestore!');
      process.exit(1);
    }

    const userData = userDoc.data();
    console.log(`✅ Usuário encontrado: ${userData.name || 'Sem nome'} (${userData.email || 'Sem email'})\n`);

    // Adicionar role MASTER
    console.log('📝 Adicionando role MASTER...');
    await setDoc(doc(db, 'roles_master', userId), {
      email: userData.email,
      createdAt: new Date().toISOString(),
      role: 'master'
    });

    // Atualizar perfil do usuário
    console.log('📝 Atualizando perfil do usuário...');
    await setDoc(userRef, {
      ...userData,
      role: 'master',
      updatedAt: new Date().toISOString()
    }, { merge: true });

    console.log('\n✅ SUCESSO!');
    console.log('═══════════════════════════════════════');
    console.log(`✅ ${userData.name || 'Usuário'} agora é MASTER!`);
    console.log(`   - Email: ${userData.email}`);
    console.log(`   - UID: ${userId}`);
    console.log(`   - Role: master`);
    console.log('═══════════════════════════════════════\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error(error);
    process.exit(1);
  }
}

addMasterRoleByUid();
