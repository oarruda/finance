# Guia: Configurar Rafael Arruda como MASTER

## Método 1: Firebase Console (RECOMENDADO - Mais Simples)

### Passo 1: Obter o UID do usuário
1. Acesse: https://console.firebase.google.com
2. Selecione o projeto: `studio-8444859572-1c9a4`
3. Vá em **Authentication** > **Users**
4. Procure por `rafael@rafaelarruda.com`
5. **Copie o User UID** (exemplo: wU4jJII35pZx8a6uiMinNsprT0u2)

### Passo 2: Criar role de MASTER
1. Ainda no Firebase Console, vá em **Firestore Database**
2. Clique em **Start collection** (ou adicione uma nova collection)
3. Collection ID: `roles_master`
4. Document ID: **Cole o UID copiado**
5. Adicione os campos:
   ```
   email: rafael@rafaelarruda.com
   addedAt: [timestamp atual]
   addedBy: setup-manual
   name: Rafael Arruda
   ```
6. Clique em **Save**

### Passo 3: Atualizar perfil do usuário
1. Na mesma tela do Firestore
2. Vá para collection `users`
3. Se não existir, crie um documento com ID = **UID copiado**
4. Se já existir, clique no documento
5. Adicione/atualize os campos:
   ```
   id: [seu UID]
   email: rafael@rafaelarruda.com
   name: Rafael Arruda
   role: master
   avatarUrl: https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop
   ```
6. Clique em **Update** ou **Save**

### Passo 4: Fazer deploy das regras
1. Abra o terminal na pasta do projeto
2. Execute:
   ```bash
   firebase deploy --only firestore:rules
   ```

### Passo 5: Testar
1. Faça logout do app
2. Faça login novamente com `rafael@rafaelarruda.com`
3. Acesse a página `/admin`
4. Você deve conseguir ver e gerenciar todos os usuários!

---

## Método 2: Script Node.js

### Pré-requisitos
```bash
npm install firebase
```

### Executar
1. Abra o arquivo `scripts/setup-master.js`
2. **IMPORTANTE**: Edite a linha da senha:
   ```javascript
   const MASTER_PASSWORD = 'SUA_SENHA_AQUI'; // Coloque sua senha real
   ```
3. Execute:
   ```bash
   node scripts/setup-master.js
   ```

---

## Método 3: Direto no Código (Desenvolvimento Local)

Se estiver em ambiente de desenvolvimento, você pode temporariamente usar dados mockados.

Edite `src/lib/data.ts`:
```typescript
export const users: User[] = [
  {
    id: 'wU4jJII35pZx8a6uiMinNsprT0u2', // Seu UID real
    name: 'Rafael Arruda',
    email: 'rafael@rafaelarruda.com',
    role: 'master',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
  },
  // ... outros usuários
];
```

---

## Verificação

Após configurar, verifique se funcionou:

1. **No Firebase Console**:
   - ✅ Existe documento em `/roles_master/{seu-uid}`
   - ✅ Existe documento em `/users/{seu-uid}` com `role: "master"`

2. **No App**:
   - ✅ Consegue acessar `/admin`
   - ✅ Consegue ver dropdown de roles (Master/Admin/Viewer)
   - ✅ Consegue alterar roles de outros usuários

3. **No Console do Browser** (F12):
   ```javascript
   // Abra o console e digite:
   console.log(user.uid); // Deve mostrar seu UID
   ```

---

## Troubleshooting

### "Permission Denied"
- Certifique-se que fez deploy das regras: `firebase deploy --only firestore:rules`
- Verifique se o documento existe em `roles_master`

### "User not found"
- Verifique se você já criou uma conta com esse email
- Vá em Authentication > Users no Firebase Console

### Script não funciona
- Verifique a senha no script
- Confirme que você tem Firebase instalado: `npm install firebase`
- Tente o Método 1 (Firebase Console) em vez disso

---

## Seu UID Atual

Com base no erro anterior, seu UID é:
```
wU4jJII35pZx8a6uiMinNsprT0u2
```

Use este UID nos passos acima! 👆
