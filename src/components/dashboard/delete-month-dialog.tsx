'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Trash2, Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/lib/i18n';
import { useFirebase } from '@/firebase';
import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';

export function DeleteMonthDialog() {
    const { firestore, user } = useFirebase();
    const { toast } = useToast();
    const { t, language } = useLanguage();
    const [selectedMonth, setSelectedMonth] = React.useState<Date | undefined>(new Date());
    const [isDeleting, setIsDeleting] = React.useState(false);
    const [isOpen, setIsOpen] = React.useState(false);

    const handleDeleteMonth = async () => {
        if (!selectedMonth || !user?.uid || !firestore) return;

        setIsDeleting(true);
        try {
            const monthStart = startOfMonth(selectedMonth);
            const monthEnd = endOfMonth(selectedMonth);

            // Buscar todas as transações do mês
            const transactionsRef = collection(firestore, 'users', user.uid, 'transactions');
            const monthQuery = query(
                transactionsRef,
                where('date', '>=', monthStart.toISOString()),
                where('date', '<=', monthEnd.toISOString())
            );
            
            const snapshot = await getDocs(monthQuery);
            
            // Deletar todas as transações
            const deletePromises = snapshot.docs.map(docSnap => 
                deleteDoc(doc(firestore, 'users', user.uid, 'transactions', docSnap.id))
            );
            
            await Promise.all(deletePromises);

            toast({
                title: t('toast.success'),
                description: t('transactions.deleteMonthSuccess'),
            });
            setIsOpen(false);
        } catch (error) {
            console.error('Erro ao deletar transações:', error);
            toast({
                variant: 'destructive',
                title: t('toast.error'),
                description: t('transactions.deleteMonthError'),
            });
        } finally {
            setIsDeleting(false);
        }
    };

    const getMonthName = () => {
        if (!selectedMonth) return '';
        const locale = language === 'PT-BR' || language === 'PT-PT' ? ptBR : undefined;
        return format(selectedMonth, 'MMMM yyyy', { locale });
    };

    return (
        <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
            <AlertDialogTrigger asChild>
                <Button variant="destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    {t('transactions.deleteMonth')}
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{t('transactions.deleteMonthTitle')}</AlertDialogTitle>
                    <AlertDialogDescription>
                        {selectedMonth 
                            ? t('transactions.deleteMonthConfirm').replace('{month}', getMonthName())
                            : t('transactions.deleteMonthDesc')
                        }
                    </AlertDialogDescription>
                </AlertDialogHeader>
                
                <div className="py-4">
                    <Label>{t('transactions.selectMonth')}</Label>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" className="w-full justify-start text-left font-normal mt-2">
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {selectedMonth ? getMonthName() : t('transactions.selectMonth')}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                mode="single"
                                selected={selectedMonth}
                                onSelect={setSelectedMonth}
                                initialFocus
                            />
                        </PopoverContent>
                    </Popover>
                </div>

                <AlertDialogFooter>
                    <AlertDialogCancel>{t('transactions.cancel')}</AlertDialogCancel>
                    <AlertDialogAction 
                        onClick={handleDeleteMonth}
                        disabled={isDeleting || !selectedMonth}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                        {isDeleting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                {t('transactions.deleting')}
                            </>
                        ) : (
                            t('transactions.confirmDelete')
                        )}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
