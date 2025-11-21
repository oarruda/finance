import { OverviewCards } from '@/components/dashboard/overview-cards';
import { ExpenseChart } from '@/components/dashboard/expense-chart';
import { RecentTransactions } from '@/components/dashboard/recent-transactions';
import { AIInsights } from '@/components/dashboard/ai-insights';
import { AddTransactionSheet } from '@/components/dashboard/add-transaction-sheet';

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-headline tracking-tight">
            Dashboard
          </h1>
          <p className="text-muted-foreground">
            Here's a summary of your family's finances.
          </p>
        </div>
        <AddTransactionSheet />
      </div>

      <OverviewCards />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <div className="lg:col-span-4">
          <ExpenseChart />
        </div>
        <div className="lg:col-span-3">
            <AIInsights />
        </div>
      </div>
      
      <RecentTransactions />

    </div>
  );
}
