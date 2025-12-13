"use client";
import { useState } from "react";
import { OverviewCards } from '@/components/dashboard/overview-cards';
import { ExpenseChart } from '@/components/dashboard/expense-chart';
import { RecentTransactions } from '@/components/dashboard/recent-transactions';
import { AddTransactionSheet } from '@/components/dashboard/add-transaction-sheet';
import { DeleteMonthDialog } from '@/components/dashboard/delete-month-dialog';
import { AddSampleDataButton } from '@/components/dashboard/add-sample-data-button';
import { AddSampleConversionsButton } from '@/components/dashboard/add-sample-conversions-button';
import { ClearDemoDataButton } from '@/components/dashboard/clear-demo-data-button';
import { WiseConversionCard } from '@/components/dashboard/conversao-card';
import { ConversionHistoryChart } from '@/components/dashboard/conversion-history-chart';
import { ConversionStats } from '@/components/dashboard/conversion-stats';
import { useLanguage } from '@/lib/i18n';
import { usePermissions } from '@/hooks/use-permissions';

export default function DashboardPage() {
  const { t } = useLanguage();
  const { isMaster, canEdit } = usePermissions();
  
  const [demoOpen, setDemoOpen] = useState(false);
  const { DemoModal } = require('@/components/dashboard/demo-modal');
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
        <div className="flex flex-wrap gap-2">
          {isMaster && (
            <>
              <button
                className="bg-zinc-800 text-white px-4 py-2 rounded font-semibold shadow hover:bg-zinc-900 transition"
                onClick={() => setDemoOpen(true)}
              >
                Demonstração
              </button>
              <DemoModal open={demoOpen} onOpenChange={setDemoOpen} />
              <div className="w-px h-8 bg-border" />
            </>
          )}
          {canEdit && <AddTransactionSheet />}
          {canEdit && <DeleteMonthDialog />}
        </div>
      </div>

      <OverviewCards />

      <div className="grid gap-6 md:grid-cols-2">
        <ExpenseChart />
        <RecentTransactions />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-3">
          <WiseConversionCard />
          <ConversionStats />
        </div>
        <ConversionHistoryChart />
      </div>

    </div>
  );
}
