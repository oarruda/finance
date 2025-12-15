'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';
import { enUS } from 'date-fns/locale/en-US';
import { es } from 'date-fns/locale/es';
import { Calendar as CalendarIcon, Loader2, Plus, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
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
import { collection, addDoc, doc, setDoc, getDoc } from 'firebase/firestore';
import { useLanguage } from '@/lib/i18n';
import { Badge } from '@/components/ui/badge';

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
  const [datePickerOpen, setDatePickerOpen] = React.useState(false);
  const [isSuggesting, setIsSuggesting] = React.useState(false);
  const [recentCategories, setRecentCategories] = React.useState<string[]>([]);
  const [isMobile, setIsMobile] = React.useState(false);
  const { toast } = useToast();
  const { user } = useUser();
  const { firestore } = useFirebase();
  const { t, language } = useLanguage();

  const getLocale = () => {
    switch (language) {
      case 'PT-BR':
      case 'pt-BR':
        return ptBR;
      case 'ES-ES':
      case 'es-ES':
        return es;
      case 'EN-US':
      case 'en-US':
      default:
        return enUS;
    }
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: new Date(),
      description: '',
      type: 'expense',
      currency: 'BRL',
    },
  });

  // Detectar se é mobile
  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Carregar categorias recentes ao abrir o sheet
  React.useEffect(() => {
    if (open && user?.uid && firestore) {
      const loadCategories = async () => {
        try {
          console.log('🔍 Carregando categorias para user:', user.uid);
          const categoriesRef = doc(firestore, 'users', user.uid, 'settings', 'categories');
          const categoriesDoc = await getDoc(categoriesRef);
          console.log('📄 Documento existe:', categoriesDoc.exists());
          if (categoriesDoc.exists()) {
            const data = categoriesDoc.data();
            console.log('📦 Dados do documento:', data);
            setRecentCategories(data.recent || []);
            console.log('✅ Categorias carregadas:', data.recent || []);
          } else {
            console.log('⚠️ Documento de categorias não existe ainda');
          }
        } catch (error) {
          console.error('❌ Erro ao carregar categorias:', error);
        }
      };
      loadCategories();
    }
  }, [open, user, firestore]);

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

      // Salvar categoria nas recentes
      await saveCategoryToRecents(values.category);

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

  async function saveCategoryToRecents(category: string) {
    if (!user?.uid || !firestore || !category) return;

    try {
      console.log('💾 Salvando categoria:', category);
      const categoriesRef = doc(firestore, 'users', user.uid, 'settings', 'categories');
      const categoriesDoc = await getDoc(categoriesRef);
      
      let categories: string[] = [];
      if (categoriesDoc.exists()) {
        categories = categoriesDoc.data().recent || [];
        console.log('📋 Categorias existentes:', categories);
      }

      // Remover categoria se já existe (para colocar no início)
      categories = categories.filter(cat => cat.toLowerCase() !== category.toLowerCase());
      
      // Adicionar no início
      categories.unshift(category);
      
      // Manter apenas as últimas 10 categorias
      categories = categories.slice(0, 10);

      console.log('💾 Salvando categorias atualizadas:', categories);
      await setDoc(categoriesRef, { recent: categories });
      setRecentCategories(categories);
      console.log('✅ Categorias salvas com sucesso!');
    } catch (error) {
      console.error('❌ Erro ao salvar categoria:', error);
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
          <SheetTitle>{t('transactions.addTitle')}</SheetTitle>
          <SheetDescription>
            {t('transactions.addDesc')}
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                <FormLabel>{t('transactions.type')}</FormLabel>
                  <FormControl>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant={field.value === 'expense' ? 'default' : 'outline'}
                        className="flex-1"
                        onClick={() => field.onChange('expense')}
                      >
                        {t('transactions.expense')}
                      </Button>
                      <Button
                        type="button"
                        variant={field.value === 'income' ? 'default' : 'outline'}
                        className="flex-1"
                        onClick={() => field.onChange('income')}
                      >
                        {t('transactions.income')}
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
                  <FormLabel>{t('transactions.description')}</FormLabel>
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
                    <FormLabel>{t('transactions.amount')}</FormLabel>
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
                    <FormLabel>{t('transactions.currency')}</FormLabel>
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
                <FormLabel>{t('transactions.date')}</FormLabel>
                {isMobile ? (
                  <Dialog open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                    <DialogTrigger asChild>
                      <FormControl>
                        <Button
                        variant={'outline'}
                        className={cn(
                            'w-full pl-3 text-left font-normal',
                            !field.value && 'text-muted-foreground'
                        )}
                        >
                        {field.value ? (
                            format(new Date(field.value), 'PPP', { locale: getLocale() })
                        ) : (
                            <span>{t('transactions.selectDate')}</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={(date) => {
                          field.onChange(date);
                          setDatePickerOpen(false);
                        }}
                        disabled={(date) =>
                          date > new Date() || date < new Date('1900-01-01')
                        }
                        locale={getLocale()}
                        initialFocus
                      />
                    </DialogContent>
                  </Dialog>
                ) : (
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
                            format(new Date(field.value), 'PPP', { locale: getLocale() })
                        ) : (
                            <span>{t('transactions.selectDate')}</span>
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
                        locale={getLocale()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                )}
                <FormMessage />
                </FormItem>
            )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('transactions.category')}</FormLabel>
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
                  
                  {/* Debug: sempre mostrar a seção */}
                  <div className="mt-2">
                    {recentCategories.length > 0 ? (
                      <>
                        <p className="text-sm text-muted-foreground mb-2">{t('transactions.recentCategories')}:</p>
                        <div className="flex flex-wrap gap-2">
                          {recentCategories.map((category, index) => (
                            <Badge
                              key={index}
                              variant="secondary"
                              className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                              onClick={() => form.setValue('category', category)}
                            >
                              {category}
                            </Badge>
                          ))}
                        </div>
                      </>
                    ) : (
                      <p className="text-xs text-muted-foreground italic">
                        Suas categorias recentes aparecerão aqui após adicionar transações
                      </p>
                    )}
                  </div>
                </FormItem>
              )}
            />

            <SheetFooter className="pt-4">
                <Button type="submit" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {t('transactions.save')}
                </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
