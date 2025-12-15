'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUser, useFirebase } from '@/firebase';
import { Loader2 } from 'lucide-react';
import * as React from 'react';
import { useToast } from '@/hooks/use-toast';
import { saveUserSettings, getUserSettings } from '@/lib/user-settings';
import Image from 'next/image';
import { useLanguage } from '@/lib/i18n';
import { AvatarPicker, UserAvatar } from '@/components/ui/avatar-picker';
import { FloatingSaveButton } from '@/components/ui/floating-save-button';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

const CurrencyFlag = ({ code }: { code: string }) => {
  const flags: Record<string, string> = {
    BRL: 'br',
    EUR: 'eu',
    USD: 'us',
  };
  return (
    <Image
      src={'https://flagcdn.com/w20/' + flags[code] + '.png'}
      alt={code}
      width={20}
      height={15}
      className="inline-block mr-2"
    />
  );
};

const LanguageFlag = ({ code }: { code: string }) => {
  const flags: Record<string, string> = {
    'PT-BR': 'br',
    'PT-PT': 'pt',
    'EN-US': 'us',
  };
  return (
    <Image
      src={'https://flagcdn.com/w20/' + flags[code] + '.png'}
      alt={code}
      width={20}
      height={15}
      className="inline-block mr-2"
    />
  );
};

export default function ProfilePage() {
  const { user } = useUser();
  const { firestore, auth } = useFirebase();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(false);
  const [selectedAvatarId, setSelectedAvatarId] = React.useState<string>('user-1');
  const [emailFrequency, setEmailFrequency] = React.useState<'never' | 'biweekly' | 'monthly' | 'quarterly' | 'semiannual' | 'ninemonths' | 'yearly'>('never');
  const [isSendingTest, setIsSendingTest] = React.useState(false);
  const [formData, setFormData] = React.useState({
    firstName: '',
    lastName: '',
    email: '',
    emailConfirm: '',
    whatsapp: '',
    phone: '',
    zipCode: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    cpf: '',
    timezone: '',
    defaultCurrency: 'BRL',
    defaultLanguage: 'PT-BR',
    avatarId: 'user-1',
  });

  React.useEffect(() => {
    const loadUserSettings = async () => {
      if (user?.uid && firestore) {
        const result = await getUserSettings(firestore, user.uid);
        
        const [firstName, ...lastNameParts] = (user.displayName || '').split(' ');
        const authData = {
          firstName: firstName || '',
          lastName: lastNameParts.join(' ') || '',
          email: user.email || '',
          emailConfirm: user.email || '',
        };
        
        if (result.success && result.data) {
          const mergedData = {
            ...result.data,
            firstName: result.data.firstName || authData.firstName,
            lastName: result.data.lastName || authData.lastName,
            email: result.data.email || authData.email,
            emailConfirm: result.data.email || authData.email,
            whatsapp: result.data.whatsapp || '',
            phone: result.data.phone || '',
            avatarId: result.data.avatarId || 'user-1',
          };
          setFormData(mergedData);
          setSelectedAvatarId(result.data.avatarId || 'user-1');
        } else {
          setFormData(prev => ({
            ...prev,
            ...authData,
            timezone: 'America/Sao_Paulo',
            defaultCurrency: 'BRL',
            defaultLanguage: 'PT-BR',
            avatarId: 'user-1',
          }));
          setSelectedAvatarId('user-1');
        }
      }
    };
    loadUserSettings();
  }, [user, firestore]);

  React.useEffect(() => {
    const loadEmailSettings = async () => {
      if (!user?.uid || !firestore) return;

      try {
        const userRef = doc(firestore, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const data = userSnap.data();
          setEmailFrequency(data.emailFrequency || 'never');
        }
      } catch (error) {
        console.error('Erro ao carregar configurações de email:', error);
      }
    };

    loadEmailSettings();
  }, [user, firestore]);

  const capitalizeFirstLetter = (text: string) => {
    if (!text) return '';
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === 'firstName' || name === 'lastName') {
      const formatted = capitalizeFirstLetter(value);
      setFormData(prev => ({ ...prev, [name]: formatted }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleZipCodeBlur = async () => {
    const cleanZip = formData.zipCode.replace(/\D/g, '');
    if (cleanZip.length === 8) {
      try {
        const response = await fetch('https://viacep.com.br/ws/' + cleanZip + '/json/');
        const data = await response.json();
        if (!data.erro) {
          setFormData(prev => ({
            ...prev,
            street: data.logradouro || '',
            neighborhood: data.bairro || '',
            city: data.localidade || '',
            state: data.uf || '',
          }));
          toast({
            title: t('settings.zipCodeFound'),
            description: data.logradouro + ', ' + data.bairro + ', ' + data.localidade + ' - ' + data.uf,
          });
        } else {
          toast({
            variant: 'destructive',
            title: t('settings.zipCodeNotFound'),
            description: t('settings.zipCodeCheckAgain'),
          });
        }
      } catch (error) {
        toast({
          variant: 'destructive',
          title: t('settings.zipCodeFetchError'),
          description: t('settings.zipCodeValidationFailed'),
        });
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.email !== formData.emailConfirm) {
      toast({
        variant: 'destructive',
        title: t('settings.validationError'),
        description: t('settings.emailsMismatch'),
      });
      return;
    }

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
      const result = await saveUserSettings(
        firestore, 
        auth, 
        user.uid, 
        user, 
        {
          ...formData,
          defaultCurrency: formData.defaultCurrency as 'BRL' | 'EUR' | 'USD',
          defaultLanguage: formData.defaultLanguage as 'PT-BR' | 'PT-PT' | 'EN-US',
          avatarId: selectedAvatarId,
        }
      );

      if (result.success) {
        toast({
          title: t('toast.saved'),
          description: t('toast.savedDesc'),
        });
        setIsEditing(false);
        
        setTimeout(() => {
          window.location.reload();
        }, 1000);
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

  const handleAvatarSelect = (avatarId: string) => {
    setSelectedAvatarId(avatarId);
    setFormData(prev => ({ ...prev, avatarId }));
  };

  const handleCancel = async () => {
    setIsEditing(false);
    if (user?.uid && firestore) {
      const result = await getUserSettings(firestore, user.uid);
      if (result.success && result.data) {
        setFormData({
          ...result.data,
          emailConfirm: result.data.email,
        });
        setSelectedAvatarId(result.data.avatarId || 'user-1');
      }
    }
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    const hasPlus = value.startsWith('+');
    
    if (!hasPlus && numbers.length > 0) {
      return '+' + numbers;
    }
    
    return hasPlus ? '+' + numbers : numbers;
  };

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 6) return numbers.slice(0, 3) + '.' + numbers.slice(3);
    if (numbers.length <= 9) return numbers.slice(0, 3) + '.' + numbers.slice(3, 6) + '.' + numbers.slice(6);
    return numbers.slice(0, 3) + '.' + numbers.slice(3, 6) + '.' + numbers.slice(6, 9) + '-' + numbers.slice(9, 11);
  };

  const formatZipCode = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 5) return numbers;
    return numbers.slice(0, 5) + '-' + numbers.slice(5, 8);
  };

  const handleSaveEmailSettings = async () => {
    if (!user?.uid || !firestore) return;

    setIsLoading(true);
    try {
      const userRef = doc(firestore, 'users', user.uid);
      await updateDoc(userRef, {
        emailFrequency,
        updatedAt: new Date().toISOString(),
      });

      toast({
        title: 'Sucesso',
        description: 'Configurações de email salvas com sucesso.',
      });
    } catch (error) {
      console.error('Erro ao salvar configurações de email:', error);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível salvar as configurações de email.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendTestEmail = async () => {
    if (!user) return;

    setIsSendingTest(true);
    try {
      const idToken = await user.getIdToken();
      const response = await fetch('/api/reports/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao enviar email');
      }

      const data = await response.json();
      toast({
        title: 'Email enviado!',
        description: `Relatório enviado com sucesso. ${data.summary.transactionCount} transações processadas.`,
      });
    } catch (error: any) {
      console.error('Erro ao enviar email de teste:', error);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: error.message || 'Não foi possível enviar o email de teste.',
      });
    } finally {
      setIsSendingTest(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-headline tracking-tight">
            {t('settings.personalInfo')}
          </h1>
          <p className="text-muted-foreground">
            {t('settings.personalInfoDesc')}
          </p>
        </div>
        {!isEditing && (
          <Button type="button" variant="outline" onClick={() => setIsEditing(true)}>
            {t('settings.editData')}
          </Button>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Column 1: Avatar and Personal Info */}
        <Card>
          <CardHeader>
            <CardTitle>{t('settings.personalInfo')}</CardTitle>
            <CardDescription>{t('settings.personalInfoDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {isEditing ? (
                /* Avatar Selection Mode */
                <div className="space-y-4 pb-4 border-b">
                  <div className="flex flex-col items-center gap-3">
                    <UserAvatar avatarId={selectedAvatarId} className="h-24 w-24" />
                    <Label className="text-sm font-medium">Escolha seu avatar:</Label>
                  </div>
                  <AvatarPicker
                    selectedAvatarId={selectedAvatarId}
                    onSelect={handleAvatarSelect}
                    disabled={!isEditing}
                  />
                </div>
              ) : (
                /* Avatar Display Mode */
                <div className="flex flex-col items-center gap-4 pb-4 border-b">
                  <UserAvatar avatarId={selectedAvatarId} className="h-32 w-32" />
                  <p className="text-sm font-medium text-center">Seu avatar</p>
                </div>
              )}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName">{t('settings.firstName')} *</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    placeholder={t('settings.firstNamePlaceholder')}
                    required
                    disabled={!isEditing}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">{t('settings.lastName')} *</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    placeholder={t('settings.lastNamePlaceholder')}
                    required
                    disabled={!isEditing}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="email">{t('settings.email')} *</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder={t('settings.emailPlaceholder')}
                    required
                    disabled={!isEditing}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emailConfirm">{t('settings.confirmEmail')} *</Label>
                  <Input
                    id="emailConfirm"
                    name="emailConfirm"
                    type="email"
                    value={formData.emailConfirm}
                    onChange={handleInputChange}
                    placeholder={t('settings.emailPlaceholder')}
                    required
                    disabled={!isEditing}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="whatsapp">{t('settings.whatsapp')}</Label>
                  <Input
                    id="whatsapp"
                    name="whatsapp"
                    value={formData.whatsapp}
                    onChange={(e) => {
                      const formatted = formatPhone(e.target.value);
                      setFormData(prev => ({ ...prev, whatsapp: formatted }));
                    }}
                    placeholder={t('settings.phonePlaceholder')}
                    disabled={!isEditing}
                  />
                  <p className="text-xs text-muted-foreground">
                    {t('settings.phoneFormat')}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">{t('settings.phone')}</Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={(e) => {
                      const formatted = formatPhone(e.target.value);
                      setFormData(prev => ({ ...prev, phone: formatted }));
                    }}
                    placeholder={t('settings.phonePlaceholder')}
                    disabled={!isEditing}
                  />
                  <p className="text-xs text-muted-foreground">
                    {t('settings.phoneFormat')}
                  </p>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Column 2: Address and Preferences */}
        <Card>
          <CardHeader>
            <CardTitle>{t('settings.address')}</CardTitle>
            <CardDescription>{t('settings.addressInfo')}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="zipCode">{t('settings.zipCode')}</Label>
                <Input
                  id="zipCode"
                  name="zipCode"
                  value={formatZipCode(formData.zipCode)}
                  onChange={(e) => {
                    const formatted = formatZipCode(e.target.value);
                    setFormData(prev => ({ ...prev, zipCode: formatted }));
                  }}
                  onBlur={handleZipCodeBlur}
                  placeholder={t('settings.zipCodePlaceholder')}
                  maxLength={9}
                  disabled={!isEditing}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="street">{t('settings.street')}</Label>
                  <Input
                    id="street"
                    name="street"
                    value={formData.street}
                    onChange={handleInputChange}
                    placeholder={t('settings.streetPlaceholder')}
                    disabled={!isEditing}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="number">{t('settings.number')}</Label>
                  <Input
                    id="number"
                    name="number"
                    value={formData.number}
                    onChange={handleInputChange}
                    placeholder={t('settings.numberPlaceholder')}
                    disabled={!isEditing}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="complement">{t('settings.complement')}</Label>
                <Input
                  id="complement"
                  name="complement"
                  value={formData.complement}
                  onChange={handleInputChange}
                  placeholder={t('settings.complementPlaceholder')}
                  disabled={!isEditing}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="neighborhood">{t('settings.neighborhood')}</Label>
                  <Input
                    id="neighborhood"
                    name="neighborhood"
                    value={formData.neighborhood}
                    onChange={handleInputChange}
                    placeholder={t('settings.neighborhoodPlaceholder')}
                    disabled={!isEditing}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">{t('settings.city')}</Label>
                  <Input
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    placeholder={t('settings.cityPlaceholder')}
                    disabled={!isEditing}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="state">{t('settings.state')}</Label>
                  <Input
                    id="state"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    placeholder={t('settings.statePlaceholder')}
                    maxLength={2}
                    disabled={!isEditing}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cpf">{t('settings.cpf')}</Label>
                  <Input
                    id="cpf"
                    name="cpf"
                    value={formatCPF(formData.cpf)}
                    onChange={(e) => {
                      const formatted = formatCPF(e.target.value);
                      setFormData(prev => ({ ...prev, cpf: formatted }));
                    }}
                    placeholder={t('settings.cpfPlaceholder')}
                    maxLength={14}
                    disabled={!isEditing}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="defaultCurrency">{t('settings.defaultCurrency')}</Label>
                <Select 
                  value={formData.defaultCurrency} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, defaultCurrency: value }))}
                  disabled={!isEditing}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BRL">
                      <CurrencyFlag code="BRL" />
                      Real Brasileiro (BRL)
                    </SelectItem>
                    <SelectItem value="EUR">
                      <CurrencyFlag code="EUR" />
                      Euro (EUR)
                    </SelectItem>
                    <SelectItem value="USD">
                      <CurrencyFlag code="USD" />
                      Dólar Americano (USD)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="defaultLanguage">{t('settings.defaultLanguage')}</Label>
                <Select 
                  value={formData.defaultLanguage} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, defaultLanguage: value }))}
                  disabled={!isEditing}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PT-BR">
                      <LanguageFlag code="PT-BR" />
                      Português (Brasil)
                    </SelectItem>
                    <SelectItem value="PT-PT">
                      <LanguageFlag code="PT-PT" />
                      Português (Portugal)
                    </SelectItem>
                    <SelectItem value="EN-US">
                      <LanguageFlag code="EN-US" />
                      English (US)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Email Reports Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Relatórios por Email</CardTitle>
          <CardDescription>
            Receba relatórios periódicos com resumo de suas transações e gráficos.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="emailFrequency">Frequência de Envio</Label>
            <Select value={emailFrequency} onValueChange={(value: any) => setEmailFrequency(value)}>
              <SelectTrigger id="emailFrequency">
                <SelectValue placeholder="Selecione a frequência" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="never">Nunca</SelectItem>
                <SelectItem value="biweekly">A cada 15 dias</SelectItem>
                <SelectItem value="monthly">1 mês</SelectItem>
                <SelectItem value="quarterly">3 meses</SelectItem>
                <SelectItem value="semiannual">6 meses</SelectItem>
                <SelectItem value="ninemonths">9 meses</SelectItem>
                <SelectItem value="yearly">1 ano</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {emailFrequency === 'never' && 'Você não receberá relatórios por email.'}
              {emailFrequency === 'biweekly' && 'Você receberá um relatório a cada 15 dias com suas transações.'}
              {emailFrequency === 'monthly' && 'Você receberá um relatório mensal com suas transações.'}
              {emailFrequency === 'quarterly' && 'Você receberá um relatório a cada 3 meses com suas transações.'}
              {emailFrequency === 'semiannual' && 'Você receberá um relatório a cada 6 meses com suas transações.'}
              {emailFrequency === 'ninemonths' && 'Você receberá um relatório a cada 9 meses com suas transações.'}
              {emailFrequency === 'yearly' && 'Você receberá um relatório anual com suas transações.'}
            </p>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSaveEmailSettings} disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar Configurações de Email
            </Button>
            <Button 
              onClick={handleSendTestEmail} 
              disabled={isSendingTest || emailFrequency === 'never'} 
              variant="outline"
            >
              {isSendingTest && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enviar Email de Teste
            </Button>
          </div>
        </CardContent>
      </Card>

      {isEditing && (
        <FloatingSaveButton
          onSave={handleSubmit}
          onCancel={handleCancel}
          isLoading={isLoading}
          saveLabel={t('settings.save')}
          cancelLabel={t('settings.cancel')}
        />
      )}
    </div>
  );
}
