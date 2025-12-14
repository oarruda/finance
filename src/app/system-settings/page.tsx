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
import { AIApiKeyLoader } from '@/components/ai-api-key-loader';
import { ExchangeRateApiKeyLoader } from '@/components/exchange-rate-api-key-loader';
import { BankApiKeyLoader } from '@/components/bank-api-key-loader';

export default function SystemSettingsPage() {
  const { user } = useUser();
  const { firestore, auth } = useFirebase();
  const { toast } = useToast();
  const { t } = useLanguage();
  const { isMaster, isLoading: permissionsLoading } = usePermissions();
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(false);
  const [isSendingTestEmail, setIsSendingTestEmail] = React.useState(false);
  const [formData, setFormData] = React.useState({
    aiProvider: 'gemini',
    aiApiKey: '',
    exchangeRateProvider: 'eodhd',
    exchangeRateApiKey: '',
    wiseApiKey: '',
    c6ApiKey: '',
    resendApiKey: '',
    resendFromEmail: '',
    appUrl: '',
  });

  // Redirect non-master users (apenas após carregar as permissões)
  React.useEffect(() => {
    if (!permissionsLoading && !isMaster) {
      console.log('Redirecionando: não é MASTER', { isMaster, permissionsLoading });
      router.push('/dashboard');
    }
  }, [isMaster, permissionsLoading, router]);

  React.useEffect(() => {
    const loadUserSettings = async () => {
      if (user?.uid && firestore) {
        const result = await getUserSettings(firestore, user.uid);
        
        if (result.success && result.data) {
          setFormData({
            aiProvider: result.data.aiProvider || 'gemini',
            aiApiKey: result.data.aiApiKey || '',
            exchangeRateProvider: result.data.exchangeRateProvider || 'eodhd',
            exchangeRateApiKey: result.data.exchangeRateApiKey || '',
            wiseApiKey: result.data.wiseApiKey || '',
            c6ApiKey: result.data.c6ApiKey || '',
            resendApiKey: result.data.resendApiKey || '',
            resendFromEmail: result.data.resendFromEmail || '',
            appUrl: result.data.appUrl || '',
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
      
      const dataToSave = {
        firstName: currentData.data?.firstName || '',
        lastName: currentData.data?.lastName || '',
        email: currentData.data?.email || user.email || '',
        timezone: currentData.data?.timezone || 'America/Sao_Paulo',
        ...(currentData.success && currentData.data ? currentData.data : {}),
        ...formData,
      };

      console.log('=== SALVANDO CONFIGURAÇÕES ===');
      console.log('resendApiKey:', dataToSave.resendApiKey ? `${dataToSave.resendApiKey.substring(0, 8)}...` : 'NÃO DEFINIDA');
      console.log('resendFromEmail:', dataToSave.resendFromEmail);
      console.log('appUrl:', dataToSave.appUrl);
      
      const result = await saveUserSettings(
        firestore, 
        auth, 
        user.uid, 
        user, 
        dataToSave
      );

      if (result.success) {
        console.log('✅ Configurações salvas com sucesso');
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

  const handleSendTestEmail = async () => {
    if (!user?.email || !auth) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Usuário não identificado',
      });
      return;
    }

    if (!formData.resendApiKey || !formData.resendFromEmail || !formData.appUrl) {
      toast({
        variant: 'destructive',
        title: 'Configurações incompletas',
        description: 'Configure a API Key, Email Remetente e URL do App antes de enviar o teste',
      });
      return;
    }

    setIsSendingTestEmail(true);

    try {
      // Primeiro salvar as configurações se estiver editando
      if (isEditing) {
        const currentData = await getUserSettings(firestore!, user.uid);
        await saveUserSettings(
          firestore!,
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
      }

      // Obter token
      const token = await auth.currentUser?.getIdToken();
      if (!token) {
        throw new Error('Não foi possível obter token de autenticação');
      }

      // Enviar email de teste
      const response = await fetch('/api/admin/send-welcome-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: user.displayName || 'Usuário Master',
          email: user.email,
          password: '********',
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao enviar email de teste');
      }

      toast({
        title: 'Email enviado!',
        description: `Email de teste enviado com sucesso para ${user.email}`,
      });
    } catch (error: any) {
      console.error('Error sending test email:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao enviar email',
        description: error.message,
      });
    } finally {
      setIsSendingTestEmail(false);
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
          exchangeRateProvider: result.data.exchangeRateProvider || 'eodhd',
          exchangeRateApiKey: result.data.exchangeRateApiKey || '',
          wiseApiKey: result.data.wiseApiKey || '',
          c6ApiKey: result.data.c6ApiKey || '',
          resendApiKey: result.data.resendApiKey || '',
          resendFromEmail: result.data.resendFromEmail || '',
          appUrl: result.data.appUrl || '',
        });
      }
    }
  };

  // Mostrar loading enquanto verifica permissões
  if (permissionsLoading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  // Mostrar acesso restrito se não for MASTER
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
        {/* AI APIs Configuration */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>🤖 APIs de Inteligência Artificial</CardTitle>
                <CardDescription>Configure o provedor de IA...</CardDescription>
              </div>
              {formData.aiApiKey && (
                <div className="flex items-center gap-2 px-3 py-1 bg-green-100 dark:bg-green-900 rounded-full">
                  <div className="h-2 w-2 bg-green-600 dark:bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-xs font-medium text-green-700 dark:text-green-300">Configurada</span>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Status da Chave */}
            {formData.aiApiKey && !isEditing && (
              <div className="p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                      {formData.aiProvider === 'gemini' && '🟡 Google Gemini'}
                      {formData.aiProvider === 'openai' && '🟢 OpenAI'}
                      {formData.aiProvider === 'anthropic' && '🔵 Anthropic Claude'}
                    </p>
                    <p className="text-xs text-blue-700 dark:text-blue-300 font-mono">
                      {formData.aiApiKey.substring(0, 8)}...{formData.aiApiKey.slice(-4)}
                    </p>
                  </div>
                </div>
              </div>
            )}

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
                  <SelectItem value="gemini">🟡 Google Gemini</SelectItem>
                  <SelectItem value="openai">🟢 OpenAI (GPT-4)</SelectItem>
                  <SelectItem value="anthropic">🔵 Anthropic Claude</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="aiApiKey">Chave de API</Label>
              <Input
                id="aiApiKey"
                name="aiApiKey"
                type="password"
                value={formData.aiApiKey}
                onChange={handleInputChange}
                placeholder="AIza... / sk-... / sk-ant-..."
                disabled={!isEditing}
              />
              <div className="text-xs text-muted-foreground space-y-1">
                <p className="font-medium">Obtenha sua chave de API:</p>
                <p>🔗 <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">Google AI Studio (Gemini)</a></p>
                <p>🔗 <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">OpenAI Platform</a></p>
                <p>🔗 <a href="https://console.anthropic.com/" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">Anthropic Console (Claude)</a></p>
              </div>
            </div>

            {/* AI API Key Loader */}
            <div className="pt-4 border-t">
              <AIApiKeyLoader 
                savedApiKey={formData.aiApiKey}
                isEditing={isEditing}
                onLoaded={() => {
                  toast({
                    title: 'API carregada',
                    description: 'A chave de API foi carregada com sucesso para esta sessão.',
                  });
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Exchange Rate APIs Configuration */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>💱 APIs de Taxa de Câmbio</CardTitle>
                <CardDescription>Configure o provedor de taxa de câmbio...</CardDescription>
              </div>
              {formData.exchangeRateApiKey && (
                <div className="flex items-center gap-2 px-3 py-1 bg-green-100 dark:bg-green-900 rounded-full">
                  <div className="h-2 w-2 bg-green-600 dark:bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-xs font-medium text-green-700 dark:text-green-300">Configurada</span>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Status da Chave */}
            {formData.exchangeRateApiKey && !isEditing && (
              <div className="p-3 bg-purple-50 dark:bg-purple-950 border border-purple-200 dark:border-purple-800 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-900 dark:text-purple-100">
                      {formData.exchangeRateProvider === 'eodhd' && '💎 EODHD Financial APIs'}
                      {formData.exchangeRateProvider === 'exchangerate' && '💱 ExchangeRate-API'}
                      {formData.exchangeRateProvider === 'openexchange' && '🌐 Open Exchange Rates'}
                    </p>
                    <p className="text-xs text-purple-700 dark:text-purple-300 font-mono">
                      {formData.exchangeRateApiKey.substring(0, 8)}...{formData.exchangeRateApiKey.slice(-4)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="exchangeRateProvider">Provedor de Taxa de Câmbio</Label>
              <Select 
                value={formData.exchangeRateProvider} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, exchangeRateProvider: value }))}
                disabled={!isEditing}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="eodhd">💎 EODHD (Atual)</SelectItem>
                  <SelectItem value="exchangerate">💱 ExchangeRate-API</SelectItem>
                  <SelectItem value="openexchange">🌐 Open Exchange Rates</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="exchangeRateApiKey">Chave de API</Label>
              <Input
                id="exchangeRateApiKey"
                name="exchangeRateApiKey"
                type="password"
                value={formData.exchangeRateApiKey}
                onChange={handleInputChange}
                placeholder="Chave da API"
                disabled={!isEditing}
              />
              <div className="text-xs text-muted-foreground space-y-1">
                <p className="font-medium">Obtenha sua chave de API:</p>
                <p>🔗 <a href="https://eodhd.com/" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">EODHD</a> - Financial APIs completas</p>
                <p>🔗 <a href="https://exchangerate-api.com/" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">ExchangeRate-API</a> - Simples e confiável</p>
                <p>🔗 <a href="https://openexchangerates.org/" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">Open Exchange Rates</a> - 1000 requisições/mês grátis</p>
              </div>
            </div>

            {/* Exchange Rate API Key Loader */}
            <div className="pt-4 border-t">
              <ExchangeRateApiKeyLoader 
                savedApiKey={formData.exchangeRateApiKey}
                isEditing={isEditing}
                onLoaded={() => {
                  toast({
                    title: 'API carregada',
                    description: 'A chave de API de Taxa de Câmbio foi carregada com sucesso para esta sessão.',
                  });
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Bank APIs Configuration */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>🏦 APIs de Bancos</CardTitle>
                <CardDescription>Configure o provedor de banco...</CardDescription>
              </div>
              {(formData.wiseApiKey || formData.c6ApiKey) && (
                <div className="flex items-center gap-2 px-3 py-1 bg-green-100 dark:bg-green-900 rounded-full">
                  <div className="h-2 w-2 bg-green-600 dark:bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-xs font-medium text-green-700 dark:text-green-300">
                    {[formData.wiseApiKey, formData.c6ApiKey].filter(Boolean).length} configurada(s)
                  </span>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
                {/* Status das Chaves */}
                {(formData.wiseApiKey || formData.c6ApiKey) && !isEditing && (
                  <div className="space-y-2">
                    {formData.wiseApiKey && (
                      <div className="p-3 bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-orange-900 dark:text-orange-100">
                              🌍 Wise (TransferWise)
                            </p>
                            <p className="text-xs text-orange-700 dark:text-orange-300 font-mono">
                              {formData.wiseApiKey.substring(0, 8)}...{formData.wiseApiKey.slice(-4)}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                    {formData.c6ApiKey && (
                      <div className="p-3 bg-teal-50 dark:bg-teal-950 border border-teal-200 dark:border-teal-800 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-teal-900 dark:text-teal-100">
                              🇧🇷 C6 Bank
                            </p>
                            <p className="text-xs text-teal-700 dark:text-teal-300 font-mono">
                              {formData.c6ApiKey.substring(0, 8)}...{formData.c6ApiKey.slice(-4)}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="wiseApiKey">🌍 Wise (TransferWise)</Label>
                  <Input
                    id="wiseApiKey"
                    name="wiseApiKey"
                    type="password"
                    value={formData.wiseApiKey}
                    onChange={handleInputChange}
                    placeholder="wise_..."
                    disabled={!isEditing}
                  />
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>🔗 <a href="https://wise.com/developer/api-access" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">Wise API Documentation</a></p>
                    <p>Transferências internacionais e conversão de moedas</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="c6ApiKey">🇧🇷 C6 Bank</Label>
                  <Input
                    id="c6ApiKey"
                    name="c6ApiKey"
                    type="password"
                    value={formData.c6ApiKey}
                    onChange={handleInputChange}
                    placeholder="c6_..."
                    disabled={!isEditing}
                  />
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>🔗 <a href="https://developers.c6bank.com.br/" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">C6 Bank Developers</a></p>
                    <p>Sincronização de transações do C6 Bank</p>
                  </div>
                </div>

                <div className="p-4 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <div className="flex items-start gap-2">
                    <ShieldAlert className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                        ⚠️ Segurança Crítica
                      </p>
                      <p className="text-xs text-amber-800 dark:text-amber-200">
                        Estas chaves têm acesso a dados financeiros sensíveis. Apenas o usuário MASTER deve ter acesso a estas configurações. Nunca compartilhe suas chaves de API.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <BankApiKeyLoader 
                    savedWiseKey={formData.wiseApiKey}
                    savedC6Key={formData.c6ApiKey}
                    isEditing={isEditing}
                    onLoaded={() => {
                      toast({
                        title: 'API carregada',
                        description: 'As chaves de API bancárias foram carregadas com sucesso para esta sessão.',
                      });
                    }}
                  />
                </div>
              </div>
          </CardContent>
        </Card>

        {/* Resend Email API Configuration */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>📧 API de Email (Resend)</CardTitle>
                <CardDescription>Configure a chave de API do Resend para envio de emails</CardDescription>
              </div>
              {formData.resendApiKey && formData.resendFromEmail && formData.appUrl && (
                <div className="flex items-center gap-2 px-3 py-1 bg-green-100 dark:bg-green-900 rounded-full">
                  <div className="h-2 w-2 bg-green-600 dark:bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-xs font-medium text-green-700 dark:text-green-300">Configurada</span>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Status da Chave */}
            {formData.resendApiKey && !isEditing && (
              <div className="p-3 bg-indigo-50 dark:bg-indigo-950 border border-indigo-200 dark:border-indigo-800 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-indigo-900 dark:text-indigo-100">
                      📧 Resend Email API
                    </p>
                    <p className="text-xs text-indigo-700 dark:text-indigo-300 font-mono">
                      {formData.resendApiKey.substring(0, 8)}...{formData.resendApiKey.slice(-4)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="resendApiKey">Chave de API do Resend</Label>
              <Input
                id="resendApiKey"
                name="resendApiKey"
                type="password"
                value={formData.resendApiKey}
                onChange={handleInputChange}
                placeholder="re_..."
                disabled={!isEditing}
              />
              <div className="text-xs text-muted-foreground space-y-1">
                <p className="font-medium">Obtenha sua chave de API:</p>
                <p>🔗 <a href="https://resend.com/api-keys" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">Resend Dashboard</a> - Crie uma conta gratuita</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="resendFromEmail">Email Remetente</Label>
              <Input
                id="resendFromEmail"
                name="resendFromEmail"
                type="email"
                value={formData.resendFromEmail}
                onChange={handleInputChange}
                placeholder="noreply@seudominio.com"
                disabled={!isEditing}
              />
              <div className="text-xs text-muted-foreground">
                <p>Email que aparecerá como remetente dos emails enviados</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="appUrl">URL do Aplicativo</Label>
              <Input
                id="appUrl"
                name="appUrl"
                type="url"
                value={formData.appUrl}
                onChange={handleInputChange}
                placeholder="https://seudominio.com"
                disabled={!isEditing}
              />
              <div className="text-xs text-muted-foreground">
                <p>URL completa do seu aplicativo (usado nos links de login dos emails)</p>
              </div>
            </div>

            <div className="pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={handleSendTestEmail}
                disabled={isSendingTestEmail || !formData.resendApiKey || !formData.resendFromEmail || !formData.appUrl}
                className="w-full"
              >
                {isSendingTestEmail ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  '🧪 Enviar Email de Teste'
                )}
              </Button>
              <p className="text-xs text-muted-foreground text-center mt-2">
                Enviará um email de teste para: {user?.email}
              </p>
            </div>

            <div className="p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-start gap-2">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    ℹ️ Sobre o Resend
                  </p>
                  <p className="text-xs text-blue-800 dark:text-blue-200">
                    Resend é um serviço de email moderno e confiável. O plano gratuito oferece 100 emails/dia e 3.000 emails/mês.
                  </p>
                </div>
              </div>
            </div>
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
