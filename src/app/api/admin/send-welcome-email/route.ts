import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { firebaseConfig } from '@/firebase/config';

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
    const currentUserId = currentUser.localId;

    // Obter dados do body
    const body = await request.json();
    const { name, email, password } = body;

    if (!name || !email || !password) {
      return NextResponse.json({ 
        error: 'Nome, email e senha são obrigatórios' 
      }, { status: 400 });
    }

    // Buscar as configurações do Resend de TODOS os usuários MASTER
    const { getMasterResendApiKey, getMasterResendConfig } = await import('@/lib/api-keys');
    
    let resendApiKey = process.env.RESEND_API_KEY || '';
    let resendFromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
    let resendFromName = 'Sistema Financeiro';
    let appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002';

    console.log('=== BUSCANDO CONFIGURAÇÕES DO RESEND EM TODOS OS MASTER USERS ===');

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
        resendFromName = masterConfig.resendFromName || resendFromName;
        appUrl = masterConfig.appUrl;
        console.log('✅ Configurações do Resend encontradas em um dos MASTER users');
      }
    } catch (error) {
      console.error('Erro ao buscar configurações do Resend dos MASTER users:', error);
    }

    console.log('Configurações finais:');
    console.log('- resendApiKey:', resendApiKey ? `${resendApiKey.substring(0, 8)}...` : 'NÃO CONFIGURADA');
    console.log('- resendFromEmail:', resendFromEmail);
    console.log('- appUrl:', appUrl);

    // Verificar se a API key do Resend está configurada
    if (!resendApiKey) {
      console.error('RESEND_API_KEY não está configurada');
      return NextResponse.json({ 
        error: 'Serviço de email não configurado. Configure a API Key do Resend nas Configurações de Sistema' 
      }, { status: 500 });
    }

    // Inicializar Resend com a chave configurada
    const resend = new Resend(resendApiKey);

    // Buscar template personalizado do Firestore
    let template = {
      primaryColor: '#667eea',
      secondaryColor: '#764ba2',
      backgroundColor: '#f4f4f4',
      textColor: '#333333',
      fontFamily: 'Arial, sans-serif',
      headerTitle: '🎉 Bem-vindo ao FIN',
      bodyText: 'Olá {nome},\n\nUma conta foi criada para você no FIN. Abaixo estão suas credenciais de acesso:\n\nEmail: {email}\nSenha Temporária: {senha}\n\n⚠️ Importante: Esta é uma senha temporária. Por motivos de segurança, recomendamos que você altere sua senha após o primeiro acesso.',
      footerText: 'Este é um email automático. Por favor, não responda a esta mensagem.',
      companyName: 'FIN',
      buttonColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      buttonTextColor: '#ffffff',
    };

    try {
      const templateUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/emailTemplates/${currentUserId}`;
      const templateResponse = await fetch(templateUrl, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (templateResponse.ok) {
        const templateDoc = await templateResponse.json();
        const fields = templateDoc.fields || {};
        
        if (fields.welcome?.mapValue?.fields) {
          const welcomeFields = fields.welcome.mapValue.fields;
          if (welcomeFields.primaryColor?.stringValue) template.primaryColor = welcomeFields.primaryColor.stringValue;
          if (welcomeFields.secondaryColor?.stringValue) template.secondaryColor = welcomeFields.secondaryColor.stringValue;
          if (welcomeFields.backgroundColor?.stringValue) template.backgroundColor = welcomeFields.backgroundColor.stringValue;
          if (welcomeFields.textColor?.stringValue) template.textColor = welcomeFields.textColor.stringValue;
          if (welcomeFields.fontFamily?.stringValue) template.fontFamily = welcomeFields.fontFamily.stringValue;
          if (welcomeFields.headerTitle?.stringValue) template.headerTitle = welcomeFields.headerTitle.stringValue;
          if (welcomeFields.bodyText?.stringValue) template.bodyText = welcomeFields.bodyText.stringValue;
          if (welcomeFields.footerText?.stringValue) template.footerText = welcomeFields.footerText.stringValue;
          if (welcomeFields.companyName?.stringValue) template.companyName = welcomeFields.companyName.stringValue;
          if (welcomeFields.buttonColor?.stringValue) template.buttonColor = welcomeFields.buttonColor.stringValue;
          if (welcomeFields.buttonTextColor?.stringValue) template.buttonTextColor = welcomeFields.buttonTextColor.stringValue;
          console.log('✅ Template personalizado de boas-vindas carregado');
        }
      }
    } catch (err) {
      console.log('Usando template padrão (erro ao carregar personalizado):', err);
    }

    // Substituir variáveis no texto do template (senha SEMPRE visível)
    const emailBody = template.bodyText
      .replace(/{nome}/g, `<strong style="color: ${template.primaryColor};">${name}</strong>`)
      .replace(/{email}/g, `<strong style="color: ${template.textColor};">${email}</strong>`)
      .replace(/{senha}/g, `<span style="font-family: 'Courier New', Courier, monospace; font-size: 20px; font-weight: bold; color: ${template.primaryColor}; letter-spacing: 2px; background-color: #f0f0f0; padding: 4px 8px; border-radius: 4px; display: inline-block; -webkit-text-security: none !important; text-security: none !important;">${password}</span>`)
      .replace(/{link}/g, appUrl)
      .replace(/\n/g, '<br>');

    // Criar HTML do email com template personalizado (compatível e responsivo)
    const emailHtml = `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="format-detection" content="telephone=no" />
    <title>${template.headerTitle}</title>
    <style type="text/css">
      @media only screen and (max-width: 600px) {
        .content-wrapper { width: 100% !important; }
        .mobile-padding { padding: 20px 15px !important; }
        .mobile-text { font-size: 14px !important; }
        .mobile-title { font-size: 24px !important; }
      }
    </style>
  </head>
  <body style="margin: 0; padding: 0; background-color: ${template.backgroundColor}; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;">
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: ${template.backgroundColor}; min-width: 100%;">
      <tr>
        <td align="center" style="padding: 10px;">
          <table border="0" cellpadding="0" cellspacing="0" width="100%" class="content-wrapper" style="background-color: #ffffff; max-width: 600px;">
            <!-- Header -->
            <tr>
              <td align="center" bgcolor="${template.primaryColor}" class="mobile-padding" style="padding: 30px 20px; background-color: ${template.primaryColor};">
                <h1 class="mobile-title" style="margin: 0; font-family: Arial, Helvetica, sans-serif; font-size: 26px; font-weight: bold; color: #ffffff; line-height: 1.3; word-wrap: break-word;">${template.headerTitle}</h1>
              </td>
            </tr>
            <!-- Body -->
            <tr>
              <td class="mobile-padding mobile-text" style="padding: 30px 20px; font-family: Arial, Helvetica, sans-serif; font-size: 15px; line-height: 1.6; color: ${template.textColor}; word-wrap: break-word; overflow-wrap: break-word;">
                <div style="max-width: 100%; overflow-wrap: break-word;">
                  ${emailBody}
                </div>
                
                <!-- Button -->
                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 20px 0;">
                  <tr>
                    <td align="center" style="padding: 10px 0;">
                      <table border="0" cellpadding="0" cellspacing="0">
                        <tr>
                          <td align="center" bgcolor="${template.primaryColor}" style="border-radius: 6px; background-color: ${template.primaryColor};">
                            <a href="${appUrl}" target="_blank" style="display: inline-block; padding: 14px 30px; font-family: Arial, Helvetica, sans-serif; font-size: 16px; font-weight: bold; color: #ffffff !important; text-decoration: none; border-radius: 6px;">Acessar Sistema</a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <!-- Footer -->
            <tr>
              <td bgcolor="#f8f9fa" class="mobile-padding" style="padding: 20px; background-color: #f8f9fa; border-top: 1px solid #e9ecef;">
                <table border="0" cellpadding="0" cellspacing="0" width="100%">
                  <tr>
                    <td align="center" style="font-family: Arial, Helvetica, sans-serif; font-size: 12px; line-height: 1.5; color: #666666; word-wrap: break-word;">
                      <p style="margin: 0 0 8px 0;">${template.footerText}</p>
                      <p style="margin: 0;">© ${new Date().getFullYear()} ${template.companyName}. Todos os direitos reservados.</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
    `;

    // Enviar email usando Resend
    const { data, error } = await resend.emails.send({
      from: resendFromEmail,
      to: [email],
      subject: '🎉 Bem-vindo ao Sistema Financeiro - Suas Credenciais de Acesso',
      html: emailHtml,
    });

    if (error) {
      console.error('Erro ao enviar email:', error);
      return NextResponse.json({ 
        error: 'Erro ao enviar email: ' + error.message 
      }, { status: 500 });
    }

    console.log('Email enviado com sucesso:', data);

    return NextResponse.json({
      success: true,
      message: 'Email enviado com sucesso',
      emailId: data?.id,
    });
  } catch (error: any) {
    console.error('Erro ao processar requisição de email:', error);
    return NextResponse.json({ 
      error: 'Erro ao enviar email: ' + (error.message || 'Erro desconhecido')
    }, { status: 500 });
  }
}
