import { NextRequest, NextResponse } from 'next/server';
import { getServerSdks } from '@/firebase/server';

export async function POST(request: NextRequest) {
  try {
    // Inicializar Firebase Admin
    const { auth, firestore: db } = getServerSdks();

    // Obter token do header para verificar autenticação
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    
    // Verificar autenticação usando Admin SDK
    const decodedToken = await auth.verifyIdToken(token);
    const currentUserId = decodedToken.uid;

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

    console.log('========================================');
    console.log('🗑️  Iniciando deleção de usuário');
    console.log('ID:', userId);
    console.log('========================================');

    // 1. Buscar dados do usuário no Firestore
    console.log('1️⃣  Buscando dados no Firestore...');
    const userDoc = await db.collection('users').doc(userId).get();

    if (!userDoc.exists) {
      console.error('❌ Usuário não encontrado no Firestore');
      return NextResponse.json({ 
        error: 'Usuário não encontrado' 
      }, { status: 404 });
    }

    const userData = userDoc.data();
    const email = userData?.email;

    if (!email) {
      console.error('❌ Email do usuário não encontrado');
      return NextResponse.json({ 
        error: 'Email do usuário não encontrado' 
      }, { status: 404 });
    }

    console.log('✅ Usuário encontrado:', email);

    // 2. Deletar do Firebase Authentication
    console.log('2️⃣  Deletando do Firebase Authentication...');
    try {
      await auth.deleteUser(userId);
      console.log('✅ Usuário deletado do Authentication');
    } catch (authError: any) {
      console.error('⚠️  Erro ao deletar do Authentication:', authError.message);
      // Continuar mesmo se falhar (usuário pode não existir no Auth)
    }

    // 3. Deletar do Firestore (users collection)
    console.log('3️⃣  Deletando do Firestore (users)...');
    await db.collection('users').doc(userId).delete();
    console.log('✅ Usuário deletado do Firestore');

    // 4. Deletar das collections de roles
    console.log('4️⃣  Deletando das collections de roles...');
    const deleteRoles = [];
    
    try {
      const masterDoc = await db.collection('roles_master').doc(userId).get();
      if (masterDoc.exists) {
        deleteRoles.push(db.collection('roles_master').doc(userId).delete());
        console.log('  - Encontrado em roles_master');
      }
    } catch (e) {
      console.log('  - Não estava em roles_master');
    }

    try {
      const adminDoc = await db.collection('roles_admin').doc(userId).get();
      if (adminDoc.exists) {
        deleteRoles.push(db.collection('roles_admin').doc(userId).delete());
        console.log('  - Encontrado em roles_admin');
      }
    } catch (e) {
      console.log('  - Não estava em roles_admin');
    }

    try {
      const viewerDoc = await db.collection('roles_viewer').doc(userId).get();
      if (viewerDoc.exists) {
        deleteRoles.push(db.collection('roles_viewer').doc(userId).delete());
        console.log('  - Encontrado em roles_viewer');
      }
    } catch (e) {
      console.log('  - Não estava em roles_viewer');
    }

    if (deleteRoles.length > 0) {
      await Promise.all(deleteRoles);
      console.log(`✅ Deletado de ${deleteRoles.length} collection(s) de roles`);
    } else {
      console.log('ℹ️  Usuário não estava em nenhuma collection de roles');
    }

    console.log('========================================');
    console.log('🎉 USUÁRIO COMPLETAMENTE DELETADO');
    console.log('Email:', email);
    console.log('ID:', userId);
    console.log('========================================');

    return NextResponse.json({ 
      success: true,
      message: 'Usuário deletado com sucesso',
      deletedUser: { 
        id: userId, 
        email 
      }
    });

  } catch (error: any) {
    console.error('========================================');
    console.error('💥 ERRO NA DELEÇÃO');
    console.error('Mensagem:', error.message);
    console.error('Stack:', error.stack);
    console.error('========================================');
    
    return NextResponse.json({ 
      error: 'Erro ao deletar usuário: ' + error.message 
    }, { status: 500 });
  }
}
