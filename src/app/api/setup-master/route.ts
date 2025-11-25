import { NextRequest, NextResponse } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { initializeFirebaseAdmin } from '@/firebase/server';

/**
 * API para configurar o primeiro usuário MASTER
 * Este endpoint só funciona se não existir nenhum MASTER ainda
 * 
 * Uso: POST /api/setup-master
 * Body: { email: "seu@email.com" }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email é obrigatório' }, { status: 400 });
    }

    const app = initializeFirebaseAdmin();
    const db = getFirestore(app);
    const auth = getAuth(app);

    // Verificar se já existe algum MASTER
    console.log('Verificando se já existe MASTER...');
    const mastersSnapshot = await db.collection('roles_master').limit(1).get();
    
    if (!mastersSnapshot.empty) {
      return NextResponse.json({ 
        error: 'Já existe um usuário MASTER configurado. Use o painel admin para criar novos usuários.',
        hasMaster: true 
      }, { status: 403 });
    }

    // Buscar usuário por email no Auth
    console.log(`Buscando usuário com email: ${email}...`);
    let userRecord;
    try {
      userRecord = await auth.getUserByEmail(email);
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        return NextResponse.json({ 
          error: 'Usuário não encontrado. Faça login ao menos uma vez antes de usar este endpoint.' 
        }, { status: 404 });
      }
      throw error;
    }

    const userId = userRecord.uid;
    console.log(`Usuário encontrado: ${userId}`);

    // Buscar dados do usuário no Firestore
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.exists ? userDoc.data() : {};

    // Adicionar na coleção roles_master
    console.log('Adicionando na coleção roles_master...');
    await db.collection('roles_master').doc(userId).set({
      email: email,
      role: 'master',
      createdAt: new Date().toISOString(),
    });

    // Atualizar ou criar documento do usuário
    console.log('Atualizando perfil do usuário...');
    await db.collection('users').doc(userId).set({
      id: userId,
      email: email,
      name: userData?.name || userRecord.displayName || 'Master User',
      role: 'master',
      createdAt: userData?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }, { merge: true });

    // Definir custom claims
    console.log('Definindo custom claims...');
    await auth.setCustomUserClaims(userId, { role: 'master' });

    return NextResponse.json({
      success: true,
      message: 'Usuário configurado como MASTER com sucesso!',
      userId: userId,
      email: email,
      instruction: 'Faça logout e login novamente para aplicar as permissões.'
    });

  } catch (error: any) {
    console.error('Erro ao configurar MASTER:', error);
    return NextResponse.json({ 
      error: 'Erro ao configurar MASTER',
      details: error.message 
    }, { status: 500 });
  }
}

/**
 * GET endpoint para verificar se já existe um MASTER
 */
export async function GET() {
  try {
    const app = initializeFirebaseAdmin();
    const db = getFirestore(app);

    const mastersSnapshot = await db.collection('roles_master').limit(1).get();
    
    return NextResponse.json({
      hasMaster: !mastersSnapshot.empty,
      count: mastersSnapshot.size
    });
  } catch (error: any) {
    console.error('Erro ao verificar MASTER:', error);
    return NextResponse.json({ 
      error: 'Erro ao verificar MASTER',
      details: error.message 
    }, { status: 500 });
  }
}
