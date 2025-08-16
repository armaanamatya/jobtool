const GmailService = require('../services/gmailService');
const JobParser = require('../services/jobParser');

async function testJobParser() {
  console.log('🔍 Testing job parser with real SWEList emails...');
  
  const gmailService = new GmailService();
  const jobParser = new JobParser();
  
  try {
    // Initialize Gmail service
    await gmailService.initialize();
    
    // Fetch recent SWEList emails (last 7 days)
    console.log('📧 Fetching recent SWEList emails...');
    const emails = await gmailService.getSWEListEmails(7);
    
    console.log(`\n✅ Found ${emails.length} emails to process`);
    
    let totalJobs = [];
    
    // Process each email
    for (let i = 0; i < Math.min(emails.length, 3); i++) {
      const email = emails[i];
      console.log(`\n--- Processing Email ${i + 1} ---`);
      
      // Extract metadata
      const metadata = gmailService.extractEmailMetadata(email);
      console.log('📋 Subject:', metadata.subject);
      console.log('📅 Date:', metadata.date.toLocaleDateString());
      
      // Extract email body
      const body = gmailService.extractEmailBody(email);
      
      // Parse jobs from email
      const jobs = jobParser.parseJobsFromEmail(body, metadata.date);
      console.log(`💼 Found ${jobs.length} jobs in this email`);
      
      // Show first few jobs
      jobs.slice(0, 5).forEach((job, index) => {
        console.log(`  ${index + 1}. ${job.company}: ${job.position}`);
        if (job.location) console.log(`     📍 ${job.location}`);
        if (job.salaryRange) console.log(`     💰 ${job.salaryRange}`);
        console.log(`     🔗 ${job.applicationUrl.substring(0, 60)}...`);
      });
      
      if (jobs.length > 5) {
        console.log(`     ... and ${jobs.length - 5} more jobs`);
      }
      
      totalJobs.push(...jobs);
    }
    
    console.log(`\n📊 Summary:`);
    console.log(`   Total jobs found: ${totalJobs.length}`);
    
    // Deduplicate jobs
    const uniqueJobs = jobParser.deduplicateJobs(totalJobs);
    console.log(`   Unique jobs after deduplication: ${uniqueJobs.length}`);
    
    // Show some statistics
    const companies = [...new Set(uniqueJobs.map(job => job.company))];
    console.log(`   Unique companies: ${companies.length}`);
    
    // Show top 10 companies by job count
    const companyCounts = {};
    uniqueJobs.forEach(job => {
      companyCounts[job.company] = (companyCounts[job.company] || 0) + 1;
    });
    
    const topCompanies = Object.entries(companyCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10);
    
    console.log('\n🏆 Top 10 companies by job count:');
    topCompanies.forEach(([company, count], index) => {
      console.log(`   ${index + 1}. ${company}: ${count} jobs`);
    });
    
    console.log('\n🎉 Job parser test completed successfully!');
    
    return uniqueJobs;
    
  } catch (error) {
    console.error('❌ Job parser test failed:', error.message);
    console.error(error.stack);
  }
}

if (require.main === module) {
  testJobParser();
}

module.exports = testJobParser;