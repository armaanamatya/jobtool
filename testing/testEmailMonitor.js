const { EmailMonitor } = require('../services/emailMonitor');
const { EmailClassifier } = require('../services/emailClassifier');
const { JobMatcher } = require('../services/jobMatcher');
const { StatusUpdater } = require('../services/statusUpdater');
const { JobLogger } = require('../services/jobLogger');
const Job = require('../models/Job');
const mongoose = require('mongoose');

const logger = new JobLogger('email_monitor_test');

async function connectToDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/jobtool');
    logger.log('Connected to MongoDB');
  } catch (error) {
    logger.error('Failed to connect to MongoDB:', error);
    throw error;
  }
}

async function testEmailClassification() {
  logger.log('=== Testing Email Classification ===');
  
  const classifier = new EmailClassifier();
  
  // Test emails with different classifications
  const testEmails = [
    {
      emailId: 'test_rejection_1',
      subject: 'Thank you for your interest - Software Engineer position',
      content: 'Thank you for your interest in the Software Engineer position at Google. Unfortunately, we have decided to move forward with other candidates at this time.',
      sender: 'hr@google.com'
    },
    {
      emailId: 'test_interview_1', 
      subject: 'Interview Invitation - Frontend Developer Role',
      content: 'Hi there! We would like to schedule an interview for the Frontend Developer position. Please use this Calendly link to book a time that works for you.',
      sender: 'recruiting@stripe.com'
    },
    {
      emailId: 'test_oa_1',
      subject: 'Next Steps - Technical Assessment',
      content: 'Thank you for applying to the Backend Engineer role. Please complete the following online assessment on HackerRank within 48 hours.',
      sender: 'talent@meta.com'
    },
    {
      emailId: 'test_offer_1',
      subject: 'Congratulations - Job Offer',
      content: 'Congratulations! We are pleased to extend an offer for the Software Engineer position. The compensation package details are attached.',
      sender: 'hr@microsoft.com'
    }
  ];
  
  for (const email of testEmails) {
    const result = await classifier.classify(email);
    logger.log(`Email ${email.emailId}:`, {
      classification: result.type,
      confidence: (result.confidence * 100).toFixed(1) + '%',
      subject: email.subject
    });
  }
}

async function testJobMatching() {
  logger.log('=== Testing Job Matching ===');
  
  const jobMatcher = new JobMatcher();
  const classifier = new EmailClassifier();
  
  // First, let's see what jobs are in the database
  const jobs = await Job.find({ status: 'applied' }).limit(5);
  logger.log(`Found ${jobs.length} jobs with 'applied' status for testing`);
  
  if (jobs.length === 0) {
    logger.log('No jobs with applied status found. Creating test job...');
    
    // Create a test job
    const testJob = new Job({
      company: 'Google',
      position: 'Software Engineer',
      status: 'applied',
      datePosted: new Date(),
      dateApplied: new Date()
    });
    
    await testJob.save();
    logger.log('Created test job:', {
      id: testJob._id,
      company: testJob.company,
      position: testJob.position
    });
    
    jobs.push(testJob);
  }
  
  // Test email that should match
  const testEmail = {
    emailId: 'test_match_1',
    subject: 'Update on your Software Engineer application',
    content: 'Thank you for your interest in the Software Engineer position at Google. Unfortunately, we will not be moving forward with your application.',
    sender: 'hr@google.com',
    receivedDate: new Date()
  };
  
  const classification = await classifier.classify(testEmail);
  const jobMatch = await jobMatcher.findMatch(testEmail, classification);
  
  logger.log('Job matching result:', {
    emailId: testEmail.emailId,
    classification: classification.type,
    matchFound: !!jobMatch.job,
    confidence: jobMatch.confidence ? (jobMatch.confidence * 100).toFixed(1) + '%' : 'N/A',
    matchedJob: jobMatch.job ? {
      id: jobMatch.job._id,
      company: jobMatch.job.company,
      position: jobMatch.job.position
    } : null
  });
}

async function testStatusUpdate() {
  logger.log('=== Testing Status Update ===');
  
  const statusUpdater = new StatusUpdater();
  const jobMatcher = new JobMatcher();
  const classifier = new EmailClassifier();
  
  // Find a job to test with
  const job = await Job.findOne({ status: 'applied' });
  
  if (!job) {
    logger.log('No applied job found for status update test');
    return;
  }
  
  logger.log('Testing status update with job:', {
    id: job._id,
    company: job.company,
    position: job.position,
    currentStatus: job.status
  });
  
  // Create test rejection email
  const testEmail = {
    emailId: 'test_status_update_1',
    subject: `Update on your ${job.position} application`,
    content: `Thank you for your interest in the ${job.position} position at ${job.company}. Unfortunately, we have decided to move forward with other candidates.`,
    sender: `hr@${job.company.toLowerCase().replace(/\s+/g, '')}.com`,
    receivedDate: new Date()
  };
  
  // Classify and match
  const classification = await classifier.classify(testEmail);
  const jobMatch = await jobMatcher.findMatch(testEmail, classification);
  jobMatch.email = testEmail;
  
  logger.log('Before status update:', {
    classification: classification.type,
    confidence: (jobMatch.confidence * 100).toFixed(1) + '%',
    currentStatus: job.status
  });
  
  // Test status update (but don't actually update for real jobs)
  if (jobMatch.confidence >= 0.85) {
    logger.log('Would update status to: rejected (confidence above threshold)');
    
    // For testing, just show what would happen
    logger.log('Status update simulation:', {
      oldStatus: job.status,
      newStatus: 'rejected',
      confidence: jobMatch.confidence,
      emailId: testEmail.emailId,
      emailLink: `https://mail.google.com/mail/u/0/#inbox/${testEmail.emailId}`
    });
  } else {
    logger.log('Would log for manual review (confidence below threshold)');
  }
}

async function testEmailMonitorScan() {
  logger.log('=== Testing Email Monitor Scan ===');
  
  const emailMonitor = new EmailMonitor();
  
  try {
    // Test manual scan of last 1 day
    logger.log('Starting manual scan of last 1 day...');
    const results = await emailMonitor.manualScan(1);
    
    logger.log('Email scan results:', results);
    
  } catch (error) {
    logger.error('Email monitor scan failed:', error);
  }
}

async function testFullPipeline() {
  logger.log('=== Testing Full Email Processing Pipeline ===');
  
  const emailMonitor = new EmailMonitor();
  
  // Create a realistic test email
  const testEmail = {
    emailId: 'test_pipeline_' + Date.now(),
    subject: 'Thank you for your application - Software Engineer',
    content: `Dear Candidate,

Thank you for your interest in the Software Engineer position at TechCorp. After careful consideration, we have decided to move forward with other candidates who more closely match our current needs.

We encourage you to apply for future opportunities that align with your background and experience.

Best regards,
TechCorp Hiring Team`,
    sender: 'hiring@techcorp.com',
    receivedDate: new Date()
  };
  
  logger.log('Processing test email through full pipeline...');
  
  try {
    const result = await emailMonitor.processEmail(testEmail);
    
    logger.log('Pipeline result:', {
      emailId: result.emailId,
      classification: result.classification,
      classificationConfidence: result.classificationConfidence ? (result.classificationConfidence * 100).toFixed(1) + '%' : 'N/A',
      jobMatch: result.jobMatch,
      action: result.action,
      success: result.success
    });
    
  } catch (error) {
    logger.error('Pipeline test failed:', error);
  }
}

async function runAllTests() {
  try {
    logger.log('Starting Email Monitor Tests...');
    
    await connectToDatabase();
    
    await testEmailClassification();
    await testJobMatching();
    await testStatusUpdate();
    await testEmailMonitorScan();
    await testFullPipeline();
    
    logger.log('All tests completed!');
    
  } catch (error) {
    logger.error('Test execution failed:', error);
  } finally {
    await mongoose.disconnect();
    logger.log('Disconnected from MongoDB');
  }
}

// Run the tests
runAllTests();