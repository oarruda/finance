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

    const verifyData = await verifyResponse.json();
    const currentUser = verifyData.users[0];

    // Obter dados do body
    const body = await request.json();
    const { userId, disabled } = body;

    if (!userId || typeof disabled !== 'boolean') {
      return NextResponse.json({ 
        error: 'userId e disabled (boolean) são obrigatórios' 
      }, { status: 400 });
    }

    // Não permitir desativar o próprio usuário
    if (userId === currentUser.localId) {
      return NextResponse.json({ 
        error: 'Você não pode desativar sua própria conta' 
      }, { status: 400 });
    }

    // Nota: A REST API do Firebase não suporta desabilitar usuários diretamente
    // Isso requer Firebase Admin SDK com permissões especiais
    // Por enquanto, vamos apenas marcar o usuário como desativado no Firestore
    // O frontend deve verificar o campo 'disabled' antes de permitir login
    
    // Atualizar o campo disabled no Firestore
    const { getFirestore, doc, updateDoc } = await import('firebase/firestore');
    const { initializeApp, getApps } = await import('firebase/app');

    // Inicializar Firebase
    let app;
    if (!getApps().length) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApps()[0];
    }

    const firestore = getFirestore(app);
    const userRef = doc(firestore, 'users', userId);
    await updateDoc(userRef, {
      disabled,
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: `Usuário ${disabled ? 'desativado' : 'ativado'} com sucesso`,
      disabled,
    });
  } catch (error: any) {
    console.error('Erro ao atualizar status do usuário:', error);
    return NextResponse.json({ 
      error: 'Erro ao atualizar status: ' + (error.message || 'Erro desconhecido')
    }, { status: 500 });
  }
}
