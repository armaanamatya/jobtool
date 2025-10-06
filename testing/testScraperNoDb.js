const GmailService = require('../services/gmailService');
const JobParser = require('../services/jobParser');

async function testScraperNoDb() {
  console.log('🔍 Testing email scraper (without database)...');
  
  const gmailService = new GmailService();
  const jobParser = new JobParser();
  
  try {
    // Initialize Gmail service
    await gmailService.initialize();
    
    // Fetch recent emails
    console.log('📧 Fetching recent SWEList emails...');
    const emails = await gmailService.getSWEListEmails(3);
    
    console.log(`📬 Found ${emails.length} emails to process`);
    
    let allJobs = [];
    
    // Process each email
    for (let i = 0; i < emails.length; i++) {
      const email = emails[i];
      console.log(`\n--- Processing email ${i + 1}/${emails.length} ---`);
      
      // Extract metadata
      const metadata = gmailService.extractEmailMetadata(email);
      console.log(`📋 Subject: ${metadata.subject}`);
      console.log(`📅 Date: ${metadata.date.toLocaleDateString()}`);
      
      // Extract body
      const body = gmailService.extractEmailBody(email);
      
      // Parse jobs
      const jobs = jobParser.parseJobsFromEmail(body, metadata.date);
      console.log(`💼 Extracted ${jobs.length} jobs from this email`);
      
      // Show first 3 jobs from this email
      jobs.slice(0, 3).forEach((job, index) => {
        console.log(`  ${index + 1}. ${job.company}: ${job.position}`);
        console.log(`     📅 Posted: ${job.datePosted.toLocaleDateString()}`);
        console.log(`     🔗 Apply: ${job.applicationUrl.substring(0, 50)}...`);
      });
      
      if (jobs.length > 3) {
        console.log(`     ... and ${jobs.length - 3} more jobs`);
      }
      
      allJobs.push(...jobs);
    }
    
    // Deduplicate
    const uniqueJobs = jobParser.deduplicateJobs(allJobs);
    
    console.log(`\n📊 Summary:`);
    console.log(`   Total jobs extracted: ${allJobs.length}`);
    console.log(`   Unique jobs after deduplication: ${uniqueJobs.length}`);
    
    // Show company distribution
    const companies = {};
    uniqueJobs.forEach(job => {
      companies[job.company] = (companies[job.company] || 0) + 1;
    });
    
    const sortedCompanies = Object.entries(companies)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10);
    
    console.log('\n🏆 Top companies:');
    sortedCompanies.forEach(([company, count], index) => {
      console.log(`   ${index + 1}. ${company}: ${count} jobs`);
    });
    
    console.log('\n✅ Email scraper test completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Set up MongoDB connection string in .env file');
    console.log('2. Run the full scraper with: node scripts/runScraper.js');
    
    return uniqueJobs;
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

if (require.main === module) {
  testScraperNoDb();
}

module.exports = testScraperNoDb;