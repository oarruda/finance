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

    if (!email) {
      return NextResponse.json({ 
        error: 'Email do usuário não encontrado' 
      }, { status: 404 });
    }

    // IMPORTANTE: A REST API do Firebase não permite resetar senha diretamente
    // Vamos enviar um email de reset de senha usando a API do Firebase
    console.log('Enviando email de reset de senha para:', email);

    const resetPasswordResponse = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${firebaseConfig.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestType: 'PASSWORD_RESET',
          email: email,
        }),
      }
    );

    if (!resetPasswordResponse.ok) {
      const errorData = await resetPasswordResponse.json();
      console.error('Erro ao enviar email de reset:', errorData);
      return NextResponse.json({ 
        error: 'Erro ao enviar email de reset de senha: ' + (errorData.error?.message || 'Erro desconhecido')
      }, { status: 500 });
    }

    const resetData = await resetPasswordResponse.json();
    console.log('Email de reset enviado com sucesso para:', email);

    return NextResponse.json({
      success: true,
      message: 'Email de reset de senha enviado com sucesso',
      email: email,
    });
  } catch (error: any) {
    console.error('Erro ao reenviar email:', error);
    return NextResponse.json({ 
      error: 'Erro ao reenviar email: ' + (error.message || 'Erro desconhecido')
    }, { status: 500 });
  }
}
