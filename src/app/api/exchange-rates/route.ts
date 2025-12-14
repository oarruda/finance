import { getExchangeRates } from '@/lib/exchange-rates';
import { NextResponse } from 'next/server';

export const dynamic = 'force-static';

export async function GET() {
  try {
    const data = await getExchangeRates();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching exchange rates:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch exchange rates' },
      { status: 500 }
    );
  }
}
