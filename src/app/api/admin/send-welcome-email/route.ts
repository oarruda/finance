import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import WelcomeEmail from '@/components/emails/welcome-email';
import { firebaseConfig } from '@/firebase/config';

// Inicializar Resend com a API key
// Você precisa adicionar RESEND_API_KEY no arquivo .env.local
const resend = new Resend(process.env.RESEND_API_KEY);

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

    // Obter dados do body
    const body = await request.json();
    const { name, email, password } = body;

    if (!name || !email || !password) {
      return NextResponse.json({ 
        error: 'Nome, email e senha são obrigatórios' 
      }, { status: 400 });
    }

    // Verificar se a API key do Resend está configurada
    if (!process.env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY não está configurada');
      return NextResponse.json({ 
        error: 'Serviço de email não configurado. Configure RESEND_API_KEY no arquivo .env.local' 
      }, { status: 500 });
    }

    // URL de login (ajustar conforme necessário)
    const loginUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002';

    // Enviar email usando Resend
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'Sistema Financeiro <onboarding@resend.dev>',
      to: [email],
      subject: '🎉 Bem-vindo ao Sistema Financeiro - Suas Credenciais de Acesso',
      react: WelcomeEmail({
        name,
        email,
        password,
        loginUrl,
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
