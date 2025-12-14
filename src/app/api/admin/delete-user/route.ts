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
    const currentUserId = verifyData.users[0].localId;

    // Obter dados do body
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ 
        error: 'userId é obrigatório' 
      }, { status: 400 });
    }

    // Não permitir deletar o próprio usuário
    if (userId === currentUserId) {
      return NextResponse.json({ 
        error: 'Você não pode deletar sua própria conta' 
      }, { status: 400 });
    }

    // Buscar dados do usuário no Firestore
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
    const email = userData?.email?.stringValue || '';

    if (!email) {
      return NextResponse.json({ 
        error: 'Email do usuário não encontrado' 
      }, { status: 404 });
    }

    // Buscar usuário no Firebase Auth pelo email
    const getUserResponse = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${firebaseConfig.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: [email] }),
      }
    );

    if (getUserResponse.ok) {
      const getUserData = await getUserResponse.json();
      const firebaseUserId = getUserData.users?.[0]?.localId;

      if (firebaseUserId) {
        // Deletar usuário do Firebase Auth
        const deleteAuthResponse = await fetch(
          `https://identitytoolkit.googleapis.com/v1/accounts:delete?key=${firebaseConfig.apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              localId: firebaseUserId,
            }),
          }
        );

        if (!deleteAuthResponse.ok) {
          const errorData = await deleteAuthResponse.json();
          console.error('Erro ao deletar usuário do Auth:', errorData);
          return NextResponse.json({ 
            error: 'Erro ao deletar usuário do Firebase Auth: ' + (errorData.error?.message || 'Erro desconhecido')
          }, { status: 500 });
        }

        console.log('Usuário deletado do Firebase Auth:', email);
      }
    }

    // Deletar usuário do Firestore
    const deleteFirestoreResponse = await fetch(userFirestoreUrl, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!deleteFirestoreResponse.ok) {
      console.error('Erro ao deletar usuário do Firestore');
      return NextResponse.json({ 
        error: 'Erro ao deletar usuário do Firestore' 
      }, { status: 500 });
    }

    console.log('Usuário deletado do Firestore:', userId);

    return NextResponse.json({
      success: true,
      message: 'Usuário deletado com sucesso do Firebase Auth e Firestore',
    });
  } catch (error: any) {
    console.error('Erro ao deletar usuário:', error);
    return NextResponse.json({ 
      error: 'Erro ao deletar usuário: ' + (error.message || 'Erro desconhecido')
    }, { status: 500 });
  }
}
