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

    // Criar HTML do email
    const emailHtml = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <style>
      body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
      .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
      .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
      .header h1 { margin: 0; font-size: 28px; }
      .content { padding: 30px; }
      .credentials { background: #f8f9fa; border-left: 4px solid #667eea; padding: 15px; margin: 20px 0; border-radius: 4px; }
      .credentials p { margin: 10px 0; }
      .credentials strong { color: #667eea; font-weight: 600; }
      .button { display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: 600; }
      .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #e9ecef; }
      .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>🎉 Bem-vindo ao Sistema Financeiro</h1>
      </div>
      <div class="content">
        <p>Olá <strong>${name}</strong>,</p>
        <p>Uma conta foi criada para você no sistema de gestão financeira. Abaixo estão suas credenciais de acesso:</p>
        
        <div class="credentials">
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Senha Temporária:</strong> ${password}</p>
        </div>

        <div class="warning">
          <p>⚠️ <strong>Importante:</strong> Esta é uma senha temporária. Por motivos de segurança, recomendamos que você altere sua senha após o primeiro acesso.</p>
        </div>

        <div style="text-align: center;">
          <a href="${appUrl}" class="button">Acessar Sistema</a>
        </div>

        <p style="margin-top: 30px; font-size: 14px; color: #666;">
          Se você tiver alguma dúvida ou precisar de ajuda, entre em contato com o administrador do sistema.
        </p>
      </div>
      <div class="footer">
        <p>Este é um email automático. Por favor, não responda a esta mensagem.</p>
        <p>© ${new Date().getFullYear()} Sistema Financeiro. Todos os direitos reservados.</p>
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
