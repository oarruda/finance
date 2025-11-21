'use client';
import { transactionInsights } from '@/ai/flows/transaction-insights';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { Lightbulb, Loader2 } from 'lucide-react';
import type { Transaction } from '@/lib/types';
import { collection, query, limit } from 'firebase/firestore';
import React from 'react';
import { useLanguage } from '@/lib/i18n';

export function AIInsights() {
  const { firestore, user } = useFirebase();
  const { t } = useLanguage();
  const [insights, setInsights] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(true);

  const transactionsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(firestore, 'users', user.uid, 'transactions'), limit(10));
  }, [firestore, user]);

  const { data: transactions } = useCollection<Transaction>(transactionsQuery);

  React.useEffect(() => {
    async function fetchInsights() {
      if (transactions && transactions.length > 0) {
        setIsLoading(true);
        try {
          const transactionDataString = JSON.stringify(
            transactions.map(t => ({...t, date: new Date(t.date).toISOString()})), // Convert to ISO string
            null, 2
          );
          const result = await transactionInsights({
            transactionData: transactionDataString,
          });
          setInsights(result.insights);
        } catch (error) {
          console.error("Error fetching AI insights:", error);
          setInsights(t('dashboard.aiInsightsError'));
        } finally {
          setIsLoading(false);
        }
      } else if (transactions && transactions.length === 0) {
        setInsights(t('dashboard.aiInsightsNoData'));
        setIsLoading(false);
      }
    }

    fetchInsights();
  }, [transactions]);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex items-start justify-between">
            <div>
                <CardTitle>{t('dashboard.aiInsights')}</CardTitle>
                <CardDescription>{t('dashboard.aiInsightsDesc')}</CardDescription>
            </div>
            <div className="p-2 bg-primary/10 rounded-lg">
                <Lightbulb className="h-5 w-5 text-primary" />
            </div>
        </div>
      </CardHeader>
      <CardContent className="flex-grow flex items-center justify-center">
        {isLoading ? (
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
        ) : (
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {insights}
            </p>
        )}
      </CardContent>
    </Card>
  );
}
