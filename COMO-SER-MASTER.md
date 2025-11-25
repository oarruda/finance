/**
 * GUIA RÁPIDO: Como se Tornar MASTER (Método Simples)
 * 
 * Este é o método mais rápido e fácil - diretamente pelo navegador!
 */

## 🚀 Método 1: Via Console do Navegador (MAIS FÁCIL!)

### Passo 1: Faça Login
1. Acesse sua aplicação: http://localhost:9002
2. Faça login com: **rafael@rafaelarruda.com**

### Passo 2: Abra o Console do Navegador
1. Pressione **F12** (ou Cmd+Option+I no Mac)
2. Vá na aba **Console**

### Passo 3: Execute este Código

Cole e execute no console:

```javascript
// Seu UID (substitua se necessário)
const myUid = "wU4jJII35pZx8a6uiMinNsprT0u2";
const myEmail = "rafael@rafaelarruda.com";

// Pegar referências do Firestore
const db = firebase.firestore();

// Adicionar na coleção roles_master
db.collection('roles_master').doc(myUid).set({
  email: myEmail,
  role: 'master',
  createdAt: new Date().toISOString()
}).then(() => {
  console.log('✅ Adicionado em roles_master!');
  
  // Atualizar perfil do usuário
  return db.collection('users').doc(myUid).update({
    role: 'master',
    updatedAt: new Date().toISOString()
  });
}).then(() => {
  console.log('✅ Role atualizada no perfil!');
  console.log('🎉 VOCÊ AGORA É MASTER!');
  console.log('⚠️ Faça LOGOUT e LOGIN novamente!');
}).catch(error => {
  console.error('❌ Erro:', error);
  console.log('💡 Se deu erro de permissão, use o Método 2 abaixo');
});
```

### Passo 4: Logout e Login
1. Faça logout
2. Faça login novamente
3. Acesse **/admin**
4. Pronto! Você verá o botão "Novo Usuário"

---

## 🔧 Método 2: Via Firebase Console (SE O MÉTODO 1 NÃO FUNCIONAR)

### Passo 1: Acesse o Firebase Console
https://console.firebase.google.com

### Passo 2: Selecione o Projeto
Projeto: **studio-8444859572-1c9a4**

### Passo 3: Vá em Firestore Database
No menu lateral: **Firestore Database**

### Passo 4: Adicione na Coleção roles_master
1. Clique em **"Iniciar coleção"** (ou abra a coleção se já existir)
2. Nome da coleção: `roles_master`
3. ID do documento: `wU4jJII35pZx8a6uiMinNsprT0u2` (seu UID)
4. Adicione estes campos:
   - `email` (string): `rafael@rafaelarruda.com`
   - `role` (string): `master`
   - `createdAt` (string): `2024-11-25T00:00:00.000Z`
5. Clique em **Salvar**

### Passo 5: Atualize a Coleção users
1. Vá na coleção **users**
2. Abra o documento: `wU4jJII35pZx8a6uiMinNsprT0u2`
3. Edite/adicione o campo:
   - `role` (string): `master`
4. Clique em **Salvar**

### Passo 6: Logout e Login
1. Volte para sua aplicação
2. Faça logout
3. Faça login novamente
4. Acesse **/admin**

---

## 🎯 Verificação

Após executar qualquer método acima, verifique:

1. ✅ Você consegue acessar **/admin**
2. ✅ Vê o botão **"Novo Usuário"**
3. ✅ Consegue criar novos usuários
4. ✅ Consegue editar e excluir usuários

---

## ⚡ Método 3: Atualizar Regras do Firestore (Temporário)

Se os métodos acima não funcionarem por problema de permissões, você pode liberar temporariamente:

1. Abra: `/firestore.rules`
2. Adicione esta regra TEMPORÁRIA:

```
// TEMPORÁRIO - Remover depois!
match /roles_master/{userId} {
  allow create: if request.auth.uid == userId;
}
```

3. Execute: `firebase deploy --only firestore:rules`
4. Use o Método 1 (Console do Navegador)
5. **IMPORTANTE**: Remova esta regra depois!

---

## 📱 Funcionalidades MASTER

Como MASTER você pode:
- ✅ Criar novos usuários (Master, Admin, Viewer)
- ✅ Editar todos os usuários
- ✅ Excluir usuários
- ✅ Alterar roles
- ✅ Exportar/Importar dados
- ✅ Ver detalhes de todos os usuários
- ✅ Acesso total ao sistema

---

## 🆘 Problemas?

### "Erro de permissão"
- Use o Método 2 (Firebase Console)
- Ou use o Método 3 (Atualizar regras temporariamente)

### "Documento não encontrado"
- Certifique-se de ter feito login ao menos uma vez
- Verifique se o UID está correto

### "Não vejo o botão Novo Usuário"
- Faça logout e login novamente
- Limpe o cache: Cmd+Shift+R (Mac) ou Ctrl+Shift+R (Windows)
- Verifique o console do navegador (F12) por erros

---

## 🎉 Pronto!

Após executar qualquer um dos métodos, você terá:
- ✅ Controle total do sistema
- ✅ Poder criar novos usuários
- ✅ Gerenciar todos os usuários
- ✅ Acesso ao painel admin completo
