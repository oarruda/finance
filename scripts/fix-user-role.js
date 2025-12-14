const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, where, getDocs, doc, updateDoc, serverTimestamp } = require('firebase/firestore');

// Firebase config (ajuste com suas credenciais)
const firebaseConfig = {
  projectId: "studio-8444859572-1c9a4",
  // Não precisa de mais config para operações no Firestore com Emulator
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkAndFixUserRole() {
  const email = 'rafael@rafaelarruda.com';
  
  try {
    // Buscar usuário por email
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', email));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      console.log('❌ Usuário não encontrado no Firestore');
      console.log('');
      console.log('Dica: Verifique se o email está correto e se o usuário já fez login pelo menos uma vez.');
      return;
    }
    
    const userDoc = snapshot.docs[0];
    const userData = userDoc.data();
    
    console.log('📄 Dados atuais do usuário:');
    console.log('UID:', userDoc.id);
    console.log('Email:', userData.email);
    console.log('Role atual:', userData.role || 'NÃO DEFINIDO');
    console.log('');
    
    // Atualizar role para master
    const userDocRef = doc(db, 'users', userDoc.id);
    await updateDoc(userDocRef, {
      role: 'master',
      updatedAt: serverTimestamp()
    });
    
    console.log('✅ Role atualizado para MASTER com sucesso!');
    console.log('');
    console.log('🔄 Próximos passos:');
    console.log('1. Recarregue a página no navegador (F5 ou Cmd+R)');
    console.log('2. Tente acessar /system-settings novamente');
    
  } catch (error) {
    console.error('❌ Erro:', error);
    console.log('');
    console.log('Se o erro persistir, verifique:');
    console.log('- Sua conexão com o Firebase');
    console.log('- Se o usuário existe no Firestore');
    console.log('- Se as regras do Firestore permitem escrita');
  }
  
  process.exit(0);
}

checkAndFixUserRole();
