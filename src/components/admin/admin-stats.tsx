'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Shield, Eye, Crown } from 'lucide-react';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import type { User } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

export function AdminStats() {
  const { firestore } = useFirebase();

  const usersQuery = useMemoFirebase(() => {
    return query(collection(firestore, 'users'));
  }, [firestore]);

  const { data: users, isLoading } = useCollection<User>(usersQuery);

  const totalUsers = users?.length || 0;
  const masterUsers = users?.filter(u => u.role === 'master').length || 0;
  const adminUsers = users?.filter(u => u.role === 'admin').length || 0;
  const viewerUsers = users?.filter(u => u.role === 'viewer').length || 0;

  const stats = [
    {
      title: 'Total de Usuários',
      value: totalUsers,
      description: 'Usuários cadastrados no sistema',
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20',
    },
    {
      title: 'Masters',
      value: masterUsers,
      description: 'Controle total do sistema',
      icon: Crown,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900/20',
    },
    {
      title: 'Admins',
      value: adminUsers,
      description: 'Gerenciamento de conteúdo',
      icon: Shield,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: 'Viewers',
      value: viewerUsers,
      description: 'Apenas visualização',
      icon: Eye,
      color: 'text-gray-600',
      bgColor: 'bg-gray-100 dark:bg-gray-900/20',
    },
  ];

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-8 rounded-lg" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-12 mb-1" />
              <Skeleton className="h-3 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <div className={`p-2 rounded-lg ${stat.bgColor}`}>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground">{stat.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
