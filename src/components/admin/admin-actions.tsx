'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserPlus, Download, Upload, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function AdminActions() {
  const { toast } = useToast();

  const handleAction = (action: string) => {
    toast({
      title: 'Em desenvolvimento',
      description: `A funcionalidade "${action}" será implementada em breve.`,
    });
  };

  const actions = [
    {
      title: 'Adicionar Usuário',
      description: 'Criar uma nova conta de usuário',
      icon: UserPlus,
      onClick: () => handleAction('Adicionar Usuário'),
      variant: 'default' as const,
    },
    {
      title: 'Exportar Dados',
      description: 'Baixar relatório de usuários',
      icon: Download,
      onClick: () => handleAction('Exportar Dados'),
      variant: 'outline' as const,
    },
    {
      title: 'Importar Usuários',
      description: 'Adicionar vários usuários via CSV',
      icon: Upload,
      onClick: () => handleAction('Importar Usuários'),
      variant: 'outline' as const,
    },
    {
      title: 'Configurações',
      description: 'Configurações do sistema',
      icon: Settings,
      onClick: () => handleAction('Configurações'),
      variant: 'outline' as const,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ações Rápidas</CardTitle>
        <CardDescription>Gerenciar usuários e configurações do sistema</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
