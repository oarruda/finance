'use client';

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import {
  ChartTooltip,
  ChartTooltipContent,
  ChartContainer,
} from '@/components/ui/chart';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import type { Transaction } from '@/lib/types';
import { Skeleton } from '../ui/skeleton';

export function ExpenseChart() {
    const { firestore, user } = useFirebase();
    const transactionsQuery = useMemoFirebase(() => {
        if (!user) return null;
        return query(collection(firestore, 'users', user.uid, 'transactions'));
    }, [firestore, user]);

    const { data: transactions, isLoading } = useCollection<Transaction>(transactionsQuery);

    const expenseChartData = transactions
        ?.filter(t => t.type === 'expense')
        .reduce((acc, t) => {
            const existing = acc.find(item => item.category === t.category);
            if (existing) {
                existing.amount += Math.abs(t.amount);
            } else {
                acc.push({ category: t.category, amount: Math.abs(t.amount) });
            }
            return acc;
        }, [] as { category: string; amount: number; }[]) ?? [];

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Expenses by Category</CardTitle>
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
    <Card>
      <CardHeader>
        <CardTitle>Expenses by Category</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={{}} className="h-80 w-full">
          <ResponsiveContainer>
            <BarChart
              data={expenseChartData}
              margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
            >
              <XAxis
                dataKey="category"
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                angle={-30}
                textAnchor="end"
                height={60}
              />
              <YAxis
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={value => formatCurrency(value as number).slice(0,-3)}
              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent
                    formatter={(value) => formatCurrency(value as number)}
                    indicator='dot'
                />}
              />
              <Bar
                dataKey="amount"
                fill="hsl(var(--primary))"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
