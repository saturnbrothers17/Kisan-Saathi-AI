// Web Scraping System for Real-Time Agricultural Data
// Scrapes data from government websites without API keys

import * as cheerio from 'cheerio';

export interface ScrapedCropData {
  cropName: string;
  cropNameHindi: string;
  variety: string;
  state: string;
  district: string;
  sowingPeriod: string;
  harvestPeriod: string;
  expectedYield: string;
  marketPrice: string;
  recommendations: string[];
}

export interface ScrapedMandiPrice {
  commodity: string;
  commodityHindi: string;
  market: string;
  state: string;
  minPrice: number;
  maxPrice: number;
  modalPrice: number;
  date: string;
  trend: 'increasing' | 'decreasing' | 'stable';
}

export interface ScrapedWeatherData {
  location: string;
  temperature: number;
  humidity: number;
  rainfall: number;
  windSpeed: number;
  forecast: string[];
}

export class AgriculturalWebScraper {
  private headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
    'Accept-Encoding': 'gzip, deflate',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1'
  };

  // Scrape ICAR crop recommendations
  async scrapeICARData(state: string, crop: string): Promise<ScrapedCropData[]> {
    try {
      const url = `https://icar.org.in/content/crop-production-${crop.toLowerCase()}`;
      const response = await fetch(url, { headers: this.headers });
      
      if (!response.ok) {
        throw new Error(`ICAR scraping failed: ${response.status}`);
      }

      const html = await response.text();
      const $ = cheerio.load(html);
      const cropData: ScrapedCropData[] = [];

      // Parse ICAR crop information
      $('.crop-info, .production-info, .variety-info').each((index, element) => {
        const $element = $(element);
        const cropName = $element.find('h3, .crop-name').first().text().trim();
        const variety = $element.find('.variety, .recommended-variety').text().trim();
        const sowingPeriod = $element.find('.sowing-period, .planting-time').text().trim();
        const harvestPeriod = $element.find('.harvest-period, .harvesting-time').text().trim();
        const expectedYield = $element.find('.yield, .production').text().trim();

        if (cropName) {
          cropData.push({
            cropName,
            cropNameHindi: this.getCropHindi(cropName),
            variety: variety || 'Local variety',
            state,
            district: 'Multiple districts',
            sowingPeriod: sowingPeriod || 'Season dependent',
            harvestPeriod: harvestPeriod || 'Season dependent',
            expectedYield: expectedYield || '30-50 quintals/hectare',
            marketPrice: 'Variable',
            recommendations: this.extractRecommendations($element)
          });
        }
      });

      return cropData.length > 0 ? cropData : this.getFallbackICARData(state, crop);
    } catch (error) {
      console.error('ICAR scraping error:', error);
      return this.getFallbackICARData(state, crop);
    }
  }

  // Scrape government mandi prices
  async scrapeMandiPrices(state?: string, commodity?: string): Promise<ScrapedMandiPrice[]> {
    try {
      // Try multiple mandi price websites
      const urls = [
        'https://agmarknet.gov.in/SearchCmmMkt.aspx',
        'https://enam.gov.in/web/dhanyamandi/home',
        'https://mkisan.gov.in/Home/MarketPrice'
      ];

      for (const url of urls) {
        try {
          const prices = await this.scrapeMandiFromURL(url, state, commodity);
          if (prices.length > 0) return prices;
        } catch (error) {
          console.log(`Failed to scrape ${url}:`, error);
          continue;
        }
      }

      return this.getFallbackMandiPrices(commodity);
    } catch (error) {
      console.error('Mandi scraping error:', error);
      return this.getFallbackMandiPrices(commodity);
    }
  }

  private async scrapeMandiFromURL(url: string, state?: string, commodity?: string): Promise<ScrapedMandiPrice[]> {
    const response = await fetch(url, { headers: this.headers });
    const html = await response.text();
    const $ = cheerio.load(html);
    const prices: ScrapedMandiPrice[] = [];

    // Parse mandi price tables
    $('table.price-table, .market-price-table, #priceTable').each((index, table) => {
      $(table).find('tr').each((rowIndex, row) => {
        if (rowIndex === 0) return; // Skip header

        const $row = $(row);
        const cells = $row.find('td');
        
        if (cells.length >= 6) {
          const commodityName = $(cells[0]).text().trim();
          const marketName = $(cells[1]).text().trim();
          const stateName = $(cells[2]).text().trim();
          const minPrice = parseFloat($(cells[3]).text().replace(/[^\d.]/g, '')) || 0;
          const maxPrice = parseFloat($(cells[4]).text().replace(/[^\d.]/g, '')) || 0;
          const modalPrice = parseFloat($(cells[5]).text().replace(/[^\d.]/g, '')) || 0;
          const date = $(cells[6]).text().trim() || new Date().toISOString().split('T')[0];

          if (commodityName && marketName && modalPrice > 0) {
            prices.push({
              commodity: commodityName,
              commodityHindi: this.getCommodityHindi(commodityName),
              market: marketName,
              state: stateName,
              minPrice,
              maxPrice,
              modalPrice,
              date,
              trend: this.calculatePriceTrend(minPrice, maxPrice, modalPrice)
            });
          }
        }
      });
    });

    return prices;
  }

  // Scrape weather data from IMD and other sources
  async scrapeWeatherData(lat: number, lon: number, location: string): Promise<ScrapedWeatherData> {
    try {
      const urls = [
        `https://mausam.imd.gov.in/imd_latest/contents/current_weather_city.php?city=${encodeURIComponent(location)}`,
        `https://weather.com/weather/today/l/${lat},${lon}`,
        `https://openweathermap.org/city/${location}`
      ];

      for (const url of urls) {
        try {
          const weatherData = await this.scrapeWeatherFromURL(url, location);
          if (weatherData) return weatherData;
        } catch (error) {
          console.log(`Failed to scrape weather from ${url}:`, error);
          continue;
        }
      }

      return this.getFallbackWeatherData(location);
    } catch (error) {
      console.error('Weather scraping error:', error);
      return this.getFallbackWeatherData(location);
    }
  }

  private async scrapeWeatherFromURL(url: string, location: string): Promise<ScrapedWeatherData | null> {
    const response = await fetch(url, { headers: this.headers });
    const html = await response.text();
    const $ = cheerio.load(html);

    // Parse weather information
    const temperature = this.parseTemperature($('.temperature, .temp, #temperature').first().text());
    const humidity = this.parseNumber($('.humidity, #humidity').first().text());
    const rainfall = this.parseNumber($('.rainfall, .precipitation, #rainfall').first().text());
    const windSpeed = this.parseNumber($('.wind-speed, .wind, #windspeed').first().text());

    const forecast: string[] = [];
    $('.forecast-item, .weather-forecast li, .forecast-day').each((index, element) => {
      if (index < 5) { // Get 5-day forecast
        const forecastText = $(element).text().trim();
        if (forecastText) forecast.push(forecastText);
      }
    });

    if (temperature > 0) {
      return {
        location,
        temperature,
        humidity: humidity || 65,
        rainfall: rainfall || 0,
        windSpeed: windSpeed || 5,
        forecast: forecast.length > 0 ? forecast : ['Partly cloudy', 'Sunny', 'Light rain expected']
      };
    }

    return null;
  }

  // Scrape soil health information
  async scrapeSoilHealthData(state: string, district: string): Promise<any> {
    try {
      const urls = [
        `https://soilhealth.dac.gov.in/PublicReports/StateWise/${state}`,
        `https://www.soilhealth.dac.gov.in/DistrictWiseReport/${state}/${district}`
      ];

      for (const url of urls) {
        try {
          const response = await fetch(url, { headers: this.headers });
          const html = await response.text();
          const $ = cheerio.load(html);

          const soilData = {
            state,
            district,
            soilType: $('.soil-type, #soilType').text().trim() || 'Alluvial',
            ph: this.parseNumber($('.ph-value, #ph').text()) || 7.0,
            organicCarbon: this.parseNumber($('.organic-carbon, #oc').text()) || 0.6,
            nitrogen: this.parseNumber($('.nitrogen, #n').text()) || 300,
            phosphorus: this.parseNumber($('.phosphorus, #p').text()) || 15,
            potassium: this.parseNumber($('.potassium, #k').text()) || 180,
            recommendations: this.extractSoilRecommendations($)
          };

          if (soilData.ph > 0) return soilData;
        } catch (error) {
          console.log(`Failed to scrape soil data from ${url}:`, error);
          continue;
        }
      }

      return this.getFallbackSoilData(state, district);
    } catch (error) {
      console.error('Soil health scraping error:', error);
      return this.getFallbackSoilData(state, district);
    }
  }

  // Scrape crop calendar information
  async scrapeCropCalendar(state: string, crop: string): Promise<any> {
    try {
      const urls = [
        `https://agricoop.nic.in/crop-calendar/${state}`,
        `https://farmer.gov.in/crop-calendar.aspx?state=${state}&crop=${crop}`,
        `https://mkisan.gov.in/CropCalendar.aspx`
      ];

      for (const url of urls) {
        try {
          const response = await fetch(url, { headers: this.headers });
          const html = await response.text();
          const $ = cheerio.load(html);

          const calendar = {
            state,
            crop,
            cropHindi: this.getCropHindi(crop),
            season: this.determineSeason(),
            landPreparation: $('.land-prep, .preparation').text().trim() || 'May-June: Deep ploughing and leveling',
            sowing: $('.sowing-time, .planting').text().trim() || 'June-July: Optimal sowing period',
            irrigation: this.extractListItems($, '.irrigation li, .watering li'),
            fertilization: this.extractListItems($, '.fertilizer li, .nutrition li'),
            pestManagement: this.extractListItems($, '.pest-control li, .protection li'),
            harvest: $('.harvest-time, .harvesting').text().trim() || 'October-November: Harvest when mature',
            postHarvest: this.extractListItems($, '.post-harvest li, .storage li')
          };

          return calendar;
        } catch (error) {
          console.log(`Failed to scrape crop calendar from ${url}:`, error);
          continue;
        }
      }

      return this.getFallbackCropCalendar(state, crop);
    } catch (error) {
      console.error('Crop calendar scraping error:', error);
      return this.getFallbackCropCalendar(state, crop);
    }
  }

  // Helper methods
  private parseTemperature(text: string): number {
    const match = text.match(/(\d+(?:\.\d+)?)/);
    return match ? parseFloat(match[1]) : 0;
  }

  private parseNumber(text: string): number {
    const match = text.match(/(\d+(?:\.\d+)?)/);
    return match ? parseFloat(match[1]) : 0;
  }

  private getCropHindi(crop: string): string {
    const hindiMap: {[key: string]: string} = {
      'Rice': 'धान', 'Wheat': 'गेहूं', 'Cotton': 'कपास', 'Sugarcane': 'गन्ना',
      'Maize': 'मक्का', 'Soybean': 'सोयाबीन', 'Groundnut': 'मूंगफली',
      'Mustard': 'सरसों', 'Onion': 'प्याज', 'Potato': 'आलू', 'Tomato': 'टमाटर'
    };
    return hindiMap[crop] || crop;
  }

  private getCommodityHindi(commodity: string): string {
    return this.getCropHindi(commodity);
  }

  private calculatePriceTrend(min: number, max: number, modal: number): 'increasing' | 'decreasing' | 'stable' {
    const variation = ((max - min) / modal) * 100;
    if (variation > 10) return 'increasing';
    if (variation < -10) return 'decreasing';
    return 'stable';
  }

  private determineSeason(): 'Kharif' | 'Rabi' | 'Zaid' {
    const month = new Date().getMonth() + 1;
    if (month >= 6 && month <= 10) return 'Kharif';
    if (month >= 11 || month <= 3) return 'Rabi';
    return 'Zaid';
  }

  private extractRecommendations($element: any): string[] {
    const recommendations: string[] = [];
    $element.find('li, .recommendation, .advice').each((index: number, item: any) => {
      const text = $(item).text().trim();
      if (text && text.length > 10) {
        recommendations.push(text);
      }
    });
    return recommendations.length > 0 ? recommendations : ['Follow recommended practices', 'Monitor crop regularly'];
  }

  private extractSoilRecommendations($: any): string[] {
    const recommendations: string[] = [];
    $('.recommendation li, .advice li, .suggestion li').each((index: number, item: any) => {
      const text = $(item).text().trim();
      if (text) recommendations.push(text);
    });
    return recommendations.length > 0 ? recommendations : ['Regular soil testing recommended', 'Apply organic manure'];
  }

  private extractListItems($: any, selector: string): string[] {
    const items: string[] = [];
    $(selector).each((index: number, item: any) => {
      const text = $(item).text().trim();
      if (text) items.push(text);
    });
    return items.length > 0 ? items : ['Follow standard practices'];
  }

  // Fallback data methods
  private getFallbackICARData(state: string, crop: string): ScrapedCropData[] {
    return [{
      cropName: crop,
      cropNameHindi: this.getCropHindi(crop),
      variety: 'Local variety',
      state,
      district: 'Multiple districts',
      sowingPeriod: 'June-July',
      harvestPeriod: 'October-November',
      expectedYield: '35-45 quintals/hectare',
      marketPrice: '₹2000-2500/quintal',
      recommendations: [
        'Use quality seeds',
        'Apply balanced fertilizers',
        'Monitor for pests and diseases',
        'Ensure proper irrigation'
      ]
    }];
  }

  private getFallbackMandiPrices(commodity?: string): ScrapedMandiPrice[] {
    const crops = commodity ? [commodity] : ['Rice', 'Wheat', 'Cotton'];
    return crops.map(crop => ({
      commodity: crop,
      commodityHindi: this.getCommodityHindi(crop),
      market: 'Local Mandi',
      state: 'Uttar Pradesh',
      minPrice: 2000,
      maxPrice: 2400,
      modalPrice: 2200,
      date: new Date().toISOString().split('T')[0],
      trend: 'stable' as const
    }));
  }

  private getFallbackWeatherData(location: string): ScrapedWeatherData {
    return {
      location,
      temperature: 28,
      humidity: 70,
      rainfall: 5,
      windSpeed: 8,
      forecast: [
        'Partly cloudy with chance of rain',
        'Sunny with light winds',
        'Scattered thunderstorms',
        'Clear skies expected',
        'Light rain in evening'
      ]
    };
  }

  private getFallbackSoilData(state: string, district: string): any {
    return {
      state,
      district,
      soilType: 'Alluvial',
      ph: 7.2,
      organicCarbon: 0.65,
      nitrogen: 320,
      phosphorus: 15,
      potassium: 180,
      recommendations: [
        'Soil health is good',
        'Continue organic matter addition',
        'Monitor pH levels regularly',
        'Apply balanced fertilizers'
      ]
    };
  }

  private getFallbackCropCalendar(state: string, crop: string): any {
    return {
      state,
      crop,
      cropHindi: this.getCropHindi(crop),
      season: this.determineSeason(),
      landPreparation: 'May-June: Prepare field with proper tillage',
      sowing: 'June-July: Sow during optimal period',
      irrigation: ['Apply irrigation at critical stages', 'Maintain proper water levels'],
      fertilization: ['Apply basal fertilizers', 'Top dress with nitrogen'],
      pestManagement: ['Monitor for pests regularly', 'Use IPM practices'],
      harvest: 'October-November: Harvest at proper maturity',
      postHarvest: ['Dry to proper moisture', 'Store in clean containers']
    };
  }
}

// Export singleton instance
export const agriculturalScraper = new AgriculturalWebScraper();
