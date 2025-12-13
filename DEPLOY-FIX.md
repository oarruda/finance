# Comandos para Aplicar Correções

## Problema Identificado
As regras do Firestore estavam bloqueando a criação de documentos de usuário quando um MASTER cria um usuário para outra pessoa.

## Correções Aplicadas

### 1. Firestore Rules
Atualizada a regra em `firestore.rules` para permitir que MASTER crie documentos de usuários:

```
allow create: if isOwner(userId) || isMaster();
```

### 2. API Route
Simplificada a API em `src/app/api/admin/create-user/route.ts` para usar o Firebase Client SDK diretamente, que é mais confiável.

## Comandos para Executar

### 1. Implantar as Novas Regras do Firestore
```bash
cd finance
firebase deploy --only firestore:rules
```

### 2. Reiniciar o Servidor de Desenvolvimento
```bash
# No terminal do servidor (Ctrl+C para parar)
npm run dev
```

## Teste

Após executar os comandos acima:

1. Acesse o painel de Admin
2. Tente criar um novo usuário
3. Verifique se o documento foi criado em `/users/{userId}` no Firestore Console

## Verificação no Firestore Console

1. Abra o [Firebase Console](https://console.firebase.google.com/)
2. Selecione seu projeto
3. Vá em **Firestore Database**
4. Navegue até a coleção `users`
5. Verifique se o novo usuário aparece lá

---

**Observação**: As mudanças nas regras do Firestore levam alguns segundos para serem aplicadas após o deploy.
