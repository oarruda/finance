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
    const { userId, newPassword } = body;

    if (!userId || !newPassword) {
      return NextResponse.json({ 
        error: 'userId e newPassword são obrigatórios' 
      }, { status: 400 });
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ 
        error: 'A senha deve ter pelo menos 8 caracteres' 
      }, { status: 400 });
    }

    console.log('========================================');
    console.log('🔑 Atualizando senha do usuário');
    console.log('User ID:', userId);
    console.log('========================================');

    // Atualizar senha usando Firebase REST API
    const updatePasswordResponse = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:setAccountInfo?key=${firebaseConfig.apiKey}`,
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

    if (!updatePasswordResponse.ok) {
      const errorData = await updatePasswordResponse.json();
      console.error('❌ Erro ao atualizar senha:', errorData);
      return NextResponse.json({ 
        error: 'Erro ao atualizar senha: ' + (errorData.error?.message || 'Erro desconhecido')
      }, { status: 500 });
    }

    console.log('✅ Senha atualizada com sucesso');

    // Marcar senha como NÃO temporária no Firestore usando REST API
    const updateUserUrl = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents/users/${userId}?updateMask.fieldPaths=isTemporaryPassword&key=${firebaseConfig.apiKey}`;
    
    await fetch(updateUserUrl, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fields: {
          isTemporaryPassword: { booleanValue: false },
        },
      }),
    });

    return NextResponse.json({ 
      success: true,
      message: 'Senha atualizada com sucesso'
    });

  } catch (error: any) {
    console.error('❌ Erro ao atualizar senha do usuário:', error);
    return NextResponse.json({ 
      error: error.message || 'Erro ao atualizar senha' 
    }, { status: 500 });
  }
}
