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
import { formatDistanceToNow, startOfMonth, endOfMonth, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '../ui/button';
import { Download, Loader2, Pencil, Calendar as CalendarIcon } from 'lucide-react';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit, doc, updateDoc, deleteDoc, where } from 'firebase/firestore';
import type { Transaction } from '@/lib/types';
import { Skeleton } from '../ui/skeleton';
import { MonthTransactionsModal } from './month-transactions-modal';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Calendar } from '../ui/calendar';
import * as React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/lib/i18n';

export function RecentTransactions() {
    const { firestore, user } = useFirebase();
    const { toast } = useToast();
    const { t } = useLanguage();
    const [editingTransaction, setEditingTransaction] = React.useState<Transaction | null>(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
    const [isSaving, setIsSaving] = React.useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
    const [isDeleting, setIsDeleting] = React.useState(false);
    
    // Estado para o modal de transações do mês
    const [selectedMonth, setSelectedMonth] = React.useState<Date | null>(null);
    const [isMonthModalOpen, setIsMonthModalOpen] = React.useState(false);

    const transactionsQuery = useMemoFirebase(() => {
        if (!user) return null;
        return query(collection(firestore, 'users', user.uid, 'transactions'), orderBy('date', 'desc'), limit(3));
    }, [firestore, user]);

    const { data: transactions, isLoading } = useCollection<Transaction>(transactionsQuery);

    // Query para buscar transações do mês selecionado
    const monthTransactionsQuery = useMemoFirebase(() => {
        if (!user || !selectedMonth) return null;
        
        const start = startOfMonth(selectedMonth);
        const end = endOfMonth(selectedMonth);
        
        return query(
            collection(firestore, 'users', user.uid, 'transactions'),
            where('date', '>=', start.toISOString()),
            where('date', '<=', end.toISOString()),
            orderBy('date', 'desc')
        );
    }, [firestore, user, selectedMonth]);

    const { data: monthTransactions, isLoading: isLoadingMonthTransactions } = useCollection<Transaction>(monthTransactionsQuery);

    const handleViewMonth = (month: Date) => {
        setSelectedMonth(month);
        setIsMonthModalOpen(true);
    };

    const handleEdit = (transaction: Transaction) => {
        setEditingTransaction(transaction);
        setIsEditDialogOpen(true);
    };

    const handleSave = async () => {
        if (!editingTransaction || !user?.uid || !firestore) return;

        setIsSaving(true);
        try {
            const transactionRef = doc(firestore, 'users', user.uid, 'transactions', editingTransaction.id);
            await updateDoc(transactionRef, {
                description: editingTransaction.description,
                amount: editingTransaction.amount,
                category: editingTransaction.category,
                currency: editingTransaction.currency || 'BRL',
                type: editingTransaction.type,
                date: typeof editingTransaction.date === 'string' ? editingTransaction.date : editingTransaction.date.toISOString(),
                updatedAt: new Date().toISOString(),
            });

            toast({
                title: t('toast.success'),
                description: t('transactions.updateSuccess'),
            });
            setIsEditDialogOpen(false);
            setEditingTransaction(null);
        } catch (error) {
            console.error('Erro ao atualizar transação:', error);
            toast({
                variant: 'destructive',
                title: t('toast.error'),
                description: t('transactions.updateError'),
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!editingTransaction || !user?.uid || !firestore) return;

        setIsDeleting(true);
        try {
            const transactionRef = doc(firestore, 'users', user.uid, 'transactions', editingTransaction.id);
            await deleteDoc(transactionRef);

            toast({
                title: t('toast.success'),
                description: t('transactions.deleteSuccess'),
            });
            setIsDeleteDialogOpen(false);
            setIsEditDialogOpen(false);
            setEditingTransaction(null);
        } catch (error) {
            console.error('Erro ao excluir transação:', error);
            toast({
                variant: 'destructive',
                title: t('toast.error'),
                description: t('transactions.deleteError'),
            });
        } finally {
            setIsDeleting(false);
        }
    };

  return (
    <>
    <Card>
      <CardHeader className='sm:flex-row sm:items-center sm:justify-between'>
        <div>
            <CardTitle>{t('dashboard.recentTransactions')}</CardTitle>
            <CardDescription>
                {t('transactions.recentList')}
            </CardDescription>
        </div>
        <div className="flex gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button size="sm" variant="outline">
                <CalendarIcon className="mr-2 h-4 w-4" />
                Ver mês
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-3" align="end">
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium mb-2 block">Mês</label>
                  <select
                    value={selectedMonth ? selectedMonth.getMonth() : new Date().getMonth()}
                    onChange={(e) => {
                      const newDate = new Date(selectedMonth || new Date());
                      newDate.setMonth(parseInt(e.target.value));
                      setSelectedMonth(newDate);
                    }}
                    className="w-full p-2 border rounded-md"
                  >
                    {Array.from({ length: 12 }, (_, i) => {
                      const date = new Date(2000, i, 1);
                      return (
                        <option key={i} value={i}>
                          {format(date, 'MMMM', { locale: ptBR })}
                        </option>
                      );
                    })}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Ano</label>
                  <select
                    value={selectedMonth ? selectedMonth.getFullYear() : new Date().getFullYear()}
                    onChange={(e) => {
                      const newDate = new Date(selectedMonth || new Date());
                      newDate.setFullYear(parseInt(e.target.value));
                      setSelectedMonth(newDate);
                    }}
                    className="w-full p-2 border rounded-md"
                  >
                    {Array.from({ length: 10 }, (_, i) => {
                      const year = new Date().getFullYear() - 5 + i;
                      return (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      );
                    })}
                  </select>
                </div>
                <Button 
                  onClick={() => selectedMonth && handleViewMonth(selectedMonth)} 
                  className="w-full"
                  size="sm"
                >
                  Ver transações
                </Button>
              </div>
            </PopoverContent>
          </Popover>
          <Button size="sm" variant="outline" onClick={() => alert('Exportando para .xlsx...')}>
              <Download className="mr-2 h-4 w-4" />
              {t('transactions.exportExcel')}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('transactions.description')}</TableHead>
              <TableHead>{t('transactions.category')}</TableHead>
              <TableHead className="hidden sm:table-cell">{t('transactions.date')}</TableHead>
              <TableHead className="text-right">{t('transactions.amount')}</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                    <TableCell><Skeleton className='h-5 w-32' /></TableCell>
                    <TableCell><Skeleton className='h-5 w-20' /></TableCell>
                    <TableCell className="hidden sm:table-cell"><Skeleton className='h-5 w-24' /></TableCell>
                    <TableCell className="text-right"><Skeleton className='h-5 w-16 float-right' /></TableCell>
                    <TableCell><Skeleton className='h-8 w-8' /></TableCell>
                </TableRow>
            ))}
            {transactions && transactions.map(transaction => (
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
                      ? 'text-green-500'
                      : 'text-red-500'
                  )}
                >
                  {transaction.type === 'income' ? '+' : '-'}
                  {formatCurrency(transaction.amount, transaction.currency || 'BRL')}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(transaction)}
                    className="transition-all duration-200 hover:scale-110 hover:rotate-12"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {!isLoading && transactions?.length === 0 && (
                <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                        {t('transactions.noData')}
                    </TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>

      {/* Dialog de Edição */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('transactions.editTitle')}</DialogTitle>
            <DialogDescription>
              {t('transactions.editDesc')}
            </DialogDescription>
          </DialogHeader>

          {editingTransaction && (
            <div className="space-y-4 py-4">
              {/* Tipo */}
              <div className="space-y-2">
                <Label>{t('transactions.type')}</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={editingTransaction.type === 'expense' ? 'default' : 'outline'}
                    className="flex-1"
                    onClick={() => setEditingTransaction({ ...editingTransaction, type: 'expense' })}
                  >
                    {t('transactions.expense')}
                  </Button>
                  <Button
                    type="button"
                    variant={editingTransaction.type === 'income' ? 'default' : 'outline'}
                    className="flex-1"
                    onClick={() => setEditingTransaction({ ...editingTransaction, type: 'income' })}
                  >
                    {t('transactions.income')}
                  </Button>
                </div>
              </div>

              {/* Descrição */}
              <div className="space-y-2">
                <Label htmlFor="edit-description">{t('transactions.description')}</Label>
                <Textarea
                  id="edit-description"
                  value={editingTransaction.description}
                  onChange={(e) => setEditingTransaction({ ...editingTransaction, description: e.target.value })}
                  placeholder={t('transactions.descPlaceholder')}
                />
              </div>

              {/* Valor, Moeda e Data */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Valor */}
                <div className="space-y-2">
                  <Label htmlFor="edit-amount">{t('transactions.amount')}</Label>
                  <Input
                    id="edit-amount"
                    type="number"
                    step="0.01"
                    value={editingTransaction.amount}
                    onChange={(e) => setEditingTransaction({ ...editingTransaction, amount: parseFloat(e.target.value) })}
                  />
                </div>

                {/* Moeda */}
                <div className="space-y-2">
                  <Label>{t('transactions.currency')}</Label>
                  <Select
                    value={editingTransaction.currency || 'BRL'}
                    onValueChange={(value) => setEditingTransaction({ ...editingTransaction, currency: value as 'BRL' | 'EUR' | 'USD' })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BRL">{t('currencies.BRL')}</SelectItem>
                      <SelectItem value="EUR">{t('currencies.EUR')}</SelectItem>
                      <SelectItem value="USD">{t('currencies.USD')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Data */}
                <div className="space-y-2">
                  <Label>{t('transactions.date')}</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !editingTransaction.date && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {editingTransaction.date ? format(new Date(editingTransaction.date), 'dd/MM/yyyy') : t('transactions.selectDate')}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={new Date(editingTransaction.date)}
                        onSelect={(date) => date && setEditingTransaction({ ...editingTransaction, date: date.toISOString() })}
                        disabled={(date) => date > new Date() || date < new Date('1900-01-01')}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Categoria */}
              <div className="space-y-2">
                <Label htmlFor="edit-category">{t('transactions.category')}</Label>
                <Input
                  id="edit-category"
                  value={editingTransaction.category}
                  onChange={(e) => setEditingTransaction({ ...editingTransaction, category: e.target.value })}
                  placeholder={t('transactions.categoryPlaceholder')}
                />
              </div>
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button 
              variant="destructive" 
              onClick={() => setIsDeleteDialogOpen(true)} 
              disabled={isSaving}
              className="sm:mr-auto"
            >
              {t('transactions.delete')}
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={isSaving}>
                {t('transactions.cancel')}
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t('transactions.save')}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AlertDialog de Confirmação de Exclusão */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('transactions.deleteConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('transactions.deleteConfirmDesc')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>{t('transactions.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('transactions.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>

    {/* Modal de Transações do Mês */}
    <MonthTransactionsModal
      open={isMonthModalOpen}
      onOpenChange={setIsMonthModalOpen}
      month={selectedMonth}
      transactions={monthTransactions || []}
      isLoading={isLoadingMonthTransactions}
    />
    </>
  );
}
