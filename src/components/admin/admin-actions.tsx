'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserPlus, Download, Upload, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import type { User } from '@/lib/types';

export function AdminActions() {
  const { toast } = useToast();
  const { firestore } = useFirebase();

  const usersQuery = useMemoFirebase(() => {
    return query(collection(firestore, 'users'));
  }, [firestore]);

  const { data: users } = useCollection<User>(usersQuery);

  const handleExportUsers = () => {
    if (!users || users.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Nenhum usuário disponível para exportar.',
      });
      return;
    }

    // Preparar dados para CSV
    const csvHeaders = ['Nome', 'Email', 'Função', 'Telefone', 'CPF', 'Criado em'];
    const csvRows = users.map(user => [
      user.name || '',
      user.email || '',
      user.role || 'viewer',
      user.phone || '',
      user.cpf || '',
      user.createdAt || '',
    ]);

    // Criar conteúdo CSV
    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Criar blob e download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `usuarios_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: 'Sucesso',
      description: `${users.length} usuários exportados com sucesso.`,
    });
  };

  const handleImportUsers = () => {
    // Criar input file
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    
    input.onchange = (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        const lines = text.split('\n');
        const userCount = lines.length - 1; // Menos o cabeçalho

        toast({
          title: 'Funcionalidade em desenvolvimento',
          description: `Arquivo detectado com ${userCount} usuários. A importação será implementada em breve.`,
        });
      };
      reader.readAsText(file);
    };

    input.click();
  };

  const actions = [
    {
      title: 'Exportar Dados',
      description: 'Baixar relatório de usuários em CSV',
      icon: Download,
      onClick: handleExportUsers,
      variant: 'default' as const,
    },
    {
      title: 'Importar Usuários',
      description: 'Adicionar vários usuários via CSV',
      icon: Upload,
      onClick: handleImportUsers,
      variant: 'outline' as const,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ações Rápidas</CardTitle>
        <CardDescription>Gerenciar usuários e exportar dados do sistema</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2">
          {actions.map((action) => (
            <Button
              key={action.title}
              variant={action.variant}
              className="h-auto flex-col items-start gap-2 p-4"
              onClick={action.onClick}
            >
              <action.icon className="h-5 w-5" />
              <div className="text-left">
                <div className="font-semibold text-sm">{action.title}</div>
                <div className="text-xs text-muted-foreground font-normal">
                  {action.description}
                </div>
              </div>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
