'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Trash2, Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfDay, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/lib/i18n';
import { useFirebase } from '@/firebase';
import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';

type DeleteType = 'day' | 'month';

export function DeleteMonthDialog() {
    const { firestore, user } = useFirebase();
    const { toast } = useToast();
    const { t, language } = useLanguage();
    const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(new Date());
    const [deleteType, setDeleteType] = React.useState<DeleteType>('month');
    const [isDeleting, setIsDeleting] = React.useState(false);
    const [isOpen, setIsOpen] = React.useState(false);

    const handleDelete = async () => {
        if (!selectedDate || !user?.uid || !firestore) return;

        setIsDeleting(true);
        try {
            let startDate: Date;
            let endDate: Date;

            if (deleteType === 'day') {
                startDate = startOfDay(selectedDate);
                endDate = endOfDay(selectedDate);
            } else {
                startDate = startOfMonth(selectedDate);
                endDate = endOfMonth(selectedDate);
            }

            // Buscar todas as transações do período
            const transactionsRef = collection(firestore, 'users', user.uid, 'transactions');
            const periodQuery = query(
                transactionsRef,
                where('date', '>=', startDate.toISOString()),
                where('date', '<=', endDate.toISOString())
            );
            
            const snapshot = await getDocs(periodQuery);
            
            // Deletar todas as transações
            const deletePromises = snapshot.docs.map(docSnap => 
                deleteDoc(doc(firestore, 'users', user.uid, 'transactions', docSnap.id))
            );
            
            await Promise.all(deletePromises);

            toast({
                title: t('toast.success'),
                description: deleteType === 'day' 
                    ? t('transactions.deleteDaySuccess') 
                    : t('transactions.deleteMonthSuccess'),
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

    const getFormattedDate = () => {
        if (!selectedDate) return '';
        const locale = language === 'PT-BR' || language === 'PT-PT' ? ptBR : undefined;
        if (deleteType === 'day') {
            return format(selectedDate, 'dd/MM/yyyy', { locale });
        }
        return format(selectedDate, 'MMMM yyyy', { locale });
    };

    return (
        <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
            <AlertDialogTrigger asChild>
                <Button variant="destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Excluir Transação
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{t('transactions.selectDateToDelete')}</AlertDialogTitle>
                    <AlertDialogDescription>
                        {t('transactions.selectDateToDeleteDesc')}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                
                <div className="space-y-4 py-4">
                    <div>
                        <Label>{t('transactions.deleteType')}</Label>
                        <RadioGroup value={deleteType} onValueChange={(value) => setDeleteType(value as DeleteType)} className="mt-2">
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="day" id="day" />
                                <Label htmlFor="day" className="font-normal cursor-pointer">
                                    {t('transactions.deleteDay')}
                                </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="month" id="month" />
                                <Label htmlFor="month" className="font-normal cursor-pointer">
                                    {t('transactions.deleteMonth')}
                                </Label>
                            </div>
                        </RadioGroup>
                    </div>

                    <div>
                        <Label>
                            {deleteType === 'day' ? t('transactions.selectDay') : t('transactions.selectMonth')}
                        </Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="w-full justify-start text-left font-normal mt-2">
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {selectedDate ? getFormattedDate() : t('transactions.selectDate')}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                {deleteType === 'day' ? (
                                    <Calendar
                                        mode="single"
                                        selected={selectedDate}
                                        onSelect={setSelectedDate}
                                        initialFocus
                                    />
                                ) : (
                                    <div className="p-3">
                                        <select
                                            value={selectedDate ? selectedDate.getMonth() : new Date().getMonth()}
                                            onChange={(e) => {
                                                const newDate = new Date(selectedDate || new Date());
                                                newDate.setMonth(parseInt(e.target.value));
                                                setSelectedDate(newDate);
                                            }}
                                            className="w-full p-2 mb-2 border rounded-md"
                                        >
                                            {Array.from({ length: 12 }, (_, i) => {
                                                const date = new Date(2000, i, 1);
                                                const locale = language === 'PT-BR' || language === 'PT-PT' ? ptBR : undefined;
                                                return (
                                                    <option key={i} value={i}>
                                                        {format(date, 'MMMM', { locale })}
                                                    </option>
                                                );
                                            })}
                                        </select>
                                        <select
                                            value={selectedDate ? selectedDate.getFullYear() : new Date().getFullYear()}
                                            onChange={(e) => {
                                                const newDate = new Date(selectedDate || new Date());
                                                newDate.setFullYear(parseInt(e.target.value));
                                                setSelectedDate(newDate);
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
                                )}
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>

                <AlertDialogFooter>
                    <AlertDialogCancel>{t('transactions.cancel')}</AlertDialogCancel>
                    <AlertDialogAction 
                        onClick={handleDelete}
                        disabled={isDeleting || !selectedDate}
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
