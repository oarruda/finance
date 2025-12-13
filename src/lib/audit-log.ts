import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';
import type { User as FirebaseUser } from 'firebase/auth';
import type { Transaction, TransactionHistoryEntry } from './types';

interface AuditLogParams {
  firestore: Firestore;
  user: FirebaseUser;
  transactionId: string;
  action: 'created' | 'updated' | 'deleted';
  before?: Partial<Transaction>;
  after?: Partial<Transaction>;
}

/**
 * Registra uma alteração no histórico de transações
 * Esta função cria um registro de auditoria imutável no Firestore
 */
export async function logTransactionChange({
  firestore,
  user,
  transactionId,
  action,
  before,
  after,
}: AuditLogParams): Promise<void> {
  try {
    const historyEntry: Omit<TransactionHistoryEntry, 'id'> = {
      transactionId,
      action,
      userId: user.uid,
      userName: user.displayName || 'Usuário sem nome',
      userEmail: user.email || 'Email não disponível',
      timestamp: serverTimestamp(),
      changes: {
        before,
        after,
      },
    };

    await addDoc(collection(firestore, 'transactionHistory'), historyEntry);
    console.log('Histórico de transação registrado:', action, transactionId);
  } catch (error) {
    console.error('Erro ao registrar histórico de transação:', error);
    // Não lançar erro para não bloquear a operação principal
  }
}

/**
 * Formata as diferenças entre duas versões de uma transação
 */
export function formatTransactionDiff(
  before?: Partial<Transaction>,
  after?: Partial<Transaction>
): string[] {
  const changes: string[] = [];

  if (!before && after) {
    return ['Transação criada'];
  }

  if (before && !after) {
    return ['Transação deletada'];
  }

  if (!before || !after) {
    return changes;
  }

  // Comparar campos
  const fields: (keyof Transaction)[] = ['description', 'amount', 'category', 'type', 'currency', 'date'];

  for (const field of fields) {
    if (before[field] !== after[field]) {
      changes.push(`${field}: "${before[field]}" → "${after[field]}"`);
    }
  }

  return changes;
}
