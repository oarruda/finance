# Sistema de Auditoria de Transações

## Visão Geral

Este sistema registra automaticamente todas as alterações feitas em transações, criando um histórico imutável de modificações.

## Estrutura de Dados

### TransactionHistoryEntry
```typescript
{
  id: string;                    // ID único do registro
  transactionId: string;         // ID da transação modificada
  action: 'created' | 'updated' | 'deleted';
  userId: string;                // UID do usuário que fez a alteração
  userName: string;              // Nome do usuário
  userEmail: string;             // Email do usuário
  timestamp: Timestamp;          // Data/hora da alteração
  changes: {
    before?: Partial<Transaction>;  // Estado anterior (para updates/deletes)
    after?: Partial<Transaction>;   // Estado novo (para creates/updates)
  };
}
```

## Como Integrar

### 1. Importar a função de auditoria

```typescript
import { logTransactionChange } from '@/lib/audit-log';
import { useFirebase } from '@/firebase';
```

### 2. Ao CRIAR uma transação

```typescript
const handleCreateTransaction = async (data: Transaction) => {
  const { firestore, user } = useFirebase();
  
  // Criar a transação
  const docRef = await addDoc(
    collection(firestore, 'users', user.uid, 'transactions'),
    data
  );
  
  // Registrar no histórico
  await logTransactionChange({
    firestore,
    user,
    transactionId: docRef.id,
    action: 'created',
    after: { ...data, id: docRef.id },
  });
};
```

### 3. Ao ATUALIZAR uma transação

```typescript
const handleUpdateTransaction = async (
  transactionId: string,
  newData: Partial<Transaction>,
  oldData: Transaction
) => {
  const { firestore, user } = useFirebase();
  
  // Atualizar a transação
  await updateDoc(
    doc(firestore, 'users', user.uid, 'transactions', transactionId),
    newData
  );
  
  // Registrar no histórico
  await logTransactionChange({
    firestore,
    user,
    transactionId,
    action: 'updated',
    before: oldData,
    after: { ...oldData, ...newData },
  });
};
```

### 4. Ao DELETAR uma transação

```typescript
const handleDeleteTransaction = async (
  transactionId: string,
  transaction: Transaction
) => {
  const { firestore, user } = useFirebase();
  
  // Deletar a transação
  await deleteDoc(
    doc(firestore, 'users', user.uid, 'transactions', transactionId)
  );
  
  // Registrar no histórico
  await logTransactionChange({
    firestore,
    user,
    transactionId,
    action: 'deleted',
    before: transaction,
  });
};
```

## Visualizar Histórico

### Componente TransactionHistory

```tsx
import { TransactionHistory } from '@/components/transactions/transaction-history';

// Para ver histórico de todas as transações
<TransactionHistory maxResults={100} />

// Para ver histórico de uma transação específica
<TransactionHistory transactionId="abc123" />
```

## Permissões

De acordo com as regras do Firestore:
- **MASTER**: Pode ver e deletar histórico
- **ADMIN**: Pode ver histórico
- **VIEWER**: Sem acesso ao histórico

## Características

✅ **Imutável**: Uma vez criado, o registro não pode ser modificado
✅ **Automático**: Não bloqueia operações principais se falhar
✅ **Detalhado**: Registra quem, quando e o que foi alterado
✅ **Rastreável**: Histórico completo de mudanças campo por campo

## Próximos Passos

1. Integrar chamadas de auditoria em todos os componentes que modificam transações
2. Adicionar aba "Histórico" na página de transações
3. Implementar filtros por usuário, data, tipo de ação
4. Adicionar exportação de relatórios de auditoria
