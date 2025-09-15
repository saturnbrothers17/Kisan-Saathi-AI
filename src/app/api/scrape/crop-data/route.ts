// Server-side API route for crop data scraping
import { NextRequest, NextResponse } from 'next/server';
import { integratedScraperService } from '@/lib/scrapers/integrated-scraper-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = parseFloat(searchParams.get('lat') || '25.3176');
    const lon = parseFloat(searchParams.get('lon') || '82.9739');
    const cropType = searchParams.get('cropType') || 'Rice';

    console.log(`🌾 Scraping crop data for ${cropType} at ${lat}, ${lon}`);

    // Initialize scraper service
    await integratedScraperService.initialize();

    // Get comprehensive agricultural data
    const scrapedData = await integratedScraperService.getAgriculturalData(lat, lon, cropType);

    if (scrapedData && scrapedData.crops && scrapedData.crops.length > 0) {
      const cropInfo = scrapedData.crops[0];
      
      const response = {
        success: true,
        data: {
          name: cropInfo.cropName || cropType,
          variety: cropInfo.variety || 'Local variety',
          plantingDate: cropInfo.sowingPeriod || 'Season dependent',
          currentStage: {
            name: 'Current Growth Stage',
            duration: '30-45 days',
            currentDay: 30,
            totalDays: 120,
            activities: cropInfo.recommendations || ['Monitor crop health', 'Apply fertilizers as needed'],
            weatherRequirements: 'Optimal weather conditions',
            risks: ['Pest monitoring required', 'Weather dependency']
          },
          nextStage: 'Next growth phase',
          harvestDate: cropInfo.harvestPeriod || 'Season dependent',
          weatherSuitability: 'good' as const,
          recommendations: cropInfo.recommendations || [],
          alerts: [],
          marketPrice: scrapedData.prices?.[0]?.modalPrice ? `₹${scrapedData.prices[0].modalPrice}/quintal` : '₹2200/quintal',
          expectedYield: cropInfo.expectedYield || '40-60 quintals/hectare',
          profitEstimate: scrapedData.prices?.[0]?.modalPrice ? `₹${Math.round(scrapedData.prices[0].modalPrice * 0.3)}/acre` : '₹660/acre',
          scrapedAt: new Date().toISOString(),
          source: 'real-time-scraping'
        }
      };

      console.log('✅ Successfully scraped crop data:', response.data.name);
      return NextResponse.json(response);
    }

    // If no scraped data, return structured fallback
    const fallbackResponse = {
      success: true,
      data: {
        name: cropType,
        variety: 'Local variety',
        plantingDate: 'Season dependent',
        currentStage: {
          name: 'Vegetative Stage',
          duration: '30-45 days',
          currentDay: 30,
          totalDays: 120,
          activities: ['Monitor crop health', 'Apply fertilizers as needed', 'Ensure proper irrigation'],
          weatherRequirements: 'Moderate temperature and humidity',
          risks: ['Pest monitoring required', 'Weather dependency']
        },
        nextStage: 'Reproductive Stage',
        harvestDate: 'Season dependent',
        weatherSuitability: 'good' as const,
        recommendations: [
          'Apply balanced NPK fertilizers',
          'Monitor for pest and disease symptoms',
          'Maintain proper water levels',
          'Follow integrated pest management'
        ],
        alerts: [],
        marketPrice: '₹2200/quintal',
        expectedYield: '40-60 quintals/hectare',
        profitEstimate: '₹660/acre',
        scrapedAt: new Date().toISOString(),
        source: 'fallback-data'
      }
    };

    console.log('⚠️ Using fallback data for crop:', cropType);
    return NextResponse.json(fallbackResponse);

  } catch (error) {
    console.error('❌ Error in crop data scraping API:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to scrape crop data',
      message: (error as Error).message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { lat, lon, cropType } = body;

    console.log(`🌾 POST: Scraping crop data for ${cropType} at ${lat}, ${lon}`);

    // Initialize scraper service
    await integratedScraperService.initialize();

    // Force refresh and get new data
    await integratedScraperService.forceRefresh();
    const scrapedData = await integratedScraperService.getAgriculturalData(lat, lon, cropType);

    if (scrapedData && scrapedData.crops && scrapedData.crops.length > 0) {
      const cropInfo = scrapedData.crops[0];
      
      const response = {
        success: true,
        data: {
          name: cropInfo.cropName || cropType,
          variety: cropInfo.variety || 'Local variety',
          plantingDate: cropInfo.sowingPeriod || 'Season dependent',
          harvestDate: cropInfo.harvestPeriod || 'Season dependent',
          expectedYield: cropInfo.expectedYield || '40-60 quintals/hectare',
          recommendations: cropInfo.recommendations || [],
          marketPrice: scrapedData.prices?.[0]?.modalPrice || 2200,
          scrapedAt: new Date().toISOString(),
          source: 'real-time-scraping-fresh'
        }
      };

      return NextResponse.json(response);
    }

    return NextResponse.json({
      success: false,
      error: 'No crop data found',
      timestamp: new Date().toISOString()
    }, { status: 404 });

  } catch (error) {
    console.error('❌ Error in POST crop data scraping:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to scrape crop data',
      message: (error as Error).message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
