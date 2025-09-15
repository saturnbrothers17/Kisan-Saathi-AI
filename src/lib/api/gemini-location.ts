// Gemini AI-powered intelligent location detection for Kisan Saathi AI
import type { LocationData } from './custom-geolocation';

interface BrowserContext {
  userAgent?: string;
  timeZone?: string;
  language?: string;
  platform?: string;
  cookieEnabled?: boolean;
  onLine?: boolean;
  connection?: string;
  effectiveType?: string;
}

export class GeminiLocationService {
  private static instance: GeminiLocationService;
  private cache: Map<string, { data: LocationData; expiry: number }> = new Map();
  private readonly CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

  static getInstance(): GeminiLocationService {
    if (!GeminiLocationService.instance) {
      GeminiLocationService.instance = new GeminiLocationService();
    }
    return GeminiLocationService.instance;
  }

  private getBrowserContext(): BrowserContext {
    if (typeof window === 'undefined') return {};
    
    return {
      userAgent: navigator.userAgent,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language,
      platform: navigator.platform,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      // @ts-ignore - Check if connection API is available
      connection: navigator.connection?.type,
      // @ts-ignore
      effectiveType: navigator.connection?.effectiveType,
    };
  }

  private async getClientIP(): Promise<string | undefined> {
    try {
      // Use a simple IP detection service
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch (error) {
      console.warn('Failed to get client IP:', error);
      return undefined;
    }
  }

  private getCacheKey(context: BrowserContext, ip?: string): string {
    return `${ip || 'no-ip'}-${context.timeZone}-${context.language}`;
  }

  async detectLocation(fallbackCoords?: { lat: number; lon: number }): Promise<LocationData> {
    console.log('🤖 Gemini AI: Starting intelligent location detection...');
    
    try {
      const browserContext = this.getBrowserContext();
      const clientIP = await this.getClientIP();
      
      console.log('🤖 Browser context:', browserContext);
      console.log('🤖 Client IP:', clientIP ? `${clientIP.substring(0, 8)}...` : 'Not detected');

      // Check cache first
      const cacheKey = this.getCacheKey(browserContext, clientIP);
      const cached = this.cache.get(cacheKey);
      if (cached && Date.now() < cached.expiry) {
        console.log('🤖 Using cached Gemini location:', cached.data.city);
        return cached.data;
      }

      // Prepare input for Gemini AI
      const contextData = {
        ipAddress: clientIP,
        userAgent: browserContext.userAgent,
        timeZone: browserContext.timeZone,
        language: browserContext.language,
        networkInfo: {
          connection: browserContext.connection,
          effectiveType: browserContext.effectiveType,
        },
        browserData: {
          platform: browserContext.platform,
          cookieEnabled: browserContext.cookieEnabled,
          onLine: browserContext.onLine,
        },
      };

      console.log('🤖 Calling Gemini AI for location analysis...');

      // Call the API route for Gemini AI location detection
      const response = await fetch('/api/location/gemini', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contextData,
          fallbackCoordinates: fallbackCoords,
        }),
      });

      if (!response.ok) {
        throw new Error(`Gemini API failed: ${response.status}`);
      }

      const locationResult = await response.json();

      console.log('🤖 Gemini AI result:', {
        city: locationResult.city,
        state: locationResult.state,
        confidence: locationResult.confidence,
        reasoning: locationResult.reasoning?.substring(0, 100) + '...'
      });

      // Convert to LocationData format
      const locationData: LocationData = {
        lat: locationResult.latitude,
        lon: locationResult.longitude,
        city: locationResult.city,
        state: locationResult.state,
        country: locationResult.country || 'India',
        accuracy: locationResult.confidence > 0.8 ? 'high' : locationResult.confidence > 0.5 ? 'medium' : 'low',
        source: 'ai_service',
      };

      // Cache the result
      this.cache.set(cacheKey, {
        data: locationData,
        expiry: Date.now() + this.CACHE_DURATION
      });

      return locationData;

    } catch (error) {
      console.error('🤖 Gemini AI location detection failed:', error);
      
      // Fallback to a reasonable default for Indian farmers
      return {
        lat: fallbackCoords?.lat || 25.3176,
        lon: fallbackCoords?.lon || 82.9739,
        city: 'Varanasi',
        state: 'Uttar Pradesh',
        country: 'India',
        accuracy: 'low',
        source: 'default',
      };
    }
  }

  // Method to get location with multiple AI strategies
  async getSmartLocation(): Promise<LocationData> {
    console.log('🤖 Gemini AI: Multi-strategy location detection...');
    
    try {
      // Strategy 1: Pure AI inference from context
      const aiLocation = await this.detectLocation();
      
      if (aiLocation.accuracy === 'high') {
        console.log('🤖 High confidence AI location:', aiLocation.city);
        return aiLocation;
      }

      // Strategy 2: If we have medium confidence, try to enhance with additional context
      if (aiLocation.accuracy === 'medium') {
        console.log('🤖 Medium confidence, enhancing with additional context...');
        
        // Try to get more precise location using the AI result as a starting point
        const enhancedLocation = await this.detectLocation({
          lat: aiLocation.lat,
          lon: aiLocation.lon
        });

        return enhancedLocation;
      }

      // Strategy 3: Low confidence, return best guess
      console.log('🤖 Low confidence AI result, using as best available');
      return aiLocation;

    } catch (error) {
      console.error('🤖 Smart location detection failed:', error);
      
      return {
        lat: 25.3176,
        lon: 82.9739,
        city: 'Varanasi',
        state: 'Uttar Pradesh',
        country: 'India',
        accuracy: 'low',
        source: 'default',
      };
    }
  }
}

// Export singleton instance
export const geminiLocationService = GeminiLocationService.getInstance();
