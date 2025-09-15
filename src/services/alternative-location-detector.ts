/**
 * Alternative Location Detection Methods
 * When IP geolocation fails due to ISP routing through different cities
 */

interface LocationData {
  city: string;
  state: string;
  country: string;
  lat: number;
  lon: number;
  accuracy: number;
  source: string;
  timestamp: number;
}

class AlternativeLocationDetector {
  
  /**
   * Method 1: Browser Timezone + Language Detection
   */
  async detectByTimezoneAndLanguage(): Promise<LocationData | null> {
    try {
      console.log('🕐 [ALT] Detecting location by timezone and language...');
      
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const language = navigator.language || 'en-US';
      
      console.log('🕐 [ALT] Detected timezone:', timezone);
      console.log('🗣️ [ALT] Detected language:', language);
      
      // Asia/Kolkata timezone covers ALL of India, so we can't use it for city detection
      console.log('⚠️ [ALT] Timezone detection not reliable for Indian cities (Asia/Kolkata covers entire subcontinent)');
      
      // Skip timezone-based detection for India since Asia/Kolkata is used nationwide
      if (timezone === 'Asia/Kolkata' || timezone === 'Asia/Calcutta') {
        console.log('⚠️ [ALT] Skipping timezone detection - Asia/Kolkata covers all of India');
        return null; // Don't guess location based on timezone
      }
      
      // Only use timezone for very specific regional timezones (if they exist)
      const specificTimezoneMap: { [key: string]: { city: string; state: string; lat: number; lon: number } } = {
        // Currently no city-specific timezones in India - all use Asia/Kolkata
      };
      
      const location = specificTimezoneMap[timezone];
      if (location) {
        return {
          city: location.city,
          state: location.state,
          country: 'India',
          lat: location.lat,
          lon: location.lon,
          accuracy: 60,
          source: 'timezone_detection',
          timestamp: Date.now()
        };
      }
      
    } catch (error) {
      console.error('❌ [ALT] Timezone detection failed:', error);
    }
    return null;
  }
  
  /**
   * Method 2: Screen Resolution + Connection Speed Analysis
   */
  async detectByScreenResolutionAndConnection(): Promise<LocationData | null> {
    try {
      console.log('📱 [ALT] Detecting location by device characteristics...');
      
      const screen = window.screen;
      const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
      
      console.log('📱 [ALT] Screen resolution:', screen.width, 'x', screen.height);
      console.log('🌐 [ALT] Connection info:', connection);
      
      // Analyze device characteristics to guess location type
      const isMobile = screen.width <= 768;
      const isHighRes = screen.width >= 1920;
      const connectionSpeed = connection?.effectiveType || 'unknown';
      
      console.log('📱 [ALT] Device analysis:', { isMobile, isHighRes, connectionSpeed });
      
      // Device heuristics are too unreliable for location detection
      console.log('⚠️ [ALT] Device heuristics too unreliable - skipping automatic guessing');
      
      // Don't make random guesses based on device characteristics
      // This leads to incorrect locations like Mumbai/Bangalore for everyone
      
    } catch (error) {
      console.error('❌ [ALT] Device detection failed:', error);
    }
    return null;
  }
  
  /**
   * Method 3: Manual Location Input with Local Storage
   */
  async getManualLocation(): Promise<LocationData | null> {
    try {
      console.log('👤 [ALT] Checking for manually set location...');
      
      const savedLocation = localStorage.getItem('kisan_manual_location');
      if (savedLocation) {
        const location = JSON.parse(savedLocation);
        console.log('👤 [ALT] Found saved manual location:', location);
        
        // Check if location is not too old (7 days)
        if (Date.now() - location.timestamp < 7 * 24 * 60 * 60 * 1000) {
          return {
            ...location,
            source: 'manual_input',
            accuracy: 95
          };
        }
      }
    } catch (error) {
      console.error('❌ [ALT] Manual location check failed:', error);
    }
    return null;
  }
  
  /**
   * Method 4: Crowd-sourced Location Database
   */
  async detectByCrowdsourcedData(): Promise<LocationData | null> {
    try {
      console.log('👥 [ALT] Checking crowd-sourced location data...');
      
      // Simulate checking a crowd-sourced database based on network characteristics
      const networkInfo = {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        screen: `${screen.width}x${screen.height}`
      };
      
      console.log('👥 [ALT] Network fingerprint:', networkInfo);
      
      // Language-based heuristics are too broad and inaccurate
      console.log('⚠️ [ALT] Language heuristics too unreliable - many users have English as default');
      
      // Don't make assumptions based on browser language
      // Most users have English (en-US) regardless of their actual location
      
    } catch (error) {
      console.error('❌ [ALT] Crowdsourced detection failed:', error);
    }
    return null;
  }
  
  /**
   * Method 5: Ask User for Location with Smart Suggestions
   */
  async promptUserLocation(): Promise<LocationData | null> {
    try {
      console.log('❓ [ALT] Prompting user for location...');
      
      // This would show a modal asking user to select their city
      // For now, we'll return null to indicate this method needs UI implementation
      return null;
      
    } catch (error) {
      console.error('❌ [ALT] User prompt failed:', error);
    }
    return null;
  }
  
  /**
   * Main method to try all alternative detection methods
   */
  async detectAlternativeLocation(): Promise<LocationData | null> {
    console.log('🔄 [ALT] Starting alternative location detection...');
    
    const methods = [
      () => this.getManualLocation(),
      () => this.detectByTimezoneAndLanguage(),
      () => this.detectByCrowdsourcedData(),
      () => this.detectByScreenResolutionAndConnection()
    ];
    
    for (const method of methods) {
      try {
        const result = await method();
        if (result) {
          console.log('✅ [ALT] Alternative location found:', result);
          return result;
        }
      } catch (error) {
        console.error('❌ [ALT] Method failed:', error);
      }
    }
    
    console.log('❌ [ALT] All alternative methods failed');
    return null;
  }
  
  /**
   * Save manual location input
   */
  saveManualLocation(city: string, state: string, lat: number, lon: number): void {
    const location = {
      city,
      state,
      country: 'India',
      lat,
      lon,
      accuracy: 95,
      source: 'manual_input',
      timestamp: Date.now()
    };
    
    localStorage.setItem('kisan_manual_location', JSON.stringify(location));
    console.log('💾 [ALT] Manual location saved:', location);
  }
}

export const alternativeLocationDetector = new AlternativeLocationDetector();
export type { LocationData };
