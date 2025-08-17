const express = require('express');
const JobService = require('../services/jobService');

async function testApiRoutes() {
  console.log('🧪 Testing API routes...');
  
  try {
    // Test JobService directly
    const jobService = new JobService();
    const jobs = await jobService.getJobs();
    console.log(`✅ JobService works: Found ${jobs.length} jobs`);
    
    if (jobs.length > 0) {
      console.log('📄 Sample job:', {
        company: jobs[0].company,
        position: jobs[0].position,
        status: jobs[0].status,
        datePosted: jobs[0].datePosted
      });
    }
    
    // Test route import
    const jobsRouter = require('../routes/jobs');
    console.log('✅ Routes import successfully');
    
    await jobService.closeConnection();
    
  } catch (error) {
    console.error('❌ API test failed:', error.message);
  }
}

if (require.main === module) {
  testApiRoutes();
}

module.exports = testApiRoutes;