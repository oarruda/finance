# Configuração de Variáveis de Ambiente no Firebase App Hosting

## Problema
Erro 500 ao reenviar credenciais ou trocar senha:
```
Could not load the default credentials
```

## Causa
As credenciais do Firebase Admin SDK não estão configuradas no ambiente de produção do Firebase App Hosting.

## Solução

### 1. Acessar o Console do Firebase
1. Vá para [Firebase Console](https://console.firebase.google.com)
2. Selecione o projeto: **studio-8444859572-1c9a4**
3. No menu lateral, clique em **App Hosting** (ou **Hosting**)
4. Selecione seu backend/aplicativo

### 2. Configurar Variáveis de Ambiente

#### Opção A: Via Console do Firebase (RECOMENDADO)
1. Na página do App Hosting, vá para **Settings** ou **Configurações**
2. Procure por **Environment Variables** ou **Variáveis de Ambiente**
3. Adicione as seguintes variáveis:

```
GOOGLE_API_KEY=AIzaSyCMuGt4eK2Wyam1LyKGv4TjvkshLWBFLlM
RESEND_API_KEY=[sua_chave_resend_aqui]
NEXT_PUBLIC_FIREBASE_PROJECT_ID=studio-8444859572-1c9a4
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@studio-8444859572-1c9a4.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCvGfIu5laKgpgC
jrs7SWiKKoz2JfN7wTSOj719VN8PZR0cbUx0r1ZTVJOQ81MoA22FBtgmfnruZ8cY
6/TyPZmZAnEC4T1vHmztFLLcAEUwKExF9G3oiH1v/dI0A2NZO39+4MqIW/WeeJAy
XEmo6VFPTwGMEE9cSk6jeoFEiJzJJqvwRWAt6CNKWbF2JoplfZIZE3Jvm6Z/Sg2r
gcxPmaVYyqzkvuQ+HY4Y3M1Mt1tJ8LEW+/+9pVsmBylv/FNUT84JBg2A8UD/Qdq9
GDnitLdkMnqBg2j5OXSq+TOqwBwPbdMDzS1sMWE3i5C73Bapz5tOL4vfH2SNuRAX
7o8EjSDrAgMBAAECggEAUdsSQWSCflvQjhmFY5DMoxKDNSrGqUrHtAF0NtvvLvY4
5qodvMqe03PNTEzDygfYMgDiGRS1iS/QflEIABpV7JacmBkNrB2QFEDB4GDr9zhP
d8BthPARm8IPeys+TV+oGXsikx5SM1PvLOvBr4nq7eVkNsMFJoLCQmApgA1RJiL8
8uKjrUXjDFMT9GHFjPBxGxuCzbgEA6R/+VzbFdk60qnGX7eATEEiytnilu2Z/hhg
3cAhS9F2eKxqMHWDkx1rO3hzJW1eoODlRZpVr8pA+bUXzifTBw9u4ot6QMV54faC
Dm9QADbrg8n7Sf0fcUx/zr5gF3yiX8oNCGacDEIJGQKBgQDWw+kBXKbsJA7RpcJ4
BfZgmnfymnqfZnh0Q/vk/Q4kZkz4S6cWTHehHieWVi10TfIdZndmDcQY/s73liiw
8GPEEMmoD/j40xR/0Wv/GAHVJlEsa2Ce2oBVzJlbwu29uFRFhWRtOzqKdK3w8RWl
FETwkosIahEY5nE+u0Sq1Dp/5QKBgQDQuHwI2j/Vgk6D3r+nMb8Cq/uzoP99ROIu
OWqkk/GqcY3qZcnrPeaKo4RDGO4U+lH1+qBmamTpZUV9eRFXqqE5v+t0rNXsBYKP
IewxFMhirkQ58lefVrZUhao+/6nWPm4OTPSxHwQxpHq/gMWUVTXC+tQX6vfnINjc
dpQLloXwjwKBgQC4FShtIGt7UNTa4ge0NPgfiYdyjPK6Gmz4yyTn+/fZP06OLNpF
BLotgdlQxQElBYKXrLJ+6SHCgvYHxc+PCh2ZewI+aaJwNQ0HGgxFlOBNQRCm0Er7
HjKOWFbDDmwVCCBDjrir3+6nqqdFNH/nBV6qDhHZ3oBVJYC/0mhjPJH/+QKBgA41
4UwBAAObYZkc21OY0XZvGy35sitnOzcGdbpK0FNYc98Xmw3HIyEhTOn8kokfGeFz
dORELiat3HNUgNfFKED0TiWddtsg7Oit2JTm41XEo6SGWWzhzHwotZSgd4G8smWK
28YLZI+0sR7Et68HtidWSIZwWvyDggBQmnfHgcsFAoGAK1gUvt45CEqwmOHB1vPA
+eRIKGwh08FcLS/nB1QxXT1cKBZ8DeclL818+inKUa1WZSh8qydh3tx5rPiWHMGv
WO3NBrEtYLVPAmPl/vwIDp4bRTo52ZFCBwi1J8x61+uauPFr1wiWf+oukktgwK7T
EEoI4O6VsiITgeClBwfot/U=
-----END PRIVATE KEY-----
```

**IMPORTANTE para FIREBASE_PRIVATE_KEY:**
- Cole a chave completa incluindo `-----BEGIN PRIVATE KEY-----` e `-----END PRIVATE KEY-----`
- Mantenha as quebras de linha (`\n`) no texto
- A chave deve ser uma string contínua com `\n` entre as linhas

#### Opção B: Via Firebase CLI
```bash
# Instalar Firebase CLI se necessário
npm install -g firebase-tools

# Fazer login
firebase login

# Configurar variáveis de ambiente
firebase apphosting:secrets:set GOOGLE_API_KEY
firebase apphosting:secrets:set RESEND_API_KEY
firebase apphosting:secrets:set FIREBASE_CLIENT_EMAIL
firebase apphosting:secrets:set FIREBASE_PRIVATE_KEY

# Variável pública (não secreta)
firebase apphosting:env:set NEXT_PUBLIC_FIREBASE_PROJECT_ID=studio-8444859572-1c9a4
```

### 3. Redesenhar a Aplicação
Após configurar as variáveis:

1. Via Console:
   - Clique em **Redeploy** ou **Reimplantar** no App Hosting

2. Via CLI:
   ```bash
   firebase deploy --only hosting
   ```

3. Via Git Push (se configurado com integração contínua):
   ```bash
   git add .
   git commit -m "Add environment variables configuration"
   git push
   ```

### 4. Verificar a Configuração
Após o deploy, teste as funcionalidades:
- ✅ Reenviar credenciais para usuário
- ✅ Trocar senha de usuário
- ✅ Deletar usuário
- ✅ Enviar email de teste

## Valores das Variáveis

| Variável | Valor | Tipo |
|----------|-------|------|
| `GOOGLE_API_KEY` | `AIzaSyCMuGt4eK2Wyam1LyKGv4TjvkshLWBFLlM` | Secret |
| `RESEND_API_KEY` | Configurar sua chave do Resend | Secret |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `studio-8444859572-1c9a4` | Public |
| `FIREBASE_CLIENT_EMAIL` | `firebase-adminsdk-fbsvc@studio-8444859572-1c9a4.iam.gserviceaccount.com` | Secret |
| `FIREBASE_PRIVATE_KEY` | (Chave RSA completa do arquivo acima) | Secret |

## Segurança

⚠️ **NUNCA** commite valores sensíveis diretamente no código ou no arquivo `apphosting.yaml`

✅ Use sempre o sistema de variáveis de ambiente do Firebase

✅ As variáveis marcadas como `Secret` devem ser configuradas via Console ou CLI

✅ Mantenha o arquivo `.env.local` no `.gitignore`

## Troubleshooting

### Erro persiste após configurar variáveis
1. Verifique se todas as 5 variáveis foram configuradas
2. Confirme que `FIREBASE_PRIVATE_KEY` está com formato correto (com `\n`)
3. Aguarde alguns minutos após o deploy
4. Limpe o cache do navegador
5. Verifique os logs no Firebase Console > Functions > Logs

### Chave privada com formato incorreto
Se o erro mencionar "invalid key format":
- Certifique-se de incluir `-----BEGIN PRIVATE KEY-----` e `-----END PRIVATE KEY-----`
- Mantenha `\n` entre as linhas (não quebras de linha reais)
- Não adicione espaços extras no início ou fim

### Como obter a chave privada novamente
1. Firebase Console > Project Settings (Configurações do Projeto)
2. Service Accounts (Contas de Serviço)
3. Generate New Private Key (Gerar Nova Chave Privada)
4. Baixar o arquivo JSON
5. Copiar os valores de `client_email` e `private_key`
