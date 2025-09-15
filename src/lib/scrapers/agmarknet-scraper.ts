// Real-time web scraper for agmarknet.gov.in
// Extracts actual market prices from the government website

import * as cheerio from 'cheerio';

export interface ScrapedPriceData {
  commodity: string;
  market: string;
  state: string;
  minPrice: number;
  maxPrice: number;
  modalPrice: number;
  date: string;
  arrivals?: string;
}

export interface AgmarknetScraperOptions {
  commodity: string;
  state: string;
  market?: string;
  fromDate?: string;
  toDate?: string;
}

export class AgmarknetScraper {
  private baseUrl = 'https://agmarknet.gov.in';
  private userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

  // Commodity mapping for agmarknet search
  private commodityMapping: Record<string, string> = {
    'Rice': 'Rice',
    'Wheat': 'Wheat',
    'Potato': 'Potato',
    'Onion': 'Onion',
    'Tomato': 'Tomato',
    'Sugarcane': 'Sugarcane',
    'Cotton': 'Cotton',
    'Maize': 'Maize',
    'Soybean': 'Soybean',
    'Groundnut': 'Groundnut',
    'Mustard': 'Mustard Seed',
    'Turmeric': 'Turmeric',
    'Chilli': 'Chilli',
    'Coriander': 'Coriander',
    'Cumin': 'Cumin',
    'Ginger': 'Ginger',
    'Garlic': 'Garlic',
    'Cabbage': 'Cabbage',
    'Cauliflower': 'Cauliflower',
    'Carrot': 'Carrot'
  };

  // State mapping for agmarknet
  private stateMapping: Record<string, string> = {
    'Uttar Pradesh': 'Uttar Pradesh',
    'Maharashtra': 'Maharashtra',
    'Punjab': 'Punjab',
    'Haryana': 'Haryana',
    'Rajasthan': 'Rajasthan',
    'Gujarat': 'Gujarat',
    'Madhya Pradesh': 'Madhya Pradesh',
    'Bihar': 'Bihar',
    'West Bengal': 'West Bengal',
    'Karnataka': 'Karnataka',
    'Tamil Nadu': 'Tamil Nadu',
    'Andhra Pradesh': 'Andhra Pradesh'
  };

  async scrapePrices(options: AgmarknetScraperOptions): Promise<ScrapedPriceData[]> {
    try {
      console.log('🌾 Starting agmarknet scraping for:', options);

      // Get today's date in DD/MM/YYYY format
      const today = new Date();
      const fromDate = options.fromDate || this.formatDate(today);
      const toDate = options.toDate || fromDate;

      // Map commodity and state names
      const commodity = this.commodityMapping[options.commodity] || options.commodity;
      const state = this.stateMapping[options.state] || options.state;

      // Construct the search URL for price and arrivals report
      const searchUrl = `${this.baseUrl}/PriceAndArrivals/DatewiseCommodityReport.aspx`;
      
      console.log('📡 Fetching agmarknet page...');

      // First, get the page to extract form data and viewstate
      const initialResponse = await fetch(searchUrl, {
        method: 'GET',
        headers: {
          'User-Agent': this.userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1'
        },
        signal: AbortSignal.timeout(15000)
      });

      if (!initialResponse.ok) {
        throw new Error(`Failed to fetch agmarknet page: ${initialResponse.status}`);
      }

      const initialHtml = await initialResponse.text();
      const $ = cheerio.load(initialHtml);

      // Extract form data needed for POST request
      const viewState = $('input[name="__VIEWSTATE"]').val() as string;
      const viewStateGenerator = $('input[name="__VIEWSTATEGENERATOR"]').val() as string;
      const eventValidation = $('input[name="__EVENTVALIDATION"]').val() as string;

      if (!viewState) {
        throw new Error('Could not extract ViewState from agmarknet page');
      }

      console.log('🔍 Submitting search form...');

      // Prepare form data for search
      const formData = new URLSearchParams({
        '__VIEWSTATE': viewState,
        '__VIEWSTATEGENERATOR': viewStateGenerator || '',
        '__EVENTVALIDATION': eventValidation || '',
        'ctl00$ContentPlaceHolder1$ddlCommodity': commodity,
        'ctl00$ContentPlaceHolder1$ddlState': state,
        'ctl00$ContentPlaceHolder1$ddlDistrict': '', // Let it auto-select
        'ctl00$ContentPlaceHolder1$ddlMarket': options.market || '', // Let it auto-select
        'ctl00$ContentPlaceHolder1$txtFromDate': fromDate,
        'ctl00$ContentPlaceHolder1$txtToDate': toDate,
        'ctl00$ContentPlaceHolder1$btnSubmit': 'Submit'
      });

      // Submit the search form
      const searchResponse = await fetch(searchUrl, {
        method: 'POST',
        headers: {
          'User-Agent': this.userAgent,
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Referer': searchUrl
        },
        body: formData.toString(),
        signal: AbortSignal.timeout(20000)
      });

      if (!searchResponse.ok) {
        throw new Error(`Search request failed: ${searchResponse.status}`);
      }

      const resultHtml = await searchResponse.text();
      const result$ = cheerio.load(resultHtml);

      console.log('📊 Parsing price data...');

      // Parse the results table
      const priceData: ScrapedPriceData[] = [];
      const dataTable = result$('table[id*="GridView"]').first();

      if (dataTable.length === 0) {
        console.log('⚠️ No data table found, checking for error messages...');
        const errorMsg = result$('.error, .alert, .message').text().trim();
        if (errorMsg) {
          console.log('Error from agmarknet:', errorMsg);
        }
        throw new Error('No price data found for the specified criteria');
      }

      // Extract data from table rows
      dataTable.find('tr').each((index, row) => {
        if (index === 0) return; // Skip header row

        const cells = result$(row).find('td');
        if (cells.length >= 6) {
          const marketName = result$(cells[1]).text().trim();
          const minPriceText = result$(cells[3]).text().trim();
          const maxPriceText = result$(cells[4]).text().trim();
          const modalPriceText = result$(cells[5]).text().trim();
          const dateText = result$(cells[0]).text().trim();
          const arrivalsText = result$(cells[2]).text().trim();

          // Parse prices (remove commas and convert to numbers)
          const minPrice = parseFloat(minPriceText.replace(/,/g, '')) || 0;
          const maxPrice = parseFloat(maxPriceText.replace(/,/g, '')) || 0;
          const modalPrice = parseFloat(modalPriceText.replace(/,/g, '')) || Math.round((minPrice + maxPrice) / 2);

          if (minPrice > 0 || maxPrice > 0 || modalPrice > 0) {
            priceData.push({
              commodity: options.commodity,
              market: marketName || options.market || 'Unknown',
              state: options.state,
              minPrice,
              maxPrice,
              modalPrice,
              date: dateText || fromDate,
              arrivals: arrivalsText || undefined
            });
          }
        }
      });

      console.log(`✅ Successfully scraped ${priceData.length} price records from agmarknet`);
      return priceData;

    } catch (error) {
      console.error('❌ Agmarknet scraping failed:', error);
      throw error;
    }
  }

  private formatDate(date: Date): string {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  // Get available commodities
  async getAvailableCommodities(): Promise<string[]> {
    return Object.keys(this.commodityMapping);
  }

  // Get available states
  async getAvailableStates(): Promise<string[]> {
    return Object.keys(this.stateMapping);
  }
}

// Export singleton instance
export const agmarknetScraper = new AgmarknetScraper();
