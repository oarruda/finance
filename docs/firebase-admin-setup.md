# Configuração do Firebase Admin SDK

## Por que configurar?

O Firebase Admin SDK é necessário para que a API de criação de usuários possa **escrever diretamente no Firestore** a partir do servidor. Sem isso, a API tenta usar a REST API do Firestore, que pode ter limitações de permissão.

## Problema Atual

Quando você cria um novo usuário através do painel de Admin, o usuário é criado no Firebase Authentication, mas o documento correspondente não é criado no Firestore `/users/{userId}`.

## Solução

Configure as credenciais do Firebase Admin SDK seguindo os passos abaixo:

### Passo 1: Obter as Credenciais

1. Acesse o [Firebase Console](https://console.firebase.google.com/)
2. Selecione seu projeto
3. Vá em **Project Settings** (ícone de engrenagem) > **Service Accounts**
4. Clique em **Generate New Private Key**
5. Um arquivo JSON será baixado

### Passo 2: Extrair as Credenciais

Abra o arquivo JSON baixado. Você precisará de dois valores:

```json
{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com",
  ...
}
```

### Passo 3: Adicionar ao .env

Adicione estas linhas ao seu arquivo `.env` na raiz do projeto:

```env
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"
```

**IMPORTANTE:**
- A `FIREBASE_PRIVATE_KEY` deve estar entre aspas duplas
- Mantenha os `\n` na chave (quebras de linha)
- Não compartilhe essas credenciais publicamente

### Passo 4: Reiniciar o Servidor

Após adicionar as credenciais, reinicie o servidor de desenvolvimento:

```bash
npm run dev
```

## Verificação

Após configurar, tente criar um novo usuário pelo painel de Admin. O sistema irá:

1. Criar o usuário no Firebase Authentication
2. Criar automaticamente o documento em `/users/{userId}` no Firestore
3. Se o role for `master` ou `admin`, criar também em `/roles_master/{userId}` ou `/roles_admin/{userId}`

Se ainda houver problemas, verifique o console do servidor para mensagens de erro detalhadas.

## Alternativa (Desenvolvimento)

Se você não quiser configurar as credenciais agora, a API tentará usar a REST API do Firestore como fallback. Porém, isso pode não funcionar devido às permissões de segurança do Firestore.

## Segurança

⚠️ **NUNCA** faça commit do arquivo `.env` ou das credenciais no Git!

O arquivo `.env` já está no `.gitignore`, mas verifique antes de fazer push.
