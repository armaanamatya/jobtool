const EmailScraper = require('../services/emailScraper');
require('dotenv').config();

async function runScraper() {
  const scraper = new EmailScraper();
  
  try {
    // Initialize the scraper
    await scraper.initialize();
    
    // Get command line arguments
    const args = process.argv.slice(2);
    const daysBack = args[0] ? parseInt(args[0]) : 1;
    
    console.log(`🎯 Running scraper for last ${daysBack} day(s)`);
    
    // Run the scraper
    const results = await scraper.scrapeAndReport(daysBack);
    
    // Show final summary
    console.log('\n📋 Final Summary:');
    console.log(`   Emails processed: ${results.emails}`);
    console.log(`   Jobs extracted: ${results.jobs}`);
    console.log(`   New jobs saved: ${results.saved}`);
    console.log(`   Duplicates skipped: ${results.duplicates}`);
    if (results.errors > 0) {
      console.log(`   Errors encountered: ${results.errors}`);
    }
    
    if (results.saved > 0) {
      console.log('\n🎉 New jobs have been added to your database!');
      console.log('   You can now view them in your frontend application.');
    } else if (results.duplicates > 0) {
      console.log('\n ℹ️ No new jobs found - all jobs were already in the database.');
    } else {
      console.log('\n ℹ️ No jobs found in the specified time period.');
    }
    
  } catch (error) {
    console.error('\n❌ Scraper failed:', error.message);
    process.exit(1);
  } finally {
    // Clean up
    await scraper.close();
  }
}

// Handle command line usage
if (require.main === module) {
  console.log('🤖 SWEList Email Scraper');
  console.log('Usage: node scripts/runScraper.js [days]');
  console.log('Example: node scripts/runScraper.js 7  (scrape last 7 days)');
  console.log('');
  
  runScraper();
}

module.exports = runScraper;