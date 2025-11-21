# Sistema de Permissões - Finance App

## Visão Geral

O aplicativo possui três níveis de acesso hierárquicos:

### 1. **MASTER** (Controle Total)
- **Acesso**: Controle completo de todo o sistema
- **Permissões**:
  - ✅ Visualizar todos os dados
  - ✅ Criar, editar e excluir qualquer conteúdo
  - ✅ Gerenciar usuários (criar, editar, excluir)
  - ✅ Alterar roles de outros usuários
  - ✅ Acesso a configurações do sistema
- **Uso**: Proprietário ou administrador principal do sistema
- **Badge**: Gradiente roxo/rosa

### 2. **ADMIN** (Gerenciamento)
- **Acesso**: Gerenciamento de conteúdo e dados
- **Permissões**:
  - ✅ Visualizar todos os dados
  - ✅ Criar, editar e excluir transações
  - ✅ Gerenciar taxas de câmbio
  - ❌ NÃO pode gerenciar usuários
  - ❌ NÃO pode alterar roles
- **Uso**: Gerentes ou administradores de conteúdo
- **Badge**: Azul primário

### 3. **VIEWER** (Visualização)
- **Acesso**: Apenas leitura
- **Permissões**:
  - ✅ Visualizar dashboards
  - ✅ Ver gráficos e relatórios
  - ✅ Ver todas as transações
  - ❌ NÃO pode criar ou editar nada
  - ❌ NÃO pode excluir dados
- **Uso**: Membros da família que apenas acompanham as finanças
- **Badge**: Cinza secundário

## Matriz de Permissões

| Ação                          | Master | Admin | Viewer |
|-------------------------------|--------|-------|--------|
| Ver Dashboard                 | ✅     | ✅    | ✅     |
| Ver Transações                | ✅     | ✅    | ✅     |
| Criar Transações              | ✅     | ✅    | ❌     |
| Editar Transações             | ✅     | ✅    | ❌     |
| Excluir Transações            | ✅     | ✅    | ❌     |
| Ver Usuários                  | ✅     | ✅    | ✅     |
| Criar Usuários                | ✅     | ❌    | ❌     |
| Editar Usuários               | ✅     | ❌    | ❌     |
| Excluir Usuários              | ✅     | ❌    | ❌     |
| Alterar Roles                 | ✅     | ❌    | ❌     |
| Alterar Própria Senha         | ✅     | ✅    | ✅     |
| Gerenciar Taxas de Câmbio    | ✅     | ✅    | ❌     |

## Configuração no Firestore

### Collections de Roles

#### `/roles_master/{userId}`
- Identifica usuários com privilégios de Master
- **NÃO pode ser modificado pelo cliente** (apenas Firebase Console ou Admin SDK)
- Exemplo de documento:
```json
{
  "email": "rafael@rafaelarruda.com",
  "addedAt": "2025-11-21T10:00:00Z",
  "addedBy": "setup-script"
}
```

#### `/roles_admin/{userId}`
- Identifica usuários com privilégios de Admin
- **NÃO pode ser modificado pelo cliente**
- Exemplo de documento:
```json
{
  "email": "ana@example.com",
  "addedAt": "2025-11-21T10:00:00Z",
  "addedBy": "master-user-id"
}
```

#### `/users/{userId}`
- Perfil do usuário com campo `role`
- O campo `role` no documento de usuário é **informativo**
- As collections `roles_master` e `roles_admin` são a **fonte de verdade**

## Como Adicionar um Master

### Opção 1: Firebase Console (Recomendado para primeiro master)
1. Acesse [Firebase Console](https://console.firebase.google.com)
2. Selecione seu projeto
3. Vá em **Firestore Database**
4. Crie a collection `roles_master`
5. Adicione um documento com ID = UID do usuário
6. Adicione campos: `email`, `addedAt`, etc.

### Opção 2: Script (Para adicionar masters subsequentes)
```bash
node scripts/add-admin.js rafael@rafaelarruda.com master
```

### Opção 3: Admin SDK (Programaticamente)
```javascript
const admin = require('firebase-admin');
const db = admin.firestore();

await db.collection('roles_master').doc(userId).set({
  email: userEmail,
  addedAt: admin.firestore.FieldValue.serverTimestamp(),
  addedBy: currentMasterUserId,
});

// Atualizar também o documento do usuário
await db.collection('users').doc(userId).update({
  role: 'master'
});
```

## Uso no Código

### Hook de Permissões
```tsx
import { usePermissions } from '@/hooks/use-permissions';

function MyComponent() {
  const { canEdit, canManageUsers, isMaster } = usePermissions();

  if (!canEdit) {
    return <div>Você não tem permissão para editar</div>;
  }

  return <EditForm />;
}
```

### Componente de Restrição
```tsx
import { RequirePermission, RequireRole } from '@/hooks/use-permissions';

// Por permissão
<RequirePermission permission="canEdit" fallback={<ReadOnlyView />}>
  <EditableContent />
</RequirePermission>

// Por role
<RequireRole roles={['master', 'admin']} fallback={<AccessDenied />}>
  <AdminPanel />
</RequireRole>
```

## Segurança

### Princípios
1. **Privilégio Mínimo**: Novos usuários começam como `viewer`
2. **Imutabilidade de Roles**: Roles críticos só podem ser modificados server-side
3. **Hierarquia Clara**: Master > Admin > Viewer
4. **Auditoria**: Todas as mudanças de role devem ser registradas

### Proteções
- ❌ Usuários não podem promover a si mesmos
- ❌ Usuários não podem modificar `roles_master` ou `roles_admin` diretamente
- ❌ Viewers não têm acesso de escrita a nenhum dado
- ✅ Apenas Masters podem criar novos Masters
- ✅ Regras do Firestore validam permissões no servidor

## Deploy das Regras

### Deploy Completo
```bash
firebase deploy --only firestore:rules
```

### Validação Local
```bash
firebase emulators:start
```

## Troubleshooting

### "Permission Denied" no Firestore
1. Verifique se o usuário está autenticado
2. Verifique se existe documento em `roles_master` ou `roles_admin` para o UID do usuário
3. Confirme que as regras foram deployadas: `firebase deploy --only firestore:rules`
4. Verifique os logs no Firebase Console > Firestore > Rules

### Usuário não consegue editar
1. Confirme o role no documento `/users/{userId}`
2. Verifique se existe documento correspondente em `roles_master` ou `roles_admin`
3. Teste com o hook: `const { canEdit, userRole } = usePermissions()`

### Como resetar para modo desenvolvimento
Para testes, você pode temporariamente usar regras abertas (NÃO EM PRODUÇÃO):
```javascript
// firestore.rules - APENAS DESENVOLVIMENTO
match /{document=**} {
  allow read, write: if request.auth != null;
}
```

## Próximos Passos

1. ✅ Sistema de roles implementado
2. ⏳ Integrar com Firebase Authentication
3. ⏳ Implementar auditoria de mudanças de role
4. ⏳ Adicionar notificações quando roles mudam
5. ⏳ Criar painel de logs de atividades
