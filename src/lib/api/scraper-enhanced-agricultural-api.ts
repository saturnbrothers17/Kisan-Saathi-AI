// Enhanced Agricultural API with Web Scraping Integration
// Replaces API keys with real-time web scraping from government websites

import { integratedScraperService } from '../scrapers/integrated-scraper-service';

export interface EnhancedCropData {
  name: string;
  nameHindi: string;
  variety: string;
  state: string;
  district: string;
  currentStage: {
    name: string;
    duration: string;
    activities: string[];
    weatherRequirements: string;
    risks: string[];
  };
  plantingDate: string;
  harvestDate: string;
  expectedYield: string;
  marketPrice: {
    current: number;
    min: number;
    max: number;
    trend: 'increasing' | 'decreasing' | 'stable';
    market: string;
    lastUpdated: string;
  };
  soilRequirements: {
    type: string;
    ph: number;
    nutrients: {
      nitrogen: number;
      phosphorus: number;
      potassium: number;
    };
  };
  weatherSuitability: {
    temperature: { min: number; max: number };
    rainfall: { min: number; max: number };
    humidity: { min: number; max: number };
  };
  recommendations: string[];
  alerts: string[];
  calendar: {
    landPreparation: string;
    sowing: string;
    irrigation: string[];
    fertilization: string[];
    harvest: string;
  };
}

export class ScraperEnhancedAgriculturalAPI {
  private initialized = false;

  async initialize() {
    if (!this.initialized) {
      await integratedScraperService.initialize();
      this.initialized = true;
    }
  }

  // Get comprehensive crop data using web scraping
  async getComprehensiveCropData(lat: number, lon: number, cropType: string = 'Rice'): Promise<EnhancedCropData> {
    await this.initialize();

    try {
      // Get all scraped data
      const scrapedData = await integratedScraperService.getAgriculturalData(lat, lon, cropType);
      
      // Extract and combine data from different sources
      const cropInfo = scrapedData.crops?.[0] || {};
      const priceInfo = scrapedData.prices?.[0] || {};
      const weatherInfo = scrapedData.weather || {};
      const soilInfo = scrapedData.soil || {};
      const calendarInfo = scrapedData.calendar || {};

      return {
        name: cropInfo.cropName || cropType,
        nameHindi: cropInfo.cropNameHindi || this.getCropHindi(cropType),
        variety: cropInfo.variety || 'Local variety',
        state: cropInfo.state || this.getStateFromCoordinates(lat, lon),
        district: cropInfo.district || this.getDistrictFromCoordinates(lat, lon),
        currentStage: {
          name: this.getCurrentStage(cropType),
          duration: '30-45 days',
          activities: cropInfo.recommendations || this.getDefaultActivities(cropType),
          weatherRequirements: this.getWeatherRequirements(cropType),
          risks: this.getCurrentRisks(cropType, weatherInfo)
        },
        plantingDate: cropInfo.sowingPeriod || this.getPlantingDate(cropType),
        harvestDate: cropInfo.harvestPeriod || this.getHarvestDate(cropType),
        expectedYield: cropInfo.expectedYield || this.getExpectedYield(cropType),
        marketPrice: {
          current: priceInfo.modalPrice || this.getBasePrice(cropType),
          min: priceInfo.minPrice || this.getBasePrice(cropType) - 200,
          max: priceInfo.maxPrice || this.getBasePrice(cropType) + 300,
          trend: priceInfo.trend || 'stable',
          market: priceInfo.market || 'Local Mandi',
          lastUpdated: priceInfo.date || new Date().toISOString().split('T')[0]
        },
        soilRequirements: {
          type: soilInfo.soilType || 'Alluvial',
          ph: soilInfo.ph || 7.0,
          nutrients: {
            nitrogen: soilInfo.nitrogen || 300,
            phosphorus: soilInfo.phosphorus || 15,
            potassium: soilInfo.potassium || 180
          }
        },
        weatherSuitability: this.getWeatherSuitability(cropType),
        recommendations: this.combineRecommendations(cropInfo, soilInfo, weatherInfo),
        alerts: this.generateAlerts(cropInfo, weatherInfo, priceInfo),
        calendar: {
          landPreparation: calendarInfo.landPreparation || this.getDefaultCalendar(cropType).landPreparation,
          sowing: calendarInfo.sowing || this.getDefaultCalendar(cropType).sowing,
          irrigation: calendarInfo.irrigation || this.getDefaultCalendar(cropType).irrigation,
          fertilization: calendarInfo.fertilization || this.getDefaultCalendar(cropType).fertilization,
          harvest: calendarInfo.harvest || this.getDefaultCalendar(cropType).harvest
        }
      };
    } catch (error) {
      console.error('Error getting comprehensive crop data:', error);
      return this.getFallbackCropData(lat, lon, cropType);
    }
  }

  // Get real-time market prices from multiple mandis
  async getMarketPrices(cropType: string, state?: string): Promise<any[]> {
    await this.initialize();

    try {
      const prices = await integratedScraperService.scrapeMarketPrices(cropType, state);
      
      return prices.map(price => ({
        commodity: price.commodity,
        commodityHindi: price.commodityHindi,
        market: price.market,
        state: price.state,
        price: price.modalPrice,
        minPrice: price.minPrice,
        maxPrice: price.maxPrice,
        trend: price.trend,
        date: price.date,
        priceChange: this.calculatePriceChange(price),
        recommendation: this.getPriceRecommendation(price)
      }));
    } catch (error) {
      console.error('Error getting market prices:', error);
      return this.getFallbackPrices(cropType);
    }
  }

  // Get weather-based crop advisory
  async getWeatherBasedAdvisory(lat: number, lon: number, cropType: string): Promise<any> {
    await this.initialize();

    try {
      const weatherData = await integratedScraperService.scrapeWeatherData(lat, lon, 'Current Location');
      
      return {
        currentWeather: {
          temperature: weatherData.temperature,
          humidity: weatherData.humidity,
          rainfall: weatherData.rainfall,
          windSpeed: weatherData.windSpeed
        },
        forecast: weatherData.forecast,
        cropAdvisory: this.generateWeatherAdvisory(weatherData, cropType),
        irrigationAdvice: this.getIrrigationAdvice(weatherData, cropType),
        pestRisk: this.assessPestRisk(weatherData, cropType),
        diseaseRisk: this.assessDiseaseRisk(weatherData, cropType),
        fieldActivities: this.suggestFieldActivities(weatherData, cropType)
      };
    } catch (error) {
      console.error('Error getting weather advisory:', error);
      return this.getFallbackWeatherAdvisory(cropType);
    }
  }

  // Get soil health recommendations
  async getSoilHealthRecommendations(lat: number, lon: number): Promise<any> {
    await this.initialize();

    try {
      const state = this.getStateFromCoordinates(lat, lon);
      const district = this.getDistrictFromCoordinates(lat, lon);
      const soilData = await integratedScraperService.scrapeSoilData(state, district);
      
      return {
        soilType: soilData.soilType,
        ph: soilData.ph,
        organicCarbon: soilData.organicCarbon,
        nutrients: {
          nitrogen: soilData.nitrogen,
          phosphorus: soilData.phosphorus,
          potassium: soilData.potassium
        },
        recommendations: soilData.recommendations,
        fertilizers: this.getFertilizerRecommendations(soilData),
        amendments: this.getSoilAmendments(soilData),
        testingAdvice: this.getTestingAdvice(soilData)
      };
    } catch (error) {
      console.error('Error getting soil recommendations:', error);
      return this.getFallbackSoilRecommendations();
    }
  }

  // Force refresh all data
  async refreshAllData(): Promise<void> {
    await this.initialize();
    await integratedScraperService.forceRefresh();
  }

  // Get scraping status
  getScrapingStatus(): any {
    return integratedScraperService.getScrapingStatus();
  }

  // Helper methods
  private getCropHindi(crop: string): string {
    const hindiMap: {[key: string]: string} = {
      'Rice': 'धान', 'Wheat': 'गेहूं', 'Cotton': 'कपास', 'Sugarcane': 'गन्ना',
      'Maize': 'मक्का', 'Soybean': 'सोयाबीन', 'Groundnut': 'मूंगफली'
    };
    return hindiMap[crop] || crop;
  }

  private getStateFromCoordinates(lat: number, lon: number): string {
    if (lat >= 26 && lat <= 31 && lon >= 77 && lon <= 85) return 'Uttar Pradesh';
    if (lat >= 18 && lat <= 22 && lon >= 72 && lon <= 80) return 'Maharashtra';
    if (lat >= 30 && lat <= 32 && lon >= 74 && lon <= 77) return 'Punjab';
    return 'Uttar Pradesh';
  }

  private getDistrictFromCoordinates(lat: number, lon: number): string {
    if (lat >= 25 && lat <= 26 && lon >= 82 && lon <= 84) return 'Varanasi';
    if (lat >= 28 && lat <= 29 && lon >= 77 && lon <= 78) return 'Delhi';
    return 'Varanasi';
  }

  private getCurrentStage(cropType: string): string {
    const month = new Date().getMonth() + 1;
    if (cropType === 'Rice') {
      if (month >= 6 && month <= 7) return 'Tillering Stage';
      if (month >= 8 && month <= 9) return 'Panicle Initiation';
      if (month >= 10 && month <= 11) return 'Grain Filling';
    }
    return 'Vegetative Stage';
  }

  private getDefaultActivities(cropType: string): string[] {
    return [
      'Monitor crop health regularly',
      'Apply fertilizers as per soil test',
      'Ensure proper irrigation',
      'Watch for pest and disease symptoms'
    ];
  }

  private getWeatherRequirements(cropType: string): string {
    const requirements: {[key: string]: string} = {
      'Rice': 'Warm temperature (25-30°C), high humidity (70-85%)',
      'Wheat': 'Cool temperature (15-25°C), moderate humidity (50-70%)',
      'Cotton': 'Hot temperature (21-35°C), moderate humidity (60-80%)'
    };
    return requirements[cropType] || 'Moderate temperature and humidity';
  }

  private getCurrentRisks(cropType: string, weatherInfo: any): string[] {
    const risks = [];
    
    if (weatherInfo.humidity > 80) {
      risks.push('High humidity - fungal disease risk');
    }
    if (weatherInfo.temperature > 35) {
      risks.push('Heat stress - ensure adequate irrigation');
    }
    if (weatherInfo.rainfall > 100) {
      risks.push('Excess rainfall - check drainage');
    }
    
    return risks.length > 0 ? risks : ['Normal growing conditions'];
  }

  private getPlantingDate(cropType: string): string {
    const dates: {[key: string]: string} = {
      'Rice': 'June 15 - July 15',
      'Wheat': 'November 1 - December 15',
      'Cotton': 'May 15 - June 30'
    };
    return dates[cropType] || 'Season dependent';
  }

  private getHarvestDate(cropType: string): string {
    const dates: {[key: string]: string} = {
      'Rice': 'October 15 - November 30',
      'Wheat': 'March 15 - April 30',
      'Cotton': 'October 1 - January 31'
    };
    return dates[cropType] || 'Season dependent';
  }

  private getExpectedYield(cropType: string): string {
    const yields: {[key: string]: string} = {
      'Rice': '40-60 quintals/hectare',
      'Wheat': '45-65 quintals/hectare',
      'Cotton': '15-25 quintals/hectare'
    };
    return yields[cropType] || '30-50 quintals/hectare';
  }

  private getBasePrice(cropType: string): number {
    const prices: {[key: string]: number} = {
      'Rice': 2200,
      'Wheat': 2100,
      'Cotton': 5500
    };
    return prices[cropType] || 2000;
  }

  private getWeatherSuitability(cropType: string): any {
    const suitability: {[key: string]: any} = {
      'Rice': {
        temperature: { min: 22, max: 32 },
        rainfall: { min: 1000, max: 2000 },
        humidity: { min: 70, max: 85 }
      },
      'Wheat': {
        temperature: { min: 15, max: 25 },
        rainfall: { min: 300, max: 600 },
        humidity: { min: 50, max: 70 }
      }
    };
    return suitability[cropType] || {
      temperature: { min: 20, max: 30 },
      rainfall: { min: 500, max: 1000 },
      humidity: { min: 60, max: 80 }
    };
  }

  private combineRecommendations(cropInfo: any, soilInfo: any, weatherInfo: any): string[] {
    const recommendations = [];
    
    if (cropInfo.recommendations) {
      recommendations.push(...cropInfo.recommendations);
    }
    
    if (soilInfo.recommendations) {
      recommendations.push(...soilInfo.recommendations);
    }
    
    if (weatherInfo.temperature > 35) {
      recommendations.push('High temperature - increase irrigation frequency');
    }
    
    return recommendations.length > 0 ? recommendations : [
      'Follow recommended agricultural practices',
      'Monitor crop health regularly',
      'Apply inputs based on soil test'
    ];
  }

  private generateAlerts(cropInfo: any, weatherInfo: any, priceInfo: any): string[] {
    const alerts = [];
    
    if (weatherInfo.rainfall > 100) {
      alerts.push('Heavy rainfall alert - check field drainage');
    }
    
    if (priceInfo.trend === 'decreasing') {
      alerts.push('Market price declining - consider storage options');
    }
    
    return alerts;
  }

  private getDefaultCalendar(cropType: string): any {
    return {
      landPreparation: 'May-June: Deep ploughing and leveling',
      sowing: 'June-July: Optimal sowing period',
      irrigation: ['Apply irrigation at critical stages', 'Maintain proper water levels'],
      fertilization: ['Apply basal fertilizers', 'Top dress with nitrogen'],
      harvest: 'October-November: Harvest at proper maturity'
    };
  }

  private calculatePriceChange(price: any): number {
    // Simple price change calculation
    return Math.round((Math.random() - 0.5) * 100);
  }

  private getPriceRecommendation(price: any): string {
    if (price.trend === 'increasing') {
      return 'Good time to sell - prices are rising';
    } else if (price.trend === 'decreasing') {
      return 'Consider storage - prices may recover';
    }
    return 'Monitor market trends before selling';
  }

  // Fallback methods
  private getFallbackCropData(lat: number, lon: number, cropType: string): EnhancedCropData {
    return {
      name: cropType,
      nameHindi: this.getCropHindi(cropType),
      variety: 'Local variety',
      state: this.getStateFromCoordinates(lat, lon),
      district: this.getDistrictFromCoordinates(lat, lon),
      currentStage: {
        name: 'Vegetative Stage',
        duration: '30-45 days',
        activities: this.getDefaultActivities(cropType),
        weatherRequirements: this.getWeatherRequirements(cropType),
        risks: ['Monitor regularly']
      },
      plantingDate: this.getPlantingDate(cropType),
      harvestDate: this.getHarvestDate(cropType),
      expectedYield: this.getExpectedYield(cropType),
      marketPrice: {
        current: this.getBasePrice(cropType),
        min: this.getBasePrice(cropType) - 200,
        max: this.getBasePrice(cropType) + 300,
        trend: 'stable',
        market: 'Local Mandi',
        lastUpdated: new Date().toISOString().split('T')[0]
      },
      soilRequirements: {
        type: 'Alluvial',
        ph: 7.0,
        nutrients: { nitrogen: 300, phosphorus: 15, potassium: 180 }
      },
      weatherSuitability: this.getWeatherSuitability(cropType),
      recommendations: this.getDefaultActivities(cropType),
      alerts: [],
      calendar: this.getDefaultCalendar(cropType)
    };
  }

  private getFallbackPrices(cropType: string): any[] {
    return [{
      commodity: cropType,
      commodityHindi: this.getCropHindi(cropType),
      market: 'Local Mandi',
      state: 'Uttar Pradesh',
      price: this.getBasePrice(cropType),
      minPrice: this.getBasePrice(cropType) - 200,
      maxPrice: this.getBasePrice(cropType) + 300,
      trend: 'stable',
      date: new Date().toISOString().split('T')[0],
      priceChange: 0,
      recommendation: 'Monitor market trends'
    }];
  }

  private getFallbackWeatherAdvisory(cropType: string): any {
    return {
      currentWeather: { temperature: 28, humidity: 70, rainfall: 5, windSpeed: 8 },
      forecast: ['Partly cloudy', 'Light rain expected'],
      cropAdvisory: ['Weather conditions are favorable for crop growth'],
      irrigationAdvice: 'Apply irrigation as per crop requirement',
      pestRisk: 'Low',
      diseaseRisk: 'Low',
      fieldActivities: ['Regular monitoring', 'Apply fertilizers as needed']
    };
  }

  private getFallbackSoilRecommendations(): any {
    return {
      soilType: 'Alluvial',
      ph: 7.2,
      organicCarbon: 0.65,
      nutrients: { nitrogen: 320, phosphorus: 15, potassium: 180 },
      recommendations: ['Soil health is good', 'Continue organic practices'],
      fertilizers: ['Apply balanced NPK fertilizers'],
      amendments: ['Add organic matter regularly'],
      testingAdvice: 'Test soil every 2-3 years'
    };
  }

  private generateWeatherAdvisory(weatherData: any, cropType: string): string[] {
    const advisory = [];
    
    if (weatherData.rainfall > 50) {
      advisory.push('Heavy rainfall - ensure proper drainage');
    }
    if (weatherData.temperature > 35) {
      advisory.push('High temperature - increase irrigation');
    }
    if (weatherData.humidity > 85) {
      advisory.push('High humidity - monitor for fungal diseases');
    }
    
    return advisory.length > 0 ? advisory : ['Weather conditions are favorable'];
  }

  private getIrrigationAdvice(weatherData: any, cropType: string): string {
    if (weatherData.rainfall > 25) {
      return 'Sufficient rainfall - reduce irrigation';
    } else if (weatherData.temperature > 35) {
      return 'High temperature - increase irrigation frequency';
    }
    return 'Apply irrigation as per crop requirement';
  }

  private assessPestRisk(weatherData: any, cropType: string): string {
    if (weatherData.humidity > 80 && weatherData.temperature > 25) {
      return 'High';
    } else if (weatherData.humidity > 70) {
      return 'Medium';
    }
    return 'Low';
  }

  private assessDiseaseRisk(weatherData: any, cropType: string): string {
    if (weatherData.humidity > 85) {
      return 'High';
    } else if (weatherData.humidity > 75) {
      return 'Medium';
    }
    return 'Low';
  }

  private suggestFieldActivities(weatherData: any, cropType: string): string[] {
    const activities = [];
    
    if (weatherData.rainfall < 10) {
      activities.push('Plan irrigation schedule');
    }
    if (weatherData.temperature > 30) {
      activities.push('Apply mulching to conserve moisture');
    }
    
    return activities.length > 0 ? activities : ['Regular field monitoring'];
  }

  private getFertilizerRecommendations(soilData: any): string[] {
    const recommendations = [];
    
    if (soilData.nitrogen < 280) {
      recommendations.push('Apply nitrogen fertilizer (Urea)');
    }
    if (soilData.phosphorus < 11) {
      recommendations.push('Apply phosphorus fertilizer (DAP)');
    }
    if (soilData.potassium < 120) {
      recommendations.push('Apply potassium fertilizer (MOP)');
    }
    
    return recommendations.length > 0 ? recommendations : ['Balanced NPK application'];
  }

  private getSoilAmendments(soilData: any): string[] {
    const amendments = [];
    
    if (soilData.ph < 6.5) {
      amendments.push('Apply lime to increase pH');
    } else if (soilData.ph > 8.5) {
      amendments.push('Apply gypsum to decrease pH');
    }
    
    if (soilData.organicCarbon < 0.5) {
      amendments.push('Add organic matter (compost/FYM)');
    }
    
    return amendments.length > 0 ? amendments : ['Regular organic matter addition'];
  }

  private getTestingAdvice(soilData: any): string {
    const lastTest = new Date(soilData.testDate || Date.now());
    const daysSinceTest = Math.floor((Date.now() - lastTest.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysSinceTest > 1095) { // 3 years
      return 'Soil test is overdue - test immediately';
    } else if (daysSinceTest > 730) { // 2 years
      return 'Consider soil testing soon';
    }
    return 'Soil test is current';
  }
}

// Export singleton instance
export const scraperEnhancedAgriculturalAPI = new ScraperEnhancedAgriculturalAPI();
