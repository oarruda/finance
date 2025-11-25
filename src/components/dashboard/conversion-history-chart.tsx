'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '@/lib/i18n';

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

export function ConversionHistoryChart() {
  const { firestore, user } = useFirebase();
  const { t } = useLanguage();

  const conversionsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(
      collection(firestore, 'users', user.uid, 'wiseTransactions'),
      orderBy('createdAt', 'desc'),
      limit(10)
    );
  }, [firestore, user]);

  const { data: conversions, isLoading } = useCollection<WiseTransaction>(conversionsQuery);

  // Preparar dados para o gráfico
  const chartData = React.useMemo(() => {
    if (!conversions || conversions.length === 0) return [];

    return conversions
      .slice()
      .reverse() // Inverter para ordem cronológica
      .map((conversion) => ({
        date: format(new Date(conversion.createdAt), 'dd/MM', { locale: ptBR }),
        fullDate: format(new Date(conversion.createdAt), 'dd/MM/yyyy HH:mm', { locale: ptBR }),
        enviado: conversion.fromAmount,
        recebido: conversion.toAmount,
        taxa: conversion.wiseFee,
        fromCurrency: conversion.fromCurrency,
        toCurrency: conversion.toCurrency,
        bank: conversion.bank,
      }));
  }, [conversions]);

  const getCurrencySymbol = (currency: string) => {
    switch (currency) {
      case 'BRL': return 'R$';
      case 'EUR': return '€';
      case 'USD': return '$';
      default: return currency;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Conversões</CardTitle>
          <CardDescription>Suas últimas 10 conversões registradas</CardDescription>
        </CardHeader>
        <CardContent className="h-[400px]">
          <Skeleton className="h-full w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!conversions || conversions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Conversões</CardTitle>
          <CardDescription>Suas últimas 10 conversões registradas</CardDescription>
        </CardHeader>
        <CardContent className="h-[400px] flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <p>Nenhuma conversão registrada ainda.</p>
            <p className="text-sm mt-2">Registre sua primeira conversão para ver o histórico.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Histórico de Conversões</CardTitle>
        <CardDescription>
          Suas últimas {conversions.length} conversões registradas
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="date" 
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis 
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--popover))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
              labelStyle={{ color: 'hsl(var(--popover-foreground))' }}
              formatter={(value: number, name: string, props: any) => {
                const { payload } = props;
                if (name === 'enviado') {
                  return [`${getCurrencySymbol(payload.fromCurrency)} ${value.toFixed(2)}`, 'Enviado'];
                }
                if (name === 'recebido') {
                  return [`${getCurrencySymbol(payload.toCurrency)} ${value.toFixed(2)}`, 'Recebido'];
                }
                if (name === 'taxa') {
                  return [`${getCurrencySymbol(payload.fromCurrency)} ${value.toFixed(2)}`, 'Taxa'];
                }
                return [value, name];
              }}
              labelFormatter={(label: string, payload: any) => {
                if (payload && payload.length > 0) {
                  return `${payload[0].payload.fullDate} - ${payload[0].payload.bank}`;
                }
                return label;
              }}
            />
            <Legend 
              wrapperStyle={{ paddingTop: '20px' }}
              formatter={(value) => {
                if (value === 'enviado') return 'Valor Enviado';
                if (value === 'recebido') return 'Valor Recebido';
                if (value === 'taxa') return 'Taxa Cobrada';
                return value;
              }}
            />
            <Line 
              type="monotone" 
              dataKey="enviado" 
              stroke="hsl(var(--primary))" 
              strokeWidth={2}
              dot={{ fill: 'hsl(var(--primary))', r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line 
              type="monotone" 
              dataKey="recebido" 
              stroke="hsl(var(--chart-2))" 
              strokeWidth={2}
              dot={{ fill: 'hsl(var(--chart-2))', r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line 
              type="monotone" 
              dataKey="taxa" 
              stroke="hsl(var(--destructive))" 
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ fill: 'hsl(var(--destructive))', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
