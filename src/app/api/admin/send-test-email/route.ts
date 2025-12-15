import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { firebaseConfig } from '@/firebase/config';

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
  senderName: string;
}

export async function POST(request: NextRequest) {
  try {
    // Obter token do header para verificar autenticação
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    
    // Verificar autenticação via REST API
    const verifyResponse = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${firebaseConfig.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: token }),
      }
    );

    if (!verifyResponse.ok) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const verifyData = await verifyResponse.json();
    const currentUser = verifyData.users[0];

    // Obter dados do body
    const body = await request.json();
    const { templateType, recipientEmail, template } = body as {
      templateType: 'welcome' | 'reset' | 'credentials' | 'report';
      recipientEmail: string;
      template: EmailTemplate;
    };

    if (!templateType || !recipientEmail || !template) {
      return NextResponse.json({ 
        error: 'Tipo de template, email e template são obrigatórios' 
      }, { status: 400 });
    }

    // Buscar as configurações do Resend de TODOS os usuários MASTER
    const { getMasterResendApiKey, getMasterResendConfig } = await import('@/lib/api-keys');
    
    let resendApiKey = process.env.RESEND_API_KEY || '';
    let resendFromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
    let resendFromName = template.senderName || 'Sistema Financeiro';
    let appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002';

    console.log('=== ENVIANDO EMAIL DE TESTE ===');
    console.log('Template Type:', templateType);
    console.log('Recipient:', recipientEmail);

    try {
      // Buscar API key de todos os MASTER users
      const masterApiKey = await getMasterResendApiKey();
      if (masterApiKey) {
        resendApiKey = masterApiKey;
        console.log('✅ resendApiKey encontrada em um dos MASTER users');
      }

      // Buscar configurações adicionais de todos os MASTER users
      const masterConfig = await getMasterResendConfig();
      if (masterConfig) {
        resendFromEmail = masterConfig.resendFromEmail;
        if (!template.senderName && masterConfig.resendFromName) {
          resendFromName = masterConfig.resendFromName;
        }
        appUrl = masterConfig.appUrl;
        console.log('✅ Configurações do Resend encontradas em um dos MASTER users');
      }
    } catch (error) {
      console.error('Erro ao buscar configurações do Resend dos MASTER users:', error);
    }

    // Verificar se a API key do Resend está configurada
    if (!resendApiKey) {
      return NextResponse.json({ 
        error: 'API Key do Resend não configurada. Configure nas Configurações do Sistema.' 
      }, { status: 400 });
    }

    // Preparar dados de teste baseado no tipo de template
    let testData = {
      nome: currentUser.displayName || 'Usuário Teste',
      email: recipientEmail,
      senha: 'SenhaTeste@2024',
      link: appUrl,
    };

    // Dados específicos para relatório
    if (templateType === 'report') {
      testData = {
        ...testData,
        periodo: '01/12/2024 a 15/12/2024',
        totalReceitas: 'R$ 10.000,00',
        totalDespesas: 'R$ 6.500,00',
        saldo: 'R$ 3.500,00',
        totalTransacoes: '28',
        topCategorias: 'Top 5 Categorias:\n1. Alimentação - R$ 2.000,00\n2. Transporte - R$ 1.500,00\n3. Lazer - R$ 1.000,00\n4. Saúde - R$ 800,00\n5. Educação - R$ 500,00',
      } as any;
    }

    // Substituir variáveis no texto
    let bodyText = template.bodyText;
    Object.keys(testData).forEach((key) => {
      const regex = new RegExp(`{${key}}`, 'g');
      bodyText = bodyText.replace(regex, testData[key as keyof typeof testData]);
    });

    // Converter quebras de linha para HTML
    bodyText = bodyText.replace(/\n/g, '<br>');

    // Gerar HTML do email usando tabelas com CSS inline
    const emailHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: ${template.fontFamily}; background-color: ${template.backgroundColor};">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: ${template.backgroundColor};">
    <tr>
      <td align="center" style="padding: 20px 0;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); overflow: hidden;">
          
          <!-- Test Badge -->
          <tr>
            <td align="center" style="background-color: #ff6b6b; color: #ffffff; padding: 8px 16px; font-size: 14px; font-weight: bold;">
              🧪 EMAIL DE TESTE
            </td>
          </tr>
          
          <!-- Header -->
          <tr>
            <td align="center" style="background: linear-gradient(135deg, ${template.primaryColor} 0%, ${template.secondaryColor} 100%); padding: 30px; color: #ffffff;">
              <h1 style="margin: 0; font-size: 28px; font-weight: bold; color: #ffffff;">${template.headerTitle}</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 30px; color: ${template.textColor}; line-height: 1.6;">
              <p style="margin: 0 0 20px 0; color: ${template.textColor};">${bodyText}</p>
            </td>
          </tr>
          
          <!-- Button -->
          <tr>
            <td align="center" style="padding: 0 30px 30px 30px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="center" style="border-radius: 6px; background: ${template.buttonColor};">
                    <a href="${appUrl}" target="_blank" style="display: inline-block; padding: 12px 30px; font-family: ${template.fontFamily}; font-size: 16px; font-weight: 600; color: ${template.buttonTextColor}; text-decoration: none; border-radius: 6px; background: ${template.buttonColor};">
                      Acessar Sistema
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td align="center" style="background-color: #f8f9fa; padding: 20px; border-top: 1px solid #e9ecef;">
              <p style="margin: 0; font-size: 12px; color: #666666; line-height: 1.5;">${template.footerText}</p>
              <p style="margin: 10px 0 0 0; font-size: 12px; color: #666666;">&copy; ${new Date().getFullYear()} ${template.companyName}. Todos os direitos reservados.</p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    // Configurar assunto baseado no tipo
    const subjects = {
      welcome: `[TESTE] ${template.headerTitle}`,
      reset: `[TESTE] ${template.headerTitle}`,
      credentials: `[TESTE] ${template.headerTitle}`,
      report: `[TESTE] ${template.headerTitle}`,
    };

    // Enviar email via Resend
    const resend = new Resend(resendApiKey);
    
    const { data, error } = await resend.emails.send({
      from: `${resendFromName} <${resendFromEmail}>`,
      to: recipientEmail,
      subject: subjects[templateType],
      html: emailHTML,
    });

    if (error) {
      console.error('Erro ao enviar email:', error);
      return NextResponse.json({ 
        error: 'Erro ao enviar email de teste',
        details: error 
      }, { status: 500 });
    }

    console.log('✅ Email de teste enviado com sucesso:', data);

    return NextResponse.json({ 
      success: true,
      message: 'Email de teste enviado com sucesso',
      emailId: data?.id,
    });

  } catch (error: any) {
    console.error('Erro ao processar envio de email de teste:', error);
    return NextResponse.json({ 
      error: 'Erro ao processar requisição',
      details: error.message 
    }, { status: 500 });
  }
}
