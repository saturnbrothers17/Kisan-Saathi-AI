// Real-time agricultural data API integrations
// Now enhanced with server-side web scraping via API routes

import { realTimeScraperClient } from './real-time-scraper-client';

export interface PestAlert {
  name: string;
  nameHindi: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  probability: number;
  affectedCrops: string[];
  weatherConditions: string;
  symptoms: string[];
  prevention: string[];
  treatment: string[];
  economicImpact: string;
}

export interface CropData {
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
  marketPrice?: string;
  expectedYield?: string;
  profitEstimate?: string;
}

// Fetch pest and disease alerts based on weather conditions
export async function fetchPestAlerts(lat: number, lon: number, temperature: number, humidity: number): Promise<PestAlert[]> {
  try {
    const alerts: PestAlert[] = [];
    
    // Brown Plant Hopper - High humidity and temperature conditions
    if (humidity > 75 && temperature >= 25 && temperature <= 32) {
      alerts.push({
        name: 'Brown Plant Hopper',
        nameHindi: 'भूरा फुदका',
        riskLevel: humidity > 85 ? 'critical' : 'high',
        probability: Math.min(95, 60 + (humidity - 75) * 2),
        affectedCrops: ['rice'],
        weatherConditions: `High humidity (${humidity}%), Temperature ${temperature}°C, Favorable for pest development`,
        symptoms: [
          'Yellowing and drying of leaves',
          'Stunted plant growth',
          'Honeydew secretion on leaves',
          'Sooty mold development'
        ],
        prevention: [
          'Use resistant varieties like IR64',
          'Maintain proper plant spacing',
          'Install light traps in fields',
          'Remove alternate host plants'
        ],
        treatment: [
          'Spray Imidacloprid 17.8% SL @ 100ml/acre',
          'Use Thiamethoxam 25% WG @ 40g/acre',
          'Apply neem oil @ 3ml/liter water',
          'Release natural predators like spiders'
        ],
        economicImpact: 'Can cause 20-80% yield loss if not controlled'
      });
    }
    
    // Wheat Rust - Cool nights, warm days
    if (temperature >= 20 && temperature <= 25 && humidity > 60) {
      alerts.push({
        name: 'Wheat Rust',
        nameHindi: 'गेहूं का रतुआ',
        riskLevel: 'medium',
        probability: 65,
        affectedCrops: ['wheat'],
        weatherConditions: `Cool-warm conditions (${temperature}°C), High humidity (${humidity}%)`,
        symptoms: [
          'Orange-red pustules on leaves',
          'Yellowing of leaf tissue',
          'Premature leaf death',
          'Reduced grain filling'
        ],
        prevention: [
          'Use resistant varieties like HD3086',
          'Avoid late sowing',
          'Proper crop rotation',
          'Remove volunteer plants'
        ],
        treatment: [
          'Spray Propiconazole 25% EC @ 200ml/acre',
          'Use Tebuconazole 25.9% EC @ 200ml/acre',
          'Apply at first appearance of disease',
          'Repeat spray after 15 days if needed'
        ],
        economicImpact: 'Can reduce yield by 10-40% in severe cases'
      });
    }
    
    // Cotton Bollworm - Hot dry conditions
    if (temperature >= 30 && humidity < 70) {
      alerts.push({
        name: 'Cotton Bollworm',
        nameHindi: 'कपास का इल्ली',
        riskLevel: 'critical',
        probability: Math.min(95, 70 + (temperature - 30) * 3),
        affectedCrops: ['cotton'],
        weatherConditions: `Hot dry weather (${temperature}°C), Low humidity (${humidity}%)`,
        symptoms: [
          'Holes in cotton bolls',
          'Damaged flowers and buds',
          'Frass (insect excrement) visible',
          'Reduced boll formation'
        ],
        prevention: [
          'Use Bt cotton varieties',
          'Install pheromone traps @ 5/acre',
          'Intercrop with marigold or castor',
          'Regular field monitoring'
        ],
        treatment: [
          'Spray Chlorantraniliprole 18.5% SC @ 60ml/acre',
          'Use Emamectin benzoate 5% SG @ 80g/acre',
          'Apply Bacillus thuringiensis @ 500g/acre',
          'Release Trichogramma @ 50,000/acre'
        ],
        economicImpact: 'Major pest causing 30-60% yield loss'
      });
    }
    
    return alerts;
  } catch (error) {
    console.error('Error fetching pest alerts:', error);
    return [];
  }
}

// Fetch crop advisory based on current date and location
export async function fetchCropAdvisory(lat: number, lon: number, cropType: string = 'rice'): Promise<CropData> {
  try {
    // Use real-time scraper client to get server-side scraped data
    console.log(`🌾 Fetching real-time crop advisory for ${cropType} at ${lat}, ${lon}`);
    
    const scrapedData = await realTimeScraperClient.getCropData(lat, lon, cropType);
    
    if (scrapedData) {
      console.log(`✅ Got real-time crop data from ${scrapedData.source}`);
      return {
        name: scrapedData.name,
        variety: scrapedData.variety,
        plantingDate: scrapedData.plantingDate,
        currentStage: scrapedData.currentStage,
        nextStage: scrapedData.nextStage,
        harvestDate: scrapedData.harvestDate,
        weatherSuitability: scrapedData.weatherSuitability,
        recommendations: scrapedData.recommendations,
        alerts: scrapedData.alerts,
        marketPrice: scrapedData.marketPrice,
        expectedYield: scrapedData.expectedYield,
        profitEstimate: scrapedData.profitEstimate
      };
    }
  } catch (error) {
    console.error('Real-time scraping failed, using fallback logic:', error);
  }
  
  // Fallback to existing logic if real-time scraping fails
  const now = new Date();
  const month = now.getMonth() + 1;
  
  // Determine crop stage based on planting season and current date
  let cropData: CropData;
  
  if (cropType === 'rice') {
      // Kharif rice (June-November)
      if (month >= 6 && month <= 11) {
        const daysSincePlanting = Math.floor((now.getTime() - new Date(2024, 5, 15).getTime()) / (1000 * 60 * 60 * 24));
        
        let currentStage;
        if (daysSincePlanting < 35) {
          currentStage = {
            name: 'Tillering Stage',
            duration: '25-35 days after transplanting',
            currentDay: daysSincePlanting,
            totalDays: 35,
            activities: [
              'Apply nitrogen fertilizer (25kg/acre)',
              'Maintain 2-3 cm water level',
              'Remove weeds manually',
              'Monitor for pest attacks'
            ],
            weatherRequirements: 'Warm temperature (25-30°C), high humidity',
            risks: ['Brown plant hopper', 'Blast disease', 'Water shortage']
          };
        } else if (daysSincePlanting < 65) {
          currentStage = {
            name: 'Panicle Initiation',
            duration: '35-65 days after transplanting',
            currentDay: daysSincePlanting,
            totalDays: 65,
            activities: [
              'Apply phosphorus fertilizer',
              'Maintain proper water level',
              'Monitor for disease symptoms',
              'Apply growth regulators if needed'
            ],
            weatherRequirements: 'Moderate temperature, adequate moisture',
            risks: ['Blast disease', 'Sheath blight', 'Nutrient deficiency']
          };
        } else {
          currentStage = {
            name: 'Grain Filling',
            duration: '65-120 days after transplanting',
            currentDay: daysSincePlanting,
            totalDays: 120,
            activities: [
              'Apply potassium fertilizer',
              'Reduce water level gradually',
              'Monitor grain development',
              'Prepare for harvest'
            ],
            weatherRequirements: 'Warm days, cool nights, reduced water',
            risks: ['False smut', 'Grain discoloration', 'Bird damage']
          };
        }
        
        cropData = {
          name: 'Rice',
          variety: 'Basmati 1121',
          plantingDate: 'July 15, 2024',
          currentStage,
          nextStage: daysSincePlanting < 35 ? 'Panicle Initiation' : daysSincePlanting < 65 ? 'Grain Filling' : 'Harvest',
          harvestDate: 'November 20, 2024',
          weatherSuitability: getWeatherSuitability(lat, lon, 'rice'),
          recommendations: await getCropRecommendations('rice', currentStage.name, lat, lon),
          alerts: await getCropAlerts('rice', currentStage.name, lat, lon)
        };
      } else {
        // Off-season or preparation
        cropData = {
          name: 'Rice',
          variety: 'Basmati 1121',
          plantingDate: 'Next season: June 2025',
          currentStage: {
            name: 'Land Preparation',
            duration: 'Pre-season preparation',
            currentDay: 0,
            totalDays: 30,
            activities: [
              'Prepare seedbed with proper tillage',
              'Apply organic manure',
              'Plan irrigation schedule',
              'Procure quality seeds'
            ],
            weatherRequirements: 'Suitable weather for field preparation',
            risks: ['Soil compaction', 'Weed growth', 'Pest carryover']
          },
          nextStage: 'Nursery Preparation',
          harvestDate: 'November 2025',
          weatherSuitability: 'fair',
          recommendations: [
            'Plan for next season planting',
            'Prepare land during favorable weather',
            'Store farm equipment properly',
            'Plan crop rotation'
          ],
          alerts: []
        };
      }
    } else {
      // Default wheat data for Rabi season
      cropData = {
        name: 'Wheat',
        variety: 'HD 2967',
        plantingDate: 'November 15, 2024',
        currentStage: {
          name: 'Pre-Sowing Preparation',
          duration: 'October - November',
          currentDay: 15,
          totalDays: 30,
          activities: [
            'Prepare seedbed with proper tillage',
            'Apply basal fertilizers',
            'Treat seeds with fungicide',
            'Plan irrigation schedule'
          ],
          weatherRequirements: 'Cool temperature (15-20°C), low humidity',
          risks: ['Late sowing', 'Soil moisture deficit', 'Pest infestation']
        },
        nextStage: 'Germination',
        harvestDate: 'April 15, 2025',
        weatherSuitability: getWeatherSuitability(lat, lon, 'wheat'),
        recommendations: [
          'Optimal sowing window is open',
          'Current temperature perfect for germination',
          'Soil moisture adequate for sowing',
          'Complete sowing by November 30'
        ],
        alerts: [
          'Best sowing period - act now!',
          'Weather conditions ideal for next 10 days'
        ]
      };
    }
    
  return cropData;
}

// Helper functions
function getWeatherSuitability(lat: number, lon: number, cropType: string): 'excellent' | 'good' | 'fair' | 'poor' {
  // Simplified weather suitability based on location and season
  const month = new Date().getMonth() + 1;
  
  if (cropType === 'rice') {
    if (month >= 6 && month <= 9) return 'excellent';
    if (month >= 5 && month <= 10) return 'good';
    return 'fair';
  } else if (cropType === 'wheat') {
    if (month >= 11 || month <= 3) return 'excellent';
    if (month >= 10 || month <= 4) return 'good';
    return 'poor';
  }
  
  return 'fair';
}

async function getCropRecommendations(cropType: string, stage: string, lat: number, lon: number): Promise<string[]> {
  const recommendations = [];
  
  if (cropType === 'rice' && stage === 'Tillering Stage') {
    recommendations.push('Current weather is favorable for tillering');
    recommendations.push('Apply urea fertilizer in split doses');
    recommendations.push('Ensure proper drainage to prevent root rot');
    recommendations.push('Monitor for brown plant hopper due to high humidity');
  }
  
  return recommendations;
}

async function getCropAlerts(cropType: string, stage: string, lat: number, lon: number): Promise<string[]> {
  const alerts = [];
  
  // Add weather-based alerts
  const now = new Date();
  if (now.getMonth() >= 5 && now.getMonth() <= 8) {
    alerts.push('Heavy rain expected - check field drainage');
    alerts.push('Pest risk high due to weather conditions');
  }
  
  return alerts;
}

// Market price integration with real-time scraping
export async function fetchMarketPrices(cropType: string, location: string): Promise<any> {
  try {
    console.log(`💰 Fetching real-time market prices for ${cropType} in ${location}`);
    
    // Use real-time scraper client to get server-side scraped data
    const scrapedPrices = await realTimeScraperClient.getMarketPrices(cropType, location);
    
    if (scrapedPrices && scrapedPrices.length > 0) {
      const priceData = scrapedPrices[0];
      console.log(`✅ Got real-time market prices from server`);
      return {
        currentPrice: priceData.modalPrice || 2200,
        minPrice: priceData.minPrice || 2000,
        maxPrice: priceData.maxPrice || 2400,
        trend: priceData.trend || 'stable',
        market: priceData.market || 'Local Mandi',
        lastUpdated: priceData.date || new Date().toISOString()
      };
    }
  } catch (error) {
    console.error('Real-time market price scraping failed:', error);
  }
  
  // Fallback to sample data
  return {
    currentPrice: 2200,
    trend: 'stable',
    lastUpdated: new Date().toISOString()
  };
}

// Fetch fertilizer and pesticide schedule
export async function fetchApplicationSchedule(cropType: string): Promise<any[]> {
  // This would be a complex function based on crop, stage, weather, etc.
  // For now, returning a dynamic mock schedule based on crop type
  const now = new Date();
  const schedule = [
    {
      id: '1',
      type: 'fertilizer',
      name: 'Urea (Nitrogen)',
      nameHindi: 'यूरिया (नाइट्रोजन)',
      cropStage: 'Tillering Stage',
      applicationDate: new Date(now.setDate(now.getDate() + 1)).toLocaleDateString(),
      applicationTime: '6:00 AM',
      dosage: '25 kg per acre',
      method: 'Broadcasting followed by irrigation',
      weatherConditions: 'Apply before irrigation, avoid windy conditions',
      precautions: ['Wear protective gloves and mask', 'Do not apply during rain or strong wind'],
      benefits: ['Promotes vegetative growth', 'Increases tillering'],
      cost: '₹350 per 50kg bag',
      priority: 'high',
      status: 'due'
    },
    {
      id: '2',
      type: 'pesticide',
      name: 'Imidacloprid',
      nameHindi: 'इमिडाक्लोप्रिड',
      cropStage: 'Tillering Stage',
      applicationDate: new Date(now.setDate(now.getDate() + 2)).toLocaleDateString(),
      applicationTime: '5:30 PM',
      dosage: '100ml per acre',
      method: 'Foliar spray with 200L water',
      weatherConditions: 'Evening application, no rain for 6 hours',
      precautions: ['Use complete protective equipment', 'Do not spray during flowering'],
      benefits: ['Controls brown plant hopper', 'Systemic action for 15-20 days'],
      cost: '₹450 per 100ml bottle',
      priority: 'critical',
      status: 'upcoming'
    }
  ];

  return schedule.filter(item => item.cropStage.toLowerCase().includes(cropType.toLowerCase()));
}
