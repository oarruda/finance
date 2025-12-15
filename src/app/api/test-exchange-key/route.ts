import { NextResponse } from 'next/server';
import { getServerSdks } from '@/firebase/server';
import { getUserSettings } from '@/lib/user-settings';

export async function GET() {
  try {
    const { firestore } = getServerSdks();
    
    // Busca o primeiro documento em roles_master
    const mastersSnap = await firestore.collection('roles_master').listDocuments();
    
    if (!mastersSnap.length) {
      return NextResponse.json({
        error: 'Nenhum usuário MASTER encontrado',
        mastersCount: 0
      });
    }
    
    const masterId = mastersSnap[0].id;
    console.log('🔍 Master ID:', masterId);
    
    // Buscar documento diretamente
    const userDoc = await firestore.collection('users').doc(masterId).get();
    const userData = userDoc.data();
    
    console.log('📄 Dados do usuário:', {
      exists: userDoc.exists,
      email: userData?.email,
      hasExchangeRateApiKey: !!userData?.exchangeRateApiKey,
      exchangeRateApiKeyPreview: userData?.exchangeRateApiKey ? 
        `${userData.exchangeRateApiKey.substring(0, 8)}...` : 'NÃO DEFINIDA'
    });
    
    // Testar getUserSettings
    const userSettings = await getUserSettings(firestore, masterId);
    
    console.log('📋 User Settings:', {
      success: userSettings?.success,
      hasData: !!userSettings?.data,
      hasExchangeRateApiKey: !!userSettings?.data?.exchangeRateApiKey,
      exchangeRateApiKeyPreview: userSettings?.data?.exchangeRateApiKey ?
        `${userSettings.data.exchangeRateApiKey.substring(0, 8)}...` : 'NÃO DEFINIDA'
    });
    
    return NextResponse.json({
      masterId,
      userExists: userDoc.exists,
      directAccess: {
        email: userData?.email,
        hasExchangeRateApiKey: !!userData?.exchangeRateApiKey,
        exchangeRateApiKeyPreview: userData?.exchangeRateApiKey ? 
          `${userData.exchangeRateApiKey.substring(0, 8)}...` : 'NÃO DEFINIDA'
      },
      viaGetUserSettings: {
        success: userSettings?.success,
        hasData: !!userSettings?.data,
        hasExchangeRateApiKey: !!userSettings?.data?.exchangeRateApiKey,
        exchangeRateApiKeyPreview: userSettings?.data?.exchangeRateApiKey ?
          `${userSettings.data.exchangeRateApiKey.substring(0, 8)}...` : 'NÃO DEFINIDA'
      }
    });
  } catch (error: any) {
    console.error('❌ Erro:', error);
    return NextResponse.json({
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
