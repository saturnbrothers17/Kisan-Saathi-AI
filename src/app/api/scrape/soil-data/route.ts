// Server-side API route for soil data scraping
import { NextRequest, NextResponse } from 'next/server';
import { integratedScraperService } from '@/lib/scrapers/integrated-scraper-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const state = searchParams.get('state') || 'Uttar Pradesh';
    const district = searchParams.get('district') || 'Varanasi';

    console.log(`🌱 Scraping soil data for ${district}, ${state}`);

    // Initialize scraper service
    await integratedScraperService.initialize();

    // Get soil data
    const soilData = await integratedScraperService.scrapeSoilData(state, district);

    if (soilData) {
      const response = {
        success: true,
        data: {
          soilType: soilData.soilType,
          ph: soilData.ph,
          organicCarbon: soilData.organicCarbon,
          nutrients: {
            nitrogen: soilData.nitrogen,
            phosphorus: soilData.phosphorus,
            potassium: soilData.potassium
          },
          recommendations: soilData.recommendations || [],
          fertilizers: [
            soilData.nitrogen < 280 ? 'Apply nitrogen fertilizer (Urea)' : null,
            soilData.phosphorus < 11 ? 'Apply phosphorus fertilizer (DAP)' : null,
            soilData.potassium < 120 ? 'Apply potassium fertilizer (MOP)' : null
          ].filter(Boolean),
          amendments: [
            soilData.ph < 6.5 ? 'Apply lime to increase pH' : null,
            soilData.ph > 8.5 ? 'Apply gypsum to decrease pH' : null,
            soilData.organicCarbon < 0.5 ? 'Add organic matter (compost/FYM)' : null
          ].filter(Boolean),
          testingAdvice: 'Test soil every 2-3 years for optimal crop management',
          scrapedAt: new Date().toISOString(),
          source: 'real-time-scraping'
        }
      };

      console.log('✅ Successfully scraped soil data');
      return NextResponse.json(response);
    }

    // Fallback soil data
    const fallbackResponse = {
      success: true,
      data: {
        soilType: 'Alluvial',
        ph: 7.2,
        organicCarbon: 0.65,
        nutrients: {
          nitrogen: 320,
          phosphorus: 15,
          potassium: 180
        },
        recommendations: ['Soil health is good', 'Continue organic practices'],
        fertilizers: ['Apply balanced NPK fertilizers'],
        amendments: ['Add organic matter regularly'],
        testingAdvice: 'Test soil every 2-3 years',
        scrapedAt: new Date().toISOString(),
        source: 'fallback-data'
      }
    };

    console.log('⚠️ Using fallback soil data');
    return NextResponse.json(fallbackResponse);

  } catch (error) {
    console.error('❌ Error in soil data scraping API:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to scrape soil data',
      message: (error as Error).message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
