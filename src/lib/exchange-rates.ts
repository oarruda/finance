// Server action para buscar taxas de câmbio usando EODHD API
'use server';



import { getServerSdks } from '@/firebase/server';
import { getUserSettings } from '@/lib/user-settings';

// Busca a API key do usuário MASTER (primeiro master encontrado)
async function getMasterExchangeRateApiKey() {
  const { firestore } = getServerSdks();
  // Busca o primeiro documento em roles_master
  const mastersSnap = await firestore.collection('roles_master').listDocuments();
  if (!mastersSnap.length) return null;
  const masterId = mastersSnap[0].id;
  const userSettings = await getUserSettings(firestore, masterId);
  return userSettings?.data?.exchangeRateApiKey || null;
}

export async function getExchangeRates() {
  try {
    const apiKey = await getMasterExchangeRateApiKey();
    if (!apiKey) throw new Error('API de taxa de câmbio não configurada.');

    // Buscar taxas BRL/EUR e BRL/USD da EODHD
    const [brlEurResponse, brlUsdResponse] = await Promise.all([
      fetch(`https://eodhd.com/api/real-time/BRLEUR.FOREX?api_token=${apiKey}&fmt=json`, {
        next: { revalidate: 300 }
      }),
      fetch(`https://eodhd.com/api/real-time/BRLUSD.FOREX?api_token=${apiKey}&fmt=json`, {
        next: { revalidate: 300 }
      })
    ]);

    if (!brlEurResponse.ok || !brlUsdResponse.ok) {
      throw new Error('Failed to fetch exchange rates from EODHD');
    }

    const brlEurData = await brlEurResponse.json();
    const brlUsdData = await brlUsdResponse.json();

    const brlEurRate = brlEurData.close || brlEurData.previousClose || 0.17;
    const brlUsdRate = brlUsdData.close || brlUsdData.previousClose || 0.19;

    return {
      success: true,
      rates: {
        BRL_EUR: brlEurRate,
        BRL_USD: brlUsdRate,
        EUR_BRL: 1 / brlEurRate,
        USD_BRL: 1 / brlUsdRate,
      },
      timestamp: brlEurData.timestamp || Date.now(),
    };
  } catch (error) {
    console.error('Error fetching exchange rates from EODHD:', error);

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
