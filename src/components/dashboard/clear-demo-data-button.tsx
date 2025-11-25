'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Trash2, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useFirebase } from '@/firebase';
import { collection, getDocs, deleteDoc, doc, query, where } from 'firebase/firestore';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

type DeleteOption = 'transactions' | 'conversions' | 'all';

export function ClearDemoDataButton() {
  const { firestore, user } = useFirebase();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);
  const [isOpen, setIsOpen] = React.useState(false);
  const [deleteOption, setDeleteOption] = React.useState<DeleteOption>('all');
  const [remainingTransactions, setRemainingTransactions] = React.useState<number | null>(null);
  const [remainingConversions, setRemainingConversions] = React.useState<number | null>(null);

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const deleteAllTransactions = async () => {
    if (!user || !firestore) return 0;
    const transactionsRef = collection(firestore, 'users', user.uid, 'transactions');
    const snapshot = await getDocs(transactionsRef);
    let deleted = 0;
    let total = snapshot.size;
    setRemainingTransactions(total);
    for (const docSnap of snapshot.docs) {
      await deleteDoc(doc(firestore, 'users', user.uid, 'transactions', docSnap.id));
      deleted++;
      setRemainingTransactions(total - deleted);
      if (deleted % 50 === 0) {
        await sleep(100);
      }
    }
    setRemainingTransactions(0);
    return deleted;
  };

  const deleteAllConversions = async () => {
    if (!user || !firestore) return 0;
    const conversionsRef = collection(firestore, 'users', user.uid, 'wiseTransactions');
    const snapshot = await getDocs(conversionsRef);
    let deleted = 0;
    let total = snapshot.size;
    setRemainingConversions(total);
    for (const docSnap of snapshot.docs) {
      await deleteDoc(doc(firestore, 'users', user.uid, 'wiseTransactions', docSnap.id));
      deleted++;
      setRemainingConversions(total - deleted);
      if (deleted % 20 === 0) {
        await sleep(100);
      }
    }
    setRemainingConversions(0);
    return deleted;
  };

  const handleClearData = async () => {
    if (!user || !firestore) return;

    setIsLoading(true);
    let transactionsDeleted = 0;
    let conversionsDeleted = 0;

    try {
      if (deleteOption === 'transactions' || deleteOption === 'all') {
        transactionsDeleted = await deleteAllTransactions();
      }

      if (deleteOption === 'conversions' || deleteOption === 'all') {
        conversionsDeleted = await deleteAllConversions();
      }

      const totalDeleted = transactionsDeleted + conversionsDeleted;

      toast({
        title: 'Dados removidos!',
        description: `${transactionsDeleted} transações e ${conversionsDeleted} conversões foram excluídas.`,
      });

      // Só fecha o modal após terminar tudo
      setTimeout(() => {
        setIsOpen(false);
        window.location.reload();
      }, 1000);

    } catch (error) {
      console.error('Erro ao remover dados:', error);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível remover os dados.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={isLoading ? () => {} : setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm">
          <Trash2 className="mr-2 h-4 w-4" />
          Limpar Dados Demo
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Limpar dados de demonstração?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta ação não pode ser desfeita. Escolha o que deseja remover:
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="py-4">
          {(isLoading && (remainingTransactions !== null || remainingConversions !== null)) && (
            <div className="mb-4 text-sm text-muted-foreground">
              {deleteOption !== 'conversions' && remainingTransactions !== null && (
                <div>Transações restantes: {remainingTransactions}</div>
              )}
              {deleteOption !== 'transactions' && remainingConversions !== null && (
                <div>Conversões restantes: {remainingConversions}</div>
              )}
            </div>
          )}
          <RadioGroup value={deleteOption} onValueChange={(value) => setDeleteOption(value as DeleteOption)}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="transactions" id="transactions" />
              <Label htmlFor="transactions" className="font-normal cursor-pointer">
                Apenas transações
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="conversions" id="conversions" />
              <Label htmlFor="conversions" className="font-normal cursor-pointer">
                Apenas conversões
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="all" id="all" />
              <Label htmlFor="all" className="font-normal cursor-pointer">
                Tudo (transações + conversões)
              </Label>
            </div>
          </RadioGroup>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleClearData} 
            disabled={isLoading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Removendo...
              </>
            ) : (
              'Confirmar Exclusão'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
