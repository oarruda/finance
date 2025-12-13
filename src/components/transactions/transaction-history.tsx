'use client';

import * as React from 'react';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit, where } from 'firebase/firestore';
import type { TransactionHistoryEntry } from '@/lib/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatTransactionDiff } from '@/lib/audit-log';
import { Clock, User, FileText } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface TransactionHistoryProps {
  transactionId?: string;
  maxResults?: number;
}

export function TransactionHistory({ transactionId, maxResults = 50 }: TransactionHistoryProps) {
  const { firestore } = useFirebase();

  const historyQuery = useMemoFirebase(() => {
    const baseQuery = collection(firestore, 'transactionHistory');
    
    if (transactionId) {
      return query(
        baseQuery,
        where('transactionId', '==', transactionId),
        orderBy('timestamp', 'desc'),
        limit(maxResults)
      );
    }
    
    return query(
      baseQuery,
      orderBy('timestamp', 'desc'),
      limit(maxResults)
    );
  }, [firestore, transactionId, maxResults]);

  const { data: history, isLoading } = useCollection<TransactionHistoryEntry>(historyQuery);

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return 'Data desconhecida';
    
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }).format(date);
    } catch {
      return 'Data inválida';
    }
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'created':
        return <Badge variant="default" className="bg-green-600">Criado</Badge>;
      case 'updated':
        return <Badge variant="default" className="bg-blue-600">Atualizado</Badge>;
      case 'deleted':
        return <Badge variant="destructive">Deletado</Badge>;
      default:
        return <Badge variant="outline">{action}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Alterações</CardTitle>
          <CardDescription>Carregando histórico...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!history || history.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Alterações</CardTitle>
          <CardDescription>Registro de todas as modificações nas transações</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum histórico encontrado</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Histórico de Alterações</CardTitle>
        <CardDescription>
          {transactionId 
            ? 'Histórico desta transação'
            : `Últimas ${maxResults} alterações registradas`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data/Hora</TableHead>
              <TableHead>Ação</TableHead>
              <TableHead>Usuário</TableHead>
              <TableHead>Alterações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {history.map((entry) => {
              const changes = formatTransactionDiff(
                entry.changes?.before,
                entry.changes?.after
              );

              return (
                <TableRow key={entry.id}>
                  <TableCell className="font-mono text-xs">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      {formatTimestamp(entry.timestamp)}
                    </div>
                  </TableCell>
                  <TableCell>{getActionBadge(entry.action)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium">{entry.userName}</div>
                        <div className="text-xs text-muted-foreground">{entry.userEmail}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {changes.length > 0 ? (
                      <ul className="text-sm space-y-1">
                        {changes.map((change, idx) => (
                          <li key={idx} className="text-muted-foreground">
                            {change}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-muted-foreground text-sm">Sem detalhes</span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
