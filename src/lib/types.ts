export type Transaction = {
  id: string;
  date: any; // Allow Firestore Timestamp or ISO string
  description: string;
  amount: number;
  currency?: 'BRL' | 'EUR' | 'USD';
  category: string;
  type: 'expense' | 'income';
};

export type User = {
  id: string;
  name: string;
  email: string;
  role: 'master' | 'admin' | 'viewer';
  avatarUrl: string;
  disabled?: boolean;
  lastName?: string;
  phone?: string;
  cpf?: string;
  timezone?: string;
  defaultCurrency?: string;
  defaultLanguage?: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  createdAt?: any;
  updatedAt?: any;
};

export type OverviewCardData = {
  label: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative';
  icon: React.ElementType;
};

export type TransactionHistoryEntry = {
  id: string;
  transactionId: string;
  action: 'created' | 'updated' | 'deleted';
  userId: string;
  userName: string;
  userEmail: string;
  timestamp: any; // Firestore Timestamp or ISO string
  changes?: {
    before?: Partial<Transaction>;
    after?: Partial<Transaction>;
  };
  metadata?: {
    ipAddress?: string;
    userAgent?: string;
  };
};
