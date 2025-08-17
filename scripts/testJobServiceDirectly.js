const JobService = require('../services/jobService');
require('dotenv').config();

async function testJobServiceDirectly() {
  console.log('🧪 Testing JobService directly...');
  
  const jobService = new JobService();
  
  try {
    console.log('📥 Calling getJobs() method...');
    const jobs = await jobService.getJobs();
    console.log(`✅ JobService.getJobs() returned ${jobs.length} jobs`);
    
    if (jobs.length > 0) {
      console.log('📄 First 3 jobs:');
      jobs.slice(0, 3).forEach((job, index) => {
        console.log(`  ${index + 1}. ${job.company}: ${job.position} (${job.status})`);
        console.log(`     Posted: ${job.datePosted}`);
        console.log(`     URL: ${job.applicationUrl ? job.applicationUrl.substring(0, 50) + '...' : 'N/A'}`);
      });
    }
    
    // Test with filters
    console.log('\n🔍 Testing with status filter...');
    const postedJobs = await jobService.getJobs({ status: 'posted' });
    console.log(`✅ Found ${postedJobs.length} jobs with status 'posted'`);
    
    // Test stats
    console.log('\n📊 Testing getJobStats()...');
    const stats = await jobService.getJobStats();
    console.log('Stats:', stats);
    
    await jobService.closeConnection();
    
  } catch (error) {
    console.error('❌ JobService test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

if (require.main === module) {
  testJobServiceDirectly();
}

module.exports = testJobServiceDirectly;