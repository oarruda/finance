import { NextRequest, NextResponse } from 'next/server';
import { getServerSdks } from '@/firebase/server';
import { firebaseConfig } from '@/firebase/config';

export async function POST(request: NextRequest) {
  try {
    // Inicializar Firebase Admin
    const { auth } = getServerSdks();

    // Obter token do header para verificar autenticação
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    
    // Verificar autenticação usando Admin SDK
    const decodedToken = await auth.verifyIdToken(token);
    console.log('Admin autenticado:', decodedToken.email);

    // Obter dados do body
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ 
        error: 'email é obrigatório' 
      }, { status: 400 });
    }

    console.log('========================================');
    console.log('🗑️  Deletando usuário órfão do Auth');
    console.log('Email:', email);
    console.log('========================================');

    // Buscar usuário por email
    let userRecord;
    try {
      userRecord = await auth.getUserByEmail(email);
      console.log('Usuário encontrado no Auth:', userRecord.uid);
    } catch (error: any) {
      console.log('Usuário não encontrado no Auth');
      return NextResponse.json({ 
        success: true,
        message: 'Usuário não existe no Auth' 
      });
    }

    // Deletar do Firebase Authentication
    try {
      await auth.deleteUser(userRecord.uid);
      console.log('✅ Usuário órfão deletado do Authentication');
    } catch (authError: any) {
      console.error('❌ Erro ao deletar do Authentication:', authError.message);
      return NextResponse.json({ 
        error: 'Erro ao deletar usuário: ' + authError.message 
      }, { status: 500 });
    }

    console.log('========================================');
    console.log('🎉 USUÁRIO ÓRFÃO DELETADO COM SUCESSO');
    console.log('Email:', email);
    console.log('========================================');

    return NextResponse.json({ 
      success: true,
      message: 'Usuário órfão deletado com sucesso'
    });

  } catch (error: any) {
    console.error('========================================');
    console.error('💥 ERRO NA DELEÇÃO');
    console.error('Mensagem:', error.message);
    console.error('Stack:', error.stack);
    console.error('========================================');
    
    return NextResponse.json({ 
      error: 'Erro ao deletar usuário órfão: ' + error.message 
    }, { status: 500 });
  }
}
