import { NextRequest, NextResponse } from 'next/server';
import { firebaseConfig } from '@/firebase/config';
import { Resend } from 'resend';

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
    const currentUserId = verifyData.users[0].localId;

    // Obter dados do body
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ 
        error: 'userId é obrigatório' 
      }, { status: 400 });
    }

    // Buscar dados do usuário usando a REST API do Firestore
    const userFirestoreUrl = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents/users/${userId}`;
    
    const userResponse = await fetch(userFirestoreUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!userResponse.ok) {
      console.error('Erro ao buscar usuário no Firestore');
      return NextResponse.json({ 
        error: 'Usuário não encontrado' 
      }, { status: 404 });
    }

    const userDoc = await userResponse.json();
    const userData = userDoc.fields;
    
    // Extrair valores dos campos Firestore
    const firstName = userData?.firstName?.stringValue || '';
    const lastName = userData?.lastName?.stringValue || '';
    const name = firstName && lastName ? `${firstName} ${lastName}` : (userData?.name?.stringValue || userData?.email?.stringValue || '');
    const email = userData?.email?.stringValue || '';

    if (!email) {
      return NextResponse.json({ 
        error: 'Email do usuário não encontrado' 
      }, { status: 404 });
    }

    // Gerar nova senha temporária
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%&*';
    let newPassword = '';
    for (let i = 0; i < 12; i++) {
      newPassword += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    console.log('Gerando nova senha para:', email);

    // Atualizar senha do usuário usando a API do Firebase Admin
    const updatePasswordResponse = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:update?key=${firebaseConfig.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          localId: userId,
          password: newPassword,
          returnSecureToken: false,
        }),
      }
    );

    if (!updatePasswordResponse.ok) {
      const errorData = await updatePasswordResponse.json();
      console.error('Erro ao atualizar senha:', errorData);
      return NextResponse.json({ 
        error: 'Erro ao atualizar senha: ' + (errorData.error?.message || 'Erro desconhecido')
      }, { status: 500 });
    }

    console.log('Senha atualizada com sucesso, marcando como temporária...');

    // Marcar senha como temporária no Firestore
    const updateUserUrl = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents/users/${userId}?updateMask.fieldPaths=isTemporaryPassword`;
    
    await fetch(updateUserUrl, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fields: {
          isTemporaryPassword: { booleanValue: true },
        },
      }),
    });

    console.log('Senha marcada como temporária, enviando email...');

    // Buscar configurações do Resend do usuário MASTER
    const masterSettingsUrl = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents/users/${currentUserId}`;
    
    let resendApiKey = process.env.RESEND_API_KEY || '';
    let resendFromEmail = process.env.RESEND_FROM_EMAIL || 'Sistema Financeiro <onboarding@resend.dev>';
    let appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002';

    try {
      const masterResponse = await fetch(masterSettingsUrl, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (masterResponse.ok) {
        const masterDoc = await masterResponse.json();
        const fields = masterDoc.fields || {};
        
        if (fields.resendApiKey?.stringValue) resendApiKey = fields.resendApiKey.stringValue;
        if (fields.resendFromEmail?.stringValue) resendFromEmail = fields.resendFromEmail.stringValue;
        if (fields.appUrl?.stringValue) appUrl = fields.appUrl.stringValue;
      }
    } catch (err) {
      console.error('Erro ao buscar configurações do Resend:', err);
    }

    if (!resendApiKey) {
      return NextResponse.json({ 
        error: 'Serviço de email não configurado. Configure a API Key do Resend nas Configurações de Sistema' 
      }, { status: 500 });
    }

    // Inicializar Resend
    const resend = new Resend(resendApiKey);

    // Buscar template personalizado do Firestore
    let template = {
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
    };

    try {
      const templateUrl = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents/emailTemplates/${currentUserId}`;
      const templateResponse = await fetch(templateUrl, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (templateResponse.ok) {
        const templateDoc = await templateResponse.json();
        const fields = templateDoc.fields || {};
        
        if (fields.reset?.mapValue?.fields) {
          const resetFields = fields.reset.mapValue.fields;
          if (resetFields.primaryColor?.stringValue) template.primaryColor = resetFields.primaryColor.stringValue;
          if (resetFields.secondaryColor?.stringValue) template.secondaryColor = resetFields.secondaryColor.stringValue;
          if (resetFields.backgroundColor?.stringValue) template.backgroundColor = resetFields.backgroundColor.stringValue;
          if (resetFields.textColor?.stringValue) template.textColor = resetFields.textColor.stringValue;
          if (resetFields.fontFamily?.stringValue) template.fontFamily = resetFields.fontFamily.stringValue;
          if (resetFields.headerTitle?.stringValue) template.headerTitle = resetFields.headerTitle.stringValue;
          if (resetFields.footerText?.stringValue) template.footerText = resetFields.footerText.stringValue;
          if (resetFields.companyName?.stringValue) template.companyName = resetFields.companyName.stringValue;
          if (resetFields.buttonColor?.stringValue) template.buttonColor = resetFields.buttonColor.stringValue;
          if (resetFields.buttonTextColor?.stringValue) template.buttonTextColor = resetFields.buttonTextColor.stringValue;
          console.log('✅ Template personalizado de reset carregado');
        }
      }
    } catch (err) {
      console.log('Usando template padrão (erro ao carregar personalizado):', err);
    }

    const emailHtml = `
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
        <p>Olá <strong>${name}</strong>,</p>
        <p>Uma nova senha temporária foi gerada para sua conta. Abaixo estão suas credenciais de acesso:</p>
        
        <div class="credentials">
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Nova Senha Temporária:</strong> ${newPassword}</p>
        </div>

        <div class="warning">
          <p>⚠️ <strong>Importante:</strong> Esta é uma senha temporária. Por motivos de segurança, recomendamos que você altere sua senha após fazer login.</p>
        </div>

        <div style="text-align: center;">
          <a href="${appUrl}" class="button">Acessar Sistema</a>
        </div>

        <p style="margin-top: 30px; font-size: 14px; color: #666;">
          Se você não solicitou esta alteração ou tiver alguma dúvida, entre em contato com o administrador do sistema imediatamente.
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

    const { data, error } = await resend.emails.send({
      from: resendFromEmail,
      to: [email],
      subject: '🔐 Nova Senha Temporária - Sistema Financeiro',
      html: emailHtml,
    });

    if (error) {
      console.error('Erro ao enviar email:', error);
      return NextResponse.json({ 
        error: 'Senha atualizada mas houve erro ao enviar email: ' + error.message 
      }, { status: 500 });
    }

    console.log('Email enviado com sucesso para:', email);

    return NextResponse.json({
      success: true,
      message: 'Nova senha gerada e enviada por email com sucesso',
      email: email,
    });
  } catch (error: any) {
    console.error('Erro ao reenviar credenciais:', error);
    return NextResponse.json({ 
      error: 'Erro ao reenviar credenciais: ' + (error.message || 'Erro desconhecido')
    }, { status: 500 });
  }
}
