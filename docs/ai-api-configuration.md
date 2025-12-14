# Configuração de Chave de API de IA

## Visão Geral

A aplicação agora suporta duas formas de configurar a chave de API do Google Gemini:

1. **Via Variáveis de Ambiente** (`.env.local`)
2. **Via Interface de Sistema** (System Settings)

## Método 1: Variáveis de Ambiente (Recomendado para Desenvolvimento)

1. Gere uma nova chave em: https://aistudio.google.com/app/apikey
2. Abra o arquivo `.env.local` na raiz do projeto
3. Adicione sua chave:
   ```
   GOOGLE_API_KEY=sua_chave_aqui
   ```
4. Salve o arquivo
5. Reinicie o servidor de desenvolvimento

## Método 2: Via Interface de Sistema (Recomendado para Produção)

1. Acesse http://localhost:9002/system-settings (apenas usuários MASTER)
2. Na seção **Configurações de IA**:
   - Selecione o provedor (Google Gemini)
   - Insira sua chave de API no campo **Chave de API da IA**
3. Clique em **Salvar Configurações**
4. Na mesma seção, clique no botão **Carregar Chave de API**
5. Você verá uma mensagem de sucesso quando a chave estiver carregada

## Segurança

⚠️ **IMPORTANTE:**

- A chave `.env.local` é **automaticamente ignorada** pelo git (configurado em `.gitignore`)
- Quando salva via interface de sistema, a chave é armazenada no **Firestore** de forma encriptada
- A chave carregada na sessão é armazenada em **localStorage** do navegador
- **Nunca** commit a chave real ao repositório git

## Prioridade de Carregamento

O sistema tenta carregar a chave na seguinte ordem:

1. Variáveis de ambiente (`GEMINI_API_KEY` ou `GOOGLE_API_KEY`)
2. localStorage (quando carregada via interface)
3. Nenhuma chave disponível (IA desativada)

## Troubleshooting

### Erro: "Your API key was reported as leaked"

Se receber este erro:
1. Revogue a chave atual em: https://console.cloud.google.com/apis/credentials
2. Gere uma nova chave
3. Atualize a chave em `.env.local` ou via System Settings

### A IA não funciona depois de salvar a chave

1. Verifique se a chave está correta
2. Vá para http://localhost:9002/system-settings
3. Clique no botão **Carregar Chave de API**
4. Recarregue a página

### Remover a chave da sessão

Na página System Settings, clique em **Remover da sessão** para limpar a chave do localStorage.

## Arquivos Envolvidos

- `.env.local` - Variáveis de ambiente locais (ignoradas pelo git)
- `.env.local.example` - Exemplo de configuração
- `src/ai/genkit.ts` - Configuração do Genkit com suporte a carregamento dinâmico
- `src/ai/get-api-key.ts` - Funções de gerenciamento de chave
- `src/components/ai-api-key-loader.tsx` - Componente UI para carregar chave
- `src/app/system-settings/page.tsx` - Página de configurações de sistema
