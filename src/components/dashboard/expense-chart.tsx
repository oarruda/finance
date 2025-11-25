'use client';

import * as React from 'react';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Legend, Cell } from 'recharts';
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
import { useUserCurrency } from '@/hooks/use-user-currency';
import { useLanguage } from '@/lib/i18n';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format as formatDate } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function ExpenseChart() {
    const { firestore, user } = useFirebase();
    const { currency } = useUserCurrency();
    const { t } = useLanguage();
    const [selectedType, setSelectedType] = React.useState<'all' | 'expense' | 'income'>('all');
    const [selectedCategory, setSelectedCategory] = React.useState<string>('all');
    const [dateFrom, setDateFrom] = React.useState<Date | undefined>(undefined);
    const [dateTo, setDateTo] = React.useState<Date | undefined>(undefined);
    
    const transactionsQuery = useMemoFirebase(() => {
        if (!user) return null;
        return query(
            collection(firestore, 'users', user.uid, 'transactions'),
            orderBy('date', 'asc')
        );
    }, [firestore, user]);

    const { data: transactions, isLoading } = useCollection<Transaction>(transactionsQuery);

    // Filtrar transações
    const filteredTransactions = React.useMemo(() => {
        if (!transactions) return [];
        
        return transactions.filter(t => {
            // Filtro por tipo
            if (selectedType !== 'all' && t.type !== selectedType) return false;
            
            // Filtro por categoria
            if (selectedCategory !== 'all' && t.category !== selectedCategory) return false;
            
            // Filtro por data
            const transactionDate = new Date(t.date);
            if (dateFrom && transactionDate < dateFrom) return false;
            if (dateTo && transactionDate > dateTo) return false;
            
            return true;
        });
    }, [transactions, selectedType, selectedCategory, dateFrom, dateTo]);

    // Obter todas as categorias únicas
    const allCategories = React.useMemo(() => {
        if (!transactions) return [];
        return Array.from(new Set(transactions.map(t => t.category)));
    }, [transactions]);

    // Agrupar por categoria com informação de tipo
    const expenseChartData = React.useMemo(() => {
        const categoryData = new Map<string, { total: number, type: 'expense' | 'income' | 'mixed' }>();

        // Somar por categoria e rastrear tipo
        filteredTransactions.forEach(t => {
            const current = categoryData.get(t.category);
            if (!current) {
                categoryData.set(t.category, { 
                    total: Math.abs(t.amount), 
                    type: t.type 
                });
            } else {
                current.total += Math.abs(t.amount);
                // Se houver tipos mistos na mesma categoria, marcar como mixed
                if (current.type !== t.type) {
                    current.type = 'mixed';
                }
            }
        });

        // Converter para array e ordenar por valor (maior para menor)
        return Array.from(categoryData.entries())
            .map(([category, data]) => ({
                category,
                total: data.total,
                type: data.type,
                fill: data.type === 'income' ? '#22c55e' : data.type === 'expense' ? '#ef4444' : '#f59e0b'
            }))
            .sort((a, b) => b.total - a.total);
    }, [filteredTransactions]);

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>{t('dashboard.expensesByCategory')}</CardTitle>
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
        
        {/* Filtros */}
        <div className="flex flex-wrap gap-3 mt-4">
          {/* Filtro por Tipo */}
          <Select value={selectedType} onValueChange={(value: any) => setSelectedType(value)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('transactions.all')}</SelectItem>
              <SelectItem value="expense">{t('transactions.expense')}</SelectItem>
              <SelectItem value="income">{t('transactions.income')}</SelectItem>
            </SelectContent>
          </Select>

          {/* Filtro por Categoria */}
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder={t('transactions.category')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('transactions.allCategories')}</SelectItem>
              {allCategories.map(cat => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Filtro de Data Inicial */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[140px] justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateFrom ? formatDate(dateFrom, 'dd/MM/yy') : t('transactions.from')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dateFrom}
                onSelect={setDateFrom}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          {/* Filtro de Data Final */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[140px] justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateTo ? formatDate(dateTo, 'dd/MM/yy') : t('transactions.to')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dateTo}
                onSelect={setDateTo}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          {/* Botão Limpar Filtros */}
          <Button 
            variant="ghost" 
            onClick={() => {
              setSelectedType('expense');
              setSelectedCategory('all');
              setDateFrom(undefined);
              setDateTo(undefined);
            }}
          >
            {t('transactions.clearFilters')}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {expenseChartData.length === 0 ? (
          <div className="h-64 w-full flex items-center justify-center text-muted-foreground">
            {t('dashboard.noExpensesYet')}
          </div>
        ) : (
          <ChartContainer config={{}} className="h-64 w-full">
            <ResponsiveContainer>
              <BarChart
                data={expenseChartData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                barSize={30}
              >
                <XAxis
                  dataKey="category"
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
                <Bar
                  dataKey="total"
                  radius={[8, 8, 0, 0]}
                  animationDuration={800}
                  animationBegin={0}
                >
                  {expenseChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
