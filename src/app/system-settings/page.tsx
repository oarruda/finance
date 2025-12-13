'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUser, useFirebase } from '@/firebase';
import { Loader2, ShieldAlert } from 'lucide-react';
import * as React from 'react';
import { useToast } from '@/hooks/use-toast';
import { saveUserSettings, getUserSettings } from '@/lib/user-settings';
import { useLanguage } from '@/lib/i18n';
import { usePermissions } from '@/hooks/use-permissions';
import { useRouter } from 'next/navigation';

export default function SystemSettingsPage() {
  const { user } = useUser();
  const { firestore, auth } = useFirebase();
  const { toast } = useToast();
  const { t } = useLanguage();
  const { isMaster } = usePermissions();
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(false);
  const [formData, setFormData] = React.useState({
    aiProvider: 'gemini',
    aiApiKey: '',
    wiseApiKey: '',
    c6ApiKey: '',
    exchangeRateApiKey: '',
  });

  // Redirect non-master users
  React.useEffect(() => {
    if (!isMaster) {
      router.push('/dashboard');
    }
  }, [isMaster, router]);

  React.useEffect(() => {
    const loadUserSettings = async () => {
      if (user?.uid && firestore) {
        const result = await getUserSettings(firestore, user.uid);
        
        if (result.success && result.data) {
          setFormData({
            aiProvider: result.data.aiProvider || 'gemini',
            aiApiKey: result.data.aiApiKey || '',
            wiseApiKey: result.data.wiseApiKey || '',
            c6ApiKey: result.data.c6ApiKey || '',
            exchangeRateApiKey: result.data.exchangeRateApiKey || '',
          });
        }
      }
    };
    loadUserSettings();
  }, [user, firestore]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.uid || !firestore || !auth) {
      toast({
        variant: 'destructive',
        title: t('toast.error'),
        description: t('settings.userNotIdentified'),
      });
      return;
    }

    setIsLoading(true);

    try {
      // Get current user data first
      const currentData = await getUserSettings(firestore, user.uid);
      
      const result = await saveUserSettings(
        firestore, 
        auth, 
        user.uid, 
        user, 
        {
          firstName: currentData.data?.firstName || '',
          lastName: currentData.data?.lastName || '',
          email: currentData.data?.email || user.email || '',
          timezone: currentData.data?.timezone || 'America/Sao_Paulo',
          ...(currentData.success && currentData.data ? currentData.data : {}),
          ...formData,
        }
      );

      if (result.success) {
        toast({
          title: t('toast.saved'),
          description: 'Configurações de sistema atualizadas com sucesso',
        });
        setIsEditing(false);
      } else {
        toast({
          variant: 'destructive',
          title: t('settings.saveError'),
          description: result.error || t('settings.saveErrorDesc'),
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: t('settings.saveError'),
        description: t('settings.unexpectedError'),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = async () => {
    setIsEditing(false);
    if (user?.uid && firestore) {
      const result = await getUserSettings(firestore, user.uid);
      if (result.success && result.data) {
        setFormData({
          aiProvider: result.data.aiProvider || 'gemini',
          aiApiKey: result.data.aiApiKey || '',
          wiseApiKey: result.data.wiseApiKey || '',
          c6ApiKey: result.data.c6ApiKey || '',
          exchangeRateApiKey: result.data.exchangeRateApiKey || '',
        });
      }
    }
  };

  if (!isMaster) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4 text-center">
              <ShieldAlert className="h-12 w-12 text-destructive" />
              <h2 className="text-xl font-bold">Acesso Restrito</h2>
              <p className="text-muted-foreground">
                Apenas usuários MASTER podem acessar as configurações de sistema.
              </p>
              <Button onClick={() => router.push('/dashboard')}>
                Voltar ao Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-headline tracking-tight">
            Configurações de Sistema
          </h1>
          <p className="text-muted-foreground">
            Configure integrações de IA e APIs de bancos (apenas MASTER)
          </p>
        </div>
        {!isEditing && (
          <Button type="button" variant="outline" onClick={() => setIsEditing(true)}>
            Editar Configurações
          </Button>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* AI Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Configurações de IA</CardTitle>
            <CardDescription>Configure o provedor de IA e chave de API</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="aiProvider">Provedor de IA</Label>
                <Select 
                  value={formData.aiProvider} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, aiProvider: value }))}
                  disabled={!isEditing}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gemini">Google Gemini</SelectItem>
                    <SelectItem value="openai">OpenAI</SelectItem>
                    <SelectItem value="anthropic">Anthropic Claude</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="aiApiKey">Chave de API da IA</Label>
                <Input
                  id="aiApiKey"
                  name="aiApiKey"
                  type="password"
                  value={formData.aiApiKey}
                  onChange={handleInputChange}
                  placeholder="sk-..."
                  disabled={!isEditing}
                />
                <p className="text-xs text-muted-foreground">
                  Chave de API para integração com serviços de IA
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="exchangeRateApiKey">API de Taxa de Câmbio</Label>
                <Input
                  id="exchangeRateApiKey"
                  name="exchangeRateApiKey"
                  type="password"
                  value={formData.exchangeRateApiKey}
                  onChange={handleInputChange}
                  placeholder="Chave da API"
                  disabled={!isEditing}
                />
                <p className="text-xs text-muted-foreground">
                  Chave de API para obter taxas de câmbio atualizadas
                </p>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Bank APIs Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>APIs de Bancos</CardTitle>
            <CardDescription>Configure chaves de API para integrações bancárias</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="wiseApiKey">Chave de API do Wise</Label>
                <Input
                  id="wiseApiKey"
                  name="wiseApiKey"
                  type="password"
                  value={formData.wiseApiKey}
                  onChange={handleInputChange}
                  placeholder="wise_..."
                  disabled={!isEditing}
                />
                <p className="text-xs text-muted-foreground">
                  Chave de API para integração com Wise (TransferWise)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="c6ApiKey">Chave de API do C6 Bank</Label>
                <Input
                  id="c6ApiKey"
                  name="c6ApiKey"
                  type="password"
                  value={formData.c6ApiKey}
                  onChange={handleInputChange}
                  placeholder="c6_..."
                  disabled={!isEditing}
                />
                <p className="text-xs text-muted-foreground">
                  Chave de API para integração com C6 Bank
                </p>
              </div>

              <div className="p-4 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg">
                <div className="flex items-start gap-2">
                  <ShieldAlert className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                      Segurança Crítica
                    </p>
                    <p className="text-xs text-amber-800 dark:text-amber-200">
                      Estas chaves de API têm acesso a dados financeiros sensíveis. 
                      Apenas o usuário MASTER deve ter acesso a estas configurações.
                    </p>
                  </div>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {isEditing && (
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={handleCancel} disabled={isLoading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar Configurações
          </Button>
        </div>
      )}
    </div>
  );
}
