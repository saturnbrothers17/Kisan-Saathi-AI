// Enhanced geolocation system with multiple fallback strategies
// Combines browser geolocation, IP geolocation, and AI-based location detection

export interface LocationData {
  lat: number;
  lon: number;
  city: string;
  state: string;
  country?: string;
  accuracy: 'high' | 'medium' | 'low';
  source: 'browser' | 'ip_service' | 'ai' | 'manual' | 'default';
}

export interface GeolocationConfig {
  enableBrowserLocation: boolean;
  enableIPGeolocation: boolean;
  enableAIGeolocation: boolean;
  timeout: number;
  highAccuracy: boolean;
  maxAge: number;
  fallbackLocation: {
    lat: number;
    lon: number;
    city: string;
    state: string;
  };
}

// Major Indian cities database for fallback and validation
const INDIAN_CITIES = {
  'varanasi': { lat: 25.3176, lon: 82.9739, state: 'Uttar Pradesh' },
  'delhi': { lat: 28.6139, lon: 77.2090, state: 'Delhi' },
  'mumbai': { lat: 19.0760, lon: 72.8777, state: 'Maharashtra' },
  'bangalore': { lat: 12.9716, lon: 77.5946, state: 'Karnataka' },
  'chennai': { lat: 13.0827, lon: 80.2707, state: 'Tamil Nadu' },
  'kolkata': { lat: 22.5726, lon: 88.3639, state: 'West Bengal' },
  'hyderabad': { lat: 17.3850, lon: 78.4867, state: 'Telangana' },
  'pune': { lat: 18.5204, lon: 73.8567, state: 'Maharashtra' },
  'ahmedabad': { lat: 23.0225, lon: 72.5714, state: 'Gujarat' },
  'jaipur': { lat: 26.9124, lon: 75.7873, state: 'Rajasthan' },
  'surat': { lat: 21.1702, lon: 72.8311, state: 'Gujarat' },
  'lucknow': { lat: 26.8467, lon: 80.9462, state: 'Uttar Pradesh' },
  'kanpur': { lat: 26.4499, lon: 80.3319, state: 'Uttar Pradesh' },
  'nagpur': { lat: 21.1458, lon: 79.0882, state: 'Maharashtra' },
  'patna': { lat: 25.5941, lon: 85.1376, state: 'Bihar' },
  'indore': { lat: 22.7196, lon: 75.8577, state: 'Madhya Pradesh' },
  'thane': { lat: 19.2183, lon: 72.9781, state: 'Maharashtra' },
  'bhopal': { lat: 23.2599, lon: 77.4126, state: 'Madhya Pradesh' },
  'visakhapatnam': { lat: 17.6868, lon: 83.2185, state: 'Andhra Pradesh' },
  'vadodara': { lat: 22.3072, lon: 73.1812, state: 'Gujarat' },
  'ghaziabad': { lat: 28.6692, lon: 77.4538, state: 'Uttar Pradesh' },
  'ludhiana': { lat: 30.9010, lon: 75.8573, state: 'Punjab' },
  'agra': { lat: 27.1767, lon: 78.0081, state: 'Uttar Pradesh' },
  'nashik': { lat: 19.9975, lon: 73.7898, state: 'Maharashtra' },
  'faridabad': { lat: 28.4089, lon: 77.3178, state: 'Haryana' },
  'meerut': { lat: 28.9845, lon: 77.7064, state: 'Uttar Pradesh' },
  'rajkot': { lat: 22.3039, lon: 70.8022, state: 'Gujarat' },
  'srinagar': { lat: 34.0837, lon: 74.7973, state: 'Jammu and Kashmir' },
  'aurangabad': { lat: 19.8762, lon: 75.3433, state: 'Maharashtra' },
  'dhanbad': { lat: 23.7957, lon: 86.4304, state: 'Jharkhand' },
  'amritsar': { lat: 31.6340, lon: 74.8723, state: 'Punjab' },
  'allahabad': { lat: 25.4358, lon: 81.8463, state: 'Uttar Pradesh' },
  'ranchi': { lat: 23.3441, lon: 85.3096, state: 'Jharkhand' },
  'howrah': { lat: 22.5958, lon: 88.2636, state: 'West Bengal' },
  'coimbatore': { lat: 11.0168, lon: 76.9558, state: 'Tamil Nadu' },
  'jabalpur': { lat: 23.1815, lon: 79.9864, state: 'Madhya Pradesh' },
  'gwalior': { lat: 26.2183, lon: 78.1828, state: 'Madhya Pradesh' },
  'vijayawada': { lat: 16.5062, lon: 80.6480, state: 'Andhra Pradesh' },
  'jodhpur': { lat: 26.2389, lon: 73.0243, state: 'Rajasthan' },
  'madurai': { lat: 9.9252, lon: 78.1198, state: 'Tamil Nadu' },
  'raipur': { lat: 21.2514, lon: 81.6296, state: 'Chhattisgarh' },
  'kota': { lat: 25.2138, lon: 75.8648, state: 'Rajasthan' },
  'chandigarh': { lat: 30.7333, lon: 76.7794, state: 'Chandigarh' },
  'gurgaon': { lat: 28.4595, lon: 77.0266, state: 'Haryana' },
  'solapur': { lat: 17.6599, lon: 75.9064, state: 'Maharashtra' },
  'bareilly': { lat: 28.3670, lon: 79.4304, state: 'Uttar Pradesh' },
  'moradabad': { lat: 28.8386, lon: 78.7733, state: 'Uttar Pradesh' },
  'mysore': { lat: 12.2958, lon: 76.6394, state: 'Karnataka' },
  'salem': { lat: 11.6643, lon: 78.1460, state: 'Tamil Nadu' },
  'aligarh': { lat: 27.8974, lon: 78.0880, state: 'Uttar Pradesh' },
  'thiruvananthapuram': { lat: 8.5241, lon: 76.9366, state: 'Kerala' },
  'guntur': { lat: 16.3067, lon: 80.4365, state: 'Andhra Pradesh' },
  'saharanpur': { lat: 29.9680, lon: 77.5552, state: 'Uttar Pradesh' },
  'gorakhpur': { lat: 26.7606, lon: 83.3732, state: 'Uttar Pradesh' },
  'bikaner': { lat: 28.0229, lon: 73.3119, state: 'Rajasthan' },
  'amravati': { lat: 20.9374, lon: 77.7796, state: 'Maharashtra' },
  'noida': { lat: 28.5355, lon: 77.3910, state: 'Uttar Pradesh' },
  'jamshedpur': { lat: 22.8046, lon: 86.2029, state: 'Jharkhand' },
  'bhilai': { lat: 21.1938, lon: 81.3509, state: 'Chhattisgarh' },
  'cuttack': { lat: 20.4625, lon: 85.8828, state: 'Odisha' },
  'firozabad': { lat: 27.1592, lon: 78.3957, state: 'Uttar Pradesh' },
  'kochi': { lat: 9.9312, lon: 76.2673, state: 'Kerala' },
  'bhavnagar': { lat: 21.7645, lon: 72.1519, state: 'Gujarat' },
  'dehradun': { lat: 30.3165, lon: 78.0322, state: 'Uttarakhand' },
  'durgapur': { lat: 23.5204, lon: 87.3119, state: 'West Bengal' },
  'asansol': { lat: 23.6739, lon: 86.9524, state: 'West Bengal' },
  'nanded': { lat: 19.1383, lon: 77.2975, state: 'Maharashtra' },
  'kolhapur': { lat: 16.7050, lon: 74.2433, state: 'Maharashtra' },
  'ajmer': { lat: 26.4499, lon: 74.6399, state: 'Rajasthan' },
  'jamnagar': { lat: 22.4707, lon: 70.0577, state: 'Gujarat' },
  'ujjain': { lat: 23.1765, lon: 75.7885, state: 'Madhya Pradesh' },
  'siliguri': { lat: 26.7271, lon: 88.3953, state: 'West Bengal' },
  'jhansi': { lat: 25.4484, lon: 78.5685, state: 'Uttar Pradesh' },
  'jammu': { lat: 32.7266, lon: 74.8570, state: 'Jammu and Kashmir' },
  'mangalore': { lat: 12.9141, lon: 74.8560, state: 'Karnataka' },
  'erode': { lat: 11.3410, lon: 77.7172, state: 'Tamil Nadu' },
  'belgaum': { lat: 15.8497, lon: 74.4977, state: 'Karnataka' },
  'tirunelveli': { lat: 8.7139, lon: 77.7567, state: 'Tamil Nadu' },
  'gaya': { lat: 24.7914, lon: 85.0002, state: 'Bihar' },
  'jalgaon': { lat: 21.0077, lon: 75.5626, state: 'Maharashtra' },
  'udaipur': { lat: 24.5854, lon: 73.7125, state: 'Rajasthan' }
};

class CustomGeolocation {
  private config: GeolocationConfig;
  private cachedLocation: LocationData | null = null;
  private cacheExpiry: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  constructor(config: Partial<GeolocationConfig> = {}) {
    this.config = {
      enableBrowserLocation: true,
      enableIPGeolocation: true,
      enableAIGeolocation: true,
      timeout: 20000, // 20 seconds for better GPS accuracy
      highAccuracy: true, // Enable high accuracy GPS
      maxAge: 0, // Force fresh location
      fallbackLocation: { lat: 25.3176, lon: 82.9739, city: 'Varanasi', state: 'Uttar Pradesh' },
      ...config
    };
  }

  async getCurrentLocation(): Promise<LocationData> {
    console.log('🔍 Starting enhanced location detection...');
    
    // Check cache first (but with shorter duration)
    if (this.cachedLocation && Date.now() < this.cacheExpiry && this.cachedLocation.source !== 'default') {
      console.log('📍 Using cached location:', this.cachedLocation.city, this.cachedLocation.source);
      return this.cachedLocation;
    }

    // Try browser geolocation first with high accuracy
    if (this.config.enableBrowserLocation) {
      console.log('🌐 Attempting HIGH ACCURACY browser geolocation...');
      try {
        const browserLocation = await this.getBrowserLocation();
        if (browserLocation) {
          console.log('✅ Browser geolocation SUCCESS:', browserLocation.city, browserLocation.state);
          this.cacheLocation(browserLocation);
          return browserLocation;
        } else {
          console.log('❌ Browser geolocation returned null');
        }
      } catch (error) {
        console.log('❌ Browser geolocation failed:', error);
      }
    }

    // Try IP geolocation service
    if (this.config.enableIPGeolocation) {
      console.log('🌍 Attempting IP geolocation service...');
      try {
        const ipLocation = await this.getIPGeolocation();
        if (ipLocation) {
          console.log('✅ IP geolocation SUCCESS:', ipLocation.city, ipLocation.state);
          this.cacheLocation(ipLocation);
          return ipLocation;
        } else {
          console.log('❌ IP geolocation returned null');
        }
      } catch (error) {
        console.log('❌ IP geolocation failed:', error);
      }
    }

    // Try AI geolocation as fallback
    if (this.config.enableAIGeolocation) {
      console.log('🤖 Attempting AI geolocation...');
      try {
        const aiLocation = await this.getAIGeolocation();
        if (aiLocation) {
          console.log('✅ AI geolocation SUCCESS:', aiLocation.city, aiLocation.state);
          this.cacheLocation(aiLocation);
          return aiLocation;
        } else {
          console.log('❌ AI geolocation returned null');
        }
      } catch (error) {
        console.log('❌ AI geolocation failed:', error);
      }
    }

    // Final fallback to default location
    console.log('🏠 Using fallback location:', this.config.fallbackLocation.city);
    const fallbackLocation: LocationData = {
      lat: this.config.fallbackLocation.lat,
      lon: this.config.fallbackLocation.lon,
      city: this.config.fallbackLocation.city,
      state: this.config.fallbackLocation.state,
      country: 'India',
      accuracy: 'low',
      source: 'default'
    };
    
    this.cacheLocation(fallbackLocation);
    return fallbackLocation;
  }

  private async getBrowserLocation(): Promise<LocationData | null> {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        console.log('❌ Geolocation not supported by browser');
        resolve(null);
        return;
      }

      const options: PositionOptions = {
        enableHighAccuracy: this.config.highAccuracy,
        timeout: this.config.timeout,
        maximumAge: this.config.maxAge
      };

      console.log('📍 Browser geolocation options:', options);

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          console.log('📍 Raw GPS position:', position.coords.latitude, position.coords.longitude, 'accuracy:', position.coords.accuracy + 'm');
          
          try {
            const reverseGeocodedLocation = await this.reverseGeocode(
              position.coords.latitude,
              position.coords.longitude
            );
            
            if (reverseGeocodedLocation) {
              const locationData: LocationData = {
                ...reverseGeocodedLocation,
                accuracy: this.calculateAccuracyLevel(position.coords.accuracy),
                source: 'browser'
              };
              resolve(locationData);
            } else {
              // Fallback to nearest city if reverse geocoding fails
              const nearestCity = this.findNearestCity(position.coords.latitude, position.coords.longitude);
              const locationData: LocationData = {
                lat: position.coords.latitude,
                lon: position.coords.longitude,
                city: nearestCity.city,
                state: nearestCity.state,
                country: 'India',
                accuracy: this.calculateAccuracyLevel(position.coords.accuracy),
                source: 'browser'
              };
              resolve(locationData);
            }
          } catch (error) {
            console.log('❌ Reverse geocoding failed, using nearest city');
            const nearestCity = this.findNearestCity(position.coords.latitude, position.coords.longitude);
            const locationData: LocationData = {
              lat: position.coords.latitude,
              lon: position.coords.longitude,
              city: nearestCity.city,
              state: nearestCity.state,
              country: 'India',
              accuracy: this.calculateAccuracyLevel(position.coords.accuracy),
              source: 'browser'
            };
            resolve(locationData);
          }
        },
        (error) => {
          let errorMessage = 'Unknown error';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location permission denied by user';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information unavailable';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timeout';
              break;
          }
          console.log('❌ Browser geolocation error:', errorMessage);
          resolve(null);
        },
        options
      );
    });
  }

  private async getIPGeolocation(): Promise<LocationData | null> {
    try {
      console.log('🌐 Fetching IP geolocation...');
      const response = await fetch('https://api.ipgeolocation.io/ipgeo?apiKey=free&fields=city,state_prov,country_name,latitude,longitude');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('🌐 IP geolocation raw data:', data);
      
      if (data.latitude && data.longitude && data.city) {
        // Find nearest Indian city to improve accuracy
        const nearestCity = this.findNearestCity(parseFloat(data.latitude), parseFloat(data.longitude));
        
        return {
          lat: parseFloat(data.latitude),
          lon: parseFloat(data.longitude),
          city: nearestCity.city,
          state: nearestCity.state,
          country: 'India',
          accuracy: 'medium',
          source: 'ip_service'
        };
      }
      
      return null;
    } catch (error) {
      console.log('❌ IP geolocation service error:', error);
      return null;
    }
  }

  private async getAIGeolocation(): Promise<LocationData | null> {
    try {
      console.log('🤖 Attempting AI-based geolocation...');
      
      // This would integrate with Gemini AI to determine location
      // For now, return null as it requires API setup
      console.log('🤖 AI geolocation not implemented yet');
      return null;
    } catch (error) {
      console.log('❌ AI geolocation error:', error);
      return null;
    }
  }

  private async reverseGeocode(lat: number, lon: number): Promise<Omit<LocationData, 'accuracy' | 'source'> | null> {
    try {
      // Use a free reverse geocoding service
      const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.city && data.principalSubdivision) {
        return {
          lat,
          lon,
          city: data.city,
          state: data.principalSubdivision,
          country: data.countryName || 'India'
        };
      }
      
      return null;
    } catch (error) {
      console.log('❌ Reverse geocoding error:', error);
      return null;
    }
  }

  private findNearestCity(lat: number, lon: number): { city: string; state: string; distance: number } {
    let nearestCity = { city: 'Varanasi', state: 'Uttar Pradesh', distance: Infinity };
    
    for (const [cityKey, cityData] of Object.entries(INDIAN_CITIES)) {
      const distance = this.calculateDistance(lat, lon, cityData.lat, cityData.lon);
      if (distance < nearestCity.distance) {
        nearestCity = {
          city: cityKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          state: cityData.state,
          distance
        };
      }
    }
    
    console.log('📍 Nearest city:', nearestCity.city, nearestCity.state, `(${nearestCity.distance.toFixed(1)}km away)`);
    return nearestCity;
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  private calculateAccuracyLevel(accuracy: number | null): 'high' | 'medium' | 'low' {
    if (!accuracy) return 'low';
    if (accuracy <= 100) return 'high';
    if (accuracy <= 1000) return 'medium';
    return 'low';
  }

  private cacheLocation(location: LocationData): void {
    this.cachedLocation = location;
    this.cacheExpiry = Date.now() + this.CACHE_DURATION;
    console.log('💾 Location cached for', this.CACHE_DURATION / 60000, 'minutes');
  }

  public clearCache(): void {
    this.cachedLocation = null;
    this.cacheExpiry = 0;
    console.log('🗑️ Location cache cleared');
  }

  public setManualLocation(location: LocationData): void {
    const manualLocation: LocationData = {
      ...location,
      source: 'manual'
    };
    this.cacheLocation(manualLocation);
    console.log('📍 Manual location set:', location.city, location.state);
  }
}

// Export singleton instance
export const customGeolocation = new CustomGeolocation();
export default customGeolocation;
