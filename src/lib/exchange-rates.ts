// Server action para buscar taxas de câmbio usando EODHD API
'use server';

const EODHD_API_KEY = '6920bc5ddacb74.95857695';

export async function getExchangeRates() {
  try {
    // Buscar taxas BRL/EUR e BRL/USD da EODHD
    const [brlEurResponse, brlUsdResponse] = await Promise.all([
      fetch(`https://eodhd.com/api/real-time/BRLEUR.FOREX?api_token=${EODHD_API_KEY}&fmt=json`, {
        next: { revalidate: 300 } // Cache por 5 minutos
      }),
      fetch(`https://eodhd.com/api/real-time/BRLUSD.FOREX?api_token=${EODHD_API_KEY}&fmt=json`, {
        next: { revalidate: 300 } // Cache por 5 minutos
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
