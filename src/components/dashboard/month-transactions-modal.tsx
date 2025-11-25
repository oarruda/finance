'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Transaction } from '@/lib/types';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Cell } from 'recharts';
import {
  ChartTooltip,
  ChartTooltipContent,
  ChartContainer,
} from '@/components/ui/chart';
import { useUserCurrency } from '@/hooks/use-user-currency';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';

interface MonthTransactionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  month: Date | null;
  transactions: Transaction[];
  isLoading?: boolean;
}

export function MonthTransactionsModal({
  open,
  onOpenChange,
  month,
  transactions,
  isLoading = false,
}: MonthTransactionsModalProps) {
  const { currency } = useUserCurrency();

  // Calcular estatísticas
  const stats = React.useMemo(() => {
    const income = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    return {
      income,
      expenses,
      balance: income - expenses,
      total: transactions.length,
    };
  }, [transactions]);

  // Dados do gráfico por categoria
  const chartData = React.useMemo(() => {
    const categoryMap = new Map<string, { total: number; type: 'income' | 'expense' | 'mixed' }>();

    transactions.forEach(t => {
      const current = categoryMap.get(t.category);
      if (!current) {
        categoryMap.set(t.category, {
          total: Math.abs(t.amount),
          type: t.type,
        });
      } else {
        current.total += Math.abs(t.amount);
        if (current.type !== t.type) {
          current.type = 'mixed';
        }
      }
    });

    return Array.from(categoryMap.entries())
      .map(([category, data]) => ({
        category,
        total: data.total,
        type: data.type,
        fill: data.type === 'income' ? '#22c55e' : data.type === 'expense' ? '#ef4444' : '#f59e0b',
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8); // Top 8 categorias
  }, [transactions]);

  if (!month) return null;

  const monthName = format(month, 'MMMM yyyy', { locale: ptBR });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col" hideCloseButton>
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-2xl capitalize">
                Transações de {monthName}
              </DialogTitle>
              <DialogDescription>
                {stats.total} transação(ões) encontrada(s) neste mês
              </DialogDescription>
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground px-3 py-1 rounded-md text-sm font-medium transition-colors"
            >
              Fechar
            </button>
          </div>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4 py-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 overflow-hidden">
            {/* Coluna Esquerda: Estatísticas e Tabela */}
            <div className="flex flex-col gap-4 overflow-hidden">
              {/* Cards de Estatísticas */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-green-50 dark:bg-green-950 p-3 rounded-lg">
                  <p className="text-xs text-green-600 dark:text-green-400 font-medium">Receitas</p>
                  <p className="text-lg font-bold text-green-700 dark:text-green-300">
                    {formatCurrency(stats.income, currency)}
                  </p>
                </div>
                <div className="bg-red-50 dark:bg-red-950 p-3 rounded-lg">
                  <p className="text-xs text-red-600 dark:text-red-400 font-medium">Despesas</p>
                  <p className="text-lg font-bold text-red-700 dark:text-red-300">
                    {formatCurrency(stats.expenses, currency)}
                  </p>
                </div>
                <div className={cn(
                  "p-3 rounded-lg",
                  stats.balance >= 0 
                    ? "bg-blue-50 dark:bg-blue-950" 
                    : "bg-orange-50 dark:bg-orange-950"
                )}>
                  <p className={cn(
                    "text-xs font-medium",
                    stats.balance >= 0 
                      ? "text-blue-600 dark:text-blue-400" 
                      : "text-orange-600 dark:text-orange-400"
                  )}>
                    Saldo
                  </p>
                  <p className={cn(
                    "text-lg font-bold",
                    stats.balance >= 0 
                      ? "text-blue-700 dark:text-blue-300" 
                      : "text-orange-700 dark:text-orange-300"
                  )}>
                    {formatCurrency(stats.balance, currency)}
                  </p>
                </div>
              </div>

              {/* Tabela de Transações */}
              <ScrollArea className="flex-1 rounded-lg border">
                <Table>
                  <TableHeader className="sticky top-0 bg-background">
                    <TableRow>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground h-32">
                          Nenhuma transação encontrada neste mês
                        </TableCell>
                      </TableRow>
                    ) : (
                      transactions
                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                        .map((transaction) => (
                          <TableRow key={transaction.id}>
                            <TableCell>
                              <div className="font-medium">{transaction.description}</div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{transaction.category}</Badge>
                            </TableCell>
                            <TableCell className="text-sm">
                              {format(new Date(transaction.date), 'dd/MM/yyyy', { locale: ptBR })}
                            </TableCell>
                            <TableCell
                              className={cn(
                                'text-right font-medium',
                                transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                              )}
                            >
                              {transaction.type === 'income' ? '+' : '-'}
                              {formatCurrency(transaction.amount, transaction.currency || currency)}
                            </TableCell>
                          </TableRow>
                        ))
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>

            {/* Coluna Direita: Gráfico */}
            <div className="flex flex-col gap-4">
              <div className="bg-muted/50 p-4 rounded-lg flex-1 flex flex-col">
                <h3 className="font-semibold mb-4">Gastos por Categoria</h3>
                {chartData.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center text-muted-foreground">
                    Sem dados para exibir
                  </div>
                ) : (
                  <ChartContainer config={{}} className="flex-1 min-h-[300px]">
                    <ResponsiveContainer>
                      <BarChart
                        data={chartData}
                        margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
                        layout="vertical"
                      >
                        <XAxis
                          type="number"
                          stroke="#888888"
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(value) => formatCurrency(value, currency).slice(0, -3)}
                        />
                        <YAxis
                          type="category"
                          dataKey="category"
                          stroke="#888888"
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                          width={100}
                        />
                        <ChartTooltip
                          content={
                            <ChartTooltipContent
                              formatter={(value) => formatCurrency(value as number, currency)}
                            />
                          }
                        />
                        <Bar dataKey="total" radius={[0, 8, 8, 0]}>
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                )}
              </div>

              {/* Resumo por Tipo */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-card border rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-1">Maior Receita</p>
                  <p className="text-sm font-bold text-green-600">
                    {transactions.filter(t => t.type === 'income').length > 0
                      ? formatCurrency(
                          Math.max(...transactions.filter(t => t.type === 'income').map(t => t.amount)),
                          currency
                        )
                      : '-'}
                  </p>
                </div>
                <div className="bg-card border rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-1">Maior Despesa</p>
                  <p className="text-sm font-bold text-red-600">
                    {transactions.filter(t => t.type === 'expense').length > 0
                      ? formatCurrency(
                          Math.max(...transactions.filter(t => t.type === 'expense').map(t => t.amount)),
                          currency
                        )
                      : '-'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
