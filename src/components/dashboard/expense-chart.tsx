'use client';

import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import {
  ChartTooltip,
  ChartTooltipContent,
  ChartContainer,
} from '@/components/ui/chart';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import type { Transaction } from '@/lib/types';
import { Skeleton } from '../ui/skeleton';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useUserCurrency } from '@/hooks/use-user-currency';
import { useLanguage } from '@/lib/i18n';

export function ExpenseChart() {
    const { firestore, user } = useFirebase();
    const { currency } = useUserCurrency();
    const { t } = useLanguage();
    const transactionsQuery = useMemoFirebase(() => {
        if (!user) return null;
        return query(
            collection(firestore, 'users', user.uid, 'transactions'),
            orderBy('date', 'asc')
        );
    }, [firestore, user]);

    const { data: transactions, isLoading } = useCollection<Transaction>(transactionsQuery);

    // Agrupar despesas por data e categoria
    const expenseChartData = (() => {
        if (!transactions) return [];
        
        const expenses = transactions.filter(t => t.type === 'expense');
        const dateMap = new Map<string, Record<string, number>>();
        const categories = new Set<string>();

        // Agrupar por data
        expenses.forEach(t => {
            const dateKey = format(new Date(t.date), 'dd/MM', { locale: ptBR });
            categories.add(t.category);
            
            if (!dateMap.has(dateKey)) {
                dateMap.set(dateKey, {});
            }
            
            const dateData = dateMap.get(dateKey)!;
            dateData[t.category] = (dateData[t.category] || 0) + Math.abs(t.amount);
        });

        // Converter para array
        return Array.from(dateMap.entries()).map(([date, categoryData]) => ({
            date,
            ...categoryData,
        }));
    })();

    // Obter lista de categorias únicas
    const categories = Array.from(
        new Set(transactions?.filter(t => t.type === 'expense').map(t => t.category) || [])
    );

    // Cores para as linhas
    const colors = [
        'hsl(var(--chart-1))',
        'hsl(var(--chart-2))',
        'hsl(var(--chart-3))',
        'hsl(var(--chart-4))',
        'hsl(var(--chart-5))',
    ];

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Despesas por Categoria</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-80 w-full">
                        <Skeleton className="h-full w-full" />
                    </div>
                </CardContent>
            </Card>
        )
    }

  return (
    <Card className="transition-all duration-300 hover:shadow-lg animate-in fade-in slide-in-from-left-4" style={{ animationDelay: '200ms', animationFillMode: 'backwards' }}>
      <CardHeader>
        <CardTitle>{t('dashboard.expensesByCategory')}</CardTitle>
      </CardHeader>
      <CardContent>
        {expenseChartData.length === 0 ? (
          <div className="h-80 w-full flex items-center justify-center text-muted-foreground">
            {t('dashboard.noExpensesYet')}
          </div>
        ) : (
          <ChartContainer config={{}} className="h-80 w-full">
            <ResponsiveContainer>
              <LineChart
                data={expenseChartData}
                margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
              >
                <XAxis
                  dataKey="date"
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={value => formatCurrency(value as number, currency).slice(0,-3)}
                />
                <ChartTooltip
                  content={<ChartTooltipContent
                    formatter={(value) => formatCurrency(value as number, currency)}
                  />}
                />
                <Legend />
                {categories.map((category, index) => (
                  <Line
                    key={category}
                    type="monotone"
                    dataKey={category}
                    stroke={colors[index % colors.length]}
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
