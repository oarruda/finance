import type { Transaction, User, OverviewCardData } from '@/lib/types';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { CreditCard, DollarSign, Users, TrendingUp } from 'lucide-react';

export const transactions: Transaction[] = [
  { id: '1', date: '2024-07-20T10:00:00Z', description: 'Groceries at SuperMart', amount: -150.75, currency: 'BRL', category: 'Food & Dining', type: 'expense' },
  { id: '2', date: '2024-07-20T09:00:00Z', description: 'Salary', amount: 5000.00, currency: 'BRL', category: 'Income', type: 'income' },
  { id: '3', date: '2024-07-19T15:30:00Z', description: 'WISE Transfer to EUR', amount: -1000.00, currency: 'BRL', category: 'Currency Exchange', type: 'expense' },
  { id: '4', date: '2024-07-18T12:00:00Z', description: 'Netflix Subscription', amount: -39.90, currency: 'BRL', category: 'Bills & Utilities', type: 'expense' },
  { id: '5', date: '2024-07-17T20:00:00Z', description: 'Dinner with friends', amount: -120.00, currency: 'BRL', category: 'Entertainment', type: 'expense' },
  { id: '6', date: '2024-07-15T11:00:00Z', description: 'Stock Investment (AAPL)', amount: -500.00, currency: 'BRL', category: 'Investments', type: 'expense' },
  { id: '7', date: '2024-07-14T18:00:00Z', description: 'New keyboard', amount: -350.00, currency: 'BRL', category: 'Shopping', type: 'expense' },
];

export const users: User[] = [
  { id: '1', name: 'Rafael Arruda', email: 'rafael@rafaelarruda.com', role: 'admin', avatarUrl: PlaceHolderImages.find(p => p.id === 'avatar1')?.imageUrl ?? '' },
  { id: '2', name: 'Jane Doe', email: 'jane.doe@example.com', role: 'viewer', avatarUrl: PlaceHolderImages.find(p => p.id === 'avatar2')?.imageUrl ?? ''  },
  { id: '3', name: 'John Smith', email: 'john.smith@example.com', role: 'viewer', avatarUrl: PlaceHolderImages.find(p => p.id === 'avatar3')?.imageUrl ?? '' },
];

export const overviewData: OverviewCardData[] = [
  {
      label: "Total Balance",
      value: "R$ 45,231.89",
      change: "+20.1% from last month",
      changeType: 'positive',
      icon: DollarSign,
  },
  {
      label: "Total Expenses",
      value: "R$ 4,231.89",
      change: "+10.5% from last month",
      changeType: 'negative',
      icon: CreditCard,
  },
  {
      label: "Total Investments",
      value: "R$ 15,000.00",
      change: "+5.2% from last month",
      changeType: 'positive',
      icon: TrendingUp,
  },
  {
      label: "Active Users",
      value: "3",
      change: "+1 from last month",
      changeType: 'positive',
      icon: Users,
  },
];

export const expenseChartData = transactions
  .filter(t => t.type === 'expense')
  .reduce((acc, t) => {
    const existing = acc.find(item => item.category === t.category);
    if (existing) {
      existing.amount += Math.abs(t.amount);
    } else {
      acc.push({ category: t.category, amount: Math.abs(t.amount) });
    }
    return acc;
  }, [] as { category: string; amount: number; }[]);


export const currencyRates = {
  BRL_EUR: 0.17,
  BRL_USD: 0.18,
  EUR_BRL: 5.85,
  USD_BRL: 5.45,
};
