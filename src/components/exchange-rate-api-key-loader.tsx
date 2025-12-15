'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, Check, Trash2, Copy } from 'lucide-react';
import * as React from 'react';

interface ExchangeRateApiKeyLoaderProps {
  savedApiKey?: string;
  isEditing?: boolean;
  onLoaded?: (key: string) => void;
  onDeleted?: () => void;
}

// Funções para gerenciar a chave no localStorage
const STORAGE_KEY = 'exchange_rate_api_key';

function saveExchangeRateApiKeyToClient(key: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, key);
  }
}

function getExchangeRateApiKey(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(STORAGE_KEY);
  }
  return null;
}

function removeExchangeRateApiKeyFromClient(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY);
  }
}

export function ExchangeRateApiKeyLoader({ savedApiKey, isEditing = false, onLoaded, onDeleted }: ExchangeRateApiKeyLoaderProps) {
  const [apiKey, setApiKey] = React.useState('');
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [showSavedKey, setShowSavedKey] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const { toast } = useToast();

  // Carrega a chave salva ao montar o componente
  React.useEffect(() => {
    const loadKey = () => {
      const key = getExchangeRateApiKey();
      if (key) {
        setIsLoaded(true);
        setApiKey(key.substring(0, 8) + '...');
      }
    };
    loadKey();
  }, [savedApiKey]);

  const handleLoadApiKey = () => {
    if (!savedApiKey) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Nenhuma chave de API salva encontrada. Salve a chave primeiro.',
      });
      return;
    }

    saveExchangeRateApiKeyToClient(savedApiKey);
    setIsLoaded(true);
    setApiKey(savedApiKey.substring(0, 8) + '...');
    
    toast({
      title: 'Sucesso',
      description: 'Chave de API de Taxa de Câmbio carregada com sucesso.',
    });

    if (onLoaded) {
      onLoaded(savedApiKey);
    }
  };

  const handleRemoveKey = () => {
    removeExchangeRateApiKeyFromClient();
    setIsLoaded(false);
    setApiKey('');
    
    toast({
      title: 'Chave removida',
      description: 'A chave de API de Taxa de Câmbio foi removida desta sessão.',
    });
  };

  const handleDeleteFromSystem = async () => {
    const confirmed = window.confirm(
      'Tem certeza que deseja excluir esta chave de API do sistema? Esta ação não pode ser desfeita.'
    );
    
    if (!confirmed) return;

    // Remove da sessão do navegador
    removeExchangeRateApiKeyFromClient();
    setIsLoaded(false);
    setApiKey('');

    // Chama o callback para notificar o componente pai
    if (onDeleted) {
      onDeleted();
    }

    toast({
      title: 'Chave excluída',
      description: 'A chave de API de Taxa de Câmbio foi excluída do sistema.',
    });
  };

  const handleCopyKey = () => {
    if (savedApiKey) {
      navigator.clipboard.writeText(savedApiKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: 'Copiado',
        description: 'Chave de API copiada para a área de transferência',
      });
    }
  };

  return (
    <Card className="border-purple-200 dark:border-purple-900 bg-purple-50 dark:bg-purple-950">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isLoaded ? (
            <>
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-green-700 dark:text-green-400">Chave Carregada</span>
            </>
          ) : (
            <>
              <AlertCircle className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              Carregar chave...
            </>
          )}
        </CardTitle>
        <CardDescription>
          Ative a chave de API salva para usar taxas de câmbio nesta sessão
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
                  As taxas de câmbio estão ativas nesta sessão
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
                disabled={!isEditing}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Remover da sessão
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {savedApiKey ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Chave de API Salva no Sistema</p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowSavedKey(!showSavedKey)}
                    className="h-6 text-xs"
                  >
                    {showSavedKey ? 'Ocultar' : 'Mostrar'}
                  </Button>
                </div>
                <div className="p-3 bg-purple-100 dark:bg-purple-900 border border-purple-200 dark:border-purple-800 rounded-lg">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-mono text-purple-900 dark:text-purple-100 break-all">
                      {showSavedKey ? savedApiKey : `${savedApiKey.substring(0, 12)}...${savedApiKey.slice(-8)}`}
                    </p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleCopyKey}
                      className="h-7 px-2 shrink-0"
                    >
                      {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    onClick={handleLoadApiKey}
                    className="flex-1"
                    disabled={!isEditing}
                  >
                    Carregar
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    onClick={handleDeleteFromSystem}
                    disabled={!isEditing}
                    title="Excluir chave do sistema"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg">
                <p className="text-sm text-amber-900 dark:text-amber-100">
                  Nenhuma chave salva. Salve uma chave de API primeiro usando o formulário acima.
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
