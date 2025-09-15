// Scraper Scheduler - Manages automated data collection
// Runs scrapers at optimal intervals to keep data fresh

import { agriculturalScraper } from './agricultural-web-scraper';

export interface ScrapingJob {
  id: string;
  name: string;
  url: string;
  interval: number; // minutes
  lastRun: Date | null;
  nextRun: Date;
  status: 'idle' | 'running' | 'completed' | 'failed';
  retryCount: number;
  maxRetries: number;
  data: any;
}

export class ScraperScheduler {
  private jobs: Map<string, ScrapingJob> = new Map();
  private isRunning = false;
  private intervalId: NodeJS.Timeout | null = null;

  constructor() {
    this.initializeJobs();
  }

  private initializeJobs() {
    // ICAR crop data - update every 6 hours
    this.addJob({
      id: 'icar-crops',
      name: 'ICAR Crop Recommendations',
      url: 'https://icar.org.in',
      interval: 360, // 6 hours
      lastRun: null,
      nextRun: new Date(),
      status: 'idle',
      retryCount: 0,
      maxRetries: 3,
      data: null
    });

    // Mandi prices - update every 2 hours
    this.addJob({
      id: 'mandi-prices',
      name: 'Government Mandi Prices',
      url: 'https://agmarknet.gov.in',
      interval: 120, // 2 hours
      lastRun: null,
      nextRun: new Date(),
      status: 'idle',
      retryCount: 0,
      maxRetries: 3,
      data: null
    });

    // Weather data - update every 30 minutes
    this.addJob({
      id: 'weather-data',
      name: 'Weather Information',
      url: 'https://mausam.imd.gov.in',
      interval: 30, // 30 minutes
      lastRun: null,
      nextRun: new Date(),
      status: 'idle',
      retryCount: 0,
      maxRetries: 3,
      data: null
    });

    // Soil health data - update daily
    this.addJob({
      id: 'soil-health',
      name: 'Soil Health Data',
      url: 'https://soilhealth.dac.gov.in',
      interval: 1440, // 24 hours
      lastRun: null,
      nextRun: new Date(),
      status: 'idle',
      retryCount: 0,
      maxRetries: 3,
      data: null
    });

    // Crop calendar - update weekly
    this.addJob({
      id: 'crop-calendar',
      name: 'Crop Calendar Information',
      url: 'https://agricoop.nic.in',
      interval: 10080, // 7 days
      lastRun: null,
      nextRun: new Date(),
      status: 'idle',
      retryCount: 0,
      maxRetries: 3,
      data: null
    });
  }

  addJob(job: ScrapingJob) {
    this.jobs.set(job.id, job);
  }

  removeJob(jobId: string) {
    this.jobs.delete(jobId);
  }

  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    console.log('🚀 Agricultural data scraper scheduler started');
    
    // Run immediately
    this.runScheduledJobs();
    
    // Then run every minute to check for due jobs
    this.intervalId = setInterval(() => {
      this.runScheduledJobs();
    }, 60000); // Check every minute
  }

  stop() {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    console.log('⏹️ Agricultural data scraper scheduler stopped');
  }

  private async runScheduledJobs() {
    const now = new Date();
    
    for (const [jobId, job] of this.jobs) {
      if (job.status === 'running') continue;
      if (now < job.nextRun) continue;
      
      await this.executeJob(job);
    }
  }

  private async executeJob(job: ScrapingJob) {
    console.log(`🔄 Running scraping job: ${job.name}`);
    job.status = 'running';
    job.lastRun = new Date();
    
    try {
      let data;
      
      switch (job.id) {
        case 'icar-crops':
          data = await agriculturalScraper.scrapeICARData('Uttar Pradesh', 'Rice');
          break;
          
        case 'mandi-prices':
          data = await agriculturalScraper.scrapeMandiPrices('Uttar Pradesh', 'Rice');
          break;
          
        case 'weather-data':
          data = await agriculturalScraper.scrapeWeatherData(25.3176, 82.9739, 'Varanasi');
          break;
          
        case 'soil-health':
          data = await agriculturalScraper.scrapeSoilHealthData('Uttar Pradesh', 'Varanasi');
          break;
          
        case 'crop-calendar':
          data = await agriculturalScraper.scrapeCropCalendar('Uttar Pradesh', 'Rice');
          break;
          
        default:
          throw new Error(`Unknown job: ${job.id}`);
      }
      
      job.data = data;
      job.status = 'completed';
      job.retryCount = 0;
      job.nextRun = new Date(Date.now() + job.interval * 60000);
      
      console.log(`✅ Completed scraping job: ${job.name}`);
      
      // Store data in cache
      this.cacheData(job.id, data);
      
    } catch (error) {
      console.error(`❌ Failed scraping job: ${job.name}`, error);
      
      job.retryCount++;
      job.status = 'failed';
      
      if (job.retryCount < job.maxRetries) {
        // Retry in 5 minutes
        job.nextRun = new Date(Date.now() + 5 * 60000);
        job.status = 'idle';
        console.log(`🔄 Will retry job: ${job.name} (${job.retryCount}/${job.maxRetries})`);
      } else {
        // Max retries reached, schedule for next normal interval
        job.nextRun = new Date(Date.now() + job.interval * 60000);
        console.log(`⚠️ Max retries reached for job: ${job.name}`);
      }
    }
  }

  private cacheData(jobId: string, data: any) {
    try {
      const cacheKey = `scraper_${jobId}`;
      const cacheData = {
        data,
        timestamp: new Date().toISOString(),
        jobId
      };
      
      // Store in localStorage for browser persistence
      if (typeof window !== 'undefined') {
        localStorage.setItem(cacheKey, JSON.stringify(cacheData));
      }
      
      console.log(`💾 Cached data for job: ${jobId}`);
    } catch (error) {
      console.error('Failed to cache data:', error);
    }
  }

  getCachedData(jobId: string): any {
    try {
      if (typeof window === 'undefined') return null;
      
      const cacheKey = `scraper_${jobId}`;
      const cached = localStorage.getItem(cacheKey);
      
      if (cached) {
        const cacheData = JSON.parse(cached);
        const age = Date.now() - new Date(cacheData.timestamp).getTime();
        const job = this.jobs.get(jobId);
        
        // Return cached data if it's still fresh
        if (job && age < job.interval * 60000) {
          return cacheData.data;
        }
      }
      
      return null;
    } catch (error) {
      console.error('Failed to get cached data:', error);
      return null;
    }
  }

  getJobStatus(): ScrapingJob[] {
    return Array.from(this.jobs.values());
  }

  getJobData(jobId: string): any {
    const job = this.jobs.get(jobId);
    if (job && job.data) {
      return job.data;
    }
    
    // Try to get from cache
    return this.getCachedData(jobId);
  }

  // Force run a specific job
  async forceRunJob(jobId: string): Promise<any> {
    const job = this.jobs.get(jobId);
    if (!job) {
      throw new Error(`Job not found: ${jobId}`);
    }
    
    if (job.status === 'running') {
      throw new Error(`Job already running: ${jobId}`);
    }
    
    await this.executeJob(job);
    return job.data;
  }

  // Get fresh data for a specific category
  async getFreshData(category: 'crops' | 'prices' | 'weather' | 'soil' | 'calendar', location?: any): Promise<any> {
    const jobMap = {
      'crops': 'icar-crops',
      'prices': 'mandi-prices', 
      'weather': 'weather-data',
      'soil': 'soil-health',
      'calendar': 'crop-calendar'
    };
    
    const jobId = jobMap[category];
    if (!jobId) {
      throw new Error(`Unknown category: ${category}`);
    }
    
    // First try to get cached data
    const cached = this.getCachedData(jobId);
    if (cached) {
      return cached;
    }
    
    // If no cached data, force run the job
    return await this.forceRunJob(jobId);
  }
}

// Export singleton instance
export const scraperScheduler = new ScraperScheduler();
