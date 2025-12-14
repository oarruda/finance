import { NextRequest, NextResponse } from 'next/server';

/**
 * API para configurar o primeiro usuário MASTER
 * NOTA: Esta API foi simplificada para usar client-side operations
 * Use a página /setup-master diretamente
 */
export async function POST(request: NextRequest) {
  return NextResponse.json({ 
    error: 'Use a interface /setup-master para configurar o usuário MASTER',
    redirect: '/setup-master'
  }, { status: 400 });
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Use a interface /setup-master',
    hasMaster: false
  });
}
