import { NextRequest, NextResponse } from 'next/server';
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

    // Obter dados do body
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ 
        error: 'userId é obrigatório' 
      }, { status: 400 });
    }

    // Buscar dados do usuário usando a REST API do Firestore
    const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents/users/${userId}`;
    
    const userResponse = await fetch(firestoreUrl, {
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
    
    // Extrair valores dos campos Firestore (formato: {stringValue: "value"})
    const name = userData?.name?.stringValue || userData?.email?.stringValue || '';
    const email = userData?.email?.stringValue || '';

    // Gerar uma nova senha temporária
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%&*';
    let newPassword = '';
    for (let i = 0; i < 12; i++) {
      newPassword += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    // Atualizar a senha do usuário no Firebase Auth
    const resetPasswordResponse = await fetch(
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

    if (!resetPasswordResponse.ok) {
      const errorData = await resetPasswordResponse.json();
      console.error('Erro ao atualizar senha:', errorData);
      return NextResponse.json({ 
        error: 'Erro ao atualizar senha do usuário' 
      }, { status: 500 });
    }

    console.log('Senha atualizada com sucesso para usuário:', userId);

    // Enviar email com as novas credenciais
    const emailResponse = await fetch(`${request.nextUrl.origin}/api/admin/send-welcome-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        name,
        email,
        password: newPassword,
      }),
    });

    if (!emailResponse.ok) {
      const emailError = await emailResponse.json();
      console.error('Erro ao enviar email:', emailError);
      return NextResponse.json({ 
        error: 'Senha atualizada mas falha ao enviar email: ' + (emailError.error || 'Erro desconhecido')
      }, { status: 500 });
    }

    console.log('Email reenviado com sucesso para:', email);

    return NextResponse.json({
      success: true,
      message: 'Email reenviado com sucesso com nova senha temporária',
    });
  } catch (error: any) {
    console.error('Erro ao reenviar email:', error);
    return NextResponse.json({ 
      error: 'Erro ao reenviar email: ' + (error.message || 'Erro desconhecido')
    }, { status: 500 });
  }
}
