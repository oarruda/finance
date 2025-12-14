import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { WelcomeEmail } from '@/components/emails/welcome-email';
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

    // Enviar email usando Resend
    const { data, error } = await resend.emails.send({
      from: resendFromEmail,
      to: [email],
      subject: '🎉 Bem-vindo ao Sistema Financeiro - Suas Credenciais de Acesso',
      react: WelcomeEmail({
        name,
        email,
        password,
        loginUrl: appUrl,
      }),
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
