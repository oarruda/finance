import type { User, Transaction } from './types';

export const users: User[] = [
  {
    id: '1',
    name: 'Rafael Arruda',
    email: 'rafael@rafaelarruda.com',
    role: 'master',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
  },
  {
    id: '2',
    name: 'Ana Silva',
    email: 'ana.silva@example.com',
    role: 'admin',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
  },
  {
    id: '3',
    name: 'Carlos Souza',
    email: 'carlos.souza@example.com',
    role: 'viewer',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop',
  },
];

export const transactions: Transaction[] = [
  { id: '1', description: 'Supermercado Mensal', amount: 1250.75, currency: 'BRL', date: '2024-07-28', category: 'Alimentação', type: 'expense' },
  { id: '2', description: 'Aluguel', amount: 3500.00, currency: 'BRL', date: '2024-07-05', category: 'Moradia', type: 'expense' },
  { id: '3', description: 'Salário', amount: 12000.00, currency: 'BRL', date: '2024-07-01', category: 'Renda', type: 'income' },
  { id: '4', description: 'Cinema', amount: 80.00, currency: 'BRL', date: '2024-07-20', category: 'Lazer', type: 'expense' },
  { id: '5', description: 'WISE Transfer', amount: 500.00, currency: 'EUR', date: '2024-07-15', category: 'Investimento', type: 'expense' },
  { id: '6', description: 'Conta de Luz', amount: 250.30, currency: 'BRL', date: '2024-07-10', category: 'Contas', type: 'expense' },
  { id: '7', description: 'Jantar Restaurante', amount: 300.00, currency: 'BRL', date: '2024-07-18', category: 'Lazer', type: 'expense' },
  { id: '8', description: 'Investimento Ações', amount: 1000.00, currency: 'BRL', date: '2024-07-12', category: 'Investimento', type: 'expense' },
  { id: '9', description: 'Freelance Projeto X', amount: 2500.00, currency: 'BRL', date: '2024-07-25', category: 'Renda', type: 'income' },
];



export const currencyRates = {
    BRL_EUR: 0.18,
    BRL_USD: 0.20,
    EUR_BRL: 5.56,
    USD_BRL: 5.00,
};
