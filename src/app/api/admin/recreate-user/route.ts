import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const FIREBASE_API_KEY = 'AIzaSyDinaZcQc5_Q6Fg8YBixq94-CRRBZKRAwM';
const FIREBASE_PROJECT_ID = 'studio-8444859572-1c9a4';

// Gerar senha aleatória
function generatePassword(length = 12) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%&*';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

export async function POST(request: NextRequest) {
  console.log('🔄 API: Recriando usuário no Firebase Auth');
  
  try {
    // Validar autenticação
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Validar token
    const verifyUrl = `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${FIREBASE_API_KEY}`;
    const verifyRes = await fetch(verifyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken: token }),
    });

    if (!verifyRes.ok) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    // Obter userId
    const bodyData = await request.json();
    const userId = bodyData.userId;

    if (!userId) {
      return NextResponse.json({ error: 'userId é obrigatório' }, { status: 400 });
    }

    console.log(`🔄 Recriando usuário: ${userId}`);

    // Buscar dados do usuário no Firestore
    const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/users/${encodeURIComponent(userId)}?key=${FIREBASE_API_KEY}`;
    const firestoreRes = await fetch(firestoreUrl);

    if (!firestoreRes.ok) {
      return NextResponse.json({ 
        error: 'Usuário não encontrado no Firestore' 
      }, { status: 404 });
    }

    const userDoc = await firestoreRes.json();
    const fields = userDoc.fields;
    
    const email = fields?.email?.stringValue;
    const displayName = fields?.displayName?.stringValue || fields?.name?.stringValue || email?.split('@')[0];

    if (!email) {
      return NextResponse.json({ 
        error: 'Email do usuário não encontrado no Firestore' 
      }, { status: 404 });
    }

    console.log(`📧 Email: ${email}`);
    console.log(`👤 Nome: ${displayName}`);

    // Verificar se já existe no Auth (pode ter sido recriado)
    const checkAuthUrl = `https://identitytoolkit.googleapis.com/v1/accounts:lookup`;
    const checkAuthRes = await fetch(checkAuthUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        localId: [userId],
        key: FIREBASE_API_KEY
      }),
    });

    const checkAuthData = await checkAuthRes.json();
    if (checkAuthData.users && checkAuthData.users.length > 0) {
      console.log('⚠️  Usuário já existe no Auth, apenas gerando nova senha');
    } else {
      console.log('🆕 Criando nova conta no Firebase Auth');
      
      // Gerar senha temporária
      const tempPassword = generatePassword();

      // Criar usuário no Firebase Auth usando signUp
      const signUpUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${FIREBASE_API_KEY}`;
      const signUpRes = await fetch(signUpUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email,
          password: tempPassword,
          displayName: displayName,
          returnSecureToken: false,
        }),
      });

      if (!signUpRes.ok) {
        const errorData = await signUpRes.json();
        console.error('❌ Erro ao criar usuário:', errorData);
        
        // Se o email já existe, é outro usuário
        if (errorData.error?.message?.includes('EMAIL_EXISTS')) {
          return NextResponse.json({ 
            error: 'Este email já está em uso por outro usuário. Delete o usuário do Firestore ou use outro email.' 
          }, { status: 400 });
        }
        
        return NextResponse.json({ 
          error: `Erro ao criar usuário: ${errorData.error?.message || 'desconhecido'}` 
        }, { status: 500 });
      }

      const signUpData = await signUpRes.json();
      const newUserId = signUpData.localId;

      console.log('✅ Usuário criado no Auth com ID:', newUserId);
      console.log('🔑 Senha temporária gerada:', tempPassword);

      // IMPORTANTE: O Firebase gera um novo UID, precisamos atualizar o Firestore
      if (newUserId !== userId) {
        console.log('⚠️  ATENÇÃO: Firebase gerou novo UID diferente do Firestore');
        console.log('   Firestore UID:', userId);
        console.log('   Auth UID:', newUserId);
        
        return NextResponse.json({ 
          error: 'Não é possível recriar usuário com UID específico. O Firebase gera automaticamente novos UIDs. Recomenda-se deletar o usuário do Firestore e criar um novo.',
          details: {
            firestoreUid: userId,
            authUid: newUserId,
            email: email
          }
        }, { status: 400 });
      }
    }

    // Gerar nova senha temporária
    const newPassword = generatePassword();

    // Atualizar senha
    const updateUrl = `https://identitytoolkit.googleapis.com/v1/accounts:setAccountInfo?key=${FIREBASE_API_KEY}`;
    const updateRes = await fetch(updateUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        localId: userId,
        password: newPassword,
        returnSecureToken: false,
      }),
    });

    if (!updateRes.ok) {
      const errorData = await updateRes.json();
      return NextResponse.json({ 
        error: `Erro ao definir senha: ${errorData.error?.message || 'desconhecido'}` 
      }, { status: 500 });
    }

    // Atualizar flag no Firestore
    const updateFirestoreUrl = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/users/${userId}?updateMask.fieldPaths=isTemporaryPassword&key=${FIREBASE_API_KEY}`;
    
    await fetch(updateFirestoreUrl, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fields: {
          isTemporaryPassword: { booleanValue: true },
        },
      }),
    });

    console.log('✅ Usuário recriado com sucesso');

    return NextResponse.json({ 
      success: true,
      message: 'Usuário recriado com sucesso',
      email: email,
      temporaryPassword: newPassword
    });

  } catch (error) {
    console.error('❌ ERRO:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    
    return NextResponse.json({ 
      success: false,
      error: `Erro ao recriar usuário: ${errorMessage}`
    }, { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
