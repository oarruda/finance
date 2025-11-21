'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Loader2, Plus, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from '@/components/ui/sheet';
import { Textarea } from '../ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { suggestWiseTransactionCategory } from '@/ai/flows/wise-transaction-category';
import { useUser, useFirebase } from '@/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { useLanguage } from '@/lib/i18n';

const formSchema = z.object({
  amount: z.coerce.number().positive({ message: 'Por favor, insira um valor positivo.' }),
  date: z.date({
    required_error: 'Uma data para a transação é obrigatória.',
  }),
  description: z.string().min(3, { message: 'A descrição deve ter pelo menos 3 caracteres.' }),
  category: z.string().min(1, { message: 'A categoria é obrigatória.' }),
  type: z.enum(['expense', 'income'], { required_error: 'O tipo é obrigatório.' }),
  currency: z.enum(['BRL', 'EUR', 'USD'], { required_error: 'A moeda é obrigatória.' }),
});

export function AddTransactionSheet() {
  const [open, setOpen] = React.useState(false);
  const [isSuggesting, setIsSuggesting] = React.useState(false);
  const { toast } = useToast();
  const { user } = useUser();
  const { firestore } = useFirebase();
  const { t } = useLanguage();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: new Date(),
      description: '',
      type: 'expense',
      currency: 'BRL',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user?.uid || !firestore) {
      toast({
        variant: 'destructive',
        title: t('toast.error'),
        description: t('toast.notAuthenticated'),
      });
      return;
    }

    try {
      const transactionsRef = collection(firestore, 'users', user.uid, 'transactions');
      await addDoc(transactionsRef, {
        description: values.description,
        amount: values.amount,
        date: values.date.toISOString(),
        category: values.category,
        type: values.type,
        currency: values.currency,
        createdAt: new Date().toISOString(),
      });

      toast({
        title: t('toast.success'),
        description: t('transactions.addSuccess'),
      });
      setOpen(false);
      form.reset({
        date: new Date(),
        description: '',
        type: 'expense',
        currency: 'BRL',
      });
    } catch (error) {
      console.error('Erro ao adicionar transação:', error);
      toast({
        variant: 'destructive',
        title: t('toast.error'),
        description: t('transactions.addError'),
      });
    }
  }

  async function handleSuggestCategory() {
    const description = form.getValues('description');
    if (!description) {
      form.setError('description', { message: 'Por favor, insira uma descrição primeiro.' });
      return;
    }
    setIsSuggesting(true);
    try {
        const result = await suggestWiseTransactionCategory({ transactionDetails: description });
        form.setValue('category', result.category);
    } catch (error) {
        toast({ variant: 'destructive', title: t('toast.aiSuggestionFailed'), description: t('transactions.suggestionError') });
    } finally {
        setIsSuggesting(false);
    }
  }


  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button>
            <Plus className="-ml-1 mr-2 h-4 w-4" />
            {t('dashboard.addTransaction')}
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{t('transaction.addTitle')}</SheetTitle>
          <SheetDescription>
            {t('transaction.addDesc')}
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('transaction.type')}</FormLabel>
                  <FormControl>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant={field.value === 'expense' ? 'default' : 'outline'}
                        className="flex-1"
                        onClick={() => field.onChange('expense')}
                      >
                        {t('transaction.expense')}
                      </Button>
                      <Button
                        type="button"
                        variant={field.value === 'income' ? 'default' : 'outline'}
                        className="flex-1"
                        onClick={() => field.onChange('income')}
                      >
                        {t('transaction.income')}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('transaction.description')}</FormLabel>
                  <FormControl>
                    <Textarea placeholder="ex: Aluguel, Supermercado, Salário" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
                <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>{t('transaction.amount')}</FormLabel>
                    <FormControl>
                        <Input type="number" step="0.01" placeholder="0.00" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>{t('transaction.currency')}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                        <SelectItem value="BRL">BRL (R$)</SelectItem>
                        <SelectItem value="EUR">EUR (€)</SelectItem>
                        <SelectItem value="USD">USD ($)</SelectItem>
                        </SelectContent>
                    </Select>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>
            
            <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
                <FormItem className="flex flex-col">
                <FormLabel>{t('transaction.date')}</FormLabel>
                <Popover>
                    <PopoverTrigger asChild>
                    <FormControl>
                        <Button
                        variant={'outline'}
                        className={cn(
                            'w-full pl-3 text-left font-normal',
                            !field.value && 'text-muted-foreground'
                        )}
                        >
                        {field.value ? (
                            format(field.value, 'PPP')
                        ) : (
                            <span>Selecione uma data</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                    </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                        date > new Date() || date < new Date('1900-01-01')
                        }
                        initialFocus
                    />
                    </PopoverContent>
                </Popover>
                <FormMessage />
                </FormItem>
            )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('transaction.category')}</FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <Input {...field} placeholder="ex: Alimentação, Moradia, Transporte" className="flex-grow" />
                    </FormControl>
                    <Button type="button" variant="outline" onClick={handleSuggestCategory} disabled={isSuggesting}>
                      {isSuggesting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 text-primary" />}
                      <span className="ml-2 hidden sm:inline">Sugerir</span>
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <SheetFooter className="pt-4">
                <Button type="submit" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {t('transaction.save')}
                </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
