// Integrated Scraper Service - Combines all scraping functionality
// Main service that replaces API keys with web scraping

import { agriculturalScraper } from './agricultural-web-scraper';
import { scraperScheduler } from './scraper-scheduler';
import { proxyScraper } from './proxy-scraper';
import * as cheerio from 'cheerio';

export interface ScrapedAgriculturalData {
  crops: any[];
  prices: any[];
  weather: any;
  soil: any;
  calendar: any;
  lastUpdated: string;
}

export class IntegratedScraperService {
  private isInitialized = false;

  async initialize() {
    if (this.isInitialized) return;

    console.log('🚀 Initializing Agricultural Web Scraping System...');
    
    // Start the scheduler for automated data collection
    scraperScheduler.start();
    
    // Run initial data collection
    await this.performInitialScraping();
    
    this.isInitialized = true;
    console.log('✅ Agricultural Web Scraping System initialized');
  }

  private async performInitialScraping() {
    try {
      console.log('📊 Performing initial data scraping...');
      
      // Scrape essential data immediately
      const promises = [
        this.scrapeCropData('Uttar Pradesh', 'Rice'),
        this.scrapeMarketPrices('Rice'),
        this.scrapeWeatherData(25.3176, 82.9739, 'Varanasi'),
        this.scrapeSoilData('Uttar Pradesh', 'Varanasi'),
        this.scrapeCropCalendar('Uttar Pradesh', 'Rice')
      ];

      await Promise.allSettled(promises);
      console.log('✅ Initial data scraping completed');
    } catch (error) {
      console.error('❌ Initial scraping failed:', error);
    }
  }

  // Main method to get comprehensive agricultural data
  async getAgriculturalData(lat: number, lon: number, cropType?: string): Promise<ScrapedAgriculturalData> {
    try {
      const state = this.getStateFromCoordinates(lat, lon);
      const district = this.getDistrictFromCoordinates(lat, lon);
      const crop = cropType || 'Rice';

      // Try to get fresh data, fallback to cached
      const [crops, prices, weather, soil, calendar] = await Promise.allSettled([
        this.scrapeCropData(state, crop),
        this.scrapeMarketPrices(crop, state),
        this.scrapeWeatherData(lat, lon, district),
        this.scrapeSoilData(state, district),
        this.scrapeCropCalendar(state, crop)
      ]);

      return {
        crops: crops.status === 'fulfilled' ? crops.value : [],
        prices: prices.status === 'fulfilled' ? prices.value : [],
        weather: weather.status === 'fulfilled' ? weather.value : null,
        soil: soil.status === 'fulfilled' ? soil.value : null,
        calendar: calendar.status === 'fulfilled' ? calendar.value : null,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Failed to get agricultural data:', error);
      return this.getFallbackData();
    }
  }

  // Individual scraping methods with enhanced error handling
  async scrapeCropData(state: string, crop: string): Promise<any[]> {
    try {
      // Try scheduler cache first
      const cached = scraperScheduler.getCachedData('icar-crops');
      if (cached) return cached;

      // Scrape fresh data
      return await agriculturalScraper.scrapeICARData(state, crop);
    } catch (error) {
      console.error('Crop data scraping failed:', error);
      return this.getFallbackCropData(state, crop);
    }
  }

  async scrapeMarketPrices(commodity: string, state?: string): Promise<any[]> {
    try {
      const cached = scraperScheduler.getCachedData('mandi-prices');
      if (cached) return cached;

      return await agriculturalScraper.scrapeMandiPrices(state, commodity);
    } catch (error) {
      console.error('Market price scraping failed:', error);
      return this.getFallbackMarketPrices(commodity);
    }
  }

  async scrapeWeatherData(lat: number, lon: number, location: string): Promise<any> {
    try {
      const cached = scraperScheduler.getCachedData('weather-data');
      if (cached) return cached;

      return await agriculturalScraper.scrapeWeatherData(lat, lon, location);
    } catch (error) {
      console.error('Weather data scraping failed:', error);
      return this.getFallbackWeatherData(location);
    }
  }

  async scrapeSoilData(state: string, district: string): Promise<any> {
    try {
      const cached = scraperScheduler.getCachedData('soil-health');
      if (cached) return cached;

      return await agriculturalScraper.scrapeSoilHealthData(state, district);
    } catch (error) {
      console.error('Soil data scraping failed:', error);
      return this.getFallbackSoilData(state, district);
    }
  }

  async scrapeCropCalendar(state: string, crop: string): Promise<any> {
    try {
      const cached = scraperScheduler.getCachedData('crop-calendar');
      if (cached) return cached;

      return await agriculturalScraper.scrapeCropCalendar(state, crop);
    } catch (error) {
      console.error('Crop calendar scraping failed:', error);
      return this.getFallbackCropCalendar(state, crop);
    }
  }

  // Enhanced scraping with multiple sources
  async scrapeMultipleSources(category: string, params: any): Promise<any> {
    const sources = this.getSourcesForCategory(category);
    const results = [];

    for (const source of sources) {
      try {
        const data = await this.scrapeFromSource(source, params);
        if (data && this.validateData(data, category)) {
          results.push(data);
        }
      } catch (error) {
        console.log(`Failed to scrape from ${source.name}:`, error);
        continue;
      }
    }

    return this.mergeResults(results, category);
  }

  private getSourcesForCategory(category: string): any[] {
    const sourceMap: {[key: string]: any[]} = {
      'crops': [
        { name: 'ICAR', url: 'https://icar.org.in', priority: 1 },
        { name: 'Krishi Vigyan Kendra', url: 'https://kvk.icar.gov.in', priority: 2 },
        { name: 'Agriculture Department', url: 'https://agriculture.gov.in', priority: 3 }
      ],
      'prices': [
        { name: 'AgMarkNet', url: 'https://agmarknet.gov.in', priority: 1 },
        { name: 'eNAM', url: 'https://enam.gov.in', priority: 2 },
        { name: 'mKisan', url: 'https://mkisan.gov.in', priority: 3 }
      ],
      'weather': [
        { name: 'IMD', url: 'https://mausam.imd.gov.in', priority: 1 },
        { name: 'Skymet', url: 'https://skymetweather.com', priority: 2 },
        { name: 'Weather.com', url: 'https://weather.com', priority: 3 }
      ]
    };

    return sourceMap[category] || [];
  }

  private async scrapeFromSource(source: any, params: any): Promise<any> {
    const url = this.buildSourceUrl(source, params);
    
    return await proxyScraper.scrapeWithRetry(url, (html) => {
      return this.parseSourceData(html, source.name, params);
    });
  }

  private buildSourceUrl(source: any, params: any): string {
    // Build specific URLs based on source and parameters
    const baseUrl = source.url;
    
    switch (source.name) {
      case 'ICAR':
        return `${baseUrl}/content/crop-production-${params.crop?.toLowerCase() || 'rice'}`;
      case 'AgMarkNet':
        return `${baseUrl}/SearchCmmMkt.aspx?Tx_Commodity=${params.commodity || 'Rice'}&Tx_State=${params.state || ''}`;
      case 'IMD':
        return `${baseUrl}/imd_latest/contents/current_weather_city.php?city=${params.location || 'Delhi'}`;
      default:
        return baseUrl;
    }
  }

  private parseSourceData(html: string, sourceName: string, params: any): any {
    const $ = cheerio.load(html);
    
    switch (sourceName) {
      case 'ICAR':
        return this.parseICARData($, params);
      case 'AgMarkNet':
        return this.parseMandiData($, params);
      case 'IMD':
        return this.parseWeatherData($, params);
      default:
        return null;
    }
  }

  private parseICARData($: any, params: any): any {
    return {
      cropName: $('.crop-name, h3').first().text().trim(),
      variety: $('.variety').text().trim(),
      recommendations: $('.recommendation, .advice').map((i: number, el: any) => $(el).text().trim()).get(),
      source: 'ICAR'
    };
  }

  private parseMandiData($: any, params: any): any[] {
    const prices: any[] = [];
    $('table tr').each((i: number, row: any) => {
      if (i === 0) return; // Skip header
      const cells = $(row).find('td');
      if (cells.length >= 6) {
        prices.push({
          commodity: $(cells[0]).text().trim(),
          market: $(cells[1]).text().trim(),
          price: parseFloat($(cells[5]).text().replace(/[^\d.]/g, '')) || 0,
          source: 'AgMarkNet'
        });
      }
    });
    return prices;
  }

  private parseWeatherData($: any, params: any): any {
    return {
      location: params.location,
      temperature: this.parseNumber($('.temperature, .temp').first().text()),
      humidity: this.parseNumber($('.humidity').first().text()),
      source: 'IMD'
    };
  }

  private parseNumber(text: string): number {
    const match = text.match(/(\d+(?:\.\d+)?)/);
    return match ? parseFloat(match[1]) : 0;
  }

  private validateData(data: any, category: string): boolean {
    if (!data) return false;
    
    switch (category) {
      case 'crops':
        return data.cropName && data.cropName.length > 0;
      case 'prices':
        return Array.isArray(data) && data.length > 0 && data[0].price > 0;
      case 'weather':
        return data.temperature > 0;
      default:
        return true;
    }
  }

  private mergeResults(results: any[], category: string): any {
    if (results.length === 0) return null;
    if (results.length === 1) return results[0];
    
    // Merge strategy based on category
    switch (category) {
      case 'prices':
        return results.flat();
      case 'weather':
        return results[0]; // Use first valid weather data
      default:
        return results[0];
    }
  }

  // Utility methods
  private getStateFromCoordinates(lat: number, lon: number): string {
    // Simple state mapping based on coordinates
    if (lat >= 26 && lat <= 31 && lon >= 77 && lon <= 85) return 'Uttar Pradesh';
    if (lat >= 18 && lat <= 22 && lon >= 72 && lon <= 80) return 'Maharashtra';
    if (lat >= 30 && lat <= 32 && lon >= 74 && lon <= 77) return 'Punjab';
    return 'Uttar Pradesh'; // Default
  }

  private getDistrictFromCoordinates(lat: number, lon: number): string {
    // Simple district mapping
    if (lat >= 25 && lat <= 26 && lon >= 82 && lon <= 84) return 'Varanasi';
    if (lat >= 28 && lat <= 29 && lon >= 77 && lon <= 78) return 'Delhi';
    return 'Varanasi'; // Default
  }

  // Fallback data methods
  private getFallbackData(): ScrapedAgriculturalData {
    return {
      crops: this.getFallbackCropData('Uttar Pradesh', 'Rice'),
      prices: this.getFallbackMarketPrices('Rice'),
      weather: this.getFallbackWeatherData('Varanasi'),
      soil: this.getFallbackSoilData('Uttar Pradesh', 'Varanasi'),
      calendar: this.getFallbackCropCalendar('Uttar Pradesh', 'Rice'),
      lastUpdated: new Date().toISOString()
    };
  }

  private getFallbackCropData(state: string, crop: string): any[] {
    return [{
      cropName: crop,
      cropNameHindi: crop === 'Rice' ? 'धान' : crop,
      variety: 'Local variety',
      state,
      expectedYield: '35-45 quintals/hectare',
      recommendations: [
        'Use quality seeds',
        'Apply balanced fertilizers',
        'Monitor for pests',
        'Ensure proper irrigation'
      ]
    }];
  }

  private getFallbackMarketPrices(commodity: string): any[] {
    return [{
      commodity,
      commodityHindi: commodity === 'Rice' ? 'चावल' : commodity,
      market: 'Local Mandi',
      state: 'Uttar Pradesh',
      modalPrice: 2200,
      date: new Date().toISOString().split('T')[0]
    }];
  }

  private getFallbackWeatherData(location: string): any {
    return {
      location,
      temperature: 28,
      humidity: 70,
      rainfall: 5,
      forecast: ['Partly cloudy', 'Light rain expected']
    };
  }

  private getFallbackSoilData(state: string, district: string): any {
    return {
      state,
      district,
      soilType: 'Alluvial',
      ph: 7.2,
      organicCarbon: 0.65,
      recommendations: ['Soil health is good', 'Continue organic practices']
    };
  }

  private getFallbackCropCalendar(state: string, crop: string): any {
    return {
      state,
      crop,
      season: 'Kharif',
      sowing: 'June-July',
      harvest: 'October-November'
    };
  }

  // Public methods for manual control
  async forceRefresh(category?: string): Promise<void> {
    if (category) {
      await scraperScheduler.forceRunJob(`${category}-data`);
    } else {
      // Refresh all data
      const jobs = ['icar-crops', 'mandi-prices', 'weather-data', 'soil-health', 'crop-calendar'];
      for (const job of jobs) {
        try {
          await scraperScheduler.forceRunJob(job);
        } catch (error) {
          console.error(`Failed to refresh ${job}:`, error);
        }
      }
    }
  }

  getScrapingStatus(): any {
    return scraperScheduler.getJobStatus();
  }

  stop(): void {
    scraperScheduler.stop();
  }
}

// Export singleton instance
export const integratedScraperService = new IntegratedScraperService();
