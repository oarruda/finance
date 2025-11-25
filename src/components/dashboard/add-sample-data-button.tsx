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
import { Database, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useFirebase } from '@/firebase';
import { collection, addDoc } from 'firebase/firestore';

export function AddSampleDataButton({ disabled = false }: { disabled?: boolean }) {
  const { firestore, user } = useFirebase();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);
  const [isOpen, setIsOpen] = React.useState(false);

  // Categorias e características
  const categories = {
    'Alimentação': { type: 'expense', minAmount: 20, maxAmount: 150 },
    'Transporte': { type: 'expense', minAmount: 10, maxAmount: 80 },
    'Moradia': { type: 'expense', minAmount: 500, maxAmount: 1500 },
    'Saúde': { type: 'expense', minAmount: 50, maxAmount: 300 },
    'Educação': { type: 'expense', minAmount: 100, maxAmount: 500 },
    'Lazer': { type: 'expense', minAmount: 30, maxAmount: 200 },
    'Vestuário': { type: 'expense', minAmount: 50, maxAmount: 300 },
    'Tecnologia': { type: 'expense', minAmount: 100, maxAmount: 1000 },
    'Serviços': { type: 'expense', minAmount: 50, maxAmount: 200 },
    'Outros': { type: 'expense', minAmount: 20, maxAmount: 150 },
    'Salário': { type: 'income', minAmount: 3000, maxAmount: 8000 },
    'Freelance': { type: 'income', minAmount: 500, maxAmount: 2000 },
    'Investimentos': { type: 'income', minAmount: 100, maxAmount: 1000 },
    'Vendas': { type: 'income', minAmount: 50, maxAmount: 500 },
  };

  const descriptions: Record<string, string[]> = {
    'Alimentação': ['Supermercado', 'Restaurante', 'Lanchonete', 'Padaria', 'Feira', 'Delivery', 'Café'],
    'Transporte': ['Uber', 'Combustível', 'Ônibus', 'Metrô', 'Estacionamento', 'Pedágio'],
    'Moradia': ['Aluguel', 'Condomínio', 'Luz', 'Água', 'Internet', 'Gás'],
    'Saúde': ['Farmácia', 'Consulta', 'Dentista', 'Exames', 'Academia', 'Plano'],
    'Educação': ['Curso online', 'Livros', 'Material', 'Mensalidade'],
    'Lazer': ['Cinema', 'Show', 'Viagem', 'Streaming', 'Jogos'],
    'Vestuário': ['Roupas', 'Calçados', 'Acessórios'],
    'Tecnologia': ['Celular', 'Notebook', 'Acessórios', 'Software'],
    'Serviços': ['Limpeza', 'Manutenção', 'Assinatura'],
    'Outros': ['Presente', 'Diversos', 'Imprevisto'],
    'Salário': ['Salário mensal', 'Pagamento'],
    'Freelance': ['Projeto', 'Trabalho extra', 'Consultoria'],
    'Investimentos': ['Rendimento', 'Dividendos', 'Lucro'],
    'Vendas': ['Venda', 'Comissão'],
  };

  const randomAmount = (min: number, max: number) => 
    Math.floor(Math.random() * (max - min + 1) + min);

  const randomDate = (month: number, year: number) => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const day = Math.floor(Math.random() * daysInMonth) + 1;
    const hour = Math.floor(Math.random() * 24);
    const minute = Math.floor(Math.random() * 60);
    return new Date(year, month, day, hour, minute);
  };

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const handleAddSampleData = async () => {
    if (!user || !firestore) return;

    setIsLoading(true);
    let totalAdded = 0;
    const currencies = ['BRL', 'EUR', 'USD'];
    const currentYear = new Date().getFullYear();

    try {
      // Para cada mês do ano corrente
      for (let month = 0; month < 12; month++) {
        // Gerar 5 transações aleatórias por mês
        for (let i = 0; i < 5; i++) {
          // Seleciona categoria aleatória
          const categoryKeys = Object.keys(categories);
          const category = categoryKeys[Math.floor(Math.random() * categoryKeys.length)];
          const config = categories[category as keyof typeof categories];
          const date = randomDate(month, currentYear);
          const amount = randomAmount(config.minAmount, config.maxAmount);
          const descOptions = descriptions[category];
          const description = descOptions[Math.floor(Math.random() * descOptions.length)];
          const currency = currencies[Math.floor(Math.random() * currencies.length)];

          const transaction = {
            amount,
            category,
            currency,
            date: date.toISOString(),
            description,
            type: config.type,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          const transactionsRef = collection(firestore, 'users', user.uid, 'transactions');
          await addDoc(transactionsRef, transaction);
          totalAdded++;

          // Delay a cada 10 transações
          if (totalAdded % 10 === 0) {
            await sleep(50);
          }
        }
      }

      toast({
        title: 'Dados de exemplo adicionados!',
        description: `${totalAdded} transações foram criadas para ${currentYear} (5 por mês).`,
      });

      setIsOpen(false);
      
      // Recarregar após 1 segundo
      setTimeout(() => {
        window.location.reload();
      }, 1000);

    } catch (error) {
      console.error('Erro ao adicionar dados:', error);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível adicionar os dados de exemplo.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm" disabled={disabled}>
          <Database className="mr-2 h-4 w-4" />
          Transações de exemplo
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Adicionar transações de exemplo?</AlertDialogTitle>
          <AlertDialogDescription>
            Isso irá criar 60 transações de exemplo para o ano corrente,
            com 5 transações por mês. Útil para demonstração do aplicativo.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleAddSampleData} disabled={isLoading}>
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
