import { NextRequest, NextResponse } from 'next/server';
import { firebaseConfig } from '@/firebase/config';

export async function POST(request: NextRequest) {
  try {
    console.log('=== TOGGLE USER STATUS API START ===');
    
    // Obter token do header para verificar autenticação
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ No auth header found');
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    console.log('✅ Token received');
    
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
      console.log('❌ Token verification failed');
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const verifyData = await verifyResponse.json();
    const currentUser = verifyData.users[0];
    console.log('✅ Current user verified:', currentUser.localId, currentUser.email);

    // Obter dados do body
    const body = await request.json();
    const { userId, disabled } = body;
    console.log('📦 Request body:', { userId, disabled });

    if (!userId || typeof disabled !== 'boolean') {
      console.log('❌ Invalid request body');
      return NextResponse.json({ 
        error: 'userId e disabled (boolean) são obrigatórios' 
      }, { status: 400 });
    }

    // Não permitir desativar o próprio usuário
    if (userId === currentUser.localId) {
      console.log('❌ User trying to disable themselves');
      return NextResponse.json({ 
        error: 'Você não pode desativar sua própria conta' 
      }, { status: 400 });
    }

    // Verificar se o usuário atual é MASTER usando Firebase Client SDK no servidor
    // Importar apenas quando necessário para evitar problemas de bundle
    const { initializeApp, getApps } = await import('firebase/app');
    const { getFirestore, doc, getDoc } = await import('firebase/firestore');

    let app;
    if (!getApps().length) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApps()[0];
    }

    const firestore = getFirestore(app);
    
    console.log('🔍 Checking user role in Firestore');
    
    try {
      const userRef = doc(firestore, 'users', currentUser.localId);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        console.log('❌ User document not found');
        return NextResponse.json({ 
          error: 'Documento do usuário não encontrado' 
        }, { status: 404 });
      }

      const userData = userSnap.data();
      const userRole = userData?.role;
      
      console.log('User role:', userRole);
      
      if (userRole !== 'master') {
        console.log('❌ User is not MASTER');
        return NextResponse.json({ 
          error: 'Apenas usuários MASTER podem desativar/ativar outros usuários. Seu role atual: ' + (userRole || 'viewer')
        }, { status: 403 });
      }
      
      console.log('✅ User is MASTER');
    } catch (error: any) {
      console.log('❌ Error checking user role:', error.message);
      return NextResponse.json({ 
        error: 'Erro ao verificar permissões: ' + error.message
      }, { status: 500 });
    }

    // Atualizar o campo disabled no Firestore usando Firebase Client SDK
    console.log('📝 Updating user disabled field');
    
    try {
      const { updateDoc } = await import('firebase/firestore');
      const targetUserRef = doc(firestore, 'users', userId);
      
      await updateDoc(targetUserRef, {
        disabled,
        updatedAt: new Date().toISOString(),
      });

      console.log('✅ User updated successfully');
      console.log('=== TOGGLE USER STATUS API END ===');

      return NextResponse.json({
        success: true,
        message: `Usuário ${disabled ? 'desativado' : 'ativado'} com sucesso`,
        disabled,
      });
    } catch (updateError: any) {
      console.error('❌ Update error:', updateError.message);
      return NextResponse.json({ 
        error: 'Erro ao atualizar usuário: ' + updateError.message
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('❌ FATAL ERROR:', error);
    console.log('=== TOGGLE USER STATUS API END (ERROR) ===');
    return NextResponse.json({ 
      error: 'Erro ao atualizar status: ' + (error.message || 'Erro desconhecido')
    }, { status: 500 });
  }
}
