import { NextRequest, NextResponse } from 'next/server';
import { firebaseConfig } from '@/firebase/config';

// Firebase REST API URLs
const FIREBASE_AUTH_API = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${firebaseConfig.apiKey}`;
const FIRESTORE_API = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents`;

export async function POST(request: NextRequest) {
  try {
    // Obter token do header
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

    // Verificar se é MASTER via Firestore REST API
    const masterCheck = await fetch(
      `${FIRESTORE_API}/roles_master/${currentUser.localId}`,
      {
        headers: { 'Authorization': `Bearer ${token}` },
      }
    );

    if (!masterCheck.ok || masterCheck.status === 404) {
      return NextResponse.json({ error: 'Apenas MASTER pode criar usuários' }, { status: 403 });
    }

    // Obter dados do body
    const body = await request.json();
    const { name, email, password, phone, cpf, role } = body;

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Nome, email e senha são obrigatórios' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Senha deve ter no mínimo 6 caracteres' }, { status: 400 });
    }

    // Criar usuário no Firebase Auth via REST API
    const createUserResponse = await fetch(FIREBASE_AUTH_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password,
        displayName: name,
        returnSecureToken: true,
      }),
    });

    if (!createUserResponse.ok) {
      const errorData = await createUserResponse.json();
      let errorMessage = 'Erro ao criar usuário';
      
      if (errorData.error?.message === 'EMAIL_EXISTS') {
        errorMessage = 'Este email já está em uso';
      } else if (errorData.error?.message === 'INVALID_EMAIL') {
        errorMessage = 'Email inválido';
      } else if (errorData.error?.message === 'WEAK_PASSWORD') {
        errorMessage = 'Senha muito fraca';
      }
      
      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }

    const newUserData = await createUserResponse.json();
    const userId = newUserData.localId;

    // Criar documento do usuário no Firestore via REST API
    const userDoc = {
      fields: {
        id: { stringValue: userId },
        email: { stringValue: email },
        name: { stringValue: name },
        phone: { stringValue: phone || '' },
        cpf: { stringValue: cpf || '' },
        role: { stringValue: role || 'viewer' },
        createdAt: { timestampValue: new Date().toISOString() },
        updatedAt: { timestampValue: new Date().toISOString() },
      },
    };

    await fetch(`${FIRESTORE_API}/users?documentId=${userId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(userDoc),
    });

    // Se for master ou admin, adicionar na coleção de roles
    if (role === 'master' || role === 'admin') {
      const roleDoc = {
        fields: {
          email: { stringValue: email },
          role: { stringValue: role },
          createdAt: { timestampValue: new Date().toISOString() },
        },
      };

      const roleCollection = role === 'master' ? 'roles_master' : 'roles_admin';
      await fetch(`${FIRESTORE_API}/${roleCollection}?documentId=${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(roleDoc),
      });
    }

    return NextResponse.json({
      success: true,
      userId,
      message: 'Usuário criado com sucesso',
    });
  } catch (error: any) {
    console.error('Error creating user:', error);
    return NextResponse.json({ 
      error: 'Erro ao criar usuário: ' + (error.message || 'Erro desconhecido')
    }, { status: 400 });
  }
}
