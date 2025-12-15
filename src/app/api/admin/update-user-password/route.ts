import { NextRequest, NextResponse } from 'next/server';
import { getServerSdks } from '@/firebase/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  console.log('🔐 API: Iniciando atualização de senha');
  
  try {
    // Inicializar Firebase Admin SDK
    const { auth, firestore: db } = getServerSdks();

    // Validar autenticação
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Verificar token com Admin SDK
    const decodedToken = await auth.verifyIdToken(token);
    console.log('✅ Token validado');

    // Obter dados
    const bodyData = await request.json();
    const userId = bodyData.userId;
    const newPassword = bodyData.newPassword;

    console.log(`🔐 Atualizando senha para usuário: ${userId}`);

    if (!userId || !newPassword) {
      return NextResponse.json({ 
        error: 'userId e newPassword são obrigatórios' 
      }, { status: 400 });
    }

    // Validações de senha
    if (newPassword.length < 8) {
      return NextResponse.json({ 
        error: 'A senha deve ter pelo menos 8 caracteres' 
      }, { status: 400 });
    }

    if (!/[a-zA-Z]/.test(newPassword)) {
      return NextResponse.json({ 
        error: 'A senha deve conter pelo menos uma letra' 
      }, { status: 400 });
    }

    if (!/[0-9]/.test(newPassword)) {
      return NextResponse.json({ 
        error: 'A senha deve conter pelo menos um número' 
      }, { status: 400 });
    }

    // Atualizar senha no Firebase Auth usando Admin SDK
    console.log('🔐 Atualizando senha no Firebase Auth...');
    try {
      await auth.updateUser(userId, {
        password: newPassword,
      });
      console.log('✅ Senha atualizada no Firebase Auth');
    } catch (authError: any) {
      // Se usuário não existe no Auth, tentar criar
      if (authError.code === 'auth/user-not-found') {
        console.log('⚠️  Usuário não existe no Auth, tentando criar...');
        
        // Buscar dados do Firestore
        const userDocRef = db.collection('users').doc(userId);
        const userDoc = await userDocRef.get();
        
        if (!userDoc.exists) {
          return NextResponse.json({ 
            error: 'Usuário não encontrado nem no Firebase Auth nem no Firestore.'
          }, { status: 404 });
        }
        
        const userData = userDoc.data();
        const email = userData?.email;
        const displayName = userData?.displayName || userData?.name || email?.split('@')[0];
        
        if (!email) {
          return NextResponse.json({ 
            error: 'Email do usuário não encontrado no Firestore'
          }, { status: 404 });
        }
        
        console.log('📧 Criando usuário no Auth com email:', email);
        
        // Criar usuário no Auth com o mesmo UID do Firestore
        try {
          await auth.createUser({
            uid: userId,
            email: email,
            password: newPassword,
            displayName: displayName,
          });
          console.log('✅ Usuário criado no Auth com sucesso');
        } catch (createError: any) {
          console.error('❌ Erro ao criar usuário:', createError);
          
          if (createError.code === 'auth/email-already-exists') {
            return NextResponse.json({ 
              error: 'Este email já está registrado com outro UID. Delete o usuário e crie novamente.'
            }, { status: 400 });
          }
          
          return NextResponse.json({ 
            error: `Erro ao criar usuário no Auth: ${createError.message}`
          }, { status: 500 });
        }
      } else {
        // Outro erro
        console.error('❌ Erro ao atualizar senha:', authError);
        return NextResponse.json({ 
          error: `Erro ao atualizar senha: ${authError.message}`
        }, { status: 500 });
      }
    }

    // Atualizar flag no Firestore
    try {
      await db.collection('users').doc(userId).update({
        isTemporaryPassword: false,
      });
      console.log('✅ Flag isTemporaryPassword atualizada no Firestore');
    } catch (firestoreError) {
      console.log('⚠️  Não foi possível atualizar flag no Firestore (pode não existir)');
    }

    return NextResponse.json({ 
      success: true,
      message: 'Senha atualizada com sucesso'
    });

  } catch (error) {
    console.error('❌ ERRO:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    
    return NextResponse.json({ 
      success: false,
      error: `Erro ao processar requisição: ${errorMessage}`
    }, { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
