# Guia: Como se Tornar Usuário MASTER

Este guia mostra como configurar seu usuário existente como MASTER para ter controle total do sistema.

## Método 1: Usando o Script (Recomendado)

### Passo 1: Obter seu UID

1. Acesse o [Firebase Console](https://console.firebase.google.com)
2. Selecione o projeto: **studio-8444859572-1c9a4**
3. Vá em **Authentication** > **Users**
4. Procure pelo seu email: **rafael@rafaelarruda.com**
5. Copie o **UID** (User UID)

### Passo 2: Executar o Script

No terminal, execute:

```bash
cd /Users/rafaelarruda/Desktop/Projetos-Ti/finance
node scripts/add-master-role-by-uid.js SEU_UID_AQUI
```

Substitua `SEU_UID_AQUI` pelo UID que você copiou.

### Exemplo:
```bash
node scripts/add-master-role-by-uid.js abc123xyz456
```

## Método 2: Manualmente no Firebase Console

### Passo 1: Adicionar na Coleção roles_master

1. Acesse o [Firebase Console](https://console.firebase.google.com)
2. Vá em **Firestore Database**
3. Clique em **+ Iniciar coleção**
4. Nome da coleção: `roles_master`
5. ID do documento: Cole seu **UID** aqui
6. Adicione os campos:
   - Campo: `email` | Tipo: string | Valor: `rafael@rafaelarruda.com`
   - Campo: `role` | Tipo: string | Valor: `master`
   - Campo: `createdAt` | Tipo: string | Valor: `2024-11-25T00:00:00.000Z`

### Passo 2: Atualizar Documento do Usuário

1. Na mesma tela do Firestore Database
2. Vá na coleção **users**
3. Encontre o documento com seu UID
4. Clique para editar
5. Adicione/atualize o campo:
   - Campo: `role` | Tipo: string | Valor: `master`

## Método 3: Usando o Firebase CLI (Avançado)

Se você tem o Firebase CLI configurado:

```bash
# Login no Firebase
firebase login

# Acessar o Firestore
firebase firestore:shell

# Adicionar role master (substitua SEU_UID pelo seu UID real)
db.collection('roles_master').doc('SEU_UID').set({
  email: 'rafael@rafaelarruda.com',
  role: 'master',
  createdAt: new Date().toISOString()
})

# Atualizar perfil do usuário
db.collection('users').doc('SEU_UID').update({
  role: 'master'
})
```

## Verificação

Após executar qualquer um dos métodos acima:

1. Faça logout da aplicação
2. Faça login novamente
3. Acesse **/admin**
4. Você deve ver o botão **"Novo Usuário"**
5. Agora você pode criar novos usuários!

## Funcionalidades MASTER

Como MASTER, você pode:

✅ Criar novos usuários (com qualquer role)
✅ Editar qualquer usuário
✅ Excluir usuários
✅ Alterar roles de outros usuários
✅ Exportar dados de usuários
✅ Importar usuários em lote
✅ Ver detalhes completos de qualquer usuário
✅ Gerenciar todas as transações
✅ Acesso total ao sistema

## Hierarquia de Roles

1. **MASTER** (Você) - Controle total
2. **ADMIN** - Gerenciar conteúdo (não pode gerenciar usuários)
3. **VIEWER** - Apenas visualização

## Troubleshooting

### Erro: "Apenas MASTER pode criar usuários"

- Verifique se você executou corretamente um dos métodos acima
- Certifique-se de fazer logout e login novamente
- Verifique se o documento existe em `roles_master/SEU_UID`

### Não consigo ver o botão "Novo Usuário"

- Faça logout e login
- Limpe o cache do navegador (Cmd+Shift+R)
- Verifique no console do navegador se há erros

### Script não funciona

- Certifique-se de estar no diretório correto
- Verifique se tem Node.js instalado: `node --version`
- Verifique se as dependências estão instaladas: `npm install`

## Suporte

Se tiver problemas, verifique:
- Console do navegador (F12)
- Logs do terminal onde o Next.js está rodando
- Firebase Console > Firestore Database
