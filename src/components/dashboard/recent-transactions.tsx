import { transactions } from '@/lib/data';
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
import { Download } from 'lucide-react';

export function RecentTransactions() {
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
            {transactions.map(transaction => (
              <TableRow key={transaction.id}>
                <TableCell>
                    <div className="font-medium">{transaction.description}</div>
                    <div className="block sm:hidden text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(transaction.date), { addSuffix: true })}
                    </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{transaction.category}</Badge>
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  {formatDistanceToNow(new Date(transaction.date), { addSuffix: true })}
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
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
