'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { useUser, useFirebase } from '@/firebase';
import { Loader2, ArrowLeft, Eye } from 'lucide-react';
import * as React from 'react';
import { FloatingSaveButton } from '@/components/ui/floating-save-button';
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
  bodyText: string;
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
  const [previewTab, setPreviewTab] = React.useState<'welcome' | 'reset' | 'credentials' | 'report'>('welcome');

  const [welcomeTemplate, setWelcomeTemplate] = React.useState<EmailTemplate>({
    primaryColor: '#667eea',
    secondaryColor: '#764ba2',
    backgroundColor: '#f4f4f4',
    textColor: '#333333',
    fontFamily: 'Arial, sans-serif',
    headerTitle: '🎉 Bem-vindo ao FIN',
    bodyText: 'Olá {nome},\n\nUma conta foi criada para você no FIN. Abaixo estão suas credenciais de acesso:\n\nEmail: {email}\nSenha Temporária: {senha}\n\n⚠️ Importante: Esta é uma senha temporária. Por motivos de segurança, recomendamos que você altere sua senha após o primeiro acesso.\n\nSe você tiver alguma dúvida ou precisar de ajuda, entre em contato com o administrador do sistema.',
    footerText: 'Este é um email automático. Por favor, não responda a esta mensagem.',
    companyName: 'FIN',
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
    bodyText: 'Olá {nome},\n\nUma nova senha temporária foi gerada para sua conta. Abaixo estão suas credenciais de acesso:\n\nEmail: {email}\nNova Senha Temporária: {senha}\n\n⚠️ Importante: Esta é uma senha temporária. Por motivos de segurança, recomendamos que você altere sua senha após fazer login.\n\nSe você não solicitou esta alteração ou tiver alguma dúvida, entre em contato com o administrador do sistema imediatamente.',
    footerText: 'Este é um email automático. Por favor, não responda a esta mensagem.',
    companyName: 'Sistema Financeiro',
    buttonColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    buttonTextColor: '#ffffff',
  });

  const [reportTemplate, setReportTemplate] = React.useState<EmailTemplate>({
    primaryColor: '#667eea',
    secondaryColor: '#764ba2',
    backgroundColor: '#f4f4f4',
    textColor: '#333333',
    fontFamily: 'Arial, sans-serif',
    headerTitle: '📊 Relatório de Transações',
    bodyText: 'Olá {nome},\n\nSegue o resumo das suas transações do período {periodo}:\n\n💰 Total de Receitas: {totalReceitas}\n💸 Total de Despesas: {totalDespesas}\n📈 Saldo do Período: {saldo}\n📝 Total de Transações: {totalTransacoes}\n\n{topCategorias}\n\nPara visualizar os detalhes completos, acesse o sistema.',
    footerText: 'Este é um email automático de relatório. Por favor, não responda a esta mensagem.',
    companyName: 'Sistema Financeiro',
    buttonColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    buttonTextColor: '#ffffff',
  });

  const [credentialsTemplate, setCredentialsTemplate] = React.useState<EmailTemplate>({
    primaryColor: '#667eea',
    secondaryColor: '#764ba2',
    backgroundColor: '#f4f4f4',
    textColor: '#333333',
    fontFamily: 'Arial, sans-serif',
    headerTitle: '🔐 Suas Credenciais de Acesso',
    bodyText: 'Olá {nome},\n\nSuas credenciais de acesso ao Finance App foram geradas. Use os dados abaixo para fazer login:\n\nEmail: {email}\nSenha Temporária: {senha}\n\n⚠️ Importante: Esta é uma senha temporária. Por questões de segurança, você será solicitado a alterá-la no primeiro acesso.\n\nSe você não solicitou este email, por favor ignore-o ou entre em contato com o administrador.',
    footerText: 'Este é um email automático. Por favor, não responda a esta mensagem.',
    companyName: 'Finance App',
    buttonColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    buttonTextColor: '#ffffff',
  });

  const [reportOptions, setReportOptions] = React.useState({
    showIncomeExpenseChart: true,
    showCategoriesChart: true,
    showTopCategories: true,
    showMonthlyComparison: true,
    includePeriodSummary: true,
    showConversionData: true,
    showConversionChart: true,
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
            if (data.report) setReportTemplate(data.report);
            if (data.credentials) setCredentialsTemplate(data.credentials);
            if (data.reportOptions) setReportOptions(data.reportOptions);
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
        report: reportTemplate,
        credentials: credentialsTemplate,
        reportOptions: reportOptions,
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

  const generatePreviewHTML = (template: EmailTemplate, type: 'welcome' | 'reset' | 'report' | 'credentials') => {
    // Substituir variáveis no bodyText com valores de exemplo
    let previewBody = template.bodyText
      .replace(/{nome}/g, 'João Silva')
      .replace(/{email}/g, 'joao.silva@exemplo.com')
      .replace(/{senha}/g, 'Temp@2024Pass')
      .replace(/{link}/g, '#');

    // Variáveis específicas do relatório e gráficos
    let chartsHTML = '';
    if (type === 'report') {
      const topCategorias = reportOptions.showTopCategories 
        ? 'Top 5 Categorias de Despesas:\n1. Alimentação - R$ 1.200,00\n2. Transporte - R$ 800,00\n3. Lazer - R$ 450,00\n4. Saúde - R$ 350,00\n5. Educação - R$ 300,00'
        : '';
      
      previewBody = previewBody
        .replace(/{periodo}/g, '01/12/2024 a 31/12/2024')
        .replace(/{totalReceitas}/g, 'R$ 5.000,00')
        .replace(/{totalDespesas}/g, 'R$ 3.100,00')
        .replace(/{saldo}/g, 'R$ 1.900,00')
        .replace(/{totalTransacoes}/g, '45')
        .replace(/{topCategorias}/g, topCategorias);

      // Gerar URLs de gráficos para preview
      if (reportOptions.showIncomeExpenseChart) {
        const chartConfig = {
          type: 'bar',
          data: {
            labels: ['Receitas', 'Despesas'],
            datasets: [{
              label: 'Valor (R$)',
              data: [5000, 3100],
              backgroundColor: ['rgba(46, 125, 50, 0.8)', 'rgba(198, 40, 40, 0.8)']
            }]
          },
          options: {
            plugins: {
              legend: { display: false },
              title: { display: true, text: 'Receitas vs Despesas' }
            }
          }
        };
        const chartUrl = `https://quickchart.io/chart?c=${encodeURIComponent(JSON.stringify(chartConfig))}&width=500&height=300&backgroundColor=white`;
        chartsHTML += `<div style="margin: 20px 0; text-align: center;"><img src="${chartUrl}" alt="Gráfico Receitas vs Despesas" style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);"/></div>`;
      }

      if (reportOptions.showCategoriesChart) {
        const chartConfig = {
          type: 'doughnut',
          data: {
            labels: ['Alimentação', 'Transporte', 'Lazer', 'Saúde', 'Educação'],
            datasets: [{
              data: [1200, 800, 450, 350, 300],
              backgroundColor: [
                'rgba(255, 99, 132, 0.8)',
                'rgba(54, 162, 235, 0.8)',
                'rgba(255, 206, 86, 0.8)',
                'rgba(75, 192, 192, 0.8)',
                'rgba(153, 102, 255, 0.8)'
              ]
            }]
          },
          options: {
            plugins: {
              legend: { position: 'bottom' },
              title: { display: true, text: 'Distribuição por Categorias' }
            }
          }
        };
        const chartUrl = `https://quickchart.io/chart?c=${encodeURIComponent(JSON.stringify(chartConfig))}&width=500&height=350&backgroundColor=white`;
        chartsHTML += `<div style="margin: 20px 0; text-align: center;"><img src="${chartUrl}" alt="Gráfico de Categorias" style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);"/></div>`;
      }
    }
    
    previewBody = previewBody.replace(/\n/g, '<br>');

    return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=${template.fontFamily.replace(/ /g, '+')}:wght@400;600;700&display=swap" rel="stylesheet">
    <style>
      body { font-family: ${template.fontFamily}; line-height: 1.6; color: ${template.textColor}; background-color: ${template.backgroundColor}; margin: 0; padding: 0; }
      .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
      .header { background: linear-gradient(135deg, ${template.primaryColor} 0%, ${template.secondaryColor} 100%); color: white; padding: 30px; text-align: center; }
      .header h1 { margin: 0; font-size: 28px; }
      .content { padding: 30px; }
      .button { display: inline-block; padding: 12px 30px; background: ${template.buttonColor}; color: ${template.buttonTextColor}; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: 600; }
      .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #e9ecef; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>${template.headerTitle}</h1>
      </div>
      <div class="content">
        <p>${previewBody}</p>
        ${chartsHTML}
        <div style="text-align: center;">
          <a href="#" class="button">Acessar Sistema</a>
        </div>
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
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="welcome">Email de Boas-vindas</TabsTrigger>
          <TabsTrigger value="reset">Email de Reset de Senha</TabsTrigger>
          <TabsTrigger value="credentials">Email de Credenciais</TabsTrigger>
          <TabsTrigger value="report">Email de Relatório</TabsTrigger>
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
                <Select
                  value={welcomeTemplate.fontFamily}
                  onValueChange={(value) => setWelcomeTemplate({ ...welcomeTemplate, fontFamily: value })}
                  disabled={!isEditing}
                >
                  <SelectTrigger id="welcome-fontFamily">
                    <SelectValue placeholder="Selecione uma fonte" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Arial, sans-serif">Arial</SelectItem>
                    <SelectItem value="Roboto, sans-serif">Roboto</SelectItem>
                    <SelectItem value="Open Sans, sans-serif">Open Sans</SelectItem>
                    <SelectItem value="Lato, sans-serif">Lato</SelectItem>
                    <SelectItem value="Montserrat, sans-serif">Montserrat</SelectItem>
                    <SelectItem value="Poppins, sans-serif">Poppins</SelectItem>
                    <SelectItem value="Inter, sans-serif">Inter</SelectItem>
                    <SelectItem value="Nunito, sans-serif">Nunito</SelectItem>
                    <SelectItem value="Raleway, sans-serif">Raleway</SelectItem>
                    <SelectItem value="Ubuntu, sans-serif">Ubuntu</SelectItem>
                    <SelectItem value="PT Sans, sans-serif">PT Sans</SelectItem>
                    <SelectItem value="Source Sans Pro, sans-serif">Source Sans Pro</SelectItem>
                    <SelectItem value="Merriweather, serif">Merriweather</SelectItem>
                    <SelectItem value="Playfair Display, serif">Playfair Display</SelectItem>
                    <SelectItem value="Georgia, serif">Georgia</SelectItem>
                  </SelectContent>
                </Select>
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
                <Label htmlFor="welcome-bodyText">Texto do Email</Label>
                <RichTextEditor
                  value={welcomeTemplate.bodyText}
                  onChange={(value) => setWelcomeTemplate({ ...welcomeTemplate, bodyText: value })}
                  disabled={!isEditing}
                  placeholder="Digite o texto do email..."
                  rows={8}
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
                onClick={() => {
                  setPreviewTab('welcome');
                  setShowPreview(true);
                }}
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
                <Select
                  value={resetTemplate.fontFamily}
                  onValueChange={(value) => setResetTemplate({ ...resetTemplate, fontFamily: value })}
                  disabled={!isEditing}
                >
                  <SelectTrigger id="reset-fontFamily">
                    <SelectValue placeholder="Selecione uma fonte" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Arial, sans-serif">Arial</SelectItem>
                    <SelectItem value="Roboto, sans-serif">Roboto</SelectItem>
                    <SelectItem value="Open Sans, sans-serif">Open Sans</SelectItem>
                    <SelectItem value="Lato, sans-serif">Lato</SelectItem>
                    <SelectItem value="Montserrat, sans-serif">Montserrat</SelectItem>
                    <SelectItem value="Poppins, sans-serif">Poppins</SelectItem>
                    <SelectItem value="Inter, sans-serif">Inter</SelectItem>
                    <SelectItem value="Nunito, sans-serif">Nunito</SelectItem>
                    <SelectItem value="Raleway, sans-serif">Raleway</SelectItem>
                    <SelectItem value="Ubuntu, sans-serif">Ubuntu</SelectItem>
                    <SelectItem value="PT Sans, sans-serif">PT Sans</SelectItem>
                    <SelectItem value="Source Sans Pro, sans-serif">Source Sans Pro</SelectItem>
                    <SelectItem value="Merriweather, serif">Merriweather</SelectItem>
                    <SelectItem value="Playfair Display, serif">Playfair Display</SelectItem>
                    <SelectItem value="Georgia, serif">Georgia</SelectItem>
                  </SelectContent>
                </Select>
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
                <Label htmlFor="reset-bodyText">Texto do Email</Label>
                <RichTextEditor
                  value={resetTemplate.bodyText}
                  onChange={(value) => setResetTemplate({ ...resetTemplate, bodyText: value })}
                  disabled={!isEditing}
                  placeholder="Digite o texto do email..."
                  rows={8}
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
                onClick={() => {
                  setPreviewTab('reset');
                  setShowPreview(true);
                }}
                className="w-full"
              >
                <Eye className="mr-2 h-4 w-4" />
                Visualizar Preview
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="credentials" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configurações do Email de Credenciais</CardTitle>
              <CardDescription>
                Personalize o email enviado quando credenciais são reenviadas aos usuários
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="credentials-primaryColor">Cor Primária</Label>
                  <Input
                    id="credentials-primaryColor"
                    type="color"
                    value={credentialsTemplate.primaryColor}
                    onChange={(e) => setCredentialsTemplate({ ...credentialsTemplate, primaryColor: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="credentials-secondaryColor">Cor Secundária</Label>
                  <Input
                    id="credentials-secondaryColor"
                    type="color"
                    value={credentialsTemplate.secondaryColor}
                    onChange={(e) => setCredentialsTemplate({ ...credentialsTemplate, secondaryColor: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="credentials-backgroundColor">Cor de Fundo</Label>
                  <Input
                    id="credentials-backgroundColor"
                    type="color"
                    value={credentialsTemplate.backgroundColor}
                    onChange={(e) => setCredentialsTemplate({ ...credentialsTemplate, backgroundColor: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="credentials-textColor">Cor do Texto</Label>
                  <Input
                    id="credentials-textColor"
                    type="color"
                    value={credentialsTemplate.textColor}
                    onChange={(e) => setCredentialsTemplate({ ...credentialsTemplate, textColor: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="credentials-fontFamily">Família de Fontes</Label>
                <Select
                  value={credentialsTemplate.fontFamily}
                  onValueChange={(value) => setCredentialsTemplate({ ...credentialsTemplate, fontFamily: value })}
                  disabled={!isEditing}
                >
                  <SelectTrigger id="credentials-fontFamily">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Arial, sans-serif">Arial</SelectItem>
                    <SelectItem value="'Times New Roman', serif">Times New Roman</SelectItem>
                    <SelectItem value="'Courier New', monospace">Courier New</SelectItem>
                    <SelectItem value="Georgia, serif">Georgia</SelectItem>
                    <SelectItem value="Verdana, sans-serif">Verdana</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="credentials-headerTitle">Título do Cabeçalho</Label>
                <Input
                  id="credentials-headerTitle"
                  value={credentialsTemplate.headerTitle}
                  onChange={(e) => setCredentialsTemplate({ ...credentialsTemplate, headerTitle: e.target.value })}
                  disabled={!isEditing}
                  placeholder="🔐 Suas Credenciais de Acesso"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="credentials-bodyText">Texto do Corpo</Label>
                <RichTextEditor
                  value={credentialsTemplate.bodyText}
                  onChange={(value) => setCredentialsTemplate({ ...credentialsTemplate, bodyText: value })}
                  disabled={!isEditing}
                  placeholder="Digite o corpo do email..."
                />
                <p className="text-sm text-muted-foreground">
                  Use as variáveis: {'{nome}'}, {'{email}'}, {'{senha}'}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="credentials-companyName">Nome da Empresa</Label>
                <Input
                  id="credentials-companyName"
                  value={credentialsTemplate.companyName}
                  onChange={(e) => setCredentialsTemplate({ ...credentialsTemplate, companyName: e.target.value })}
                  disabled={!isEditing}
                  placeholder="Finance App"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="credentials-footerText">Texto do Rodapé</Label>
                <Input
                  id="credentials-footerText"
                  value={credentialsTemplate.footerText}
                  onChange={(e) => setCredentialsTemplate({ ...credentialsTemplate, footerText: e.target.value })}
                  disabled={!isEditing}
                  placeholder="Este é um email automático..."
                />
              </div>

              <Button
                onClick={() => {
                  setPreviewTab('credentials');
                  setShowPreview(true);
                }}
                variant="outline"
                className="w-full"
              >
                <Eye className="mr-2 h-4 w-4" />
                Visualizar Preview
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="report" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configurações do Email de Relatório</CardTitle>
              <CardDescription>
                Personalize o template e escolha quais informações incluir no relatório periódico de transações
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="report-primaryColor">Cor Primária</Label>
                  <div className="flex gap-2">
                    <Input
                      id="report-primaryColor"
                      type="color"
                      value={reportTemplate.primaryColor}
                      onChange={(e) => setReportTemplate({ ...reportTemplate, primaryColor: e.target.value })}
                      disabled={!isEditing}
                      className="w-20 h-10"
                    />
                    <Input
                      type="text"
                      value={reportTemplate.primaryColor}
                      onChange={(e) => setReportTemplate({ ...reportTemplate, primaryColor: e.target.value })}
                      disabled={!isEditing}
                      className="flex-1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="report-secondaryColor">Cor Secundária</Label>
                  <div className="flex gap-2">
                    <Input
                      id="report-secondaryColor"
                      type="color"
                      value={reportTemplate.secondaryColor}
                      onChange={(e) => setReportTemplate({ ...reportTemplate, secondaryColor: e.target.value })}
                      disabled={!isEditing}
                      className="w-20 h-10"
                    />
                    <Input
                      type="text"
                      value={reportTemplate.secondaryColor}
                      onChange={(e) => setReportTemplate({ ...reportTemplate, secondaryColor: e.target.value })}
                      disabled={!isEditing}
                      className="flex-1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="report-backgroundColor">Cor de Fundo</Label>
                  <div className="flex gap-2">
                    <Input
                      id="report-backgroundColor"
                      type="color"
                      value={reportTemplate.backgroundColor}
                      onChange={(e) => setReportTemplate({ ...reportTemplate, backgroundColor: e.target.value })}
                      disabled={!isEditing}
                      className="w-20 h-10"
                    />
                    <Input
                      type="text"
                      value={reportTemplate.backgroundColor}
                      onChange={(e) => setReportTemplate({ ...reportTemplate, backgroundColor: e.target.value })}
                      disabled={!isEditing}
                      className="flex-1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="report-textColor">Cor do Texto</Label>
                  <div className="flex gap-2">
                    <Input
                      id="report-textColor"
                      type="color"
                      value={reportTemplate.textColor}
                      onChange={(e) => setReportTemplate({ ...reportTemplate, textColor: e.target.value })}
                      disabled={!isEditing}
                      className="w-20 h-10"
                    />
                    <Input
                      type="text"
                      value={reportTemplate.textColor}
                      onChange={(e) => setReportTemplate({ ...reportTemplate, textColor: e.target.value })}
                      disabled={!isEditing}
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="report-fontFamily">Fonte</Label>
                <Select 
                  value={reportTemplate.fontFamily} 
                  onValueChange={(value) => setReportTemplate({ ...reportTemplate, fontFamily: value })}
                  disabled={!isEditing}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Arial, sans-serif">Arial</SelectItem>
                    <SelectItem value="Georgia, serif">Georgia</SelectItem>
                    <SelectItem value="'Courier New', monospace">Courier New</SelectItem>
                    <SelectItem value="'Times New Roman', serif">Times New Roman</SelectItem>
                    <SelectItem value="Verdana, sans-serif">Verdana</SelectItem>
                    <SelectItem value="'Trebuchet MS', sans-serif">Trebuchet MS</SelectItem>
                    <SelectItem value="'Segoe UI', sans-serif">Segoe UI</SelectItem>
                    <SelectItem value="Roboto, sans-serif">Roboto</SelectItem>
                    <SelectItem value="'Open Sans', sans-serif">Open Sans</SelectItem>
                    <SelectItem value="Lato, sans-serif">Lato</SelectItem>
                    <SelectItem value="Montserrat, sans-serif">Montserrat</SelectItem>
                    <SelectItem value="Poppins, sans-serif">Poppins</SelectItem>
                    <SelectItem value="'Playfair Display', serif">Playfair Display</SelectItem>
                    <SelectItem value="Merriweather, serif">Merriweather</SelectItem>
                    <SelectItem value="'Source Sans Pro', sans-serif">Source Sans Pro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="report-headerTitle">Título do Cabeçalho</Label>
                <Input
                  id="report-headerTitle"
                  value={reportTemplate.headerTitle}
                  onChange={(e) => setReportTemplate({ ...reportTemplate, headerTitle: e.target.value })}
                  disabled={!isEditing}
                  placeholder="📊 Relatório de Transações"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="report-companyName">Nome da Empresa/Sistema</Label>
                <Input
                  id="report-companyName"
                  value={reportTemplate.companyName}
                  onChange={(e) => setReportTemplate({ ...reportTemplate, companyName: e.target.value })}
                  disabled={!isEditing}
                  placeholder="Sistema Financeiro"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="report-bodyText">Texto do Email</Label>
                <RichTextEditor
                  value={reportTemplate.bodyText}
                  onChange={(value) => setReportTemplate({ ...reportTemplate, bodyText: value })}
                  disabled={!isEditing}
                  placeholder="Digite o texto do email..."
                  rows={10}
                  additionalVariables={[
                    { label: 'Período', value: '{periodo}' },
                    { label: 'Total Receitas', value: '{totalReceitas}' },
                    { label: 'Total Despesas', value: '{totalDespesas}' },
                    { label: 'Saldo', value: '{saldo}' },
                    { label: 'Total Transações', value: '{totalTransacoes}' },
                    { label: 'Top Categorias', value: '{topCategorias}' },
                    { label: 'Total Conversões', value: '{totalConversoes}' },
                    { label: 'Valor Total Convertido', value: '{valorTotalConvertido}' },
                    { label: 'Taxa Média', value: '{taxaMediaConversao}' },
                    { label: 'Top Moedas', value: '{topMoedasConversao}' },
                  ]}
                />
              </div>

              <div className="space-y-3 border-t pt-4">
                <Label>Opções do Relatório</Label>
                <p className="text-sm text-muted-foreground mb-2">Escolha quais seções incluir no email de relatório:</p>
                <p className="text-xs text-blue-600 bg-blue-50 p-2 rounded mb-3">
                  💡 Os gráficos selecionados aparecerão automaticamente no email enviado aos usuários!
                </p>
                
                <div className="space-y-2">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={reportOptions.includePeriodSummary}
                      onChange={(e) => setReportOptions({ ...reportOptions, includePeriodSummary: e.target.checked })}
                      disabled={!isEditing}
                      className="rounded"
                    />
                    <span className="text-sm">📝 Resumo do Período (Receitas, Despesas, Saldo)</span>
                  </label>

                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={reportOptions.showTopCategories}
                      onChange={(e) => setReportOptions({ ...reportOptions, showTopCategories: e.target.checked })}
                      disabled={!isEditing}
                      className="rounded"
                    />
                    <span className="text-sm">🏆 Top 5 Categorias de Despesas</span>
                  </label>

                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={reportOptions.showIncomeExpenseChart}
                      onChange={(e) => setReportOptions({ ...reportOptions, showIncomeExpenseChart: e.target.checked })}
                      disabled={!isEditing}
                      className="rounded"
                    />
                    <span className="text-sm">📊 Gráfico de Receitas vs Despesas</span>
                  </label>

                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={reportOptions.showCategoriesChart}
                      onChange={(e) => setReportOptions({ ...reportOptions, showCategoriesChart: e.target.checked })}
                      disabled={!isEditing}
                      className="rounded"
                    />
                    <span className="text-sm">🎨 Gráfico de Distribuição por Categorias</span>
                  </label>

                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={reportOptions.showMonthlyComparison}
                      onChange={(e) => setReportOptions({ ...reportOptions, showMonthlyComparison: e.target.checked })}
                      disabled={!isEditing}
                      className="rounded"
                    />
                    <span className="text-sm">📈 Comparação Mensal</span>
                  </label>

                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={reportOptions.showConversionData}
                      onChange={(e) => setReportOptions({ ...reportOptions, showConversionData: e.target.checked })}
                      disabled={!isEditing}
                      className="rounded"
                    />
                    <span className="text-sm">💱 Dados de Conversões de Moeda</span>
                  </label>

                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={reportOptions.showConversionChart}
                      onChange={(e) => setReportOptions({ ...reportOptions, showConversionChart: e.target.checked })}
                      disabled={!isEditing}
                      className="rounded"
                    />
                    <span className="text-sm">💹 Gráfico de Conversões</span>
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="report-footerText">Texto do Rodapé</Label>
                <Input
                  id="report-footerText"
                  value={reportTemplate.footerText}
                  onChange={(e) => setReportTemplate({ ...reportTemplate, footerText: e.target.value })}
                  disabled={!isEditing}
                  placeholder="Este é um email automático de relatório..."
                />
              </div>

              <Button 
                variant="outline" 
                onClick={() => {
                  setPreviewTab('report' as any);
                  setShowPreview(true);
                }}
                className="w-full"
              >
                <Eye className="mr-2 h-4 w-4" />
                Visualizar Preview
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog de Preview */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Preview do Email - {previewTab === 'welcome' ? 'Boas-vindas' : previewTab === 'reset' ? 'Reset de Senha' : previewTab === 'credentials' ? 'Credenciais' : 'Relatório de Transações'}
            </DialogTitle>
          </DialogHeader>
          <div className="border rounded-lg overflow-hidden">
            <iframe
              srcDoc={generatePreviewHTML(
                previewTab === 'welcome' ? welcomeTemplate : previewTab === 'reset' ? resetTemplate : previewTab === 'credentials' ? credentialsTemplate : reportTemplate,
                previewTab
              )}
              className="w-full h-[600px] border-0"
              title="Email Preview"
            />
          </div>
        </DialogContent>
      </Dialog>

      {isEditing && (
        <FloatingSaveButton
          onSave={handleSave}
          onCancel={() => setIsEditing(false)}
          isLoading={isLoading}
          saveLabel="Salvar Templates"
          cancelLabel="Cancelar"
        />
      )}
    </div>
  );
}
