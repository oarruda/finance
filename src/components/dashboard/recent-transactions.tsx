'use client';
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
import { formatCurrency, cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '../ui/button';
import { Download, Loader2 } from 'lucide-react';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import type { Transaction } from '@/lib/types';
import { Skeleton } from '../ui/skeleton';

export function RecentTransactions() {
    const { firestore, user } = useFirebase();

    const transactionsQuery = useMemoFirebase(() => {
        if (!user) return null;
        return query(collection(firestore, 'users', user.uid, 'transactions'), orderBy('date', 'desc'), limit(5));
    }, [firestore, user]);

    const { data: transactions, isLoading } = useCollection<Transaction>(transactionsQuery);

  return (
    <Card>
      <CardHeader className='sm:flex-row sm:items-center sm:justify-between'>
        <div>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>
                A list of your most recent transactions.
            </CardDescription>
        </div>
        <Button size="sm" variant="outline" onClick={() => alert('Exporting to .xlsx...')}>
            <Download className="mr-2 h-4 w-4" />
            Export to .xlsx
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Description</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="hidden sm:table-cell">Date</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                    <TableCell><Skeleton className='h-5 w-32' /></TableCell>
                    <TableCell><Skeleton className='h-5 w-20' /></TableCell>
                    <TableCell className="hidden sm:table-cell"><Skeleton className='h-5 w-24' /></TableCell>
                    <TableCell className="text-right"><Skeleton className='h-5 w-16 float-right' /></TableCell>
                </TableRow>
            ))}
            {transactions && transactions.map(transaction => (
              <TableRow key={transaction.id}>
                <TableCell>
                    <div className="font-medium">{transaction.description}</div>
                    <div className="block sm:hidden text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(transaction.date.toDate()), { addSuffix: true })}
                    </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{transaction.category}</Badge>
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  {formatDistanceToNow(new Date(transaction.date.toDate()), { addSuffix: true })}
                </TableCell>
                <TableCell
                  className={cn(
                    'text-right font-medium',
                    transaction.type === 'income'
                      ? 'text-accent'
                      : 'text-foreground'
                  )}
                >
                  {transaction.type === 'income' ? '+' : ''}
                  {formatCurrency(transaction.amount, transaction.currency)}
                </TableCell>
              </TableRow>
            ))}
            {!isLoading && transactions?.length === 0 && (
                <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                        No transactions found. Add one to get started!
                    </TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
