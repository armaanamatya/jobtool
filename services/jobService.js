const mongoose = require('mongoose');
const Job = require('../models/Job');

class JobService {
  
  async connectDatabase() {
    try {
      if (mongoose.connection.readyState === 0) {
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/jobtool';
        await mongoose.connect(mongoUri);
        console.log('✅ Connected to MongoDB');
      }
    } catch (error) {
      console.error('❌ MongoDB connection failed:', error.message);
      throw error;
    }
  }

  async saveJobs(jobs) {
    if (!Array.isArray(jobs) || jobs.length === 0) {
      console.log('No jobs to save');
      return { saved: 0, duplicates: 0, errors: 0 };
    }

    await this.connectDatabase();

    let saved = 0;
    let duplicates = 0;
    let errors = 0;

    for (const jobData of jobs) {
      try {
        // Check if job already exists (by company + position + applicationUrl)
        const existingJob = await Job.findOne({
          company: jobData.company,
          position: jobData.position,
          applicationUrl: jobData.applicationUrl
        });

        if (existingJob) {
          duplicates++;
          console.log(`⚠️  Duplicate job: ${jobData.company} - ${jobData.position}`);
          continue;
        }

        // Create new job
        const job = new Job(jobData);
        await job.save();
        saved++;
        console.log(`✅ Saved: ${jobData.company} - ${jobData.position}`);

      } catch (error) {
        errors++;
        console.error(`❌ Error saving job ${jobData.company} - ${jobData.position}:`, error.message);
      }
    }

    return { saved, duplicates, errors };
  }

  async getJobs(filters = {}) {
    await this.connectDatabase();
    
    const query = {};
    
    // Apply filters
    if (filters.status) {
      query.status = filters.status;
    }
    
    if (filters.company) {
      query.company = { $regex: filters.company, $options: 'i' };
    }
    
    if (filters.position) {
      query.position = { $regex: filters.position, $options: 'i' };
    }
    
    if (filters.datePostedAfter) {
      query.datePosted = { $gte: new Date(filters.datePostedAfter) };
    }
    
    if (filters.datePostedBefore) {
      query.datePosted = { ...query.datePosted, $lte: new Date(filters.datePostedBefore) };
    }

    try {
      const jobs = await Job.find(query)
        .sort({ datePosted: -1 })
        .limit(filters.limit || 1000);
      
      return jobs;
    } catch (error) {
      console.error('Error fetching jobs:', error.message);
      throw error;
    }
  }

  async getJobStats() {
    await this.connectDatabase();
    
    try {
      const stats = await Job.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);

      const result = {
        total: 0,
        posted: 0,
        applied: 0,
        oa_round: 0,
        interview: 0,
        rejected: 0,
        offer: 0,
        ghosted: 0
      };

      stats.forEach(stat => {
        result[stat._id] = stat.count;
        result.total += stat.count;
      });

      // Calculate response rate
      const responded = result.oa_round + result.interview + result.rejected + result.offer;
      result.responseRate = result.applied > 0 ? (responded / result.applied) * 100 : 0;

      return result;
    } catch (error) {
      console.error('Error getting job stats:', error.message);
      throw error;
    }
  }

  async updateJobStatus(jobId, newStatus, additionalData = {}) {
    await this.connectDatabase();
    
    try {
      const updateData = {
        status: newStatus,
        lastUpdated: new Date(),
        ...additionalData
      };

      // Set dateApplied if status is changing to 'applied'
      if (newStatus === 'applied' && !additionalData.dateApplied) {
        updateData.dateApplied = new Date();
      }

      const job = await Job.findByIdAndUpdate(
        jobId,
        updateData,
        { new: true }
      );

      if (!job) {
        throw new Error('Job not found');
      }

      console.log(`✅ Updated job status: ${job.company} - ${job.position} -> ${newStatus}`);
      return job;
    } catch (error) {
      console.error('Error updating job status:', error.message);
      throw error;
    }
  }

  async deleteJob(jobId) {
    await this.connectDatabase();
    
    try {
      const job = await Job.findByIdAndDelete(jobId);
      
      if (!job) {
        throw new Error('Job not found');
      }

      console.log(`✅ Deleted job: ${job.company} - ${job.position}`);
      return job;
    } catch (error) {
      console.error('Error deleting job:', error.message);
      throw error;
    }
  }

  async getRecentJobs(days = 7) {
    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - days);
    
    return this.getJobs({
      datePostedAfter: dateThreshold,
      limit: 1000
    });
  }

  async closeConnection() {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
      console.log('📪 MongoDB connection closed');
    }
  }
}

module.exports = JobService;