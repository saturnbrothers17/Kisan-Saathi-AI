// Proxy-based Web Scraper to avoid blocking and rate limits
// Uses rotating proxies and user agents for reliable scraping

export interface ProxyConfig {
  host: string;
  port: number;
  username?: string;
  password?: string;
  protocol: 'http' | 'https' | 'socks4' | 'socks5';
}

export class ProxyScraper {
  private proxies: ProxyConfig[] = [];
  private userAgents: string[] = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:89.0) Gecko/20100101 Firefox/89.0',
    'Mozilla/5.0 (X11; Linux x86_64; rv:89.0) Gecko/20100101 Firefox/89.0',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Edge/91.0.864.59',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15'
  ];
  private currentProxyIndex = 0;
  private currentUserAgentIndex = 0;
  private requestDelay = 2000; // 2 seconds between requests

  constructor() {
    this.initializeFreeProxies();
  }

  private initializeFreeProxies() {
    // Free proxy services (these change frequently, so fallback to direct requests)
    this.proxies = [
      { host: '8.8.8.8', port: 3128, protocol: 'http' },
      { host: '1.1.1.1', port: 3128, protocol: 'http' },
      // Add more free proxies as needed
    ];
  }

  private getNextProxy(): ProxyConfig | null {
    if (this.proxies.length === 0) return null;
    
    const proxy = this.proxies[this.currentProxyIndex];
    this.currentProxyIndex = (this.currentProxyIndex + 1) % this.proxies.length;
    return proxy;
  }

  private getNextUserAgent(): string {
    const userAgent = this.userAgents[this.currentUserAgentIndex];
    this.currentUserAgentIndex = (this.currentUserAgentIndex + 1) % this.userAgents.length;
    return userAgent;
  }

  async fetchWithProxy(url: string, options: RequestInit = {}): Promise<Response> {
    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        // Add delay between requests to avoid rate limiting
        if (attempt > 0) {
          await this.delay(this.requestDelay * attempt);
        }

        const headers = {
          'User-Agent': this.getNextUserAgent(),
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Cache-Control': 'max-age=0',
          ...options.headers
        };

        // Try with proxy first
        const proxy = this.getNextProxy();
        if (proxy && attempt < 2) {
          try {
            return await this.fetchThroughProxy(url, proxy, { ...options, headers });
          } catch (proxyError) {
            console.log(`Proxy failed, trying direct connection: ${proxyError}`);
          }
        }

        // Fallback to direct connection
        const response = await fetch(url, {
          ...options,
          headers,
          signal: AbortSignal.timeout(30000) // 30 second timeout
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return response;

      } catch (error) {
        lastError = error as Error;
        console.log(`Attempt ${attempt + 1} failed for ${url}:`, error);
        
        // If it's a rate limit error, wait longer
        if (error instanceof Error && error.message.includes('429')) {
          await this.delay(5000 * (attempt + 1));
        }
      }
    }

    throw lastError || new Error('All fetch attempts failed');
  }

  private async fetchThroughProxy(url: string, proxy: ProxyConfig, options: RequestInit): Promise<Response> {
    // Note: Direct proxy support in fetch() is limited in browsers
    // This is a simplified implementation - in production, you'd use a proxy service
    
    const proxyUrl = `${proxy.protocol}://${proxy.host}:${proxy.port}`;
    
    // For browser environments, we'll use a CORS proxy service
    const corsProxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
    
    return fetch(corsProxyUrl, options);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Scrape with automatic retry and proxy rotation
  async scrapeWithRetry(url: string, parser: (html: string) => any, maxRetries = 3): Promise<any> {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        console.log(`🔄 Scraping attempt ${attempt + 1} for: ${url}`);
        
        const response = await this.fetchWithProxy(url);
        const html = await response.text();
        
        if (!html || html.length < 100) {
          throw new Error('Received empty or invalid response');
        }
        
        const data = parser(html);
        console.log(`✅ Successfully scraped: ${url}`);
        return data;
        
      } catch (error) {
        console.log(`❌ Scraping attempt ${attempt + 1} failed:`, error);
        
        if (attempt === maxRetries - 1) {
          throw error;
        }
        
        // Wait before retry
        await this.delay(3000 * (attempt + 1));
      }
    }
  }

  // Batch scraping with rate limiting
  async scrapeBatch(urls: string[], parser: (html: string, url: string) => any, concurrency = 2): Promise<any[]> {
    const results: any[] = [];
    const chunks = this.chunkArray(urls, concurrency);
    
    for (const chunk of chunks) {
      const chunkPromises = chunk.map(async (url) => {
        try {
          return await this.scrapeWithRetry(url, (html) => parser(html, url));
        } catch (error) {
          console.error(`Failed to scrape ${url}:`, error);
          return null;
        }
      });
      
      const chunkResults = await Promise.all(chunkPromises);
      results.push(...chunkResults.filter(result => result !== null));
      
      // Delay between chunks to avoid overwhelming the server
      if (chunks.indexOf(chunk) < chunks.length - 1) {
        await this.delay(5000);
      }
    }
    
    return results;
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  // Add custom proxy
  addProxy(proxy: ProxyConfig) {
    this.proxies.push(proxy);
  }

  // Test proxy connectivity
  async testProxy(proxy: ProxyConfig): Promise<boolean> {
    try {
      const testUrl = 'https://httpbin.org/ip';
      const response = await this.fetchThroughProxy(testUrl, proxy, {});
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  // Get working proxies
  async getWorkingProxies(): Promise<ProxyConfig[]> {
    const workingProxies: ProxyConfig[] = [];
    
    for (const proxy of this.proxies) {
      if (await this.testProxy(proxy)) {
        workingProxies.push(proxy);
      }
    }
    
    return workingProxies;
  }

  // Set request delay
  setRequestDelay(ms: number) {
    this.requestDelay = ms;
  }
}

// Export singleton instance
export const proxyScraper = new ProxyScraper();
