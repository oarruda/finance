import { transactionInsights } from '@/ai/flows/transaction-insights';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { transactions } from '@/lib/data';
import { Lightbulb } from 'lucide-react';

export async function AIInsights() {
  const transactionDataString = JSON.stringify(transactions.slice(0, 5), null, 2);

  let insightsResult;
  try {
     insightsResult = await transactionInsights({
        transactionData: transactionDataString,
      });
  } catch (error) {
    console.error("Error fetching AI insights:", error);
    insightsResult = { insights: "Could not load AI insights at this time. Please check your configuration."}
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex items-start justify-between">
            <div>
                <CardTitle>AI-Powered Insights</CardTitle>
                <CardDescription>Suggestions based on your recent activity.</CardDescription>
            </div>
            <div className="p-2 bg-primary/10 rounded-lg">
                <Lightbulb className="h-5 w-5 text-primary" />
            </div>
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
          {insightsResult.insights}
        </p>
      </CardContent>
    </Card>
  );
}
