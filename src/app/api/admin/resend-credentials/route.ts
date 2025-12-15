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

    // Buscar usuário pelo email primeiro
    const getUserResponse = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${firebaseConfig.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: [email] }),
      }
    );

    let firebaseUserId;

    // Verificar resposta da busca
    if (getUserResponse.ok && getUserData.users && getUserData.users.length > 0) {
      // Usuário encontrado no Auth
      firebaseUserId = getUserData.users[0].localId;
      console.log('Firebase User ID encontrado:', firebaseUserId);
    } else {
      // Usuário não encontrado no Auth, tentar criar
      console.log('Usuário não encontrado no Firebase Auth, tentando criar:', email);
      
      const createUserResponse = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${firebaseConfig.apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            password: newPassword,
            displayName: name,
            returnSecureToken: true,
          }),
        }
      );

      const createUserData = await createUserResponse.json();

      if (!createUserResponse.ok) {
        console.error('Erro ao criar usuário:', createUserData);
        
        // Se email já existe, buscar o usuário existente
        if (createUserData.error?.message === 'EMAIL_EXISTS') {
          console.log('Email já existe, buscando usuário existente...');
          
          const retryGetUser = await fetch(
            `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${firebaseConfig.apiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email: [email] }),
            }
          );
          
          const retryData = await retryGetUser.json();
          console.log('Resultado da segunda busca:', retryData);
          
          if (retryGetUser.ok && retryData.users && retryData.users.length > 0) {
            firebaseUserId = retryData.users[0].localId;
            console.log('Usuário encontrado na segunda tentativa:', firebaseUserId);
          } else {
            return NextResponse.json({ 
              error: 'Erro: usuário existe mas não foi possível localizá-lo'
            }, { status: 500 });
          }
        } else {
          return NextResponse.json({ 
            error: 'Erro ao criar usuário: ' + (createUserData.error?.message || 'Erro desconhecido')
          }, { status: 500 });
        }
      } else {
        firebaseUserId = createUserData.localId;
        console.log('Usuário criado no Auth com ID:', firebaseUserId);
      }
    }

    if (!firebaseUserId) {
      return NextResponse.json({ 
        error: 'Não foi possível obter ID do usuário'
      }, { status: 500 });
    }
    
    // Atualizar senha do usuário
    const updatePasswordResponse = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:update?key=${firebaseConfig.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          localId: firebaseUserId,
          password: newPassword,
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

    console.log('Senha definida com sucesso, marcando como temporária...');

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
      bodyText: 'Olá {nome},\n\nUma nova senha temporária foi gerada para sua conta. Abaixo estão suas credenciais de acesso:\n\nEmail: {email}\nNova Senha Temporária: {senha}\n\n⚠️ Importante: Esta é uma senha temporária. Por motivos de segurança, recomendamos que você altere sua senha após fazer login.',
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
          if (resetFields.bodyText?.stringValue) template.bodyText = resetFields.bodyText.stringValue;
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

    // Destacar senha no texto com formatação especial
    const passwordHighlight = `
      <div style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border: 2px solid ${template.primaryColor}; border-radius: 8px; padding: 16px; margin: 20px 0; text-align: center;">
        <div style="font-size: 12px; color: #666; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Sua Nova Senha Temporária</div>
        <div style="font-family: 'Courier New', Courier, monospace; font-size: 24px; font-weight: 700; color: ${template.primaryColor}; letter-spacing: 2px; user-select: all; padding: 8px; background: white; border-radius: 4px; box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);">${newPassword}</div>
        <div style="font-size: 11px; color: #999; margin-top: 8px;">👆 Clique para selecionar e copiar</div>
      </div>
    `;
    
    const emailBody = template.bodyText
      .replace(/{nome}/g, `<strong style="color: ${template.primaryColor};">${name}</strong>`)
      .replace(/{email}/g, `<strong style="color: ${template.textColor};">${email}</strong>`)
      .replace(/{senha}/g, passwordHighlight)
      .replace(/{link}/g, appUrl)
      .replace(/\n/g, '<br>');

    const emailHtml = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=${template.fontFamily.replace(/ /g, '+')}:wght@400;600;700&display=swap" rel="stylesheet">
  </head>
  <body style="font-family: ${template.fontFamily}; line-height: 1.6; color: ${template.textColor}; background-color: ${template.backgroundColor}; margin: 0; padding: 20px;">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
      <tr>
        <td style="background: linear-gradient(135deg, ${template.primaryColor} 0%, ${template.secondaryColor} 100%); color: white; padding: 30px; text-align: center;">
          <h1 style="margin: 0; font-size: 28px; font-weight: 700;">${template.headerTitle}</h1>
        </td>
      </tr>
      <tr>
        <td style="padding: 30px; color: ${template.textColor};">
          <div style="line-height: 1.8; font-size: 15px;">
            ${emailBody}
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${appUrl}" style="display: inline-block; padding: 14px 32px; background: ${template.buttonColor}; color: ${template.buttonTextColor} !important; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">Acessar Sistema</a>
          </div>
        </td>
      </tr>
      <tr>
        <td style="background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #e9ecef;">
          <p style="margin: 5px 0;">${template.footerText}</p>
          <p style="margin: 5px 0;">© ${new Date().getFullYear()} ${template.companyName}. Todos os direitos reservados.</p>
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
