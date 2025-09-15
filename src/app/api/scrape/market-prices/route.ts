// Server-side API route for market price data - redirects to new scraping endpoint
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cropType = searchParams.get('cropType') || 'Rice';
    const state = searchParams.get('state') || 'Uttar Pradesh';
    const market = searchParams.get('market') || undefined;

    console.log(`💰 Redirecting to new agmarknet scraper for ${cropType} in ${state}${market ? ` (${market})` : ''}`);

    // Redirect to the new scraping endpoint
    const scrapingUrl = new URL('/api/scrape/agmarknet-prices', request.url);
    scrapingUrl.searchParams.set('cropType', cropType);
    scrapingUrl.searchParams.set('state', state);
    if (market) scrapingUrl.searchParams.set('market', market);

    const response = await fetch(scrapingUrl.toString());
    const data = await response.json();

    return NextResponse.json(data);

  } catch (error) {
    console.error('❌ Error in market price API:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch market price data',
      message: (error as Error).message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { cropType = 'Rice', state = 'Uttar Pradesh', market } = body;

    console.log(`🔄 Force refreshing agmarknet prices for ${cropType} in ${state}`);

    // Redirect to the new scraping endpoint with POST method
    const scrapingUrl = new URL('/api/scrape/agmarknet-prices', request.url);
    const response = await fetch(scrapingUrl.toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cropType, state, market })
    });

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('❌ Error refreshing market prices:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to refresh market price data',
      message: (error as Error).message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
