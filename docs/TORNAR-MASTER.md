# 👑 Como Tornar rafael@rafaelarruda.com MASTER

## Método 1: Firebase Console (Recomendado)

### Passo 1: Acessar Firebase Console

1. Acesse: https://console.firebase.google.com
2. Selecione o projeto: **studio-8444859572-1c9a4**
3. No menu lateral, clique em **Firestore Database**

### Passo 2: Encontrar o UID do Usuário

1. No menu lateral, vá em **Authentication** > **Users**
2. Procure por: **rafael@rafaelarruda.com**
3. **Copie o UID** (User UID) - é uma string como: `AbCdEf123456...`

### Passo 3: Adicionar na Coleção roles_master

1. Volte para **Firestore Database**
2. Procure a coleção **roles_master**
   - Se não existir, clique em **+ Start collection** e crie **roles_master**
3. Clique em **+ Add document**
4. No campo **Document ID**, cole o **UID** que você copiou
5. Adicione os seguintes campos:
   - Campo: `email` | Tipo: string | Valor: `rafael@rafaelarruda.com`
   - Campo: `role` | Tipo: string | Valor: `master`
   - Campo: `createdAt` | Tipo: string | Valor: `2025-12-13T00:00:00.000Z`
6. Clique em **Save**

### Passo 4: Atualizar o Perfil do Usuário

1. Ainda no **Firestore Database**
2. Abra a coleção **users**
3. Procure o documento com o **UID** do rafael@rafaelarruda.com
4. Clique no documento para editar
5. Encontre o campo **role** ou adicione se não existir:
   - Campo: `role` | Tipo: string | Valor: `master`
6. Adicione ou atualize:
   - Campo: `updatedAt` | Tipo: string | Valor: (data atual)
7. Clique em **Update** (ou Save)

### Passo 5: Fazer Logout e Login

1. No seu sistema, faça **logout**
2. Faça **login** novamente com rafael@rafaelarruda.com
3. Agora você terá acesso completo como MASTER! 👑

---

## Método 2: Via Script (Alternativo)

Se você tiver acesso ao Firebase Admin SDK com Service Account:

### 1. Obter Service Account Key

1. Acesse: https://console.firebase.google.com
2. Vá em **Project Settings** > **Service Accounts**
3. Clique em **Generate new private key**
4. Salve o arquivo JSON

### 2. Configurar no .env.local

Adicione ao arquivo `.env.local`:

```env
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"studio-8444859572-1c9a4",...}
```

(Cole todo o conteúdo do JSON em uma única linha)

### 3. Executar Script

```bash
node scripts/set-master-by-email.js rafael@rafaelarruda.com
```

---

## Verificação

Para confirmar que funcionou:

1. Faça login no sistema
2. Vá para: http://localhost:9002/admin
3. Se aparecer a página de gerenciamento de usuários = ✅ SUCESSO!
4. Se aparecer "Acesso Negado" = ❌ Ainda não é MASTER

---

## Estrutura no Firestore

Após configuração, você deve ter:

### Coleção: `roles_master`
```
roles_master/
  └── {UID_DO_RAFAEL}/
      ├── email: "rafael@rafaelarruda.com"
      ├── role: "master"
      └── createdAt: "2025-12-13T00:00:00.000Z"
```

### Coleção: `users`
```
users/
  └── {UID_DO_RAFAEL}/
      ├── email: "rafael@rafaelarruda.com"
      ├── name: "Rafael"
      ├── role: "master"  ← IMPORTANTE
      └── ...outros campos...
```

---

## Troubleshooting

### ❌ "Acesso Negado" mesmo após configurar

**Solução:**
1. Verifique se o UID está correto em ambas as coleções
2. Confirme que o campo `role` no perfil está como `master` (minúsculo)
3. Faça logout completo e login novamente
4. Limpe o cache do navegador

### ❌ Coleção roles_master não existe

**Solução:**
1. Crie manualmente no Firebase Console
2. Clique em "Start collection"
3. Nome: `roles_master`
4. Adicione o primeiro documento com seu UID

### ❌ Não consigo encontrar meu UID

**Solução:**
1. Vá em Authentication > Users
2. A coluna "User UID" mostra o UID de cada usuário
3. Ou execute no console do navegador (quando logado):
   ```javascript
   firebase.auth().currentUser.uid
   ```

---

## Comandos Úteis

### Ver todos os Masters atuais
```bash
node scripts/list-masters.js
```

### Remover role MASTER
```bash
node scripts/remove-master.js EMAIL
```

### Adicionar outro MASTER
```bash
node scripts/set-master-by-email.js outro@email.com
```

---

**Data:** 13 de Dezembro de 2025  
**Versão:** 1.0
