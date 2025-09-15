// Server-side API route for weather data scraping
import { NextRequest, NextResponse } from 'next/server';
import { integratedScraperService } from '@/lib/scrapers/integrated-scraper-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = parseFloat(searchParams.get('lat') || '25.3176');
    const lon = parseFloat(searchParams.get('lon') || '82.9739');
    const location = searchParams.get('location') || 'Current Location';

    console.log(`🌤️ Scraping weather data for ${location} at ${lat}, ${lon}`);

    // Initialize scraper service
    await integratedScraperService.initialize();

    // Get weather data
    const weatherData = await integratedScraperService.scrapeWeatherData(lat, lon, location);

    if (weatherData) {
      const response = {
        success: true,
        data: {
          currentWeather: {
            temperature: weatherData.temperature,
            humidity: weatherData.humidity,
            rainfall: weatherData.rainfall,
            windSpeed: weatherData.windSpeed,
            pressure: weatherData.pressure,
            visibility: weatherData.visibility
          },
          forecast: weatherData.forecast || [],
          cropAdvisory: [
            weatherData.rainfall > 50 ? 'Heavy rainfall - ensure proper drainage' : 'Normal rainfall conditions',
            weatherData.temperature > 35 ? 'High temperature - increase irrigation' : 'Temperature within normal range',
            weatherData.humidity > 85 ? 'High humidity - monitor for fungal diseases' : 'Humidity levels are acceptable'
          ].filter(advice => advice.includes('Heavy') || advice.includes('High') || advice.includes('normal')),
          irrigationAdvice: weatherData.rainfall > 25 ? 'Reduce irrigation due to sufficient rainfall' : 
                           weatherData.temperature > 35 ? 'Increase irrigation frequency' : 
                           'Apply irrigation as per crop requirement',
          pestRisk: weatherData.humidity > 80 && weatherData.temperature > 25 ? 'High' : 
                   weatherData.humidity > 70 ? 'Medium' : 'Low',
          diseaseRisk: weatherData.humidity > 85 ? 'High' : 
                      weatherData.humidity > 75 ? 'Medium' : 'Low',
          fieldActivities: [
            weatherData.rainfall < 10 ? 'Plan irrigation schedule' : 'Check field drainage',
            weatherData.temperature > 30 ? 'Apply mulching to conserve moisture' : 'Regular field monitoring'
          ],
          scrapedAt: new Date().toISOString(),
          source: 'real-time-scraping'
        }
      };

      console.log('✅ Successfully scraped weather data');
      return NextResponse.json(response);
    }

    // Fallback weather data
    const fallbackResponse = {
      success: true,
      data: {
        currentWeather: {
          temperature: 28,
          humidity: 70,
          rainfall: 5,
          windSpeed: 8,
          pressure: 1013,
          visibility: 10
        },
        forecast: ['Partly cloudy', 'Light rain expected'],
        cropAdvisory: ['Weather conditions are favorable for crop growth'],
        irrigationAdvice: 'Apply irrigation as per crop requirement',
        pestRisk: 'Low',
        diseaseRisk: 'Low',
        fieldActivities: ['Regular monitoring', 'Apply fertilizers as needed'],
        scrapedAt: new Date().toISOString(),
        source: 'fallback-data'
      }
    };

    console.log('⚠️ Using fallback weather data');
    return NextResponse.json(fallbackResponse);

  } catch (error) {
    console.error('❌ Error in weather data scraping API:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to scrape weather data',
      message: (error as Error).message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
