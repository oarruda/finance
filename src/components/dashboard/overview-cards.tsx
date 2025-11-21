'use client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn, formatCurrency } from '@/lib/utils';
import { ArrowUpRight, ArrowDownRight, DollarSign, CreditCard, Users, TrendingUp } from 'lucide-react';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import type { Transaction } from '@/lib/types';
import { collection, query, where } from 'firebase/firestore';
import { Skeleton } from '../ui/skeleton';
import { useUserCurrency } from '@/hooks/use-user-currency';
import { useLanguage } from '@/lib/i18n';

export function OverviewCards() {
    const { firestore, user } = useFirebase();
    const { currency } = useUserCurrency();
    const { t } = useLanguage();

    const transactionsQuery = useMemoFirebase(() => {
        if (!user) return null;
        return query(collection(firestore, 'users', user.uid, 'transactions'));
    }, [firestore, user]);

    const { data: transactions, isLoading } = useCollection<Transaction>(transactionsQuery);

    const totalBalance = transactions?.reduce((acc, t) => acc + t.amount, 0) ?? 0;
    const totalExpenses = transactions?.filter(t => t.type === 'expense').reduce((acc, t) => acc + Math.abs(t.amount), 0) ?? 0;
    const totalInvestments = transactions?.filter(t => t.category === 'Investments').reduce((acc, t) => acc + Math.abs(t.amount), 0) ?? 0;

    const overviewData = [
        {
            label: t('dashboard.totalBalance'),
            value: formatCurrency(totalBalance, currency),
            change: `+20.1% ${t('dashboard.comparedToLastMonth')}`,
            changeType: 'positive',
            icon: DollarSign,
        },
        {
            label: t('dashboard.totalExpenses'),
            value: formatCurrency(totalExpenses, currency),
            change: `+10.5% ${t('dashboard.comparedToLastMonth')}`,
            changeType: 'negative',
            icon: CreditCard,
        },
        {
            label: t('dashboard.totalInvestments'),
            value: formatCurrency(totalInvestments, currency),
            change: `+5.2% ${t('dashboard.comparedToLastMonth')}`,
            changeType: 'positive',
            icon: TrendingUp,
        },
        {
            label: t('dashboard.activeUsers'),
            value: "1",
            change: "",
            changeType: 'positive',
            icon: Users,
        },
    ];

    if (isLoading) {
        return (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <Card key={i}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <Skeleton className='h-5 w-24' />
                            <Skeleton className='h-4 w-4' />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className='h-7 w-32 mb-2' />
                            <Skeleton className='h-4 w-48' />
                        </CardContent>
                    </Card>
                ))}
            </div>
        )
    }


  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {overviewData.map(item => (
        <Card key={item.label}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{item.label}</CardTitle>
            <item.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{item.value}</div>
            {item.change && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                <span
                    className={cn(
                    'flex items-center gap-1',
                    item.changeType === 'positive'
                        ? 'text-accent'
                        : 'text-destructive'
                    )}
                >
                    {item.changeType === 'positive' ? <ArrowUpRight className='h-4 w-4' /> : <ArrowDownRight className='h-4 w-4'/>}
                    {item.change}
                </span>
                </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
