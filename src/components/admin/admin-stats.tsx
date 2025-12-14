'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Shield, Eye, Crown, CheckCircle } from 'lucide-react';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import type { User } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import * as React from 'react';

export function AdminStats() {
  const { firestore } = useFirebase();
  const [showActiveUsers, setShowActiveUsers] = React.useState(false);

  const usersQuery = useMemoFirebase(() => {
    return query(collection(firestore, 'users'));
  }, [firestore]);

  const { data: users, isLoading } = useCollection<User>(usersQuery);

  const activeUsers = users?.filter(u => !u.disabled) || [];
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
      clickable: false,
    },
    {
      title: 'Usuários Ativos',
      value: activeUsers.length,
      description: 'Usuários não desativados',
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900/20',
      clickable: true,
      onClick: () => setShowActiveUsers(true),
    },
    {
      title: 'Masters',
      value: masterUsers,
      description: 'Controle total do sistema',
      icon: Crown,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900/20',
      clickable: false,
    },
    {
      title: 'Admins',
      value: adminUsers,
      description: 'Gerenciamento de conteúdo',
      icon: Shield,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      clickable: false,
    },
    {
      title: 'Visualização',
      value: viewerUsers,
      description: 'Apenas visualização',
      icon: Eye,
      color: 'text-gray-600',
      bgColor: 'bg-gray-100 dark:bg-gray-900/20',
      clickable: false,
    },
  ];

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {[...Array(5)].map((_, i) => (
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
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {stats.map((stat) => (
          <Card 
            key={stat.title}
            className={stat.clickable ? 'cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02]' : ''}
            onClick={stat.clickable ? stat.onClick : undefined}
          >
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

      {/* Dialog de Usuários Ativos */}
      <Dialog open={showActiveUsers} onOpenChange={setShowActiveUsers}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Usuários Ativos</DialogTitle>
            <DialogDescription>
              Lista de todos os usuários não desativados no sistema ({activeUsers.length} {activeUsers.length === 1 ? 'usuário' : 'usuários'})
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {activeUsers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum usuário ativo encontrado
              </div>
            ) : (
              activeUsers.map((user) => (
                <div 
                  key={user.id} 
                  className="flex items-center gap-4 p-3 border rounded-lg hover:bg-accent transition-colors"
                >
                  <Avatar>
                    <AvatarImage src={user.avatarUrl} alt={user.name} data-ai-hint="person portrait" />
                    <AvatarFallback>
                      {user.name ? user.name.charAt(0) : user.email.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{user.name || user.email}</p>
                      {user.role === 'master' && (
                        <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                          Master
                        </Badge>
                      )}
                      {user.role === 'admin' && (
                        <Badge className="bg-primary/80">Admin</Badge>
                      )}
                      {user.role === 'viewer' && (
                        <Badge variant="secondary">Visualização</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
