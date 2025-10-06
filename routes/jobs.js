const express = require('express');
const router = express.Router();
const JobService = require('../services/jobService');

const jobService = new JobService();

// GET /api/jobs - Get all jobs with optional filters
router.get('/', async (req, res) => {
  try {
    const filters = {};
    
    // Parse query parameters
    if (req.query.status) {
      filters.status = req.query.status;
    }
    
    if (req.query.company) {
      filters.company = req.query.company;
    }
    
    if (req.query.position) {
      filters.position = req.query.position;
    }
    
    if (req.query.datePostedAfter) {
      filters.datePostedAfter = req.query.datePostedAfter;
    }
    
    if (req.query.datePostedBefore) {
      filters.datePostedBefore = req.query.datePostedBefore;
    }
    
    if (req.query.limit) {
      filters.limit = parseInt(req.query.limit);
    }

    const jobs = await jobService.getJobs(filters);
    
    // Convert MongoDB documents to plain objects and format dates
    const formattedJobs = jobs.map(job => ({
      _id: job._id.toString(),
      company: job.company,
      position: job.position,
      status: job.status,
      datePosted: job.datePosted.toISOString(),
      dateApplied: job.dateApplied ? job.dateApplied.toISOString() : null,
      lastUpdated: job.lastUpdated.toISOString(),
      emailThreadId: job.emailThreadId,
      notes: job.notes,
      salaryRange: job.salaryRange,
      location: job.location,
      applicationUrl: job.applicationUrl
    }));

    res.json(formattedJobs);
  } catch (error) {
    console.error('Error fetching jobs:', error.message);
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
});

// GET /api/jobs/stats - Get job statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = await jobService.getJobStats();
    res.json(stats);
  } catch (error) {
    console.error('Error fetching job stats:', error.message);
    res.status(500).json({ error: 'Failed to fetch job statistics' });
  }
});

// GET /api/jobs/recent - Get recent jobs (last 7 days)
router.get('/recent', async (req, res) => {
  try {
    const days = req.query.days ? parseInt(req.query.days) : 7;
    const jobs = await jobService.getRecentJobs(days);
    
    const formattedJobs = jobs.map(job => ({
      _id: job._id.toString(),
      company: job.company,
      position: job.position,
      status: job.status,
      datePosted: job.datePosted.toISOString(),
      dateApplied: job.dateApplied ? job.dateApplied.toISOString() : null,
      lastUpdated: job.lastUpdated.toISOString(),
      emailThreadId: job.emailThreadId,
      notes: job.notes,
      salaryRange: job.salaryRange,
      location: job.location,
      applicationUrl: job.applicationUrl
    }));

    res.json(formattedJobs);
  } catch (error) {
    console.error('Error fetching recent jobs:', error.message);
    res.status(500).json({ error: 'Failed to fetch recent jobs' });
  }
});

// PATCH /api/jobs/:id - Update job status and details
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes, dateApplied, location, salaryRange, applicationUrl } = req.body;

    const additionalData = {};
    if (notes !== undefined) additionalData.notes = notes;
    if (dateApplied) additionalData.dateApplied = new Date(dateApplied);
    if (location !== undefined) additionalData.location = location;
    if (salaryRange !== undefined) additionalData.salaryRange = salaryRange;
    if (applicationUrl !== undefined) additionalData.applicationUrl = applicationUrl;

    let updatedJob;
    if (status) {
      // If status is provided, use the existing updateJobStatus method
      updatedJob = await jobService.updateJobStatus(id, status, additionalData);
    } else {
      // If no status, just update the job details
      updatedJob = await jobService.updateJob(id, additionalData);
    }
    
    const formattedJob = {
      _id: updatedJob._id.toString(),
      company: updatedJob.company,
      position: updatedJob.position,
      status: updatedJob.status,
      datePosted: updatedJob.datePosted.toISOString(),
      dateApplied: updatedJob.dateApplied ? updatedJob.dateApplied.toISOString() : null,
      lastUpdated: updatedJob.lastUpdated.toISOString(),
      emailThreadId: updatedJob.emailThreadId,
      notes: updatedJob.notes,
      salaryRange: updatedJob.salaryRange,
      location: updatedJob.location,
      applicationUrl: updatedJob.applicationUrl
    };

    res.json(formattedJob);
  } catch (error) {
    console.error('Error updating job:', error.message);
    if (error.message === 'Job not found') {
      res.status(404).json({ error: 'Job not found' });
    } else {
      res.status(500).json({ error: 'Failed to update job' });
    }
  }
});

// DELETE /api/jobs/:id - Delete job
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deletedJob = await jobService.deleteJob(id);
    
    res.json({ 
      message: 'Job deleted successfully',
      job: {
        _id: deletedJob._id.toString(),
        company: deletedJob.company,
        position: deletedJob.position
      }
    });
  } catch (error) {
    console.error('Error deleting job:', error.message);
    if (error.message === 'Job not found') {
      res.status(404).json({ error: 'Job not found' });
    } else {
      res.status(500).json({ error: 'Failed to delete job' });
    }
  }
});

module.exports = router;