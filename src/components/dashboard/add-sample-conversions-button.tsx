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
import { Coins, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useFirebase } from '@/firebase';
import { collection, addDoc } from 'firebase/firestore';

export function AddSampleConversionsButton({ disabled = false }: { disabled?: boolean }) {
  const { firestore, user } = useFirebase();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);
  const [isOpen, setIsOpen] = React.useState(false);

  // Bancos disponíveis
  const banks = ['Wise', 'C6', 'Itaú', 'Millennium', 'Novobanco'];

  // Pares de moedas comuns
  const currencyPairs = [
    { from: 'BRL', to: 'EUR', rate: 0.18 },
    { from: 'BRL', to: 'USD', rate: 0.20 },
    { from: 'EUR', to: 'BRL', rate: 5.50 },
    { from: 'USD', to: 'BRL', rate: 5.00 },
    { from: 'EUR', to: 'USD', rate: 1.10 },
    { from: 'USD', to: 'EUR', rate: 0.91 },
  ];

  // Notas sobre as conversões
  const notes = [
    'Conversão para viagem',
    'Pagamento internacional',
    'Transferência família',
    'Compra online exterior',
    'Investimento exterior',
    'Recebimento freelance',
    'Pagamento fornecedor',
    'Remessa internacional',
    'Compra cripto',
    'Reserva hotel',
  ];

  const randomAmount = (min: number, max: number) => 
    Math.floor(Math.random() * (max - min + 1) + min);

  const randomDate = (month: number, year: number) => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const day = Math.floor(Math.random() * daysInMonth) + 1;
    const hour = Math.floor(Math.random() * 24);
    const minute = Math.floor(Math.random() * 60);
    return new Date(year, month, day, hour, minute);
  };

  const randomItem = <T,>(array: T[]): T => 
    array[Math.floor(Math.random() * array.length)];

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const handleAddSampleConversions = async () => {
    if (!user || !firestore) return;

    setIsLoading(true);
    let totalAdded = 0;
    const currentYear = new Date().getFullYear();

    try {
      // Para cada mês do ano corrente, criar 5 conversões
      for (let month = 0; month < 12; month++) {
        const conversionsThisMonth = 5;

        for (let i = 0; i < conversionsThisMonth; i++) {
          const date = randomDate(month, currentYear);
          const pair = randomItem(currencyPairs);
          const bank = randomItem(banks);
          const note = randomItem(notes);
          
          // Valor original entre 100 e 5000
          const amountFrom = randomAmount(100, 5000);
          
          // Variação na taxa de ±5% para simular flutuação
          const rateVariation = 1 + (Math.random() * 0.1 - 0.05);
          const actualRate = pair.rate * rateVariation;
          
          // Valor convertido
          const amountTo = Math.round(amountFrom * actualRate * 100) / 100;
          
          // Taxa fixa (0.5% a 2% do valor)
          const feePercentage = 0.005 + Math.random() * 0.015;
          const fee = Math.round(amountFrom * feePercentage * 100) / 100;

          const conversion = {
            fromAmount: amountFrom,
            fromCurrency: pair.from,
            toAmount: amountTo,
            toCurrency: pair.to,
            bank,
            wiseFee: fee,
            amountAfterFee: amountFrom - fee,
            exchangeRate: Math.round(actualRate * 10000) / 10000,
            createdAt: new Date().toISOString(),
            // campos extras para compatibilidade futura
            notes: note,
            date: date.toISOString(),
            updatedAt: new Date().toISOString(),
          };

          const conversionsRef = collection(firestore, 'users', user.uid, 'wiseTransactions');
          await addDoc(conversionsRef, conversion);
          
          totalAdded++;

          // Delay a cada 5 conversões
          if (totalAdded % 5 === 0) {
            await sleep(50);
          }
        }
      }

      toast({
        title: 'Conversões de exemplo adicionadas!',
        description: `${totalAdded} conversões foram criadas para ${currentYear} (10 por mês).`,
      });

      setIsOpen(false);
      
      // Recarregar após 1 segundo
      setTimeout(() => {
        window.location.reload();
      }, 1000);

    } catch (error) {
      console.error('Erro ao adicionar conversões:', error);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível adicionar as conversões de exemplo.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm" disabled={disabled}>
          <Coins className="mr-2 h-4 w-4" />
          Conversões de exemplo
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Adicionar conversões de exemplo?</AlertDialogTitle>
          <AlertDialogDescription>
            Isso irá criar 120 conversões de exemplo para o ano corrente,
            com 10 conversões por mês distribuídas entre diferentes bancos e pares de moedas.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleAddSampleConversions} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adicionando...
              </>
            ) : (
              'Adicionar'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
