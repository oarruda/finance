'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, Check, Trash2 } from 'lucide-react';
import * as React from 'react';

interface BankApiKeyLoaderProps {
  savedWiseKey?: string;
  savedC6Key?: string;
  isEditing?: boolean;
  onLoaded?: () => void;
  onWiseDeleted?: () => void;
  onC6Deleted?: () => void;
}

// Funções para gerenciar as chaves no localStorage
const WISE_STORAGE_KEY = 'wise_api_key';
const C6_STORAGE_KEY = 'c6_api_key';

function saveWiseApiKeyToClient(key: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(WISE_STORAGE_KEY, key);
  }
}

function getWiseApiKey(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(WISE_STORAGE_KEY);
  }
  return null;
}

function removeWiseApiKeyFromClient(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(WISE_STORAGE_KEY);
  }
}

function saveC6ApiKeyToClient(key: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(C6_STORAGE_KEY, key);
  }
}

function getC6ApiKey(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(C6_STORAGE_KEY);
  }
  return null;
}

function removeC6ApiKeyFromClient(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(C6_STORAGE_KEY);
  }
}

export function BankApiKeyLoader({ savedWiseKey, savedC6Key, isEditing = false, onLoaded, onWiseDeleted, onC6Deleted }: BankApiKeyLoaderProps) {
  const [wiseLoaded, setWiseLoaded] = React.useState(false);
  const [c6Loaded, setC6Loaded] = React.useState(false);
  const { toast } = useToast();

  const isAnyLoaded = wiseLoaded || c6Loaded;

  // Carrega as chaves salvas ao montar o componente
  React.useEffect(() => {
    const wiseKey = getWiseApiKey();
    const c6Key = getC6ApiKey();
    
    if (wiseKey) setWiseLoaded(true);
    if (c6Key) setC6Loaded(true);
  }, []);

  const handleLoadWiseKey = () => {
    if (!savedWiseKey) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Nenhuma chave Wise salva encontrada. Salve a chave primeiro.',
      });
      return;
    }

    saveWiseApiKeyToClient(savedWiseKey);
    setWiseLoaded(true);
    
    toast({
      title: 'Sucesso',
      description: 'Chave de API Wise carregada com sucesso.',
    });

    if (onLoaded) onLoaded();
  };

  const handleLoadC6Key = () => {
    if (!savedC6Key) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Nenhuma chave C6 salva encontrada. Salve a chave primeiro.',
      });
      return;
    }

    saveC6ApiKeyToClient(savedC6Key);
    setC6Loaded(true);
    
    toast({
      title: 'Sucesso',
      description: 'Chave de API C6 carregada com sucesso.',
    });

    if (onLoaded) onLoaded();
  };

  const handleRemoveWiseKey = () => {
    removeWiseApiKeyFromClient();
    setWiseLoaded(false);
    
    toast({
      title: 'Chave removida',
      description: 'A chave de API Wise foi removida desta sessão.',
    });
  };

  const handleRemoveC6Key = () => {
    removeC6ApiKeyFromClient();
    setC6Loaded(false);
    
    toast({
      title: 'Chave removida',
      description: 'A chave de API C6 foi removida desta sessão.',
    });
  };

  const handleDeleteWiseFromSystem = async () => {
    const confirmed = window.confirm(
      'Tem certeza que deseja excluir esta chave Wise do sistema? Esta ação não pode ser desfeita.'
    );
    
    if (!confirmed) return;

    removeWiseApiKeyFromClient();
    setWiseLoaded(false);

    if (onWiseDeleted) {
      onWiseDeleted();
    }

    toast({
      title: 'Chave excluída',
      description: 'A chave de API Wise foi excluída do sistema.',
    });
  };

  const handleDeleteC6FromSystem = async () => {
    const confirmed = window.confirm(
      'Tem certeza que deseja excluir esta chave C6 do sistema? Esta ação não pode ser desfeita.'
    );
    
    if (!confirmed) return;

    removeC6ApiKeyFromClient();
    setC6Loaded(false);

    if (onC6Deleted) {
      onC6Deleted();
    }

    toast({
      title: 'Chave excluída',
      description: 'A chave de API C6 foi excluída do sistema.',
    });
  };

  return (
    <Card className="border-orange-200 dark:border-orange-900 bg-orange-50 dark:bg-orange-950">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isAnyLoaded ? (
            <>
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-green-700 dark:text-green-400">Chave Carregada</span>
            </>
          ) : (
            <>
              <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              Carregar chave...
            </>
          )}
        </CardTitle>
        <CardDescription>
          Ative as chaves de API salvas para usar integrações bancárias nesta sessão
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Wise API Key */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">🌍 Wise (TransferWise)</Label>
          {wiseLoaded ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 p-3 bg-green-100 dark:bg-green-900 border border-green-300 dark:border-green-700 rounded-lg">
                <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
                <p className="text-sm font-medium text-green-900 dark:text-green-100">
                  Chave Wise carregada
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleRemoveWiseKey}
                className="w-full"
                disabled={!isEditing}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Remover Wise da sessão
              </Button>
            </div>
          ) : savedWiseKey ? (
            <div className="flex gap-2">
              <Button
                type="button"
                onClick={handleLoadWiseKey}
                className="flex-1"
                disabled={!isEditing}
                variant="outline"
              >
                Carregar
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="icon"
                onClick={handleDeleteWiseFromSystem}
                disabled={!isEditing}
                title="Excluir chave Wise do sistema"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="p-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg">
              <p className="text-xs text-amber-900 dark:text-amber-100">
                Nenhuma chave salva. Salve primeiro usando o formulário acima.
              </p>
            </div>
          )}
        </div>

        {/* C6 API Key */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">🇧🇷 C6 Bank</Label>
          {c6Loaded ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 p-3 bg-green-100 dark:bg-green-900 border border-green-300 dark:border-green-700 rounded-lg">
                <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
                <p className="text-sm font-medium text-green-900 dark:text-green-100">
                  Chave C6 carregada
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleRemoveC6Key}
                className="w-full"
                disabled={!isEditing}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Remover C6 da sessão
              </Button>
            </div>
          ) : savedC6Key ? (
            <div className="flex gap-2">
              <Button
                type="button"
                onClick={handleLoadC6Key}
                className="flex-1"
                disabled={!isEditing}
                variant="outline"
              >
                Carregar
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="icon"
                onClick={handleDeleteC6FromSystem}
                disabled={!isEditing}
                title="Excluir chave C6 do sistema"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="p-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg">
              <p className="text-xs text-amber-900 dark:text-amber-100">
                Nenhuma chave salva. Salve primeiro usando o formulário acima.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <label className={className}>{children}</label>;
}
