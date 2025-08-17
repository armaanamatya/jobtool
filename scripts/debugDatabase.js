const mongoose = require('mongoose');
const Job = require('../models/Job');
require('dotenv').config();

async function debugDatabase() {
  console.log('🔍 Debugging database connection...');
  
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI;
    console.log('🔗 Connecting to:', mongoUri.substring(0, 50) + '...');
    
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');
    
    // Check database name
    console.log('📂 Database name:', mongoose.connection.db.databaseName);
    
    // List collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('📁 Collections:', collections.map(c => c.name));
    
    // Count jobs
    const jobCount = await Job.countDocuments();
    console.log(`📊 Total jobs in database: ${jobCount}`);
    
    // Get first few jobs
    const jobs = await Job.find().limit(3);
    console.log(`📄 Sample jobs:`);
    jobs.forEach((job, index) => {
      console.log(`  ${index + 1}. ${job.company}: ${job.position} (${job.status})`);
    });
    
    await mongoose.connection.close();
    
  } catch (error) {
    console.error('❌ Database debug failed:', error.message);
  }
}

if (require.main === module) {
  debugDatabase();
}

module.exports = debugDatabase;