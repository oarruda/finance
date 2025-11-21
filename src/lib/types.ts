export type Transaction = {
  id: string;
  date: string;
  description: string;
  amount: number;
  currency: 'BRL' | 'EUR' | 'USD';
  category: string;
  type: 'expense' | 'income';
};

export type User = {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'viewer';
  avatarUrl: string;
};

export type OverviewCardData = {
  label: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative';
  icon: React.ElementType;
};
