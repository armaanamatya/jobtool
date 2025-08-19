const { GmailService } = require('./gmailService');
const { EmailClassifier } = require('./emailClassifier');
const { JobMatcher } = require('./jobMatcher');
const { StatusUpdater } = require('./statusUpdater');
const { JobLogger } = require('./jobLogger');

class EmailMonitor {
  constructor() {
    this.gmailService = new GmailService();
    this.classifier = new EmailClassifier();
    this.jobMatcher = new JobMatcher();
    this.statusUpdater = new StatusUpdater();
    this.logger = new JobLogger('email_monitor');
    
    this.isRunning = false;
    this.lastScanTime = null;
  }

  /**
   * Start email monitoring service
   */
  async start() {
    if (this.isRunning) {
      this.logger.log('Email monitor is already running');
      return;
    }

    try {
      this.isRunning = true;
      this.logger.log('Starting email monitoring service...');
      
      // Perform initial scan of last 7 days
      await this.performInitialScan();
      
      // Start periodic monitoring
      this.startPeriodicMonitoring();
      
      this.logger.log('Email monitoring service started successfully');
      
    } catch (error) {
      this.logger.error('Failed to start email monitoring:', error);
      this.isRunning = false;
      throw error;
    }
  }

  /**
   * Stop email monitoring service
   */
  async stop() {
    this.isRunning = false;
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.logger.log('Email monitoring service stopped');
  }

  /**
   * Perform initial scan of emails from last 7 days
   */
  async performInitialScan() {
    try {
      this.logger.log('Performing initial email scan (last 7 days)...');
      
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const emails = await this.fetchJobRelatedEmails(sevenDaysAgo);
      
      this.logger.log(`Found ${emails.length} job-related emails to process`);
      
      const results = {
        processed: 0,
        updated: 0,
        manualReview: 0,
        errors: 0
      };
      
      for (const email of emails) {
        try {
          const result = await this.processEmail(email);
          results.processed++;
          
          if (result.success && result.action === 'status_updated') {
            results.updated++;
          } else if (result.action === 'manual_review_required') {
            results.manualReview++;
          }
          
          // Add small delay to avoid rate limiting
          await this.sleep(100);
          
        } catch (error) {
          this.logger.error('Error processing email in initial scan:', error, {
            emailId: email.emailId
          });
          results.errors++;
        }
      }
      
      this.logger.log('Initial scan completed', results);
      this.lastScanTime = new Date();
      
    } catch (error) {
      this.logger.error('Initial scan failed:', error);
      throw error;
    }
  }

  /**
   * Start periodic monitoring for new emails
   */
  startPeriodicMonitoring() {
    // Check for new emails every 30 minutes
    const intervalMs = 30 * 60 * 1000; // 30 minutes
    
    this.monitoringInterval = setInterval(async () => {
      if (this.isRunning) {
        try {
          await this.scanForNewEmails();
        } catch (error) {
          this.logger.error('Error in periodic monitoring:', error);
        }
      }
    }, intervalMs);
    
    this.logger.log(`Periodic monitoring started (${intervalMs / 60000} minute intervals)`);
  }

  /**
   * Scan for new emails since last scan
   */
  async scanForNewEmails() {
    try {
      const sinceDate = this.lastScanTime || new Date(Date.now() - 30 * 60 * 1000); // Last 30 minutes
      
      this.logger.log('Scanning for new emails...', { since: sinceDate.toISOString() });
      
      const emails = await this.fetchJobRelatedEmails(sinceDate);
      
      if (emails.length === 0) {
        this.logger.log('No new job-related emails found');
        this.lastScanTime = new Date();
        return;
      }
      
      this.logger.log(`Found ${emails.length} new job-related emails`);
      
      const results = { processed: 0, updated: 0, manualReview: 0, errors: 0 };
      
      for (const email of emails) {
        try {
          const result = await this.processEmail(email);
          results.processed++;
          
          if (result.success && result.action === 'status_updated') {
            results.updated++;
          } else if (result.action === 'manual_review_required') {
            results.manualReview++;
          }
          
        } catch (error) {
          this.logger.error('Error processing new email:', error, {
            emailId: email.emailId
          });
          results.errors++;
        }
      }
      
      this.logger.log('New email scan completed', results);
      this.lastScanTime = new Date();
      
    } catch (error) {
      this.logger.error('Error scanning for new emails:', error);
    }
  }

  /**
   * Fetch job-related emails from Gmail
   * @param {Date} sinceDate - Date to fetch emails since
   * @returns {Array} Array of email objects
   */
  async fetchJobRelatedEmails(sinceDate) {
    try {
      // Build search query to exclude SWEList and promotional emails
      const excludedSenders = [
        'noreply@swelist.com',
        'notifications@linkedin.com',
        'noreply@linkedin.com',
        'jobs-noreply@linkedin.com',
        'no-reply@glassdoor.com',
        'noreply@indeed.com'
      ];
      
      const query = [
        `after:${this.formatDateForGmail(sinceDate)}`,
        'in:inbox',
        ...excludedSenders.map(sender => `-from:${sender}`)
      ].join(' ');
      
      const emails = await this.gmailService.searchEmails(query, 50);
      
      // Filter for job-related emails
      const jobRelatedEmails = emails.filter(email => this.isJobRelatedEmail(email));
      
      this.logger.log(`Fetched ${emails.length} emails, ${jobRelatedEmails.length} appear job-related`);
      
      return jobRelatedEmails;
      
    } catch (error) {
      this.logger.error('Error fetching job-related emails:', error);
      return [];
    }
  }

  /**
   * Check if email appears to be job-related
   * @param {Object} email - Email object
   * @returns {boolean} Whether email is job-related
   */
  isJobRelatedEmail(email) {
    const subject = (email.subject || '').toLowerCase();
    const content = (email.content || '').toLowerCase();
    const sender = (email.sender || '').toLowerCase();
    
    // Job-related keywords in subject or content
    const jobKeywords = [
      'application', 'interview', 'position', 'role', 'job', 'offer',
      'assessment', 'coding', 'technical', 'screening', 'rejection',
      'unfortunately', 'congratulations', 'next step', 'round',
      'opportunity', 'candidate', 'hiring', 'talent', 'recruitment'
    ];
    
    // Common recruiting domains
    const recruitingDomains = [
      'greenhouse.io', 'lever.co', 'workday.com', 'smartrecruiters.com',
      'bamboohr.com', 'icims.com', 'jobvite.com', 'taleo.net'
    ];
    
    // Check for job keywords
    const hasJobKeywords = jobKeywords.some(keyword => 
      subject.includes(keyword) || content.includes(keyword)
    );
    
    // Check for recruiting domains
    const hasRecruitingDomain = recruitingDomains.some(domain => 
      sender.includes(domain)
    );
    
    // Check for HR/recruiting email patterns
    const hasHRPattern = /\b(hr|recruiting|talent|careers|jobs)@/.test(sender);
    
    return hasJobKeywords || hasRecruitingDomain || hasHRPattern;
  }

  /**
   * Process a single email through the classification pipeline
   * @param {Object} email - Email object
   * @returns {Object} Processing result
   */
  async processEmail(email) {
    try {
      this.logger.log('Processing email', {
        emailId: email.emailId,
        subject: email.subject?.substring(0, 100),
        sender: email.sender
      });
      
      // Step 1: Classify email
      const classification = await this.classifier.classify(email);
      
      // Step 2: Find matching job
      const jobMatch = await this.jobMatcher.findMatch(email, classification);
      jobMatch.email = email; // Add email to match object
      
      // Step 3: Update status or log for manual review
      let result;
      if (jobMatch.job && jobMatch.confidence >= 0.85) {
        result = await this.statusUpdater.updateJobStatus(jobMatch);
        result.action = result.success ? 'status_updated' : 'update_failed';
      } else {
        result = await this.statusUpdater.logForManualReview(email, jobMatch);
      }
      
      return {
        emailId: email.emailId,
        classification: classification.type,
        classificationConfidence: classification.confidence,
        jobMatch: jobMatch.job ? {
          jobId: jobMatch.job._id,
          company: jobMatch.job.company,
          position: jobMatch.job.position,
          confidence: jobMatch.confidence
        } : null,
        ...result
      };
      
    } catch (error) {
      this.logger.error('Error processing email:', error, {
        emailId: email.emailId
      });
      return {
        success: false,
        action: 'processing_error',
        error: error.message
      };
    }
  }

  /**
   * Format date for Gmail search query
   * @param {Date} date - Date to format
   * @returns {string} Formatted date string
   */
  formatDateForGmail(date) {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${year}/${month}/${day}`;
  }

  /**
   * Sleep for specified milliseconds
   * @param {number} ms - Milliseconds to sleep
   * @returns {Promise} Promise that resolves after sleep
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get monitoring status
   * @returns {Object} Status information
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      lastScanTime: this.lastScanTime,
      hasMonitoringInterval: !!this.monitoringInterval
    };
  }

  /**
   * Manually trigger email scan
   * @param {number} daysBack - Number of days to scan back
   * @returns {Object} Scan results
   */
  async manualScan(daysBack = 1) {
    try {
      const sinceDate = new Date();
      sinceDate.setDate(sinceDate.getDate() - daysBack);
      
      this.logger.log(`Manual scan triggered (${daysBack} days back)`);
      
      const emails = await this.fetchJobRelatedEmails(sinceDate);
      const results = { processed: 0, updated: 0, manualReview: 0, errors: 0 };
      
      for (const email of emails) {
        try {
          const result = await this.processEmail(email);
          results.processed++;
          
          if (result.success && result.action === 'status_updated') {
            results.updated++;
          } else if (result.action === 'manual_review_required') {
            results.manualReview++;
          }
          
        } catch (error) {
          results.errors++;
        }
      }
      
      this.logger.log('Manual scan completed', results);
      return results;
      
    } catch (error) {
      this.logger.error('Manual scan failed:', error);
      throw error;
    }
  }
}

module.exports = { EmailMonitor };