# 💰 Sistema de Gestão Financeira

Sistema completo de gestão financeira construído com Next.js 15, Firebase, e inteligência artificial.

## 🚀 Funcionalidades

### 👥 Gestão de Usuários
- **3 Níveis de Acesso**: MASTER, ADMIN, VIEWER
- **Avatares Personalizados**: 20 ícones Font Awesome estilizados
- **Email Automático**: Credenciais enviadas por email para novos usuários
- **Perfis Completos**: Informações pessoais, endereço, preferências

### 💸 Gestão Financeira
- **Dashboard Interativo**: Visão geral de receitas e despesas
- **Transações**: Adicionar, editar, categorizar transações
- **Integração Wise**: Importar transações automaticamente
- **Gráficos e Relatórios**: Visualização de tendências de gastos

### 🤖 Inteligência Artificial
- **Categorização Automática**: Sugestões de categorias para transações
- **Análise de Gastos**: Resumos e insights sobre padrões financeiros
- **Taxas de Câmbio**: Busca automática de taxas para transações Wise

### ⚙️ Configurações
- **Perfil Pessoal**: Configurações individuais de cada usuário
- **Configurações de Sistema**: APIs e integrações (apenas MASTER)
- **Múltiplos Provedores de IA**: Gemini, OpenAI, Anthropic

## 📦 Tecnologias

- **Framework**: Next.js 15.3.3 com Turbopack
- **Banco de Dados**: Firebase Firestore
- **Autenticação**: Firebase Authentication
- **IA**: Google Genkit
- **Email**: Resend
- **UI**: Tailwind CSS, shadcn/ui, Font Awesome
- **Linguagem**: TypeScript

## 🛠️ Instalação

1. Clone o repositório:
   ```bash
   git clone <repository-url>
   cd finance
   ```

2. Instale as dependências:
   ```bash
   npm install
   ```

3. Configure as variáveis de ambiente:
   ```bash
   cp .env.local.example .env.local
   # Edite .env.local com suas credenciais
   ```

4. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

5. Acesse: http://localhost:9002

## 📧 Configuração de Email

Para habilitar o envio automático de emails para novos usuários:

1. **Crie uma conta no [Resend](https://resend.com)**
2. **Obtenha sua API key**
3. **Configure no `.env.local`**:
   ```env
   RESEND_API_KEY=re_sua_api_key
   RESEND_FROM_EMAIL=Sistema Financeiro <onboarding@resend.dev>
   NEXT_PUBLIC_APP_URL=http://localhost:9002
   ```

📖 **Documentação completa**: [docs/EMAIL-SETUP.md](./docs/EMAIL-SETUP.md)

## 👤 Primeiro Acesso

### Tornando-se MASTER

Veja: [COMO-SER-MASTER.md](./COMO-SER-MASTER.md)

## 📂 Estrutura do Projeto

```
finance/
├── src/
│   ├── app/              # Páginas Next.js
│   │   ├── (auth)/       # Páginas autenticadas
│   │   ├── api/          # API routes
│   │   ├── profile/      # Configurações pessoais
│   │   └── system-settings/ # Configurações de sistema
│   ├── components/       # Componentes React
│   │   ├── ui/           # Componentes shadcn/ui
│   │   ├── emails/       # Templates de email
│   │   ├── admin/        # Componentes admin
│   │   └── dashboard/    # Componentes dashboard
│   ├── firebase/         # Configuração Firebase
│   ├── hooks/            # Custom hooks
│   ├── lib/              # Utilitários
│   └── types/            # TypeScript types
├── docs/                 # Documentação
└── scripts/              # Scripts auxiliares
```

## 🔐 Permissões

### MASTER
- ✅ Controle total do sistema
- ✅ Criar/editar/deletar usuários
- ✅ Configurar APIs e integrações
- ✅ Acesso a todas as funcionalidades

### ADMIN
- ✅ Gerenciar transações
- ✅ Ver relatórios
- ✅ Editar categorias
- ❌ Não pode gerenciar usuários
- ❌ Não pode alterar configurações de sistema

### VIEWER
- ✅ Visualizar dashboard
- ✅ Ver transações
- ❌ Não pode editar nada
- ❌ Acesso somente leitura

## 🎨 Avatares

Sistema de avatares personalizados com 20 ícones Font Awesome:
- 👤 User, User Tie, User Ninja, User Astronaut
- 🎓 User Graduate, User Doctor, User Secret
- 🎭 User Injured, User Chef, User Cowboy
- E mais 10 opções!

Cada usuário escolhe seu avatar no perfil.

## 📊 Features em Destaque

### Email Automático para Novos Usuários
Quando o MASTER cria um novo usuário, o sistema automaticamente:
1. Cria conta no Firebase Auth
2. Cria documento no Firestore
3. Envia email com:
   - Link para login
   - Email de acesso
   - Senha temporária
   - Aviso de segurança

### Perfis Separados
- **Perfil Pessoal** (`/profile`): Todos os usuários
  - Avatar, nome, email
  - Telefones, endereço, CPF
  - Moeda e idioma preferido
  
- **Configurações de Sistema** (`/system-settings`): Apenas MASTER
  - Provedor de IA (Gemini, OpenAI, Anthropic)
  - API keys (IA, Wise, C6 Bank, Exchange Rate)
  - Configurações globais

## 🚀 Deploy

### Firebase Hosting

```bash
npm run build
firebase deploy
```

### Vercel

```bash
vercel --prod
```

Certifique-se de configurar as variáveis de ambiente no painel de deploy.

## 📝 Scripts Disponíveis

- `npm run dev` - Servidor de desenvolvimento (porta 9002)
- `npm run build` - Build de produção
- `npm run start` - Servidor de produção
- `npm run lint` - Lint do código
- `npm run typecheck` - Verificação de tipos TypeScript
- `npm run genkit:dev` - Servidor Genkit
- `npm run genkit:watch` - Genkit em modo watch

## 🐛 Troubleshooting

### Email não enviado
Ver: [docs/EMAIL-SETUP.md](./docs/EMAIL-SETUP.md)

### Erros de autenticação
Verificar configuração do Firebase em `src/firebase/config.ts`

### Problemas com IA
Verificar API keys em Configurações de Sistema

## 📄 Licença

Proprietary - Todos os direitos reservados

## 🤝 Contribuindo

Este é um projeto privado. Entre em contato com os mantenedores para contribuir.

---

**Desenvolvido com ❤️ usando Next.js e Firebase**
