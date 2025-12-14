'use client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn, formatCurrency } from '@/lib/utils';
import { ArrowUpRight, ArrowDownRight, DollarSign, CreditCard, Users, TrendingUp, CheckCircle } from 'lucide-react';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import type { Transaction, User as UserType } from '@/lib/types';
import { collection, query, where, Timestamp } from 'firebase/firestore';
import { Skeleton } from '../ui/skeleton';
import { useUserCurrency } from '@/hooks/use-user-currency';
import { useLanguage } from '@/lib/i18n';

export function OverviewCards() {
    const { firestore, user } = useFirebase();
    const { currency } = useUserCurrency();
    const { t } = useLanguage();

    const transactionsQuery = useMemoFirebase(() => {
        if (!user) return null;
        return query(collection(firestore, 'users', user.uid, 'transactions'));
    }, [firestore, user]);

    const usersQuery = useMemoFirebase(() => {
        return query(collection(firestore, 'users'));
    }, [firestore]);

    const { data: transactions, isLoading } = useCollection<Transaction>(transactionsQuery);
    const { data: allUsers, isLoading: isLoadingUsers } = useCollection<UserType>(usersQuery);

    // Usuários online agora (últimos 5 minutos)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const onlineUsers = allUsers?.filter(u => {
        if (!u.lastActive || u.disabled) return false;
        const lastActiveDate = u.lastActive instanceof Timestamp 
            ? u.lastActive.toDate() 
            : new Date(u.lastActive);
        return lastActiveDate > fiveMinutesAgo;
    }) || [];

    const totalIncome = transactions?.filter(t => t.type === 'income').reduce((acc, t) => acc + Math.abs(t.amount), 0) ?? 0;
    const totalExpenses = transactions?.filter(t => t.type === 'expense').reduce((acc, t) => acc + Math.abs(t.amount), 0) ?? 0;
    const totalBalance = totalIncome - totalExpenses;
    const totalInvestments = transactions?.filter(t => t.category === 'Investments').reduce((acc, t) => acc + Math.abs(t.amount), 0) ?? 0;

    const overviewData = [
        {
            label: t('dashboard.totalBalance'),
            value: formatCurrency(totalBalance, currency),
            change: `+20.1% ${t('dashboard.comparedToLastMonth')}`,
            changeType: 'positive',
            icon: DollarSign,
        },
        {
            label: t('dashboard.totalExpenses'),
            value: formatCurrency(totalExpenses, currency),
            change: `+10.5% ${t('dashboard.comparedToLastMonth')}`,
            changeType: 'negative',
            icon: CreditCard,
        },
        {
            label: t('dashboard.totalInvestments'),
            value: formatCurrency(totalInvestments, currency),
            change: `+5.2% ${t('dashboard.comparedToLastMonth')}`,
            changeType: 'positive',
            icon: TrendingUp,
        },
        {
            label: t('dashboard.activeUsers'),
            value: onlineUsers.length.toString(),
            change: "",
            changeType: 'positive',
            icon: Users,
            isOnlineUsers: true,
        },
    ];

    if (isLoading) {
        return (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <Card key={i}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <Skeleton className='h-5 w-24' />
                            <Skeleton className='h-4 w-4' />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className='h-7 w-32 mb-2' />
                            <Skeleton className='h-4 w-48' />
                        </CardContent>
                    </Card>
                ))}
            </div>
        )
    }


  return (
    <>
      <style jsx global>{`
        @keyframes border-gradient-green {
          0% {
            border-image-source: linear-gradient(
              90deg,
              rgb(34, 197, 94),
              rgb(22, 163, 74),
              rgb(16, 185, 129),
              rgb(5, 150, 105)
            );
          }
          25% {
            border-image-source: linear-gradient(
              90deg,
              rgb(22, 163, 74),
              rgb(16, 185, 129),
              rgb(5, 150, 105),
              rgb(34, 197, 94)
            );
          }
          50% {
            border-image-source: linear-gradient(
              90deg,
              rgb(16, 185, 129),
              rgb(5, 150, 105),
              rgb(34, 197, 94),
              rgb(22, 163, 74)
            );
          }
          75% {
            border-image-source: linear-gradient(
              90deg,
              rgb(5, 150, 105),
              rgb(34, 197, 94),
              rgb(22, 163, 74),
              rgb(16, 185, 129)
            );
          }
          100% {
            border-image-source: linear-gradient(
              90deg,
              rgb(34, 197, 94),
              rgb(22, 163, 74),
              rgb(16, 185, 129),
              rgb(5, 150, 105)
            );
          }
        }
        
        @keyframes border-gradient-red {
          0% {
            border-image-source: linear-gradient(
              90deg,
              rgb(239, 68, 68),
              rgb(220, 38, 38),
              rgb(248, 113, 113),
              rgb(185, 28, 28)
            );
          }
          25% {
            border-image-source: linear-gradient(
              90deg,
              rgb(220, 38, 38),
              rgb(248, 113, 113),
              rgb(185, 28, 28),
              rgb(239, 68, 68)
            );
          }
          50% {
            border-image-source: linear-gradient(
              90deg,
              rgb(248, 113, 113),
              rgb(185, 28, 28),
              rgb(239, 68, 68),
              rgb(220, 38, 38)
            );
          }
          75% {
            border-image-source: linear-gradient(
              90deg,
              rgb(185, 28, 28),
              rgb(239, 68, 68),
              rgb(220, 38, 38),
              rgb(248, 113, 113)
            );
          }
          100% {
            border-image-source: linear-gradient(
              90deg,
              rgb(239, 68, 68),
              rgb(220, 38, 38),
              rgb(248, 113, 113),
              rgb(185, 28, 28)
            );
          }
        }
        
        .animated-border-green {
          position: relative;
          border-radius: 0.5rem;
        }
        
        .animated-border-green::before {
          content: '';
          position: absolute;
          inset: -2px;
          border-radius: 0.5rem;
          padding: 2px;
          background: linear-gradient(
            90deg,
            rgb(34, 197, 94),
            rgb(22, 163, 74),
            rgb(16, 185, 129),
            rgb(5, 150, 105)
          );
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          pointer-events: none;
          animation: border-gradient-green 3s ease-in-out infinite;
        }
        
        .animated-border-red {
          position: relative;
          border-radius: 0.5rem;
        }
        
        .animated-border-red::before {
          content: '';
          position: absolute;
          inset: -2px;
          border-radius: 0.5rem;
          padding: 2px;
          background: linear-gradient(
            90deg,
            rgb(239, 68, 68),
            rgb(220, 38, 38),
            rgb(248, 113, 113),
            rgb(185, 28, 28)
          );
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          pointer-events: none;
          animation: border-gradient-red 3s ease-in-out infinite;
        }
      `}</style>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {overviewData.map((item, index) => {
          const isTotalBalance = index === 0;
          const borderClass = isTotalBalance 
            ? totalBalance >= 0 
              ? 'animated-border-green' 
              : 'animated-border-red'
            : '';
          
          return (
            <Card 
              key={item.label} 
              className={cn(
                "transition-all duration-300 hover:shadow-lg hover:scale-105 hover:-translate-y-1 animate-in fade-in slide-in-from-bottom-4",
                borderClass
              )}
              style={{ animationDelay: `${index * 100}ms`, animationFillMode: 'backwards' }}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{item.label}</CardTitle>
                <div className="flex flex-col items-center gap-1">
                  <item.icon className="h-6 w-6 text-muted-foreground transition-transform duration-300 hover:scale-125 hover:rotate-12" />
                  {item.isOnlineUsers && (
                    <div className="text-2xl font-bold transition-colors duration-300 hover:text-primary">{item.value}</div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {!item.isOnlineUsers && (
                  <div className="text-2xl font-bold transition-colors duration-300 hover:text-primary">{item.value}</div>
                )}
                {item.change && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <span
                        className={cn(
                        'flex items-center gap-1',
                        item.changeType === 'positive'
                            ? 'text-accent'
                            : 'text-destructive'
                        )}
                    >
                        {item.changeType === 'positive' ? <ArrowUpRight className='h-6 w-6' /> : <ArrowDownRight className='h-6 w-6'/>}
                        {item.change}
                    </span>
                    </p>
                )}
                
                {/* Mostrar usuários online dentro do card */}
                {item.isOnlineUsers && onlineUsers.length > 0 && (
                  <div className="space-y-1 max-h-24 overflow-y-auto">
                    {onlineUsers.map((onlineUser) => (
                      <div 
                        key={onlineUser.id}
                        className="flex items-center gap-1.5 text-xs text-muted-foreground"
                      >
                        <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0" />
                        <span className="truncate">
                          {onlineUser.name ? onlineUser.name.split(' ')[0] : onlineUser.email.split('@')[0]}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </>
  );
}
