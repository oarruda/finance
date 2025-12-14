'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { saveAIApiKeyToClient, getAIApiKey, removeAIApiKeyFromClient } from '@/ai/get-api-key';
import { AlertCircle, Check, Copy, Trash2 } from 'lucide-react';
import * as React from 'react';

interface AIApiKeyLoaderProps {
  savedApiKey?: string;
  isEditing?: boolean;
  onLoaded?: (key: string) => void;
}

export function AIApiKeyLoader({ savedApiKey, isEditing = false, onLoaded }: AIApiKeyLoaderProps) {
  const [apiKey, setApiKey] = React.useState('');
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const { toast } = useToast();

  // Carrega a chave salva ao montar o componente
  React.useEffect(() => {
    const loadKey = async () => {
      const key = await getAIApiKey();
      if (key) {
        setIsLoaded(true);
        setApiKey(key.substring(0, 8) + '...');
      }
    };
    loadKey();
  }, []);

  const handleLoadApiKey = () => {
    if (!savedApiKey) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Nenhuma chave de API salva encontrada. Salve a chave primeiro.',
      });
      return;
    }

    saveAIApiKeyToClient(savedApiKey);
    setIsLoaded(true);
    setApiKey(savedApiKey.substring(0, 8) + '...');
    
    toast({
      title: 'Sucesso',
      description: 'Chave de API carregada com sucesso. Os insights da IA funcionarão agora.',
    });

    if (onLoaded) {
      onLoaded(savedApiKey);
    }
  };

  const handleCopyKey = () => {
    if (savedApiKey) {
      navigator.clipboard.writeText(savedApiKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleRemoveKey = () => {
    removeAIApiKeyFromClient();
    setIsLoaded(false);
    setApiKey('');
    
    toast({
      title: 'Chave removida',
      description: 'A chave de API foi removida desta sessão.',
    });
  };

  return (
    <Card className="border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isLoaded ? (
            <>
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-green-700 dark:text-green-400">Chave Carregada</span>
            </>
          ) : (
            <>
              <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              Carregar chave...
            </>
          )}
        </CardTitle>
        <CardDescription>
          Ative a chave de API salva para usar recursos de IA nesta sessão
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoaded ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2 p-3 bg-green-100 dark:bg-green-900 border border-green-300 dark:border-green-700 rounded-lg">
              <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
              <div>
                <p className="text-sm font-medium text-green-900 dark:text-green-100">
                  Chave carregada com sucesso
                </p>
                <p className="text-xs text-green-800 dark:text-green-200">
                  Os insights da IA estão ativos nesta sessão
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleRemoveKey}
                className="flex-1"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Remover da sessão
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <Alert className="border-blue-300 dark:border-blue-700 bg-blue-100 dark:bg-blue-900">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-blue-900 dark:text-blue-100">
                A chave de API precisa ser carregada para ativar os recursos de IA.
                Clique no botão abaixo para carregar a chave salva.
              </AlertDescription>
            </Alert>

            {savedApiKey ? (
              <div className="space-y-2">
                <Label>Chave de API Salva</Label>
                <div className="flex gap-2">
                  <Input
                    type="password"
                    value={savedApiKey}
                    readOnly
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleCopyKey}
                    className="px-2"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                {copied && (
                  <p className="text-xs text-green-600 dark:text-green-400">
                    Copiado para a área de transferência!
                  </p>
                )}
              </div>
            ) : (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Nenhuma chave de API salva foi encontrada. Salve a chave de API primeiro.
                </AlertDescription>
              </Alert>
            )}

            <Button
              onClick={handleLoadApiKey}
              disabled={!savedApiKey || isEditing}
              className="w-full"
            >
              Carregar Chave de API
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
