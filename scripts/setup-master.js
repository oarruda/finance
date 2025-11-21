/**
 * Script para CRIAR e configurar o primeiro usuário MASTER
 * Execute apenas UMA VEZ: node scripts/setup-master.js
 * 
 * IMPORTANTE: Mude a senha antes de executar!
 */

const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, doc, setDoc } = require('firebase/firestore');

const firebaseConfig = {
  "projectId": "studio-8444859572-1c9a4",
  "appId": "1:192413104190:web:50852c0e04ac05f8a7f96f",
  "apiKey": "AIzaSyDinaZcQc5_Q6Fg8YBixq94-CRRBZKRAwM",
  "authDomain": "studio-8444859572-1c9a4.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "192413104190"
};

const MASTER_EMAIL = 'rafael@rafaelarruda.com';
const MASTER_PASSWORD = 'Admin@2025'; // ⚠️ MUDE PARA SUA SENHA FORTE!

async function setupMaster() {
  console.log('🔧 Configurando usuário MASTER...\n');

  // Inicializar Firebase
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);

  try {
    // 1. Criar o usuário no Firebase Authentication
    console.log(`📧 Criando usuário ${MASTER_EMAIL}...`);
    const userCredential = await createUserWithEmailAndPassword(auth, MASTER_EMAIL, MASTER_PASSWORD);
    const userId = userCredential.user.uid;
    
    console.log(`✅ Usuário criado com sucesso! UID: ${userId}\n`);

    // 2. Criar documento em roles_master
    console.log('👑 Criando role de MASTER...');
    await setDoc(doc(db, 'roles_master', userId), {
      email: MASTER_EMAIL,
      addedAt: new Date().toISOString(),
      addedBy: 'setup-script',
      name: 'Rafael Arruda'
    });
    console.log('✅ Documento criado em /roles_master\n');

    // 3. Atualizar ou criar perfil do usuário
    console.log('👤 Atualizando perfil do usuário...');
    await setDoc(doc(db, 'users', userId), {
      id: userId,
      email: MASTER_EMAIL,
      name: 'Rafael Arruda',
      role: 'master',
      avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }, { merge: true });
    console.log('✅ Perfil do usuário atualizado em /users\n');

    console.log('🎉 SUCESSO! Configuração concluída!\n');
    console.log('📋 Resumo:');
    console.log(`   - Email: ${MASTER_EMAIL}`);
    console.log(`   - Senha: ${MASTER_PASSWORD}`);
    console.log(`   - UID: ${userId}`);
    console.log(`   - Role: MASTER`);
    console.log(`   - Permissões: Controle total do sistema\n`);
    console.log('⚠️  IMPORTANTE: Altere sua senha após o primeiro login!\n');
    console.log('Agora você pode fazer login e gerenciar usuários! 🚀');

  } catch (error) {
    console.error('❌ Erro durante a configuração:', error);
    
    if (error.code === 'auth/email-already-in-use') {
      console.log('\n⚠️  Este email já está em uso!');
      console.log('Se você já tem uma conta, vá ao Firebase Console para configurar como MASTER.');
      console.log('Veja: docs/setup-master-user.md');
    } else if (error.code === 'auth/weak-password') {
      console.log('\n⚠️  A senha é muito fraca. Use uma senha mais forte (mínimo 6 caracteres).');
    } else if (error.code === 'permission-denied') {
      console.log('\n⚠️  Erro de permissão. Você precisa fazer deploy das regras do Firestore primeiro.');
      console.log('Execute: firebase deploy --only firestore:rules');
    }
  }

  process.exit(0);
}

setupMaster();
