'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUser, useFirebase } from '@/firebase';
import { Camera, Loader2 } from 'lucide-react';
import * as React from 'react';
import { useToast } from '@/hooks/use-toast';
import { saveUserSettings, getUserSettings, uploadProfilePhoto } from '@/lib/user-settings';
import Image from 'next/image';
import { useLanguage } from '@/lib/i18n';

const CurrencyFlag = ({ code }: { code: string }) => {
  const flags: Record<string, string> = {
    BRL: 'br',
    EUR: 'eu',
    USD: 'us',
  };
  return (
    <Image
      src={`https://flagcdn.com/w20/${flags[code]}.png`}
      srcSet={`https://flagcdn.com/w40/${flags[code]}.png 2x`}
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
      src={`https://flagcdn.com/w20/${flags[code]}.png`}
      srcSet={`https://flagcdn.com/w40/${flags[code]}.png 2x`}
      alt={code}
      width={20}
      height={15}
      className="inline-block mr-2"
    />
  );
};

export default function SettingsPage() {
  const { user } = useUser();
  const { firestore, auth, storage } = useFirebase();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(false);
  const [uploadingPhoto, setUploadingPhoto] = React.useState(false);
  const [photoURL, setPhotoURL] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
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
  });

  React.useEffect(() => {
    const loadUserSettings = async () => {
      if (user?.uid && firestore) {
        const result = await getUserSettings(firestore, user.uid);
        if (result.success && result.data) {
          setFormData({
            ...result.data,
            emailConfirm: result.data.email,
          });
        } else if (user.displayName) {
          const [firstName, ...lastNameParts] = user.displayName.split(' ');
          setFormData(prev => ({
            ...prev,
            firstName: firstName || '',
            lastName: lastNameParts.join(' ') || '',
            email: user.email || '',
            emailConfirm: user.email || '',
            timezone: 'America/Sao_Paulo',
            defaultCurrency: 'BRL',
            defaultLanguage: 'PT-BR',
          }));
        } else if (user.email) {
          setFormData(prev => ({
            ...prev,
            email: user.email || '',
            emailConfirm: user.email || '',
            timezone: 'America/Sao_Paulo',
            defaultCurrency: 'BRL',
            defaultLanguage: 'PT-BR',
          }));
        }
      }
    };
    loadUserSettings();
  }, [user, firestore]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleZipCodeBlur = async () => {
    const cleanZip = formData.zipCode.replace(/\D/g, '');
    if (cleanZip.length === 8) {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cleanZip}/json/`);
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
            description: `${data.logradouro}, ${data.bairro}, ${data.localidade} - ${data.uf}`,
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

    // Validar e-mails
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
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          whatsapp: formData.whatsapp,
          phone: formData.phone,
          zipCode: formData.zipCode,
          street: formData.street,
          number: formData.number,
          complement: formData.complement,
          neighborhood: formData.neighborhood,
          city: formData.city,
          state: formData.state,
          cpf: formData.cpf,
          timezone: formData.timezone,
          defaultCurrency: formData.defaultCurrency,
          defaultLanguage: formData.defaultLanguage,
        },
        photoURL || undefined
      );

      if (result.success) {
        toast({
          title: t('toast.saved'),
          description: t('toast.savedDesc'),
        });
        setIsEditing(false);
        setPhotoURL(null);
        
        // Recarregar a página para aplicar o novo idioma
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

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.uid || !storage) return;

    setUploadingPhoto(true);

    try {
      const result = await uploadProfilePhoto(storage, user.uid, file);

      if (result.success && result.photoURL) {
        setPhotoURL(result.photoURL);
        toast({
          title: t('toast.photoUpdated'),
          description: t('toast.photoUpdatedDesc'),
        });
      } else {
        toast({
          variant: 'destructive',
          title: t('settings.uploadError'),
          description: result.error || t('settings.uploadErrorDesc'),
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: t('settings.uploadError'),
        description: t('settings.uploadUnexpectedError'),
      });
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setPhotoURL(null);
    // Restaurar dados originais
    if (user?.displayName) {
      const [firstName, ...lastNameParts] = user.displayName.split(' ');
      setFormData(prev => ({
        ...prev,
        firstName: firstName || '',
        lastName: lastNameParts.join(' ') || '',
        email: user.email || '',
        emailConfirm: user.email || '',
        timezone: 'America/Sao_Paulo',
        defaultCurrency: 'BRL',
        defaultLanguage: 'PT-BR',
      }));
    } else if (user?.email) {
      setFormData(prev => ({
        ...prev,
        email: user.email || '',
        emailConfirm: user.email || '',
        timezone: 'America/Sao_Paulo',
        defaultCurrency: 'BRL',
        defaultLanguage: 'PT-BR',
      }));
    }
  };

  const formatPhone = (value: string) => {
    // Remove all non-numeric characters
    const numbers = value.replace(/\D/g, '');
    
    // If starts with +, preserve it
    const hasPlus = value.startsWith('+');
    
    if (!hasPlus && numbers.length > 0) {
      return '+' + numbers;
    }
    
    return hasPlus ? '+' + numbers : numbers;
  };

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 6) return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
    if (numbers.length <= 9) return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`;
    return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9, 11)}`;
  };

  const formatZipCode = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 5) return numbers;
    return `${numbers.slice(0, 5)}-${numbers.slice(5, 8)}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-headline tracking-tight">
            {t('settings.title')}
          </h1>
          <p className="text-muted-foreground">
            {t('settings.subtitle')}
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
              {/* Avatar Section */}
              <div className="flex flex-col items-center gap-3 pb-4 border-b">
                <Avatar className="h-32 w-32">
                  <AvatarImage src={photoURL || user?.photoURL || undefined} alt={user?.displayName ?? ''} />
                  <AvatarFallback className="text-3xl">
                    {user?.displayName?.charAt(0) ?? user?.email?.charAt(0)?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  disabled={!isEditing || uploadingPhoto}
                  onClick={handlePhotoClick}
                >
                  {uploadingPhoto ? (
                    <>
                      <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                      {t('settings.uploading')}
                    </>
                  ) : (
                    <>
                      <Camera className="mr-2 h-3 w-3" />
                      {t('settings.changePhoto')}
                    </>
                  )}
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  {t('settings.photoFormats')}
                </p>
              </div>
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

        {/* Column 2: Address and Other Info */}
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
                    disabled
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

              <div className="grid gap-4 md:grid-cols-2">
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
                <div className="space-y-2">
                  <Label htmlFor="neighborhood">{t('settings.neighborhood')}</Label>
                  <Input
                    id="neighborhood"
                    name="neighborhood"
                    value={formData.neighborhood}
                    onChange={handleInputChange}
                    placeholder={t('settings.neighborhoodPlaceholder')}
                    disabled
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="city">{t('settings.city')}</Label>
                  <Input
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    placeholder={t('settings.cityPlaceholder')}
                    disabled
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">{t('settings.state')}</Label>
                  <Input
                    id="state"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    placeholder={t('settings.statePlaceholder')}
                    disabled
                  />
                </div>
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

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="timezone">{t('settings.timezone')} *</Label>
                  <Select
                    value={formData.timezone}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, timezone: value }))}
                    disabled={!isEditing}
                  >
                    <SelectTrigger id="timezone">
                      <SelectValue placeholder={t('settings.selectTimezone')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="America/Sao_Paulo">Brasil - São Paulo (GMT-3)</SelectItem>
                      <SelectItem value="America/Rio_Branco">Brasil - Acre (GMT-5)</SelectItem>
                      <SelectItem value="America/Manaus">Brasil - Amazonas (GMT-4)</SelectItem>
                      <SelectItem value="America/Noronha">Brasil - Fernando de Noronha (GMT-2)</SelectItem>
                      <SelectItem value="Europe/Lisbon">Portugal - Lisboa (GMT+0)</SelectItem>
                      <SelectItem value="Europe/London">Reino Unido - Londres (GMT+0)</SelectItem>
                      <SelectItem value="Europe/Paris">França - Paris (GMT+1)</SelectItem>
                      <SelectItem value="Europe/Berlin">Alemanha - Berlim (GMT+1)</SelectItem>
                      <SelectItem value="Europe/Madrid">Espanha - Madrid (GMT+1)</SelectItem>
                      <SelectItem value="Europe/Rome">Itália - Roma (GMT+1)</SelectItem>
                      <SelectItem value="America/New_York">EUA - Nova York (GMT-5)</SelectItem>
                      <SelectItem value="America/Los_Angeles">EUA - Los Angeles (GMT-8)</SelectItem>
                      <SelectItem value="America/Chicago">EUA - Chicago (GMT-6)</SelectItem>
                      <SelectItem value="America/Denver">EUA - Denver (GMT-7)</SelectItem>
                      <SelectItem value="Asia/Tokyo">Japão - Tóquio (GMT+9)</SelectItem>
                      <SelectItem value="Asia/Shanghai">China - Xangai (GMT+8)</SelectItem>
                      <SelectItem value="Australia/Sydney">Austrália - Sydney (GMT+11)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="defaultCurrency">{t('settings.defaultCurrency')} *</Label>
                  <Select
                    value={formData.defaultCurrency}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, defaultCurrency: value }))}
                    disabled={!isEditing}
                  >
                    <SelectTrigger id="defaultCurrency">
                      <SelectValue placeholder={t('settings.selectCurrency')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BRL">
                        <div className="flex items-center">
                          <CurrencyFlag code="BRL" />
                          BRL (R$)
                        </div>
                      </SelectItem>
                      <SelectItem value="EUR">
                        <div className="flex items-center">
                          <CurrencyFlag code="EUR" />
                          EUR (€)
                        </div>
                      </SelectItem>
                      <SelectItem value="USD">
                        <div className="flex items-center">
                          <CurrencyFlag code="USD" />
                          USD ($)
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="defaultLanguage">{t('settings.defaultLanguage')} *</Label>
                <Select
                  value={formData.defaultLanguage}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, defaultLanguage: value }))}
                  disabled={!isEditing}
                >
                  <SelectTrigger id="defaultLanguage">
                    <SelectValue placeholder={t('settings.selectLanguage')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PT-BR">
                      <div className="flex items-center">
                        <LanguageFlag code="PT-BR" />
                        Português (Brasil)
                      </div>
                    </SelectItem>
                    <SelectItem value="PT-PT">
                      <div className="flex items-center">
                        <LanguageFlag code="PT-PT" />
                        Português (Portugal)
                      </div>
                    </SelectItem>
                    <SelectItem value="EN-US">
                      <div className="flex items-center">
                        <LanguageFlag code="EN-US" />
                        English (USA)
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <p className="text-sm text-muted-foreground">{t('settings.required')}</p>

              {isEditing && (
                <div className="flex justify-end gap-4 pt-4">
                  <Button type="button" variant="outline" onClick={handleCancel}>
                    {t('settings.cancel')}
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {t('settings.save')}
                  </Button>
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
