// Server action para buscar taxas de câmbio usando EODHD API
'use server';



import { getServerSdks } from '@/firebase/server';
import { getUserSettings } from '@/lib/user-settings';

// Busca a API key de taxa de câmbio de qualquer usuário MASTER que tenha configurado
async function getMasterExchangeRateApiKey() {
  const { firestore } = getServerSdks();
  
  console.log('🔍 Buscando API key de taxa de câmbio...');
  
  // Busca todos os documentos em roles_master
  const mastersSnap = await firestore.collection('roles_master').listDocuments();
  console.log('📋 Masters encontrados:', mastersSnap.length);
  
  if (!mastersSnap.length) {
    console.log('❌ Nenhum usuário MASTER encontrado');
    return null;
  }
  
  // Verifica todos os masters até encontrar um com API key configurada
  for (const masterDoc of mastersSnap) {
    const masterId = masterDoc.id;
    console.log('🔍 Verificando Master ID:', masterId);
    
    const userSettings = await getUserSettings(firestore, masterId);
    
    if (userSettings?.success && userSettings?.data?.exchangeRateApiKey) {
      console.log('✅ API key encontrada no usuário:', userSettings.data.email || masterId);
      console.log('🔑 API key:', userSettings.data.exchangeRateApiKey.substring(0, 8) + '...');
      return userSettings.data.exchangeRateApiKey;
    } else {
      console.log('⏭️  Usuário sem API key configurada');
    }
  }
  
  console.log('❌ Nenhum usuário MASTER tem API key configurada');
  return null;
}

export async function getExchangeRates() {
  try {
    const apiKey = await getMasterExchangeRateApiKey();
    
    if (!apiKey) {
      console.log('❌ API key não encontrada, usando valores fallback');
      throw new Error('API de taxa de câmbio não configurada.');
    }
    
    console.log('✅ API key encontrada:', apiKey.substring(0, 8) + '...');
    console.log('🌐 Buscando taxas de câmbio da ExchangeRate-API...');

    // Buscar taxas usando ExchangeRate-API (base BRL)
    const response = await fetch(
      `https://v6.exchangerate-api.com/v6/${apiKey}/latest/BRL`,
      { next: { revalidate: 3600 } } // Cache por 1 hora
    );

    console.log('📡 Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erro na resposta da API:', errorText);
      throw new Error(`Failed to fetch exchange rates: ${response.status}`);
    }

    const data = await response.json();
    console.log('📊 Dados recebidos:', data.result, data.time_last_update_utc);

    if (data.result !== 'success') {
      console.error('❌ API retornou erro:', data['error-type']);
      throw new Error('API returned error: ' + data['error-type']);
    }

    const rates = data.conversion_rates;
    
    // BRL para outras moedas
    const brlToEur = rates.EUR || 0.17;
    const brlToUsd = rates.USD || 0.19;

    console.log('✅ Taxas obtidas - BRL→EUR:', brlToEur, 'BRL→USD:', brlToUsd);

    return {
      success: true,
      rates: {
        BRL_EUR: brlToEur,
        BRL_USD: brlToUsd,
        EUR_BRL: 1 / brlToEur,
        USD_BRL: 1 / brlToUsd,
      },
      timestamp: data.time_last_update_unix * 1000,
    };
  } catch (error) {
    console.error('❌ Error fetching exchange rates:', error);

    // Retornar valores fallback em caso de erro
    return {
      success: false,
      rates: {
        BRL_EUR: 0.17,
        BRL_USD: 0.19,
        EUR_BRL: 5.88,
        USD_BRL: 5.26,
      },
      timestamp: Date.now(),
    };
  }
}
