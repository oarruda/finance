import { NextRequest, NextResponse } from 'next/server';
import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

// Firebase REST API URL para criação de usuário
const FIREBASE_AUTH_API = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${firebaseConfig.apiKey}`;

// Inicializar Firebase no servidor
function getFirebaseApp() {
  if (!getApps().length) {
    return initializeApp(firebaseConfig);
  }
  return getApps()[0];
}

export async function POST(request: NextRequest) {
  console.log('=== CREATE USER API CALLED ===');
  try {
    // Obter token do header
    const authHeader = request.headers.get('authorization');
    console.log('Auth header:', authHeader ? 'Present' : 'Missing');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    console.log('Token extracted, length:', token.length);
    
    // Verificar autenticação via REST API
    console.log('Verifying token with Firebase...');
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
    console.log('User verified:', currentUser.email);

    // Obter dados do body
    let body;
    try {
      body = await request.json();
      console.log('Request body parsed:', { email: body.email, name: body.name, role: body.role });
    } catch (parseError) {
      console.error('Error parsing request body:', parseError);
      return NextResponse.json({ error: 'Corpo da requisição inválido' }, { status: 400 });
    }
    
    const { name, email, password, phone, cpf, role } = body;

    if (!name || !email || !password) {
      console.log('Missing required fields:', { name: !!name, email: !!email, password: !!password });
      return NextResponse.json({ error: 'Nome, email e senha são obrigatórios' }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Senha deve ter no mínimo 8 caracteres' }, { status: 400 });
    }

    // Validar se a senha contém letras e números
    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    if (!hasLetter || !hasNumber) {
      return NextResponse.json({ error: 'Senha deve conter letras e números' }, { status: 400 });
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

    console.log('User created in Firebase Auth successfully:', userId);
    
    // Enviar email de boas-vindas com as credenciais
    try {
      const emailResponse = await fetch(`${request.nextUrl.origin}/api/admin/send-welcome-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          email,
          password,
        }),
      });

      if (!emailResponse.ok) {
        console.error('Falha ao enviar email de boas-vindas');
        // Não falhar a criação do usuário se o email falhar
      } else {
        console.log('Email de boas-vindas enviado com sucesso');
      }
    } catch (emailError) {
      console.error('Erro ao enviar email:', emailError);
      // Continuar mesmo se o email falhar
    }
    
    // Retornar dados para o cliente criar os documentos no Firestore
    // O cliente tem as credenciais de autenticação necessárias
    return NextResponse.json({
      success: true,
      userId,
      userData: {
        id: userId,
        email,
        name,
        phone: phone || '',
        cpf: cpf || '',
        role: role || 'viewer',
      },
      message: 'Usuário criado com sucesso',
    });
  } catch (error: any) {
    console.error('=== ERROR CREATING USER ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Full error:', error);
    
    return NextResponse.json({ 
      error: 'Erro ao criar usuário: ' + (error.message || 'Erro desconhecido')
    }, { status: 500 });
  }
}
