import { NextRequest, NextResponse } from 'next/server';
import { getServerSdks } from '@/firebase/server';
import { Resend } from 'resend';

export const dynamic = 'force-dynamic';

function generateTemporaryPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  const length = 12;
  let password = '';
  
  // Garantir pelo menos 1 letra maiúscula, 1 minúscula e 1 número
  password += 'ABCDEFGHJKLMNPQRSTUVWXYZ'[Math.floor(Math.random() * 25)];
  password += 'abcdefghjkmnpqrstuvwxyz'[Math.floor(Math.random() * 23)];
  password += '23456789'[Math.floor(Math.random() * 8)];
  
  // Completar o resto
  for (let i = 3; i < length; i++) {
    password += chars[Math.floor(Math.random() * chars.length)];
  }
  
  // Embaralhar
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

export async function POST(request: NextRequest) {
  console.log('📧 API: Reenviando credenciais');
  
  try {
    // Inicializar Firebase Admin SDK
    const { auth, firestore: db } = getServerSdks();

    // Validar autenticação
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Verificar token
    const decodedToken = await auth.verifyIdToken(token);
    console.log('✅ Token validado');

    // Obter dados
    const bodyData = await request.json();
    const userId = bodyData.userId;

    if (!userId) {
      return NextResponse.json({ 
        error: 'userId é obrigatório' 
      }, { status: 400 });
    }

    console.log(`📧 Reenviando credenciais para usuário: ${userId}`);

    // Buscar usuário no Firestore
    const userDocRef = db.collection('users').doc(userId);
    const userDoc = await userDocRef.get();
    
    if (!userDoc.exists) {
      return NextResponse.json({ 
        error: 'Usuário não encontrado no Firestore'
      }, { status: 404 });
    }

    const userData = userDoc.data();
    const email = userData?.email;
    const displayName = userData?.displayName || userData?.name || email?.split('@')[0];

    if (!email) {
      return NextResponse.json({ 
        error: 'Email do usuário não encontrado'
      }, { status: 404 });
    }

    // Gerar senha temporária
    const temporaryPassword = generateTemporaryPassword();
    console.log('🔐 Senha temporária gerada');

    // Verificar se usuário existe no Auth
    let userExists = false;
    try {
      await auth.getUser(userId);
      userExists = true;
      console.log('✅ Usuário existe no Auth');
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        console.log('⚠️  Usuário não existe no Auth, será criado');
      } else {
        throw error;
      }
    }

    // Atualizar ou criar usuário no Auth
    if (userExists) {
      await auth.updateUser(userId, {
        password: temporaryPassword,
      });
      console.log('✅ Senha atualizada no Auth');
    } else {
      await auth.createUser({
        uid: userId,
        email: email,
        password: temporaryPassword,
        displayName: displayName,
      });
      console.log('✅ Usuário criado no Auth');
    }

    // Atualizar flag no Firestore
    await userDocRef.update({
      isTemporaryPassword: true,
    });

    // Buscar configurações de email do Firestore
    console.log('📧 Buscando configurações de email...');
    let resendApiKey = process.env.RESEND_API_KEY || '';
    let resendFromEmail = process.env.RESEND_FROM_EMAIL || 'Finance App <noreply@finances.rafaelarruda.com.br>';
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002';

    // Tentar buscar do usuário MASTER atual
    const currentUserDoc = await db.collection('users').doc(decodedToken.uid).get();
    if (currentUserDoc.exists) {
      const currentUserData = currentUserDoc.data();
      if (currentUserData?.resendApiKey) resendApiKey = currentUserData.resendApiKey;
      if (currentUserData?.resendFromEmail) resendFromEmail = currentUserData.resendFromEmail;
    }

    if (!resendApiKey) {
      return NextResponse.json({ 
        error: 'Serviço de email não configurado. Configure a API Key do Resend nas Configurações de Sistema.' 
      }, { status: 500 });
    }

    // Buscar template personalizado do Firestore
    let template = {
      primaryColor: '#667eea',
      secondaryColor: '#764ba2',
      backgroundColor: '#f4f4f4',
      textColor: '#333333',
      fontFamily: 'Arial, sans-serif',
      headerTitle: '🔐 Suas Credenciais de Acesso',
      bodyText: 'Olá {nome},\n\nSuas credenciais de acesso ao Finance App foram geradas. Use os dados abaixo para fazer login:\n\nEmail: {email}\nSenha Temporária: {senha}\n\n⚠️ Importante: Esta é uma senha temporária. Por questões de segurança, você será solicitado a alterá-la no primeiro acesso.\n\nSe você não solicitou este email, por favor ignore-o ou entre em contato com o administrador.',
      footerText: 'Este é um email automático. Por favor, não responda a esta mensagem.',
      companyName: 'Finance App',
    };

    const templateDoc = await db.collection('emailTemplates').doc(decodedToken.uid).get();
    if (templateDoc.exists) {
      const templatesData = templateDoc.data();
      if (templatesData?.credentials) {
        template = { ...template, ...templatesData.credentials };
      }
    }

    // Inicializar Resend com a chave configurada
    const resend = new Resend(resendApiKey);

    // Substituir variáveis no template
    const bodyText = template.bodyText
      .replace(/{nome}/g, displayName)
      .replace(/{email}/g, email)
      .replace(/{senha}/g, temporaryPassword)
      .replace(/\n/g, '<br>');

    // Enviar email com credenciais
    console.log('📧 Enviando email...');
    const { data, error } = await resend.emails.send({
      from: resendFromEmail,
      to: email,
      subject: `${template.headerTitle.replace(/[^\w\s-]/g, '')} - ${template.companyName}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: ${template.fontFamily}; line-height: 1.6; color: ${template.textColor}; background-color: ${template.backgroundColor}; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, ${template.primaryColor} 0%, ${template.secondaryColor} 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: white; padding: 30px; border-radius: 0 0 10px 10px; }
              .credentials { background: ${template.backgroundColor}; padding: 20px; border-radius: 8px; border-left: 4px solid ${template.primaryColor}; margin: 20px 0; }
              .credential-item { margin: 15px 0; }
              .credential-label { font-weight: bold; color: ${template.primaryColor}; }
              .credential-value { font-family: 'Courier New', monospace; background: #f0f0f0; padding: 8px 12px; border-radius: 4px; display: inline-block; margin-top: 5px; }
              .button { display: inline-block; background: ${template.primaryColor}; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
              .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>${template.headerTitle}</h1>
              </div>
              <div class="content">
                <p>${bodyText}</p>
                
                <div class="credentials">
                  <div class="credential-item">
                    <div class="credential-label">📧 Email:</div>
                    <div class="credential-value">${email}</div>
                  </div>
                  <div class="credential-item">
                    <div class="credential-label">🔑 Senha Temporária:</div>
                    <div class="credential-value">${temporaryPassword}</div>
                  </div>
                </div>
                
                <div style="text-align: center;">
                  <a href="${appUrl}" class="button">
                    Acessar ${template.companyName}
                  </a>
                </div>
              </div>
              <div class="footer">
                <p>${template.footerText}</p>
                <p>© ${new Date().getFullYear()} ${template.companyName}. Todos os direitos reservados.</p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error('❌ Erro ao enviar email:', error);
      return NextResponse.json({ 
        error: 'Senha atualizada, mas falha ao enviar email'
      }, { status: 500 });
    }

    console.log('✅ Email enviado com sucesso');

    return NextResponse.json({ 
      success: true,
      message: 'Credenciais enviadas por email com sucesso'
    });

  } catch (error) {
    console.error('❌ ERRO:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    
    return NextResponse.json({ 
      success: false,
      error: `Erro ao processar requisição: ${errorMessage}`
    }, { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
