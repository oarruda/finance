# 📧 Configuração de Email para Novos Usuários

## Visão Geral

Quando um usuário MASTER cria um novo usuário no sistema, um email automático é enviado com:
- 🔗 Link para a página de login
- 📧 Email de acesso
- 🔐 Senha temporária

## 🚀 Como Configurar

### 1. Criar Conta no Resend

1. Acesse [https://resend.com](https://resend.com)
2. Crie uma conta gratuita
3. Confirme seu email

### 2. Obter API Key

1. Faça login no Resend
2. Vá para [API Keys](https://resend.com/api-keys)
3. Clique em "Create API Key"
4. Dê um nome (ex: "Finance System Production")
5. Copie a API key (começa com `re_`)

### 3. Configurar Variáveis de Ambiente

Abra o arquivo `.env.local` e adicione:

```env
# Resend Email Service
RESEND_API_KEY=re_sua_api_key_aqui

# Email remetente (para teste use onboarding@resend.dev)
RESEND_FROM_EMAIL=Sistema Financeiro <onboarding@resend.dev>

# URL da aplicação (ajuste para produção)
NEXT_PUBLIC_APP_URL=http://localhost:9002
```

### 4. Verificar Domínio (Opcional - Para Produção)

Para usar seu próprio domínio em produção:

1. No Resend, vá para [Domains](https://resend.com/domains)
2. Clique em "Add Domain"
3. Digite seu domínio (ex: `seudominio.com`)
4. Configure os registros DNS conforme instruções
5. Aguarde verificação (geralmente alguns minutos)
6. Atualize o `.env.local`:
   ```env
   RESEND_FROM_EMAIL=Sistema Financeiro <noreply@seudominio.com>
   ```

## 📋 Planos do Resend

### Plano Gratuito
- ✅ 100 emails/dia
- ✅ 3,000 emails/mês
- ✅ Perfeito para desenvolvimento e pequenos times
- ✅ Suporte por email

### Planos Pagos
- 💰 A partir de $20/mês
- 📧 50,000 emails/mês
- 🚀 Limites maiores
- 💬 Suporte prioritário

## 🧪 Como Testar

### 1. Reiniciar o Servidor

Após configurar as variáveis de ambiente:

```bash
# Pare o servidor (Ctrl+C)
# Inicie novamente
npm run dev
```

### 2. Criar Usuário de Teste

1. Faça login como MASTER
2. Vá para a página Admin
3. Clique em "Novo Usuário"
4. Preencha os dados com um email real seu
5. Clique em "Criar Usuário"
6. Verifique sua caixa de entrada

### 3. Verificar Email

O email deve conter:
- ✅ Nome do usuário
- ✅ Email de login
- ✅ Senha temporária
- ✅ Botão "Acessar Sistema"
- ✅ Aviso de segurança

## 🔍 Troubleshooting

### Email não chegou?

1. **Verifique o console do servidor**
   - Deve aparecer "Email enviado com sucesso"
   - Se aparecer erro, verifique a API key

2. **Verifique spam/lixo eletrônico**
   - Emails do Resend podem ir para spam inicialmente

3. **Verifique a API key**
   ```bash
   # No terminal do servidor, deve aparecer:
   # "Email enviado com sucesso: { id: 'xxxxx' }"
   ```

4. **Teste a API key diretamente**
   ```bash
   curl -X POST https://api.resend.com/emails \
     -H 'Authorization: Bearer re_sua_api_key' \
     -H 'Content-Type: application/json' \
     -d '{
       "from": "onboarding@resend.dev",
       "to": "seuemail@exemplo.com",
       "subject": "Teste",
       "html": "<p>Teste</p>"
     }'
   ```

### Erro "RESEND_API_KEY não configurada"

- Certifique-se de que adicionou a variável no `.env.local`
- Reinicie o servidor após adicionar a variável
- Verifique se não há espaços extras

### Erro "Email not verified"

- Use `onboarding@resend.dev` para teste
- Ou configure seu próprio domínio conforme seção 4

## 📊 Monitoramento

### Ver Emails Enviados

1. Faça login no [Resend Dashboard](https://resend.com/emails)
2. Veja lista de todos os emails enviados
3. Clique em um email para ver detalhes:
   - Status de entrega
   - Horário de envio
   - Conteúdo HTML
   - Logs de erro

### Webhooks (Opcional)

Configure webhooks para receber notificações de:
- Emails entregues
- Emails abertos
- Emails com bounce
- Erros de envio

## 🔐 Segurança

### Boas Práticas

1. **Nunca commite a API key no Git**
   - O `.env.local` já está no `.gitignore`

2. **Use diferentes API keys para ambientes**
   - Desenvolvimento: uma key
   - Produção: outra key

3. **Rotacione as keys periodicamente**
   - Crie nova key no Resend
   - Atualize `.env.local`
   - Delete key antiga

4. **Monitore uso**
   - Verifique dashboard regularmente
   - Configure alertas de limite

## 📝 Template do Email

O template está em: `src/components/emails/welcome-email.tsx`

### Personalizações Possíveis

- 🎨 Cores e gradientes
- 📝 Texto e mensagens
- 🖼️ Logo da empresa
- 🔗 Links adicionais
- 🌐 Idiomas (i18n)

### Exemplo de Customização

```tsx
// src/components/emails/welcome-email.tsx
const header = {
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  // Altere para as cores da sua marca
}
```

## 🌐 Produção

### Checklist de Deploy

- [ ] Domínio verificado no Resend
- [ ] `RESEND_FROM_EMAIL` atualizado com seu domínio
- [ ] `NEXT_PUBLIC_APP_URL` apontando para URL de produção
- [ ] API key de produção configurada
- [ ] Testes de email realizados
- [ ] Monitoramento configurado

### Variáveis de Ambiente de Produção

```env
RESEND_API_KEY=re_sua_production_key
RESEND_FROM_EMAIL=Sistema Financeiro <noreply@seudominio.com>
NEXT_PUBLIC_APP_URL=https://seu-dominio.com
```

## 📚 Documentação Adicional

- [Resend Docs](https://resend.com/docs)
- [Resend API Reference](https://resend.com/docs/api-reference)
- [React Email Components](https://react.email/docs/introduction)

## 🆘 Suporte

Se encontrar problemas:

1. Verifique os logs do servidor
2. Consulte o [Resend Status](https://status.resend.com)
3. Veja os [exemplos do Resend](https://resend.com/docs/examples)
4. Entre em contato com suporte do Resend

---

**Implementado por:** GitHub Copilot
**Data:** 2024
**Versão:** 1.0
