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

    // Buscar configurações de email de TODOS os usuários MASTER
    console.log('📧 Buscando configurações de email em todos os MASTER users...');
    const { getMasterResendApiKey, getMasterResendConfig } = await import('@/lib/api-keys');
    
    let resendApiKey = process.env.RESEND_API_KEY || '';
    let resendFromEmail = process.env.RESEND_FROM_EMAIL || 'noreply@finances.rafaelarruda.com.br';
    let resendFromName = 'Finance App';
    let appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002';

    // Buscar API key e configurações de todos os MASTER users
    try {
      const masterApiKey = await getMasterResendApiKey();
      if (masterApiKey) {
        resendApiKey = masterApiKey;
        console.log('✅ resendApiKey encontrada em um dos MASTER users');
      }

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

    // Enviar email com credenciais
    console.log('📧 Enviando email...');
    const { data, error } = await resend.emails.send({
      from: `${resendFromName} <${resendFromEmail}>`,
      to: email,
      subject: `${template.headerTitle.replace(/[^\w\s-]/g, '')} - ${template.companyName}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${template.headerTitle}</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: ${template.fontFamily}; line-height: 1.6; color: ${template.textColor}; background-color: ${template.backgroundColor};">
            <table role="presentation" style="width: 100%; border-collapse: collapse;">
              <tr>
                <td align="center" style="padding: 40px 0;">
                  <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: white; box-shadow: 0 4px 6px rgba(0,0,0,0.1); border-radius: 10px; overflow: hidden;">
                    <!-- Header -->
                    <tr>
                      <td style="background: linear-gradient(135deg, ${template.primaryColor} 0%, ${template.secondaryColor} 100%); padding: 40px 30px; text-align: center;">
                        <h1 style="margin: 0; color: white; font-size: 28px; font-weight: bold;">${template.headerTitle}</h1>
                      </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                      <td style="padding: 40px 30px; background-color: white;">
                        <p style="margin: 0 0 20px 0; font-size: 16px; color: ${template.textColor};">
                          Olá <strong>${displayName}</strong>,
                        </p>
                        <p style="margin: 0 0 20px 0; font-size: 16px; color: ${template.textColor};">
                          Suas credenciais de acesso ao <strong>${template.companyName}</strong> foram geradas. Use os dados abaixo para fazer login:
                        </p>
                        
                        <!-- Credentials Box -->
                        <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: ${template.backgroundColor}; border-left: 4px solid ${template.primaryColor}; border-radius: 8px; margin: 30px 0;">
                          <tr>
                            <td style="padding: 25px;">
                              <!-- Email -->
                              <table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                                <tr>
                                  <td>
                                    <p style="margin: 0 0 8px 0; font-weight: bold; color: ${template.primaryColor}; font-size: 14px;">
                                      📧 Email:
                                    </p>
                                    <p style="margin: 0; font-family: 'Courier New', monospace; background: #f0f0f0; padding: 12px 16px; border-radius: 6px; font-size: 15px; color: #333;">
                                      ${email}
                                    </p>
                                  </td>
                                </tr>
                              </table>
                              
                              <!-- Password -->
                              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                                <tr>
                                  <td>
                                    <p style="margin: 0 0 8px 0; font-weight: bold; color: ${template.primaryColor}; font-size: 14px;">
                                      🔑 Senha Temporária:
                                    </p>
                                    <p style="margin: 0; font-family: 'Courier New', monospace; background: #f0f0f0; padding: 12px 16px; border-radius: 6px; font-size: 15px; color: #333; letter-spacing: 1px;">
                                      ${temporaryPassword}
                                    </p>
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                        </table>
                        
                        <!-- Warning -->
                        <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #fff3cd; border-left: 4px solid #ffc107; border-radius: 6px; margin: 20px 0;">
                          <tr>
                            <td style="padding: 15px;">
                              <p style="margin: 0; font-size: 14px; color: #856404;">
                                ⚠️ <strong>Importante:</strong> Esta é uma senha temporária. Por questões de segurança, você será solicitado a alterá-la no primeiro acesso.
                              </p>
                            </td>
                          </tr>
                        </table>
                        
                        <!-- Button -->
                        <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 30px 0;">
                          <tr>
                            <td align="center">
                              <a href="${appUrl}" style="display: inline-block; background: linear-gradient(135deg, ${template.primaryColor} 0%, ${template.secondaryColor} 100%); color: white; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                                🚀 Acessar ${template.companyName}
                              </a>
                            </td>
                          </tr>
                        </table>
                        
                        <p style="margin: 20px 0 0 0; font-size: 14px; color: #666;">
                          Se você não solicitou este email, por favor ignore-o ou entre em contato com o administrador.
                        </p>
                      </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                      <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef;">
                        <p style="margin: 0 0 10px 0; font-size: 13px; color: #6c757d;">
                          ${template.footerText}
                        </p>
                        <p style="margin: 0; font-size: 12px; color: #6c757d;">
                          © ${new Date().getFullYear()} ${template.companyName}. Todos os direitos reservados.
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
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
