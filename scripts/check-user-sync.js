#!/usr/bin/env node

/**
 * Script para sincronizar usuários entre Firebase Auth e Firestore
 * 
 * Este script verifica todos os documentos na collection 'users' do Firestore
 * e garante que cada um tem uma conta correspondente no Firebase Authentication.
 */

const https = require('https');

const FIREBASE_API_KEY = 'AIzaSyDinaZcQc5_Q6Fg8YBixq94-CRRBZKRAwM';
const FIREBASE_PROJECT_ID = 'studio-8444859572-1c9a4';

function httpsRequest(url, options, data) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });
    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function checkUserSync() {
  console.log('='.repeat(80));
  console.log('🔍 Verificando sincronização de usuários');
  console.log('='.repeat(80));

  // Listar todos os usuários do Firestore
  const listUrl = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/users?key=${FIREBASE_API_KEY}`;
  
  console.log('\n📋 Buscando usuários no Firestore...');
  const firestoreRes = await httpsRequest(listUrl, { method: 'GET' });
  
  if (firestoreRes.status !== 200) {
    console.error('❌ Erro ao buscar usuários do Firestore:', firestoreRes.data);
    return;
  }

  const users = firestoreRes.data.documents || [];
  console.log(`✅ Encontrados ${users.length} usuários no Firestore\n`);

  // Verificar cada usuário no Firebase Auth
  for (const userDoc of users) {
    const userId = userDoc.name.split('/').pop();
    const email = userDoc.fields?.email?.stringValue || 'N/A';
    const displayName = userDoc.fields?.displayName?.stringValue || userDoc.fields?.name?.stringValue || 'N/A';

    console.log('-'.repeat(80));
    console.log(`\n👤 Verificando usuário:`);
    console.log(`   ID: ${userId}`);
    console.log(`   Email: ${email}`);
    console.log(`   Nome: ${displayName}`);

    // Verificar se existe no Auth
    const authUrl = `https://identitytoolkit.googleapis.com/v1/accounts:lookup`;
    const authRes = await httpsRequest(authUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      localId: [userId],
      key: FIREBASE_API_KEY
    });

    if (authRes.data.users && authRes.data.users.length > 0) {
      console.log('   ✅ Existe no Firebase Auth');
      const authUser = authRes.data.users[0];
      console.log(`   Auth Email: ${authUser.email}`);
      console.log(`   Email Verified: ${authUser.emailVerified}`);
      console.log(`   Disabled: ${authUser.disabled || false}`);
    } else {
      console.log('   ⚠️  NÃO EXISTE no Firebase Auth');
      console.log('   ⚠️  Este usuário precisa ser recriado no Authentication');
      console.log(`   💡 Solução: Deletar do Firestore ou recriar no Auth`);
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('✅ Verificação concluída');
  console.log('='.repeat(80));
}

checkUserSync().catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});
