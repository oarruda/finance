'use client';
import { OverviewCards } from '@/components/dashboard/overview-cards';
import { ExpenseChart } from '@/components/dashboard/expense-chart';
import { RecentTransactions } from '@/components/dashboard/recent-transactions';
import { AddTransactionSheet } from '@/components/dashboard/add-transaction-sheet';
import { DeleteMonthDialog } from '@/components/dashboard/delete-month-dialog';
import { useLanguage } from '@/lib/i18n';

export default function DashboardPage() {
  const { t } = useLanguage();
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-headline tracking-tight">
            {t('dashboard.title')}
          </h1>
          <p className="text-muted-foreground">
            {t('dashboard.overview')}
          </p>
        </div>
        <div className="flex gap-2">
          <AddTransactionSheet />
          <DeleteMonthDialog />
        </div>
      </div>

      <OverviewCards />

      <div className="grid gap-6 md:grid-cols-2">
        <ExpenseChart />
        <RecentTransactions />
      </div>

    </div>
  );
}
