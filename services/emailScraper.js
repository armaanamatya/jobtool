const { GmailService } = require('./gmailService');
const JobParser = require('./jobParser');
const JobService = require('./jobService');

class EmailScraper {
  constructor() {
    this.gmailService = new GmailService();
    this.jobParser = new JobParser();
    this.jobService = new JobService();
  }

  async initialize() {
    console.log('🚀 Initializing email scraper...');
    await this.gmailService.initialize();
    console.log('✅ Email scraper ready');
  }

  async scrapeRecentEmails(daysBack = 1) {
    console.log(`📧 Scraping SWEList emails from last ${daysBack} days...`);
    
    try {
      // Fetch emails
      const emails = await this.gmailService.getSWEListEmails(daysBack);
      console.log(`📬 Found ${emails.length} emails to process`);

      if (emails.length === 0) {
        console.log('ℹ️  No new emails found');
        return { emails: 0, jobs: 0, saved: 0, duplicates: 0, errors: 0, jobsData: [] };
      }

      let allJobs = [];

      // Process each email
      for (let i = 0; i < emails.length; i++) {
        const email = emails[i];
        console.log(`\n--- Processing email ${i + 1}/${emails.length} ---`);

        // Extract metadata
        const metadata = this.gmailService.extractEmailMetadata(email);
        console.log(`📋 Subject: ${metadata.subject}`);
        console.log(`📅 Date: ${metadata.date.toLocaleDateString()}`);

        // Extract body
        const body = this.gmailService.extractEmailBody(email);

        // Parse jobs
        const jobs = this.jobParser.parseJobsFromEmail(body, metadata.date);
        console.log(`💼 Extracted ${jobs.length} jobs from this email`);

        allJobs.push(...jobs);
      }

      // Deduplicate jobs
      const uniqueJobs = this.jobParser.deduplicateJobs(allJobs);
      console.log(`\n📊 Total jobs extracted: ${allJobs.length}`);
      console.log(`📊 Unique jobs after deduplication: ${uniqueJobs.length}`);

      // Save to database
      console.log('\n💾 Saving jobs to database...');
      const saveResults = await this.jobService.saveJobs(uniqueJobs);

      console.log('\n✅ Scraping completed!');
      console.log(`📧 Emails processed: ${emails.length}`);
      console.log(`💼 Jobs found: ${uniqueJobs.length}`);
      console.log(`💾 Jobs saved: ${saveResults.saved}`);
      console.log(`⚠️  Duplicates skipped: ${saveResults.duplicates}`);
      console.log(`❌ Errors: ${saveResults.errors}`);

      return {
        emails: emails.length,
        jobs: uniqueJobs.length,
        saved: saveResults.saved,
        duplicates: saveResults.duplicates,
        errors: saveResults.errors,
        jobsData: uniqueJobs // Include the actual job data for logging
      };

    } catch (error) {
      console.error('❌ Email scraping failed:', error.message);
      throw error;
    }
  }

  async scrapeAndReport(daysBack = 1) {
    const startTime = new Date();
    console.log(`🕐 Starting scrape at ${startTime.toLocaleString()}`);

    try {
      const results = await this.scrapeRecentEmails(daysBack);
      
      const endTime = new Date();
      const duration = ((endTime - startTime) / 1000).toFixed(2);
      
      console.log(`\n🎉 Scraping completed in ${duration} seconds`);
      
      // Get updated stats
      const stats = await this.jobService.getJobStats();
      console.log('\n📈 Current database stats:');
      console.log(`   Total jobs: ${stats.total}`);
      console.log(`   Posted: ${stats.posted}`);
      console.log(`   Applied: ${stats.applied}`);
      console.log(`   In process: ${stats.oa_round + stats.interview}`);
      console.log(`   Closed: ${stats.rejected + stats.offer + stats.ghosted}`);

      return results;
    } catch (error) {
      console.error('❌ Scraping failed:', error.message);
      throw error;
    }
  }

  async close() {
    await this.jobService.closeConnection();
  }
}

module.exports = EmailScraper;