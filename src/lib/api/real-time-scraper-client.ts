// Client-side API calls to server-side scraping endpoints
// This replaces direct scraping calls with HTTP requests to our API routes

export interface ScrapedCropData {
  name: string;
  variety: string;
  plantingDate: string;
  currentStage: {
    name: string;
    duration: string;
    currentDay: number;
    totalDays: number;
    activities: string[];
    weatherRequirements: string;
    risks: string[];
  };
  nextStage: string;
  harvestDate: string;
  weatherSuitability: 'excellent' | 'good' | 'fair' | 'poor';
  recommendations: string[];
  alerts: string[];
  marketPrice: string;
  expectedYield: string;
  profitEstimate: string;
  scrapedAt: string;
  source: string;
}

export interface ScrapedMarketPrice {
  commodity: string;
  commodityHindi: string;
  market: string;
  state: string;
  modalPrice: number;
  minPrice: number;
  maxPrice: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  date: string;
  priceChange: number;
  recommendation: string;
}

export interface ScrapedWeatherData {
  currentWeather: {
    temperature: number;
    humidity: number;
    rainfall: number;
    windSpeed: number;
    pressure: number;
    visibility: number;
  };
  forecast: string[];
  cropAdvisory: string[];
  irrigationAdvice: string;
  pestRisk: 'Low' | 'Medium' | 'High';
  diseaseRisk: 'Low' | 'Medium' | 'High';
  fieldActivities: string[];
  scrapedAt: string;
  source: string;
}

export interface ScrapedSoilData {
  soilType: string;
  ph: number;
  organicCarbon: number;
  nutrients: {
    nitrogen: number;
    phosphorus: number;
    potassium: number;
  };
  recommendations: string[];
  fertilizers: string[];
  amendments: string[];
  testingAdvice: string;
  scrapedAt: string;
  source: string;
}

export class RealTimeScraperClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:9002';
  }

  // Get real-time crop data
  async getCropData(lat: number, lon: number, cropType: string = 'Rice'): Promise<ScrapedCropData> {
    try {
      console.log(`🌾 Fetching real-time crop data for ${cropType} at ${lat}, ${lon}`);
      
      const response = await fetch(
        `${this.baseUrl}/api/scrape/crop-data?lat=${lat}&lon=${lon}&cropType=${encodeURIComponent(cropType)}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          cache: 'no-store' // Always get fresh data
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        console.log(`✅ Successfully fetched crop data from ${result.data.source}`);
        return result.data;
      } else {
        throw new Error(result.error || 'Failed to fetch crop data');
      }
    } catch (error) {
      console.error('❌ Error fetching crop data:', error);
      throw error;
    }
  }

  // Get real-time market prices
  async getMarketPrices(cropType: string = 'Rice', state: string = 'Uttar Pradesh'): Promise<ScrapedMarketPrice[]> {
    try {
      console.log(`💰 Fetching real-time market prices for ${cropType} in ${state}`);
      
      const response = await fetch(
        `${this.baseUrl}/api/scrape/market-prices?cropType=${encodeURIComponent(cropType)}&state=${encodeURIComponent(state)}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          cache: 'no-store'
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        console.log(`✅ Successfully fetched ${result.data.length} market prices from ${result.source}`);
        return result.data;
      } else {
        throw new Error(result.error || 'Failed to fetch market prices');
      }
    } catch (error) {
      console.error('❌ Error fetching market prices:', error);
      throw error;
    }
  }

  // Get real-time weather data
  async getWeatherData(lat: number, lon: number, location: string = 'Current Location'): Promise<ScrapedWeatherData> {
    try {
      console.log(`🌤️ Fetching real-time weather data for ${location} at ${lat}, ${lon}`);
      
      const response = await fetch(
        `${this.baseUrl}/api/scrape/weather-data?lat=${lat}&lon=${lon}&location=${encodeURIComponent(location)}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          cache: 'no-store'
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        console.log(`✅ Successfully fetched weather data from ${result.data.source}`);
        return result.data;
      } else {
        throw new Error(result.error || 'Failed to fetch weather data');
      }
    } catch (error) {
      console.error('❌ Error fetching weather data:', error);
      throw error;
    }
  }

  // Get real-time soil data
  async getSoilData(state: string = 'Uttar Pradesh', district: string = 'Varanasi'): Promise<ScrapedSoilData> {
    try {
      console.log(`🌱 Fetching real-time soil data for ${district}, ${state}`);
      
      const response = await fetch(
        `${this.baseUrl}/api/scrape/soil-data?state=${encodeURIComponent(state)}&district=${encodeURIComponent(district)}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          cache: 'no-store'
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        console.log(`✅ Successfully fetched soil data from ${result.data.source}`);
        return result.data;
      } else {
        throw new Error(result.error || 'Failed to fetch soil data');
      }
    } catch (error) {
      console.error('❌ Error fetching soil data:', error);
      throw error;
    }
  }

  // Force refresh all data (POST requests for fresh scraping)
  async forceRefreshCropData(lat: number, lon: number, cropType: string): Promise<ScrapedCropData> {
    try {
      console.log(`🔄 Force refreshing crop data for ${cropType}`);
      
      const response = await fetch(`${this.baseUrl}/api/scrape/crop-data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ lat, lon, cropType }),
        cache: 'no-store'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        console.log(`✅ Successfully force refreshed crop data`);
        return result.data;
      } else {
        throw new Error(result.error || 'Failed to force refresh crop data');
      }
    } catch (error) {
      console.error('❌ Error force refreshing crop data:', error);
      throw error;
    }
  }

  async forceRefreshMarketPrices(cropType: string, state: string): Promise<ScrapedMarketPrice[]> {
    try {
      console.log(`🔄 Force refreshing market prices for ${cropType}`);
      
      const response = await fetch(`${this.baseUrl}/api/scrape/market-prices`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cropType, state }),
        cache: 'no-store'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        console.log(`✅ Successfully force refreshed market prices`);
        return result.data;
      } else {
        throw new Error(result.error || 'Failed to force refresh market prices');
      }
    } catch (error) {
      console.error('❌ Error force refreshing market prices:', error);
      throw error;
    }
  }

  // Get comprehensive agricultural data (combines all sources)
  async getComprehensiveAgriculturalData(lat: number, lon: number, cropType: string, state?: string, district?: string) {
    try {
      console.log(`📊 Fetching comprehensive agricultural data for ${cropType}`);
      
      const [cropData, marketPrices, weatherData, soilData] = await Promise.allSettled([
        this.getCropData(lat, lon, cropType),
        this.getMarketPrices(cropType, state),
        this.getWeatherData(lat, lon),
        this.getSoilData(state, district)
      ]);

      return {
        cropData: cropData.status === 'fulfilled' ? cropData.value : null,
        marketPrices: marketPrices.status === 'fulfilled' ? marketPrices.value : [],
        weatherData: weatherData.status === 'fulfilled' ? weatherData.value : null,
        soilData: soilData.status === 'fulfilled' ? soilData.value : null,
        timestamp: new Date().toISOString(),
        errors: [
          cropData.status === 'rejected' ? `Crop data: ${cropData.reason}` : null,
          marketPrices.status === 'rejected' ? `Market prices: ${marketPrices.reason}` : null,
          weatherData.status === 'rejected' ? `Weather data: ${weatherData.reason}` : null,
          soilData.status === 'rejected' ? `Soil data: ${soilData.reason}` : null
        ].filter(Boolean)
      };
    } catch (error) {
      console.error('❌ Error fetching comprehensive agricultural data:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const realTimeScraperClient = new RealTimeScraperClient();
