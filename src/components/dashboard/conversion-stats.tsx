'use client';

import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, DollarSign, Building2 } from 'lucide-react';

interface WiseTransaction {
  id: string;
  fromAmount: number;
  fromCurrency: string;
  toAmount: number;
  toCurrency: string;
  bank: string;
  wiseFee: number;
  amountAfterFee: number;
  exchangeRate: number;
  createdAt: string;
}

export function ConversionStats() {
  const { firestore, user } = useFirebase();

  const conversionsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(
      collection(firestore, 'users', user.uid, 'wiseTransactions'),
      orderBy('createdAt', 'desc')
    );
  }, [firestore, user]);

  const { data: conversions, isLoading } = useCollection<WiseTransaction>(conversionsQuery);

  const getCurrencySymbol = (currency: string) => {
    switch (currency) {
      case 'BRL': return 'R$';
      case 'EUR': return '€';
      case 'USD': return '$';
      default: return currency;
    }
  };

  // Calcular banco mais usado
  const mostUsedBank = React.useMemo(() => {
    if (!conversions || conversions.length === 0) return '-';
    
    const bankCount = conversions.reduce((acc, conv) => {
      acc[conv.bank] = (acc[conv.bank] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.keys(bankCount).reduce((a, b) => 
      bankCount[a] > bankCount[b] ? a : b
    );
  }, [conversions]);

  // Calcular total de taxas
  const totalFees = React.useMemo(() => {
    if (!conversions || conversions.length === 0) return { amount: 0, currency: 'BRL' };
    
    const total = conversions.reduce((acc, conv) => acc + conv.wiseFee, 0);
    return { amount: total, currency: conversions[0].fromCurrency };
  }, [conversions]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Skeleton className="h-20" />
        <Skeleton className="h-20" />
        <Skeleton className="h-20" />
      </div>
    );
  }

  if (!conversions || conversions.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground">Total Conversões</p>
              <p className="text-lg font-bold">{conversions.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-destructive/10 rounded-lg">
              <DollarSign className="h-4 w-4 text-destructive" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground">Total em Taxas</p>
              <p className="text-lg font-bold text-destructive">
                {getCurrencySymbol(totalFees.currency)} {totalFees.amount.toFixed(2)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-chart-2/10 rounded-lg">
              <Building2 className="h-4 w-4 text-chart-2" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground">Banco Mais Usado</p>
              <p className="text-lg font-bold truncate">{mostUsedBank}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
