# 🔑 Firebase Admin SDK - Credenciais

## Por que preciso disso?

O Firebase Admin SDK é necessário para criar usuários via API (server-side). Ele precisa de credenciais especiais chamadas **Service Account**.

## 📥 Como obter as credenciais

### Opção 1: Arquivo JSON (Recomendado)

1. Acesse o [Firebase Console](https://console.firebase.google.com/)
2. Selecione seu projeto: **familyfinancetracker-84c48**
3. Clique no ícone de **⚙️ Configurações** > **Configurações do projeto**
4. Vá para a aba **Contas de serviço**
5. Clique em **Gerar nova chave privada**
6. Um arquivo JSON será baixado (ex: `familyfinancetracker-84c48-firebase-adminsdk-xxxxx.json`)

### Opção 2: Google Cloud CLI (Alternativa)

Se você já tem o Firebase CLI instalado:

```bash
# Fazer login
gcloud auth application-default login

# Ou definir a variável de ambiente
export GOOGLE_APPLICATION_CREDENTIALS="/caminho/para/serviceAccountKey.json"
```

## 🔧 Como configurar no projeto

### Método 1: Variável de Ambiente (Mais Seguro)

1. Copie o conteúdo do arquivo JSON baixado
2. Crie um arquivo `.env.local` na raiz do projeto:

```bash
# .env.local
FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account","project_id":"familyfinancetracker-84c48",...}'
```

**Ou use credenciais individuais:**

```bash
# .env.local
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@familyfinancetracker-84c48.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIE...xxxxx\n-----END PRIVATE KEY-----\n"
```

### Método 2: Application Default Credentials (Desenvolvimento)

Se você já está autenticado com o Firebase CLI:

```bash
# Fazer login com suas credenciais do Google
gcloud auth application-default login

# Reiniciar o servidor
npm run dev
```

## ⚠️ Segurança

### ✅ FAZER:
- Usar variáveis de ambiente (`.env.local`)
- Adicionar `.env.local` ao `.gitignore`
- Usar Firebase App Hosting Secrets em produção
- Rotacionar chaves periodicamente

### ❌ NÃO FAZER:
- Nunca commitar o arquivo JSON no Git
- Nunca expor as credenciais publicamente
- Nunca usar credenciais de produção em desenvolvimento

## 🚀 Após configurar

1. Reinicie o servidor de desenvolvimento:
```bash
npm run dev
```

2. Teste criando um usuário na página de Admin

## 🔍 Verificação

Se tudo estiver correto, você verá no console:

```
✓ Ready in 2.3s
○ Compiling / ...
✓ Compiled / in 1.2s
Inicializando Firebase Admin com Application Default Credentials
```

Se der erro, você verá:

```
Firebase Admin initialization failed: Error: Could not load the default credentials
```

## 📚 Documentação Oficial

- [Firebase Admin SDK Setup](https://firebase.google.com/docs/admin/setup)
- [Service Accounts](https://cloud.google.com/iam/docs/service-accounts)
- [Application Default Credentials](https://cloud.google.com/docs/authentication/application-default-credentials)

## 🆘 Problemas Comuns

### "Could not load the default credentials"
**Solução:** Configure as variáveis de ambiente ou faça login com `gcloud auth`

### "Permission denied"
**Solução:** Verifique se o Service Account tem as permissões corretas no Firebase Console

### "Invalid key format"
**Solução:** Certifique-se de que a chave privada está com `\n` preservados ou use JSON completo

## ✅ Checklist

- [ ] Baixei o arquivo JSON do Firebase Console
- [ ] Criei `.env.local` com as credenciais
- [ ] Adicionei `.env.local` ao `.gitignore`
- [ ] Reiniciei o servidor (`npm run dev`)
- [ ] Testei criar um usuário na página Admin
