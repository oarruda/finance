# Next.js GitHub Pages

Este projeto está configurado para deploy no GitHub Pages.

## Configuração

1. **Ative GitHub Pages no repositório:**
   - Vá em `Settings` > `Pages`
   - Em `Source`, selecione `GitHub Actions`

2. **Configure os Secrets:**
   - Vá em `Settings` > `Secrets and variables` > `Actions`
   - Adicione os seguintes secrets:
     - `NEXT_PUBLIC_FIREBASE_API_KEY`
     - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
     - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
     - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
     - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
     - `NEXT_PUBLIC_FIREBASE_APP_ID`

3. **Push para o branch main:**
   ```bash
   git add .
   git commit -m "Configure GitHub Pages"
   git push origin main
   ```

## URL do Projeto

Após o deploy, seu projeto ficará disponível em:
```
https://[seu-usuario].github.io/finance/
```

## Limitações do GitHub Pages

⚠️ **IMPORTANTE**: GitHub Pages serve apenas arquivos estáticos. Algumas funcionalidades não funcionarão:

- ❌ API Routes (`/api/*`)
- ❌ Server-side rendering dinâmico
- ❌ Otimização de imagens do Next.js
- ❌ Algumas funcionalidades que dependem de servidor

Para funcionalidade completa, considere:
- **Firebase Hosting** (Recomendado - já configurado)
- **Vercel** (Gratuito)
- **Netlify** (Também gratuito)
