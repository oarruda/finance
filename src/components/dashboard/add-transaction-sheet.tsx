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
import { addTransactionAction } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { suggestWiseTransactionCategory } from '@/ai/flows/wise-transaction-category';

const formSchema = z.object({
  amount: z.coerce.number().positive({ message: 'Please enter a positive amount.' }),
  date: z.date({
    required_error: 'A date for the transaction is required.',
  }),
  description: z.string().min(3, { message: 'Description must be at least 3 characters.' }),
  category: z.string().optional(),
});

const WISE_FEE = 0.0399;

export function AddTransactionSheet() {
  const [open, setOpen] = React.useState(false);
  const [isSuggesting, setIsSuggesting] = React.useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: new Date(),
      description: '',
    },
  });

  const amountInBRL = form.watch('amount') || 0;
  const convertedAmount = amountInBRL - (amountInBRL * WISE_FEE);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const result = await addTransactionAction(values);
    if (result.success) {
      toast({
        title: 'Success!',
        description: result.message,
      });
      setOpen(false);
      form.reset();
    } else {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to add transaction.',
      });
    }
  }

  async function handleSuggestCategory() {
    const description = form.getValues('description');
    if (!description) {
      form.setError('description', { message: 'Please enter a description first.' });
      return;
    }
    setIsSuggesting(true);
    try {
        const result = await suggestWiseTransactionCategory({ transactionDetails: description });
        form.setValue('category', result.category);
    } catch (error) {
        toast({ variant: 'destructive', title: 'AI Suggestion Failed', description: 'Could not suggest a category.' });
    } finally {
        setIsSuggesting(false);
    }
  }


  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button>
            <Plus className="-ml-1 mr-2 h-4 w-4" />
            Add Transaction
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Add WISE Transaction</SheetTitle>
          <SheetDescription>
            Record a new WISE currency exchange from BRL to EUR.
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="e.g., Monthly savings for trip" {...field} />
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
                    <FormLabel>Amount (BRL)</FormLabel>
                    <FormControl>
                        <Input type="number" placeholder="1000.00" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                    <FormItem className="flex flex-col pt-2">
                    <FormLabel className="mb-2">Transaction Date</FormLabel>
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
                                <span>Pick a date</span>
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
            </div>

            <div className="space-y-2">
                <Label>Category</Label>
                <div className="flex gap-2">
                    <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                        <Input {...field} placeholder="e.g., Travel, Investment" className="flex-grow" />
                    )}
                    />
                    <Button type="button" variant="outline" onClick={handleSuggestCategory} disabled={isSuggesting}>
                        {isSuggesting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 text-primary" />}
                        <span className="ml-2 hidden sm:inline">Suggest</span>
                    </Button>
                </div>
                 <FormMessage>{form.formState.errors.category?.message}</FormMessage>
            </div>

            <div className='p-4 rounded-md border bg-muted/50 text-sm space-y-2'>
                <div className="flex justify-between">
                    <span className="text-muted-foreground">WISE fee (3.99%):</span>
                    <span className="font-medium">- {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amountInBRL * WISE_FEE)}</span>
                </div>
                <div className="flex justify-between font-semibold">
                    <span>You'll receive (EUR):</span>
                    <span>~ {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(convertedAmount / 5.85)}</span>
                </div>
                <p className="text-xs text-muted-foreground pt-1">Exchange rate is an estimate.</p>
            </div>

            <SheetFooter className="pt-4">
                <Button type="submit" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Transaction
                </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
