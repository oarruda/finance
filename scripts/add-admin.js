// Script para adicionar um usuário como admin no Firestore
// Execute com: node scripts/add-admin.js

const admin = require('firebase-admin');

// Inicializar Firebase Admin
// Em produção, use as credenciais de serviço adequadas
admin.initializeApp({
  projectId: 'finance-app', // Substitua pelo seu project ID
});

const db = admin.firestore();

async function addAdmin(email) {
  try {
    // Buscar o usuário pelo email
    const userRecord = await admin.auth().getUserByEmail(email);
    const userId = userRecord.uid;

    // Adicionar documento na coleção roles_admin
    await db.collection('roles_admin').doc(userId).set({
      email: email,
      addedAt: admin.firestore.FieldValue.serverTimestamp(),
      addedBy: 'setup-script',
    });

    console.log(`✅ Usuário ${email} (${userId}) adicionado como admin com sucesso!`);
  } catch (error) {
    console.error('❌ Erro ao adicionar admin:', error);
  }
}

// Email do usuário para tornar admin
const adminEmail = process.argv[2] || 'rafael@rafaelarruda.com';

addAdmin(adminEmail)
  .then(() => {
    console.log('\n🎉 Processo concluído!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Erro fatal:', error);
    process.exit(1);
  });
