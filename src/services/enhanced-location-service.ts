/**
 * Enhanced Location Service with Intelligent Scraping
 * Combines native geolocation with advanced web scraping for maximum accuracy
 */

import { intelligentLocationScraper, LocationData } from './intelligent-location-scraper';
import { alternativeLocationDetector } from './alternative-location-detector';

interface EnhancedLocationData extends LocationData {
  confidence: number;
  methods: string[];
}

class EnhancedLocationService {
  private cache: Map<string, EnhancedLocationData> = new Map();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes

  /**
   * Web scraping only - no native geolocation
   */
  private async getScrapedLocationOnly(): Promise<LocationData | null> {
    console.log('🕷️ Using web scraping only for location detection...');
    return await intelligentLocationScraper.getAccurateLocation();
  }

  /**
   * Enhanced reverse geocoding using multiple sources
   */
  private async reverseGeocode(lat: number, lon: number): Promise<{city: string, state: string} | null> {
    const sources = [
      {
        name: 'Nominatim',
        url: `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10&addressdetails=1`,
        headers: {
          'User-Agent': 'KisanSaathiAI/1.0 (Agricultural Weather App)',
          'Accept': 'application/json'
        }
      },
      {
        name: 'BigDataCloud',
        url: `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`,
        headers: {
          'Accept': 'application/json'
        }
      }
    ];

    for (const source of sources) {
      try {
        console.log(`🔍 Reverse geocoding with ${source.name}...`);
        
        const response = await fetch(source.url, {
          headers: {
            ...source.headers,
            'User-Agent': source.headers['User-Agent'] || 'KisanSaathiAI/1.0'
          }
        });

        if (response.ok) {
          const data = await response.json();
          console.log(`📍 ${source.name} response:`, data);

          let city = '', state = '';

          if (source.name === 'Nominatim' && data.address) {
            city = data.address.city || data.address.town || data.address.village || data.address.hamlet || '';
            state = data.address.state || '';
          } else if (source.name === 'BigDataCloud') {
            city = data.city || data.locality || '';
            state = data.principalSubdivision || '';
          }

          if (city && state) {
            return { city, state };
          }
        }
      } catch (error) {
        console.log(`❌ ${source.name} reverse geocoding failed:`, error);
      }
    }

    return null;
  }

  /**
   * Indian city database for coordinate matching
   */
  private getIndianCities() {
    return [
      { name: 'Mumbai', state: 'Maharashtra', lat: 19.0760, lon: 72.8777 },
      { name: 'Delhi', state: 'Delhi', lat: 28.7041, lon: 77.1025 },
      { name: 'Bangalore', state: 'Karnataka', lat: 12.9716, lon: 77.5946 },
      { name: 'Hyderabad', state: 'Telangana', lat: 17.3850, lon: 78.4867 },
      { name: 'Chennai', state: 'Tamil Nadu', lat: 13.0827, lon: 80.2707 },
      { name: 'Kolkata', state: 'West Bengal', lat: 22.5726, lon: 88.3639 },
      { name: 'Pune', state: 'Maharashtra', lat: 18.5204, lon: 73.8567 },
      { name: 'Ahmedabad', state: 'Gujarat', lat: 23.0225, lon: 72.5714 },
      { name: 'Jaipur', state: 'Rajasthan', lat: 26.9124, lon: 75.7873 },
      { name: 'Surat', state: 'Gujarat', lat: 21.1702, lon: 72.8311 },
      { name: 'Lucknow', state: 'Uttar Pradesh', lat: 26.8467, lon: 80.9462 },
      { name: 'Kanpur', state: 'Uttar Pradesh', lat: 26.4499, lon: 80.3319 },
      { name: 'Nagpur', state: 'Maharashtra', lat: 21.1458, lon: 79.0882 },
      { name: 'Indore', state: 'Madhya Pradesh', lat: 22.7196, lon: 75.8577 },
      { name: 'Thane', state: 'Maharashtra', lat: 19.2183, lon: 72.9781 },
      { name: 'Bhopal', state: 'Madhya Pradesh', lat: 23.2599, lon: 77.4126 },
      { name: 'Visakhapatnam', state: 'Andhra Pradesh', lat: 17.6868, lon: 83.2185 },
      { name: 'Pimpri-Chinchwad', state: 'Maharashtra', lat: 18.6298, lon: 73.7997 },
      { name: 'Patna', state: 'Bihar', lat: 25.5941, lon: 85.1376 },
      { name: 'Vadodara', state: 'Gujarat', lat: 22.3072, lon: 73.1812 },
      { name: 'Ghaziabad', state: 'Uttar Pradesh', lat: 28.6692, lon: 77.4538 },
      { name: 'Ludhiana', state: 'Punjab', lat: 30.9010, lon: 75.8573 },
      { name: 'Agra', state: 'Uttar Pradesh', lat: 27.1767, lon: 78.0081 },
      { name: 'Nashik', state: 'Maharashtra', lat: 19.9975, lon: 73.7898 },
      { name: 'Faridabad', state: 'Haryana', lat: 28.4089, lon: 77.3178 },
      { name: 'Meerut', state: 'Uttar Pradesh', lat: 28.9845, lon: 77.7064 },
      { name: 'Rajkot', state: 'Gujarat', lat: 22.3039, lon: 70.8022 },
      { name: 'Kalyan-Dombivli', state: 'Maharashtra', lat: 19.2403, lon: 73.1305 },
      { name: 'Vasai-Virar', state: 'Maharashtra', lat: 19.4912, lon: 72.8054 },
      { name: 'Varanasi', state: 'Uttar Pradesh', lat: 25.3176, lon: 82.9739 },
      { name: 'Srinagar', state: 'Jammu and Kashmir', lat: 34.0837, lon: 74.7973 },
      { name: 'Aurangabad', state: 'Maharashtra', lat: 19.8762, lon: 75.3433 },
      { name: 'Dhanbad', state: 'Jharkhand', lat: 23.7957, lon: 86.4304 },
      { name: 'Amritsar', state: 'Punjab', lat: 31.6340, lon: 74.8723 },
      { name: 'Navi Mumbai', state: 'Maharashtra', lat: 19.0330, lon: 73.0297 },
      { name: 'Allahabad', state: 'Uttar Pradesh', lat: 25.4358, lon: 81.8463 },
      { name: 'Ranchi', state: 'Jharkhand', lat: 23.3441, lon: 85.3096 },
      { name: 'Howrah', state: 'West Bengal', lat: 22.5958, lon: 88.2636 },
      { name: 'Coimbatore', state: 'Tamil Nadu', lat: 11.0168, lon: 76.9558 },
      { name: 'Jabalpur', state: 'Madhya Pradesh', lat: 23.1815, lon: 79.9864 },
      { name: 'Gwalior', state: 'Madhya Pradesh', lat: 26.2183, lon: 78.1828 },
      { name: 'Vijayawada', state: 'Andhra Pradesh', lat: 16.5062, lon: 80.6480 },
      { name: 'Jodhpur', state: 'Rajasthan', lat: 26.2389, lon: 73.0243 },
      { name: 'Madurai', state: 'Tamil Nadu', lat: 9.9252, lon: 78.1198 },
      { name: 'Raipur', state: 'Chhattisgarh', lat: 21.2514, lon: 81.6296 },
      { name: 'Kota', state: 'Rajasthan', lat: 25.2138, lon: 75.8648 },
      { name: 'Chandigarh', state: 'Chandigarh', lat: 30.7333, lon: 76.7794 },
      { name: 'Guwahati', state: 'Assam', lat: 26.1445, lon: 91.7362 },
      { name: 'Solapur', state: 'Maharashtra', lat: 17.6599, lon: 75.9064 },
      { name: 'Hubli-Dharwad', state: 'Karnataka', lat: 15.3647, lon: 75.1240 },
      { name: 'Bareilly', state: 'Uttar Pradesh', lat: 28.3670, lon: 79.4304 }
    ];
  }

  /**
   * Find nearest Indian city using Haversine formula
   */
  private findNearestCity(lat: number, lon: number): {city: string, state: string, distance: number} | null {
    const cities = this.getIndianCities();
    let nearest = null;
    let minDistance = Infinity;

    for (const city of cities) {
      const distance = this.calculateDistance(lat, lon, city.lat, city.lon);
      if (distance < minDistance) {
        minDistance = distance;
        nearest = { city: city.name, state: city.state, distance };
      }
    }

    return nearest && minDistance < 50 ? nearest : null; // 50km threshold
  }

  /**
   * Calculate distance using Haversine formula
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  /**
   * Main method to get enhanced location - ALTERNATIVE METHODS FIRST
   */
  async getEnhancedLocation(): Promise<EnhancedLocationData | null> {
    const cacheKey = 'enhanced_location';
    const cached = this.cache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
      console.log('📋 Using cached location:', cached);
      return cached;
    }

    console.log('🔄 Starting alternative location detection (avoiding IP geolocation)...');
    
    const methods: string[] = [];
    let bestLocation: LocationData | null = null;

    // Try alternative methods first (manual, timezone, device heuristics)
    const alternativeLocation = await alternativeLocationDetector.detectAlternativeLocation();
    
    if (alternativeLocation) {
      methods.push('alternative_detection');
      bestLocation = alternativeLocation;
      console.log('✅ Alternative location found:', bestLocation);
    } else {
      console.log('⚠️ Alternative methods failed, trying web scraping as last resort...');
      
      // Only use web scraping as absolute last resort
      const scrapedLocation = await this.getScrapedLocationOnly();
      
      if (scrapedLocation) {
        methods.push('web_scraping_fallback');
        bestLocation = scrapedLocation;
        console.log('⚠️ Using web scraped location (may be inaccurate due to ISP routing):', bestLocation);
      } else {
        console.log('❌ All location detection methods failed');
        return null;
      }
    }

    const enhancedLocation: EnhancedLocationData = {
      ...bestLocation,
      confidence: alternativeLocation ? 90 : 60, // Higher confidence for alternative methods
      methods
    };

    // Cache the result
    this.cache.set(cacheKey, enhancedLocation);
    
    console.log('✅ Enhanced location detected:', enhancedLocation);
    return enhancedLocation;
  }

  /**
   * Clear location cache
   */
  clearCache(): void {
    this.cache.clear();
    console.log('🗑️ Location cache cleared');
  }
}

// Export singleton instance
export const enhancedLocationService = new EnhancedLocationService();

// Export types
export type { EnhancedLocationData };
