'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Shield, Eye, Crown, CheckCircle } from 'lucide-react';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { collection, query, where, Timestamp } from 'firebase/firestore';
import type { User } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import * as React from 'react';

export function AdminStats() {
  const { firestore } = useFirebase();

  const usersQuery = useMemoFirebase(() => {
    return query(collection(firestore, 'users'));
  }, [firestore]);

  const { data: users, isLoading } = useCollection<User>(usersQuery);

  // Usuários online agora (últimos 5 minutos)
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  const onlineUsers = users?.filter(u => {
    if (!u.lastActive || u.disabled) return false;
    const lastActiveDate = u.lastActive instanceof Timestamp 
      ? u.lastActive.toDate() 
      : new Date(u.lastActive);
    return lastActiveDate > fiveMinutesAgo;
  }) || [];

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
      title: 'Usuários Online',
      value: onlineUsers.length,
      description: 'Online agora',
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900/20',
      clickable: false,
      showPopover: true,
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
        {stats.map((stat) => {
          const CardComponent = (
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
          );

          // Se o card mostra popover (Usuários Online)
          if (stat.showPopover) {
            return (
              <Popover key={stat.title}>
                <PopoverTrigger asChild>
                  {CardComponent}
                </PopoverTrigger>
                <PopoverContent className="w-80 max-h-96 overflow-y-auto" align="start">
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <h4 className="font-semibold text-sm">Usuários Online Agora</h4>
                      <p className="text-xs text-muted-foreground">
                        {onlineUsers.length} {onlineUsers.length === 1 ? 'usuário online' : 'usuários online'}
                      </p>
                    </div>
                    {onlineUsers.length === 0 ? (
                      <div className="text-center py-4 text-sm text-muted-foreground">
                        Nenhum usuário online no momento
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {onlineUsers.map((user) => (
                          <div 
                            key={user.id}
                            className="flex items-center gap-3 p-2 rounded-md hover:bg-accent/50 transition-colors"
                          >
                            <div className="relative">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={user.avatarUrl} alt={user.name} data-ai-hint="person portrait" />
                                <AvatarFallback className="text-xs">
                                  {user.name ? user.name.charAt(0) : user.email.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-500 border-2 border-background" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <p className="text-sm font-medium truncate">{user.name || user.email}</p>
                                {user.role === 'master' && (
                                  <Badge className="text-[10px] h-4 px-1 bg-gradient-to-r from-purple-600 to-pink-600">M</Badge>
                                )}
                                {user.role === 'admin' && (
                                  <Badge className="text-[10px] h-4 px-1 bg-primary/80">A</Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            );
          }

          return CardComponent;
        })}
      </div>
    </>
  );
}
