import { NextRequest, NextResponse } from 'next/server';
import { getServerSdks } from '@/firebase/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  console.log('🗑️  API: Deletando usuário');
  
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
    const currentUserId = decodedToken.uid;

    // Obter userId a deletar
    const bodyData = await request.json();
    const userId = bodyData.userId;

    if (!userId) {
      return NextResponse.json({ error: 'userId é obrigatório' }, { status: 400 });
    }

    // Não permitir deletar a si mesmo
    if (userId === currentUserId) {
      return NextResponse.json({ 
        error: 'Você não pode deletar sua própria conta' 
      }, { status: 400 });
    }

    console.log(`🗑️  Deletando usuário: ${userId}`);

    // 1. Deletar do Firebase Authentication
    console.log('1️⃣  Deletando do Firebase Authentication...');
    try {
      await auth.deleteUser(userId);
      console.log('✅ Deletado do Firebase Authentication');
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        console.log('⚠️  Usuário não encontrado no Authentication');
      } else {
        throw error;
      }
    }

    // 2. Deletar documento do Firestore
    console.log('2️⃣  Deletando documento do Firestore...');
    try {
      await db.collection('users').doc(userId).delete();
      console.log('✅ Deletado do Firestore');
    } catch (error: any) {
      if (error.code === 'not-found') {
        console.log('⚠️  Documento não encontrado no Firestore');
      } else {
        console.error('❌ Erro ao deletar do Firestore:', error);
        throw error;
      }
    }

    // 3. Deletar roles (se existirem)
    console.log('3️⃣  Deletando roles...');
    const roleTypes = ['master', 'admin', 'viewer'];
    
    for (const roleType of roleTypes) {
      try {
        await db.collection(`roles_${roleType}`).doc(userId).delete();
        console.log(`✅ Deletado role: ${roleType}`);
      } catch (error) {
        // Ignorar se não existir
        console.log(`⚠️  Role ${roleType} não encontrada`);
      }
    }

    console.log('✅ Usuário deletado completamente');

    return NextResponse.json({ 
      success: true,
      message: 'Usuário deletado com sucesso'
    });

  } catch (error) {
    console.error('❌ ERRO:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    
    return NextResponse.json({ 
      success: false,
      error: `Erro ao deletar usuário: ${errorMessage}`
    }, { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
