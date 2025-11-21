import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { overviewData } from '@/lib/data';
import { cn } from '@/lib/utils';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

export function OverviewCards() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {overviewData.map(item => (
        <Card key={item.label}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{item.label}</CardTitle>
            <item.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{item.value}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <span
                className={cn(
                  'flex items-center gap-1',
                  item.changeType === 'positive'
                    ? 'text-accent'
                    : 'text-destructive'
                )}
              >
                {item.changeType === 'positive' ? <ArrowUpRight className='h-4 w-4' /> : <ArrowDownRight className='h-4 w-4'/>}
                {item.change}
              </span>
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
