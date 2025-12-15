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

    console.log('========================================');
    console.log('🔐 Reenviando credenciais');
    console.log('User ID:', userId);
    console.log('========================================');

    // Buscar dados do usuário no Firestore usando REST API
    const userFirestoreUrl = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents/users/${userId}`;
    
    const userResponse = await fetch(userFirestoreUrl, {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (!userResponse.ok) {
      console.error('❌ Usuário não encontrado no Firestore');
      return NextResponse.json({ 
        error: 'Usuário não encontrado' 
      }, { status: 404 });
    }

    const userDoc = await userResponse.json();
    const userData = userDoc.fields;
    
    const firstName = userData?.firstName?.stringValue || '';
    const lastName = userData?.lastName?.stringValue || '';
    const name = firstName && lastName ? `${firstName} ${lastName}` : (userData?.name?.stringValue || userData?.email?.stringValue || '');
    const email = userData?.email?.stringValue || '';

    if (!email) {
      console.error('❌ Email do usuário não encontrado');
      return NextResponse.json({ 
        error: 'Email do usuário não encontrado' 
      }, { status: 404 });
    }

    console.log('✅ Usuário encontrado:', email);

    // Gerar nova senha temporária
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%&*';
    let newPassword = '';
    for (let i = 0; i < 12; i++) {
      newPassword += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    console.log('🔑 Gerando nova senha temporária');

    // Atualizar senha usando Firebase REST API
    console.log('Atualizando senha do usuário...');
    
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
      console.error('❌ Erro ao atualizar senha:', errorData);
      return NextResponse.json({ 
        error: 'Erro ao atualizar senha: ' + (errorData.error?.message || 'Erro desconhecido')
      }, { status: 500 });
    }

    console.log('✅ Senha atualizada com sucesso');
    console.log('Marcando senha como temporária no Firestore...');

    // Marcar senha como temporária no Firestore usando REST API
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
    console.log('✅ Senha marcada como temporária');

    console.log('Buscando configurações de email...');

    // Buscar configurações do Resend do usuário MASTER usando REST API
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

    // Buscar template personalizado do Firestore usando REST API
    let template = {
      primaryColor: '#667eea',
      secondaryColor: '#764ba2',
      backgroundColor: '#f4f4f4',
      textColor: '#333333',
      fontFamily: 'Arial, sans-serif',
      headerTitle: '🔐 Nova Senha Temporária',
      bodyText: 'Olá {nome},\n\nUma nova senha temporária foi gerada para sua conta. Abaixo estão suas credenciais de acesso:\n\nEmail: {email}\nNova Senha Temporária: {senha}\n\n⚠️ Importante: Esta é uma senha temporária. Por motivos de segurança, recomendamos que você altere sua senha após fazer login.',
      footerText: 'Este é um email automático. Por favor, não responda a esta mensagem.',
      companyName: 'Sistema Financeiro',
      buttonColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      buttonTextColor: '#ffffff',
    };

    try {
      console.log('Buscando template de email...');
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
          if (resetFields.bodyText?.stringValue) template.bodyText = resetFields.bodyText.stringValue;
          if (resetFields.footerText?.stringValue) template.footerText = resetFields.footerText.stringValue;
          if (resetFields.companyName?.stringValue) template.companyName = resetFields.companyName.stringValue;
          if (resetFields.buttonColor?.stringValue) template.buttonColor = resetFields.buttonColor.stringValue;
          if (resetFields.buttonTextColor?.stringValue) template.buttonTextColor = resetFields.buttonTextColor.stringValue;
          console.log('✅ Template personalizado de reset carregado');
        }
      }
    } catch (err) {
      console.log('⚠️  Usando template padrão (erro ao carregar personalizado):', err);
    }

    // Substituir variáveis no texto do template (senha SEMPRE visível)
    const emailBody = template.bodyText
      .replace(/{nome}/g, `<strong style="color: ${template.primaryColor};">${name}</strong>`)
      .replace(/{email}/g, `<strong style="color: ${template.textColor};">${email}</strong>`)
      .replace(/{senha}/g, `<span style="font-family: 'Courier New', Courier, monospace; font-size: 20px; font-weight: bold; color: ${template.primaryColor}; letter-spacing: 2px; background-color: #f0f0f0; padding: 4px 8px; border-radius: 4px; display: inline-block; -webkit-text-security: none !important; text-security: none !important;">${newPassword}</span>`)
      .replace(/{link}/g, appUrl)
      .replace(/\n/g, '<br>');

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
