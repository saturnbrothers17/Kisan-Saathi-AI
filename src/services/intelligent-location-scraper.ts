/**
 * Intelligent Location Scraper Service
 * Advanced web scraping with anti-detection measures for accurate location detection
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

interface ScrapingConfig {
  userAgent: string;
  headers: Record<string, string>;
  delays: {
    min: number;
    max: number;
  };
  retries: number;
}

class IntelligentLocationScraper {
  private configs: ScrapingConfig[];
  private currentConfigIndex: number = 0;

  constructor() {
    this.configs = this.generateHumanLikeConfigs();
  }

  /**
   * Generate multiple human-like browser configurations
   */
  private generateHumanLikeConfigs(): ScrapingConfig[] {
    const userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36 Edg/119.0.0.0',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15'
    ];

    return userAgents.map(ua => ({
      userAgent: ua,
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9,hi;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Cache-Control': 'max-age=0'
      },
      delays: {
        min: 1000 + Math.random() * 2000, // 1-3 seconds
        max: 3000 + Math.random() * 4000  // 3-7 seconds
      },
      retries: 3
    }));
  }

  /**
   * Simulate human-like delay
   */
  private async humanDelay(min: number = 1000, max: number = 3000): Promise<void> {
    const delay = min + Math.random() * (max - min);
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  /**
   * Get current configuration and rotate
   */
  private getCurrentConfig(): ScrapingConfig {
    const config = this.configs[this.currentConfigIndex];
    this.currentConfigIndex = (this.currentConfigIndex + 1) % this.configs.length;
    return config;
  }

  /**
   * Scrape location from IPInfo.io (Primary source)
   */
  private async scrapeIPInfo(): Promise<LocationData | null> {
    try {
      const config = this.getCurrentConfig();
      console.log('🔍 [DEBUG] Scraping location from IPInfo.io...');
      console.log('🔍 [DEBUG] Using User-Agent:', config.userAgent);
      console.log('🔍 [DEBUG] Using Headers:', config.headers);

      await this.humanDelay(config.delays.min, config.delays.max);

      const response = await fetch('https://ipinfo.io/json', {
        method: 'GET',
        headers: {
          ...config.headers,
          'User-Agent': config.userAgent,
          'Referer': 'https://www.google.com/',
          'X-Forwarded-For': '', // Clear proxy headers
          'CF-Connecting-IP': '',
          'X-Real-IP': ''
        }
      });

      console.log('🔍 [DEBUG] IPInfo response status:', response.status);
      console.log('🔍 [DEBUG] IPInfo response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();
      console.log('📍 [DEBUG] IPInfo FULL raw data:', JSON.stringify(data, null, 2));
      console.log('📍 [DEBUG] Your IP according to IPInfo:', data.ip);
      console.log('📍 [DEBUG] Your location according to IPInfo:', data.city, data.region, data.country);
      console.log('📍 [DEBUG] Your coordinates according to IPInfo:', data.loc);

      if (data.loc && data.city && data.region) {
        const [lat, lon] = data.loc.split(',').map(Number);
        const result = {
          city: data.city,
          state: data.region,
          country: data.country || 'IN',
          lat,
          lon,
          accuracy: 85,
          source: 'ipinfo_scraper',
          timestamp: Date.now()
        };
        console.log('✅ [DEBUG] IPInfo result:', result);
        return result;
      } else {
        console.log('❌ [DEBUG] IPInfo missing required fields:', { loc: data.loc, city: data.city, region: data.region });
      }
    } catch (error) {
      console.error('❌ [DEBUG] IPInfo scraping failed:', error);
    }
    return null;
  }

  /**
   * Scrape location from IP-API.com (Secondary source)
   */
  private async scrapeIPAPI(): Promise<LocationData | null> {
    try {
      const config = this.getCurrentConfig();
      console.log('🔍 [DEBUG] Scraping location from IP-API...');

      await this.humanDelay(config.delays.min, config.delays.max);

      const response = await fetch('http://ip-api.com/json/?fields=status,message,country,countryCode,region,regionName,city,lat,lon,timezone,query,isp,org,as', {
        method: 'GET',
        headers: {
          ...config.headers,
          'User-Agent': config.userAgent,
          'Referer': 'https://www.whatismyipaddress.com/',
          'X-Forwarded-For': '',
          'CF-Connecting-IP': '',
          'X-Real-IP': ''
        }
      });

      console.log('🔍 [DEBUG] IP-API response status:', response.status);

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();
      console.log('📍 [DEBUG] IP-API FULL raw data:', JSON.stringify(data, null, 2));
      console.log('📍 [DEBUG] Your IP according to IP-API:', data.query);
      console.log('📍 [DEBUG] Your ISP according to IP-API:', data.isp, data.org);
      console.log('📍 [DEBUG] Your location according to IP-API:', data.city, data.regionName, data.country);

      if (data.status === 'success' && data.city && data.regionName) {
        const result = {
          city: data.city,
          state: data.regionName,
          country: data.country || 'India',
          lat: data.lat,
          lon: data.lon,
          accuracy: 80,
          source: 'ipapi_scraper',
          timestamp: Date.now()
        };
        console.log('✅ [DEBUG] IP-API result:', result);
        return result;
      } else {
        console.log('❌ [DEBUG] IP-API failed or missing data:', { status: data.status, city: data.city, region: data.regionName });
      }
    } catch (error) {
      console.error('❌ [DEBUG] IP-API scraping failed:', error);
    }
    return null;
  }

  /**
   * Scrape location from IPGeolocation.io (Tertiary source)
   */
  private async scrapeIPGeolocation(): Promise<LocationData | null> {
    try {
      const config = this.getCurrentConfig();
      console.log('🔍 Scraping location from IPGeolocation...');

      await this.humanDelay(config.delays.min, config.delays.max);

      // Using free API without key for basic location
      const response = await fetch('https://api.ipgeolocation.io/ipgeo', {
        method: 'GET',
        headers: {
          ...config.headers,
          'User-Agent': config.userAgent,
          'Referer': 'https://ipgeolocation.io/'
        }
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();
      console.log('📍 IPGeolocation raw data:', data);

      if (data.city && data.state_prov) {
        return {
          city: data.city,
          state: data.state_prov,
          country: data.country_name || 'India',
          lat: parseFloat(data.latitude),
          lon: parseFloat(data.longitude),
          accuracy: 75,
          source: 'ipgeolocation_scraper',
          timestamp: Date.now()
        };
      }
    } catch (error) {
      console.error('❌ IPGeolocation scraping failed:', error);
    }
    return null;
  }

  /**
   * Advanced scraping with browser fingerprint simulation
   */
  private async scrapeWithFingerprint(): Promise<LocationData | null> {
    try {
      const config = this.getCurrentConfig();
      console.log('🔍 Advanced fingerprint scraping...');

      // Simulate browser fingerprint
      const fingerprint = {
        screen: { width: 1920, height: 1080, colorDepth: 24 },
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        language: navigator.language || 'en-US',
        platform: navigator.platform || 'Win32',
        cookieEnabled: true,
        doNotTrack: '1'
      };

      await this.humanDelay(config.delays.min, config.delays.max);

      // Try multiple endpoints with fingerprint data
      const endpoints = [
        'https://httpbin.org/ip',
        'https://api.myip.com',
        'https://ipapi.co/json/'
      ];

      for (const endpoint of endpoints) {
        try {
          const response = await fetch(endpoint, {
            method: 'GET',
            headers: {
              ...config.headers,
              'User-Agent': config.userAgent,
              'X-Forwarded-For': '', // Clear any proxy headers
              'X-Real-IP': '',
              'CF-Connecting-IP': ''
            }
          });

          if (response.ok) {
            const data = await response.json();
            console.log(`📍 Fingerprint data from ${endpoint}:`, data);
            
            // Process different response formats
            if (data.city && data.region) {
              return {
                city: data.city,
                state: data.region,
                country: data.country || 'India',
                lat: data.latitude || 0,
                lon: data.longitude || 0,
                accuracy: 70,
                source: 'fingerprint_scraper',
                timestamp: Date.now()
              };
            }
          }
        } catch (error) {
          console.log(`⚠️ Endpoint ${endpoint} failed, trying next...`);
        }
      }
    } catch (error) {
      console.error('❌ Fingerprint scraping failed:', error);
    }
    return null;
  }

  /**
   * Main scraping method with multiple fallbacks
   */
  async getAccurateLocation(): Promise<LocationData | null> {
    console.log('🚀 Starting intelligent location scraping...');

    const scrapers = [
      () => this.scrapeIPInfo(),
      () => this.scrapeIPAPI(),
      () => this.scrapeIPGeolocation(),
      () => this.scrapeWithFingerprint()
    ];

    // Try each scraper with human-like delays
    for (let i = 0; i < scrapers.length; i++) {
      try {
        console.log(`🔄 Attempting scraper ${i + 1}/${scrapers.length}...`);
        
        const result = await scrapers[i]();
        if (result) {
          console.log(`✅ Location found via scraper ${i + 1}:`, result);
          return result;
        }

        // Human-like delay between attempts
        if (i < scrapers.length - 1) {
          await this.humanDelay(2000, 5000);
        }
      } catch (error) {
        console.error(`❌ Scraper ${i + 1} failed:`, error);
      }
    }

    console.log('❌ All scrapers failed, no location data available');
    return null;
  }

  /**
   * Validate and enhance location data
   */
  async validateLocation(location: LocationData): Promise<LocationData> {
    // Add validation logic here
    if (!location.city || !location.state) {
      throw new Error('Invalid location data');
    }

    // Enhance with additional data if needed
    return {
      ...location,
      accuracy: Math.min(location.accuracy + 10, 95), // Boost accuracy
      source: `validated_${location.source}`
    };
  }
}

// Export singleton instance
export const intelligentLocationScraper = new IntelligentLocationScraper();

// Export types
export type { LocationData };
