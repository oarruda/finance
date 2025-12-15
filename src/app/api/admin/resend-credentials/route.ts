import { NextRequest, NextResponse } from 'next/server';
import { firebaseConfig } from '@/firebase/config';
import { getServerSdks } from '@/firebase/server';
import { Resend } from 'resend';

export async function POST(request: NextRequest) {
  try {
    // Inicializar Firebase Admin
    const { auth, firestore: db } = getServerSdks();

    // Obter token do header para verificar autenticação
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    
    // Verificar autenticação usando Admin SDK
    const decodedToken = await auth.verifyIdToken(token);
    const currentUserId = decodedToken.uid;

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

    // Buscar dados do usuário no Firestore usando Admin SDK
    const userDoc = await db.collection('users').doc(userId).get();

    if (!userDoc.exists) {
      console.error('❌ Usuário não encontrado no Firestore');
      return NextResponse.json({ 
        error: 'Usuário não encontrado' 
      }, { status: 404 });
    }

    const userData = userDoc.data();
    
    const firstName = userData?.firstName || '';
    const lastName = userData?.lastName || '';
    const name = firstName && lastName ? `${firstName} ${lastName}` : (userData?.name || userData?.email || '');
    const email = userData?.email || '';

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

    // Verificar se usuário existe no Auth e atualizar senha usando Admin SDK
    try {
      console.log('Verificando usuário no Auth...');
      let userRecord;
      
      try {
        // Tentar buscar usuário no Auth pelo ID do Firestore
        userRecord = await auth.getUser(userId);
        console.log('✅ Usuário encontrado no Auth');
      } catch (notFoundError: any) {
        // Usuário não existe no Auth, criar com mesmo ID do Firestore
        console.log('⚠️  Usuário não existe no Auth, criando...');
        try {
          userRecord = await auth.createUser({
            uid: userId,
            email: email,
            password: newPassword,
            displayName: name,
          });
          console.log('✅ Usuário criado no Auth com ID:', userId);
        } catch (createError: any) {
          console.error('❌ Erro ao criar usuário no Auth:', createError.message);
          return NextResponse.json({ 
            error: 'Erro ao sincronizar usuário com Auth: ' + createError.message
          }, { status: 500 });
        }
      }

      // Atualizar senha do usuário
      console.log('Atualizando senha...');
      await auth.updateUser(userId, {
        password: newPassword,
      });
      console.log('✅ Senha atualizada com sucesso');

    } catch (error: any) {
      console.error('❌ Erro ao gerenciar usuário no Auth:', error.message);
      return NextResponse.json({ 
        error: 'Erro ao atualizar senha: ' + error.message
      }, { status: 500 });
    }

    console.log('Marcando senha como temporária no Firestore...');

    // Marcar senha como temporária no Firestore usando Admin SDK
    await db.collection('users').doc(userId).update({
      isTemporaryPassword: true,
    });
    console.log('✅ Senha marcada como temporária');

    console.log('Buscando configurações de email...');

    // Buscar configurações do Resend do usuário MASTER usando Admin SDK
    const masterDoc = await db.collection('users').doc(currentUserId).get();
    const masterData = masterDoc.data();
    
    let resendApiKey = masterData?.resendApiKey || process.env.RESEND_API_KEY || '';
    let resendFromEmail = masterData?.resendFromEmail || process.env.RESEND_FROM_EMAIL || 'Sistema Financeiro <onboarding@resend.dev>';
    let appUrl = masterData?.appUrl || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002';

    if (!resendApiKey) {
      return NextResponse.json({ 
        error: 'Serviço de email não configurado. Configure a API Key do Resend nas Configurações de Sistema' 
      }, { status: 500 });
    }

    // Inicializar Resend
    const resend = new Resend(resendApiKey);

    // Buscar template personalizado do Firestore usando Admin SDK
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
      const templateDoc = await db.collection('emailTemplates').doc(currentUserId).get();
      
      if (templateDoc.exists) {
        const templateData = templateDoc.data();
        const resetTemplate = templateData?.reset;
        
        if (resetTemplate) {
          if (resetTemplate.primaryColor) template.primaryColor = resetTemplate.primaryColor;
          if (resetTemplate.secondaryColor) template.secondaryColor = resetTemplate.secondaryColor;
          if (resetTemplate.backgroundColor) template.backgroundColor = resetTemplate.backgroundColor;
          if (resetTemplate.textColor) template.textColor = resetTemplate.textColor;
          if (resetTemplate.fontFamily) template.fontFamily = resetTemplate.fontFamily;
          if (resetTemplate.headerTitle) template.headerTitle = resetTemplate.headerTitle;
          if (resetTemplate.bodyText) template.bodyText = resetTemplate.bodyText;
          if (resetTemplate.footerText) template.footerText = resetTemplate.footerText;
          if (resetTemplate.companyName) template.companyName = resetTemplate.companyName;
          if (resetTemplate.buttonColor) template.buttonColor = resetTemplate.buttonColor;
          if (resetTemplate.buttonTextColor) template.buttonTextColor = resetTemplate.buttonTextColor;
          console.log('✅ Template personalizado de reset carregado');
        }
      }
    } catch (err) {
      console.log('⚠️  Usando template padrão (erro ao carregar personalizado):', err);
    }

    // Substituir variáveis no texto do template
    const emailBody = template.bodyText
      .replace(/{nome}/g, `<strong style="color: ${template.primaryColor};">${name}</strong>`)
      .replace(/{email}/g, `<strong style="color: ${template.textColor};">${email}</strong>`)
      .replace(/{senha}/g, `<strong style="font-family: 'Courier New', Courier, monospace; font-size: 18px; color: ${template.primaryColor}; letter-spacing: 1px;">${newPassword}</strong>`)
      .replace(/{link}/g, appUrl)
      .replace(/\n/g, '<br>');

    const emailHtml = `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${template.headerTitle}</title>
  </head>
  <body style="margin: 0; padding: 0; background-color: ${template.backgroundColor};">
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: ${template.backgroundColor}; padding: 20px 0;">
      <tr>
        <td align="center">
          <table border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; max-width: 600px;">
            <!-- Header -->
            <tr>
              <td align="center" bgcolor="${template.primaryColor}" style="padding: 40px 30px; background-color: ${template.primaryColor};">
                <h1 style="margin: 0; font-family: Arial, sans-serif; font-size: 28px; font-weight: bold; color: #ffffff; line-height: 1.3;">${template.headerTitle}</h1>
              </td>
            </tr>
            <!-- Body -->
            <tr>
              <td style="padding: 40px 30px; font-family: Arial, sans-serif; font-size: 15px; line-height: 1.8; color: ${template.textColor};">
                ${emailBody}
                
                <!-- Button -->
                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 30px; margin-bottom: 30px;">
                  <tr>
                    <td align="center">
                      <table border="0" cellpadding="0" cellspacing="0">
                        <tr>
                          <td align="center" bgcolor="${template.primaryColor}" style="border-radius: 6px; background-color: ${template.primaryColor};">
                            <a href="${appUrl}" target="_blank" style="display: inline-block; padding: 16px 36px; font-family: Arial, sans-serif; font-size: 16px; font-weight: bold; color: #ffffff; text-decoration: none; border-radius: 6px;">Acessar Sistema</a>
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
              <td bgcolor="#f8f9fa" style="padding: 30px; background-color: #f8f9fa; border-top: 1px solid #e9ecef;">
                <table border="0" cellpadding="0" cellspacing="0" width="100%">
                  <tr>
                    <td align="center" style="font-family: Arial, sans-serif; font-size: 12px; line-height: 1.6; color: #666666;">
                      <p style="margin: 0 0 10px 0;">${template.footerText}</p>
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
