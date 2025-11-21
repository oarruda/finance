# Como Resolver "auth/invalid-credential"

Este erro significa que o usuário **rafael@rafaelarruda.com** ainda não existe no Firebase Authentication, ou a senha está incorreta.

## Solução: Criar o Usuário no Firebase

### Opção 1: Firebase Console (RECOMENDADO)

1. **Acesse o Firebase Console**
   - URL: https://console.firebase.google.com
   - Projeto: `studio-8444859572-1c9a4`

2. **Vá em Authentication**
   - No menu lateral, clique em **Authentication**
   - Clique na aba **Users**

3. **Adicionar Usuário**
   - Clique em **Add user**
   - Email: `rafael@rafaelarruda.com`
   - Password: Escolha uma senha forte (ex: `Admin@2025`)
   - Clique em **Add user**

4. **Copie o UID**
   - Após criar, clique no usuário
   - **COPIE O USER UID** (você vai precisar)
   - Exemplo: `wU4jJII35pZx8a6uiMinNsprT0u2`

5. **Configure como MASTER**
   Agora vá em **Firestore Database** e crie:
   
   **Collection: `roles_master`**
   - Document ID: [Cole o UID copiado]
   - Campos:
     ```
     email: rafael@rafaelarruda.com
     name: Rafael Arruda
     addedAt: [timestamp atual]
     ```

   **Collection: `users`**
   - Document ID: [Cole o UID copiado]
   - Campos:
     ```
     id: [Cole o UID]
     email: rafael@rafaelarruda.com
     name: Rafael Arruda
     role: master
     avatarUrl: https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop
     ```

6. **Teste o Login**
   - Volte para o app
   - Faça login com: `rafael@rafaelarruda.com` e a senha que você definiu

---

### Opção 2: Script de Setup Completo

Se preferir automatizar, crie este arquivo:

**`scripts/create-master-user.js`**
```javascript
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

const EMAIL = 'rafael@rafaelarruda.com';
const PASSWORD = 'Admin@2025'; // MUDE PARA SUA SENHA

async function createMasterUser() {
  console.log('🚀 Criando usuário MASTER...\n');

  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);

  try {
    // Criar usuário no Authentication
    console.log(`📧 Criando conta para ${EMAIL}...`);
    const userCredential = await createUserWithEmailAndPassword(auth, EMAIL, PASSWORD);
    const userId = userCredential.user.uid;
    
    console.log(`✅ Usuário criado! UID: ${userId}\n`);

    // Adicionar role de MASTER
    console.log('👑 Configurando como MASTER...');
    await setDoc(doc(db, 'roles_master', userId), {
      email: EMAIL,
      name: 'Rafael Arruda',
      addedAt: new Date().toISOString(),
      addedBy: 'setup-script'
    });
    
    // Criar perfil do usuário
    await setDoc(doc(db, 'users', userId), {
      id: userId,
      email: EMAIL,
      name: 'Rafael Arruda',
      role: 'master',
      avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
      createdAt: new Date().toISOString()
    });

    console.log('✅ Configuração completa!\n');
    console.log('🎉 Usuário MASTER criado com sucesso!\n');
    console.log('📋 Detalhes:');
    console.log(`   Email: ${EMAIL}`);
    console.log(`   UID: ${userId}`);
    console.log(`   Role: MASTER`);
    console.log(`   Senha: ${PASSWORD}\n`);
    console.log('Agora você pode fazer login no app! 🚀');

  } catch (error) {
    console.error('❌ Erro:', error);
    
    if (error.code === 'auth/email-already-in-use') {
      console.log('\n⚠️  O usuário já existe!');
      console.log('Use o script setup-master.js para configurá-lo como MASTER.');
    } else if (error.code === 'auth/weak-password') {
      console.log('\n⚠️  A senha é muito fraca. Use uma senha mais forte.');
    }
  }

  process.exit(0);
}

createMasterUser();
```

Execute:
```bash
npm install firebase
node scripts/create-master-user.js
```

---

### Opção 3: Cadastro pelo App (Se tiver tela de registro)

Se você ainda não tem uma tela de registro, posso criar uma para você.

---

## Verificação Pós-Criação

Após criar o usuário, verifique:

1. **Firebase Console > Authentication**
   - ✅ Usuário `rafael@rafaelarruda.com` existe
   - ✅ Status: Enabled

2. **Firebase Console > Firestore**
   - ✅ `/roles_master/{seu-uid}` existe
   - ✅ `/users/{seu-uid}` existe com `role: "master"`

3. **Deploy das Regras**
   ```bash
   firebase deploy --only firestore:rules
   ```

4. **Teste no App**
   - Faça login com email e senha
   - Acesse `/admin`
   - Você deve ter controle total!

---

## Status Atual

Com base no erro, você precisa:
1. ✅ Regras do Firestore já estão prontas
2. ❌ **Criar o usuário no Authentication** ← VOCÊ ESTÁ AQUI
3. ⏳ Configurar como MASTER no Firestore
4. ⏳ Fazer deploy das regras

Siga a **Opção 1** acima para resolver! 🎯
