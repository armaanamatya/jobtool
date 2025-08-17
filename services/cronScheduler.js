const cron = require('node-cron');
const EmailScraper = require('./emailScraper');
require('dotenv').config();

class CronScheduler {
  constructor() {
    this.scraper = new EmailScraper();
    this.isRunning = false;
  }

  async start() {
    console.log('🤖 Starting cron scheduler...');
    
    // Initialize the scraper once
    try {
      await this.scraper.initialize();
      console.log('✅ Email scraper initialized for cron jobs');
    } catch (error) {
      console.error('❌ Failed to initialize scraper:', error.message);
      return;
    }

    // Schedule daily scraping at 4:00 PM CDT (21:00 UTC during CDT, 22:00 UTC during CST)
    // CDT is UTC-5, CST is UTC-6. Using 21:00 UTC to handle CDT
    const cronExpression = '0 21 * * *'; // Every day at 9:00 PM UTC (4:00 PM CDT)
    
    cron.schedule(cronExpression, async () => {
      await this.runDailyScrape();
    }, {
      scheduled: true,
      timezone: "America/Chicago" // This automatically handles CDT/CST transitions
    });

    console.log('⏰ Daily scraper scheduled for 4:00 PM CDT');
    console.log('⏰ Next run will be logged when the time comes');
    
    // Optional: Schedule a test run every hour for testing (remove in production)
    // cron.schedule('0 * * * *', async () => {
    //   console.log('🧪 Running hourly test scrape...');
    //   await this.runDailyScrape();
    // });

    this.isRunning = true;
  }

  async runDailyScrape() {
    const timestamp = new Date().toLocaleString('en-US', { 
      timeZone: 'America/Chicago',
      dateStyle: 'full',
      timeStyle: 'long'
    });
    
    console.log(`\n🚀 Starting scheduled scrape at ${timestamp}`);
    
    try {
      const results = await this.scraper.scrapeAndReport(1); // Scrape last 1 day
      
      console.log('✅ Scheduled scrape completed successfully');
      console.log(`📊 Results: ${results.saved} new jobs, ${results.duplicates} duplicates`);
      
      // Log to file for monitoring
      await this.logResults(timestamp, results);
      
    } catch (error) {
      console.error('❌ Scheduled scrape failed:', error.message);
      await this.logError(timestamp, error);
    }
  }

  async logResults(timestamp, results) {
    const fs = require('fs').promises;
    const logEntry = `${timestamp} - SUCCESS: ${results.saved} new jobs, ${results.duplicates} duplicates, ${results.errors} errors\n`;
    
    try {
      await fs.appendFile('scraper.log', logEntry);
    } catch (error) {
      console.error('Failed to write to log file:', error.message);
    }
  }

  async logError(timestamp, error) {
    const fs = require('fs').promises;
    const logEntry = `${timestamp} - ERROR: ${error.message}\n`;
    
    try {
      await fs.appendFile('scraper.log', logEntry);
    } catch (logError) {
      console.error('Failed to write error to log file:', logError.message);
    }
  }

  stop() {
    console.log('🛑 Stopping cron scheduler...');
    this.isRunning = false;
    // Note: node-cron tasks will stop when the process exits
  }

  getStatus() {
    return {
      running: this.isRunning,
      nextRun: 'Daily at 4:00 PM CDT',
      timezone: 'America/Chicago'
    };
  }

  // Manual trigger for testing
  async runManualScrape() {
    console.log('🔧 Running manual scrape...');
    await this.runDailyScrape();
  }
}

module.exports = CronScheduler;