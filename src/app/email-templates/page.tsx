'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUser, useFirebase } from '@/firebase';
import { Loader2, ArrowLeft, Eye } from 'lucide-react';
import * as React from 'react';
import { useToast } from '@/hooks/use-toast';
import { usePermissions } from '@/hooks/use-permissions';
import { useRouter } from 'next/navigation';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface EmailTemplate {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  fontFamily: string;
  headerTitle: string;
  footerText: string;
  companyName: string;
  buttonColor: string;
  buttonTextColor: string;
}

export default function EmailTemplatesPage() {
  const { user } = useUser();
  const { firestore } = useFirebase();
  const { toast } = useToast();
  const { isMaster, isLoading: permissionsLoading } = usePermissions();
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(false);
  const [showPreview, setShowPreview] = React.useState(false);

  const [welcomeTemplate, setWelcomeTemplate] = React.useState<EmailTemplate>({
    primaryColor: '#667eea',
    secondaryColor: '#764ba2',
    backgroundColor: '#f4f4f4',
    textColor: '#333333',
    fontFamily: 'Arial, sans-serif',
    headerTitle: '🎉 Bem-vindo ao Sistema Financeiro',
    footerText: 'Este é um email automático. Por favor, não responda a esta mensagem.',
    companyName: 'Sistema Financeiro',
    buttonColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    buttonTextColor: '#ffffff',
  });

  const [resetTemplate, setResetTemplate] = React.useState<EmailTemplate>({
    primaryColor: '#667eea',
    secondaryColor: '#764ba2',
    backgroundColor: '#f4f4f4',
    textColor: '#333333',
    fontFamily: 'Arial, sans-serif',
    headerTitle: '🔐 Nova Senha Temporária',
    footerText: 'Este é um email automático. Por favor, não responda a esta mensagem.',
    companyName: 'Sistema Financeiro',
    buttonColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    buttonTextColor: '#ffffff',
  });

  // Redirect non-master users
  React.useEffect(() => {
    if (!permissionsLoading && !isMaster) {
      router.push('/dashboard');
    }
  }, [isMaster, permissionsLoading, router]);

  // Carregar templates salvos
  React.useEffect(() => {
    const loadTemplates = async () => {
      if (user?.uid && firestore) {
        try {
          const templatesRef = doc(firestore, 'emailTemplates', user.uid);
          const templatesSnap = await getDoc(templatesRef);
          
          if (templatesSnap.exists()) {
            const data = templatesSnap.data();
            if (data.welcome) setWelcomeTemplate(data.welcome);
            if (data.reset) setResetTemplate(data.reset);
          }
        } catch (error) {
          console.error('Erro ao carregar templates:', error);
        }
      }
    };
    loadTemplates();
  }, [user, firestore]);

  const handleSave = async () => {
    if (!user?.uid || !firestore) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Usuário não identificado',
      });
      return;
    }

    setIsLoading(true);

    try {
      const templatesRef = doc(firestore, 'emailTemplates', user.uid);
      await setDoc(templatesRef, {
        welcome: welcomeTemplate,
        reset: resetTemplate,
        updatedAt: new Date(),
      });

      toast({
        title: 'Templates salvos!',
        description: 'As configurações dos templates de email foram salvas com sucesso.',
      });
      setIsEditing(false);
    } catch (error: any) {
      console.error('Erro ao salvar templates:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar',
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (permissionsLoading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!isMaster) {
    return null;
  }

  const generatePreviewHTML = (template: EmailTemplate, type: 'welcome' | 'reset') => {
    return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <style>
      body { font-family: ${template.fontFamily}; line-height: 1.6; color: ${template.textColor}; background-color: ${template.backgroundColor}; margin: 0; padding: 0; }
      .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
      .header { background: linear-gradient(135deg, ${template.primaryColor} 0%, ${template.secondaryColor} 100%); color: white; padding: 30px; text-align: center; }
      .header h1 { margin: 0; font-size: 28px; }
      .content { padding: 30px; }
      .credentials { background: #f8f9fa; border-left: 4px solid ${template.primaryColor}; padding: 15px; margin: 20px 0; border-radius: 4px; }
      .credentials p { margin: 10px 0; }
      .credentials strong { color: ${template.primaryColor}; font-weight: 600; }
      .button { display: inline-block; padding: 12px 30px; background: ${template.buttonColor}; color: ${template.buttonTextColor}; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: 600; }
      .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #e9ecef; }
      .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>${template.headerTitle}</h1>
      </div>
      <div class="content">
        <p>Olá <strong>[Nome do Usuário]</strong>,</p>
        <p>${type === 'welcome' ? 'Uma conta foi criada para você no sistema de gestão financeira. Abaixo estão suas credenciais de acesso:' : 'Uma nova senha temporária foi gerada para sua conta. Abaixo estão suas credenciais de acesso:'}</p>
        
        <div class="credentials">
          <p><strong>Email:</strong> usuario@exemplo.com</p>
          <p><strong>${type === 'welcome' ? 'Senha Temporária' : 'Nova Senha Temporária'}:</strong> ********</p>
        </div>

        <div class="warning">
          <p>⚠️ <strong>Importante:</strong> Esta é uma senha temporária. Por motivos de segurança, recomendamos que você altere sua senha após ${type === 'welcome' ? 'o primeiro acesso' : 'fazer login'}.</p>
        </div>

        <div style="text-align: center;">
          <a href="#" class="button">Acessar Sistema</a>
        </div>

        <p style="margin-top: 30px; font-size: 14px; color: #666;">
          ${type === 'welcome' ? 'Se você tiver alguma dúvida ou precisar de ajuda, entre em contato com o administrador do sistema.' : 'Se você não solicitou esta alteração ou tiver alguma dúvida, entre em contato com o administrador do sistema imediatamente.'}
        </p>
      </div>
      <div class="footer">
        <p>${template.footerText}</p>
        <p>© ${new Date().getFullYear()} ${template.companyName}. Todos os direitos reservados.</p>
      </div>
    </div>
  </body>
</html>
    `;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/system-settings')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold font-headline tracking-tight">
              Templates de Email
            </h1>
            <p className="text-muted-foreground">
              Personalize a aparência dos emails enviados pelo sistema
            </p>
          </div>
        </div>
        {!isEditing && (
          <Button onClick={() => setIsEditing(true)}>
            Editar Templates
          </Button>
        )}
      </div>

      <Tabs defaultValue="welcome" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="welcome">Email de Boas-vindas</TabsTrigger>
          <TabsTrigger value="reset">Email de Reset de Senha</TabsTrigger>
        </TabsList>

        <TabsContent value="welcome" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configurações do Email de Boas-vindas</CardTitle>
              <CardDescription>
                Personalize as cores, textos e estilo do email enviado aos novos usuários
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="welcome-primaryColor">Cor Primária</Label>
                  <div className="flex gap-2">
                    <Input
                      id="welcome-primaryColor"
                      type="color"
                      value={welcomeTemplate.primaryColor}
                      onChange={(e) => setWelcomeTemplate({ ...welcomeTemplate, primaryColor: e.target.value })}
                      disabled={!isEditing}
                      className="w-20 h-10"
                    />
                    <Input
                      type="text"
                      value={welcomeTemplate.primaryColor}
                      onChange={(e) => setWelcomeTemplate({ ...welcomeTemplate, primaryColor: e.target.value })}
                      disabled={!isEditing}
                      className="flex-1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="welcome-secondaryColor">Cor Secundária</Label>
                  <div className="flex gap-2">
                    <Input
                      id="welcome-secondaryColor"
                      type="color"
                      value={welcomeTemplate.secondaryColor}
                      onChange={(e) => setWelcomeTemplate({ ...welcomeTemplate, secondaryColor: e.target.value })}
                      disabled={!isEditing}
                      className="w-20 h-10"
                    />
                    <Input
                      type="text"
                      value={welcomeTemplate.secondaryColor}
                      onChange={(e) => setWelcomeTemplate({ ...welcomeTemplate, secondaryColor: e.target.value })}
                      disabled={!isEditing}
                      className="flex-1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="welcome-backgroundColor">Cor de Fundo</Label>
                  <div className="flex gap-2">
                    <Input
                      id="welcome-backgroundColor"
                      type="color"
                      value={welcomeTemplate.backgroundColor}
                      onChange={(e) => setWelcomeTemplate({ ...welcomeTemplate, backgroundColor: e.target.value })}
                      disabled={!isEditing}
                      className="w-20 h-10"
                    />
                    <Input
                      type="text"
                      value={welcomeTemplate.backgroundColor}
                      onChange={(e) => setWelcomeTemplate({ ...welcomeTemplate, backgroundColor: e.target.value })}
                      disabled={!isEditing}
                      className="flex-1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="welcome-textColor">Cor do Texto</Label>
                  <div className="flex gap-2">
                    <Input
                      id="welcome-textColor"
                      type="color"
                      value={welcomeTemplate.textColor}
                      onChange={(e) => setWelcomeTemplate({ ...welcomeTemplate, textColor: e.target.value })}
                      disabled={!isEditing}
                      className="w-20 h-10"
                    />
                    <Input
                      type="text"
                      value={welcomeTemplate.textColor}
                      onChange={(e) => setWelcomeTemplate({ ...welcomeTemplate, textColor: e.target.value })}
                      disabled={!isEditing}
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="welcome-fontFamily">Fonte</Label>
                <Input
                  id="welcome-fontFamily"
                  value={welcomeTemplate.fontFamily}
                  onChange={(e) => setWelcomeTemplate({ ...welcomeTemplate, fontFamily: e.target.value })}
                  disabled={!isEditing}
                  placeholder="Arial, sans-serif"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="welcome-headerTitle">Título do Cabeçalho</Label>
                <Input
                  id="welcome-headerTitle"
                  value={welcomeTemplate.headerTitle}
                  onChange={(e) => setWelcomeTemplate({ ...welcomeTemplate, headerTitle: e.target.value })}
                  disabled={!isEditing}
                  placeholder="🎉 Bem-vindo ao Sistema Financeiro"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="welcome-companyName">Nome da Empresa</Label>
                <Input
                  id="welcome-companyName"
                  value={welcomeTemplate.companyName}
                  onChange={(e) => setWelcomeTemplate({ ...welcomeTemplate, companyName: e.target.value })}
                  disabled={!isEditing}
                  placeholder="Sistema Financeiro"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="welcome-footerText">Texto do Rodapé</Label>
                <Input
                  id="welcome-footerText"
                  value={welcomeTemplate.footerText}
                  onChange={(e) => setWelcomeTemplate({ ...welcomeTemplate, footerText: e.target.value })}
                  disabled={!isEditing}
                  placeholder="Este é um email automático..."
                />
              </div>

              <Button 
                variant="outline" 
                onClick={() => setShowPreview(true)}
                className="w-full"
              >
                <Eye className="mr-2 h-4 w-4" />
                Visualizar Preview
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reset" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configurações do Email de Reset de Senha</CardTitle>
              <CardDescription>
                Personalize as cores, textos e estilo do email de redefinição de senha
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="reset-primaryColor">Cor Primária</Label>
                  <div className="flex gap-2">
                    <Input
                      id="reset-primaryColor"
                      type="color"
                      value={resetTemplate.primaryColor}
                      onChange={(e) => setResetTemplate({ ...resetTemplate, primaryColor: e.target.value })}
                      disabled={!isEditing}
                      className="w-20 h-10"
                    />
                    <Input
                      type="text"
                      value={resetTemplate.primaryColor}
                      onChange={(e) => setResetTemplate({ ...resetTemplate, primaryColor: e.target.value })}
                      disabled={!isEditing}
                      className="flex-1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reset-secondaryColor">Cor Secundária</Label>
                  <div className="flex gap-2">
                    <Input
                      id="reset-secondaryColor"
                      type="color"
                      value={resetTemplate.secondaryColor}
                      onChange={(e) => setResetTemplate({ ...resetTemplate, secondaryColor: e.target.value })}
                      disabled={!isEditing}
                      className="w-20 h-10"
                    />
                    <Input
                      type="text"
                      value={resetTemplate.secondaryColor}
                      onChange={(e) => setResetTemplate({ ...resetTemplate, secondaryColor: e.target.value })}
                      disabled={!isEditing}
                      className="flex-1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reset-backgroundColor">Cor de Fundo</Label>
                  <div className="flex gap-2">
                    <Input
                      id="reset-backgroundColor"
                      type="color"
                      value={resetTemplate.backgroundColor}
                      onChange={(e) => setResetTemplate({ ...resetTemplate, backgroundColor: e.target.value })}
                      disabled={!isEditing}
                      className="w-20 h-10"
                    />
                    <Input
                      type="text"
                      value={resetTemplate.backgroundColor}
                      onChange={(e) => setResetTemplate({ ...resetTemplate, backgroundColor: e.target.value })}
                      disabled={!isEditing}
                      className="flex-1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reset-textColor">Cor do Texto</Label>
                  <div className="flex gap-2">
                    <Input
                      id="reset-textColor"
                      type="color"
                      value={resetTemplate.textColor}
                      onChange={(e) => setResetTemplate({ ...resetTemplate, textColor: e.target.value })}
                      disabled={!isEditing}
                      className="w-20 h-10"
                    />
                    <Input
                      type="text"
                      value={resetTemplate.textColor}
                      onChange={(e) => setResetTemplate({ ...resetTemplate, textColor: e.target.value })}
                      disabled={!isEditing}
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reset-fontFamily">Fonte</Label>
                <Input
                  id="reset-fontFamily"
                  value={resetTemplate.fontFamily}
                  onChange={(e) => setResetTemplate({ ...resetTemplate, fontFamily: e.target.value })}
                  disabled={!isEditing}
                  placeholder="Arial, sans-serif"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reset-headerTitle">Título do Cabeçalho</Label>
                <Input
                  id="reset-headerTitle"
                  value={resetTemplate.headerTitle}
                  onChange={(e) => setResetTemplate({ ...resetTemplate, headerTitle: e.target.value })}
                  disabled={!isEditing}
                  placeholder="🔐 Nova Senha Temporária"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reset-companyName">Nome da Empresa</Label>
                <Input
                  id="reset-companyName"
                  value={resetTemplate.companyName}
                  onChange={(e) => setResetTemplate({ ...resetTemplate, companyName: e.target.value })}
                  disabled={!isEditing}
                  placeholder="Sistema Financeiro"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reset-footerText">Texto do Rodapé</Label>
                <Input
                  id="reset-footerText"
                  value={resetTemplate.footerText}
                  onChange={(e) => setResetTemplate({ ...resetTemplate, footerText: e.target.value })}
                  disabled={!isEditing}
                  placeholder="Este é um email automático..."
                />
              </div>

              <Button 
                variant="outline" 
                onClick={() => setShowPreview(true)}
                className="w-full"
              >
                <Eye className="mr-2 h-4 w-4" />
                Visualizar Preview
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {isEditing && (
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setIsEditing(false)} disabled={isLoading}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar Templates
          </Button>
        </div>
      )}
    </div>
  );
}
