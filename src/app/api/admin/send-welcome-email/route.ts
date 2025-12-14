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

    // Buscar as configurações do Resend no Firestore usando REST API
    const projectId = firebaseConfig.projectId;
    const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${currentUserId}`;
    
    let resendApiKey = process.env.RESEND_API_KEY || '';
    let resendFromEmail = process.env.RESEND_FROM_EMAIL || 'Sistema Financeiro <onboarding@resend.dev>';
    let appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002';

    console.log('=== BUSCANDO CONFIGURAÇÕES DO RESEND ===');
    console.log('User ID:', currentUserId);
    console.log('Firestore URL:', firestoreUrl);

    try {
      const firestoreResponse = await fetch(firestoreUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('Firestore Response Status:', firestoreResponse.status);

      if (firestoreResponse.ok) {
        const userData = await firestoreResponse.json();
        const fields = userData.fields || {};
        
        console.log('Campos encontrados:', Object.keys(fields));
        console.log('resendApiKey presente?', !!fields.resendApiKey);
        console.log('resendFromEmail presente?', !!fields.resendFromEmail);
        console.log('appUrl presente?', !!fields.appUrl);
        
        if (fields.resendApiKey?.stringValue) {
          resendApiKey = fields.resendApiKey.stringValue;
          console.log('✅ resendApiKey carregada do Firestore');
        }
        if (fields.resendFromEmail?.stringValue) {
          resendFromEmail = fields.resendFromEmail.stringValue;
          console.log('✅ resendFromEmail carregada do Firestore');
        }
        if (fields.appUrl?.stringValue) {
          appUrl = fields.appUrl.stringValue;
          console.log('✅ appUrl carregada do Firestore');
        }
      } else {
        const errorText = await firestoreResponse.text();
        console.error('Erro ao buscar do Firestore:', errorText);
      }
    } catch (firestoreError) {
      console.error('Erro ao buscar configurações do Firestore:', firestoreError);
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
      headerTitle: '🎉 Bem-vindo ao Sistema Financeiro',
      bodyText: 'Olá {nome},\n\nUma conta foi criada para você no sistema de gestão financeira. Abaixo estão suas credenciais de acesso:\n\nEmail: {email}\nSenha Temporária: {senha}\n\n⚠️ Importante: Esta é uma senha temporária. Por motivos de segurança, recomendamos que você altere sua senha após o primeiro acesso.',
      footerText: 'Este é um email automático. Por favor, não responda a esta mensagem.',
      companyName: 'Sistema Financeiro',
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

    // Substituir variáveis no bodyText
    const emailBody = template.bodyText
      .replace(/{nome}/g, name)
      .replace(/{email}/g, email)
      .replace(/{senha}/g, password)
      .replace(/{link}/g, appUrl)
      .replace(/\n/g, '<br>');

    // Criar HTML do email com template personalizado
    const emailHtml = `
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
        <p>${emailBody}</p>

        <div style="text-align: center;">
          <a href="${appUrl}" class="button">Acessar Sistema</a>
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
