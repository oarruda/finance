/**
 * Script para adicionar role MASTER a um usuário existente
 * 
 * USO: node scripts/add-master-role.js EMAIL_DO_USUARIO
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc, getDoc } = require('firebase/firestore');

const firebaseConfig = {
  projectId: "studio-8444859572-1c9a4",
  appId: "1:192413104190:web:50852c0e04ac05f8a7f96f",
  apiKey: "AIzaSyDinaZcQc5_Q6Fg8YBixq94-CRRBZKRAwM",
  authDomain: "studio-8444859572-1c9a4.firebaseapp.com",
  storageBucket: "studio-8444859572-1c9a4.appspot.com",
  messagingSenderId: "192413104190"
};

async function addMasterRole() {
  try {
    const email = process.argv[2];
    
    if (!email) {
      console.error('❌ Por favor, forneça o email do usuário!');
      console.log('USO: node scripts/add-master-role.js EMAIL_DO_USUARIO');
      process.exit(1);
    }

    console.log(`🔧 Adicionando role MASTER para ${email}...\n`);

    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    // Buscar usuário pelo email
    console.log('🔍 Buscando usuário no Firestore...');
    
    // Você precisará fornecer o UID manualmente ou buscar via Admin SDK
    console.log('\n⚠️  IMPORTANTE:');
    console.log('Este script precisa do UID do usuário.');
    console.log('\nPara encontrar o UID:');
    console.log('1. Acesse: https://console.firebase.google.com');
    console.log('2. Vá em Authentication > Users');
    console.log(`3. Procure por ${email}`);
    console.log('4. Copie o UID');
    console.log('\nDepois execute:');
    console.log(`node scripts/add-master-role-by-uid.js SEU_UID_AQUI`);
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

addMasterRole();
