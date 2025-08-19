const { GmailService } = require('../services/gmailService');
const { JobLogger } = require('../services/jobLogger');
const Job = require('../models/Job');
const mongoose = require('mongoose');
require('dotenv').config();

class OneTimeApplicationScraper {
  constructor() {
    this.gmailService = new GmailService();
    this.logger = new JobLogger('application_scraper');
    
    // Patterns to detect application confirmation emails
    this.applicationPatterns = {
      subjects: [
        'thank you for your application',
        'application received',
        'application confirmation',
        'we received your application',
        'your application has been submitted',
        'application submitted successfully',
        'thanks for applying',
        'application for',
        'applied to',
        'internship application'
      ],
      senders: [
        'noreply@',
        'no-reply@',
        'careers@',
        'jobs@',
        'hiring@',
        'recruiting@',
        'talent@',
        'hr@'
      ],
      keywords: [
        'thank you for applying',
        'we have received your application',
        'your application for',
        'application has been received',
        'successfully submitted your application',
        'thank you for your interest in',
        'application confirmation',
        'next steps in our hiring process'
      ]
    };

    // Company domain patterns for application platforms
    this.applicationPlatforms = [
      'greenhouse.io',
      'lever.co',
      'workday.com',
      'myworkdayjobs.com',
      'smartrecruiters.com',
      'bamboohr.com',
      'icims.com',
      'successfactors.com',
      'jobvite.com',
      'taleo.net',
      'brassring.com',
      'simplify.jobs'
    ];
  }

  /**
   * Main function to scrape applications from June 1 to August 19, 2025
   */
  async scrapeApplications() {
    try {
      this.logger.log('Starting one-time application scraper...');
      
      // Connect to database
      await this.connectToDatabase();
      
      // Initialize Gmail service
      await this.gmailService.initialize();
      
      // Define date range: June 1, 2025 to August 19, 2025
      const startDate = new Date('2025-06-01');
      const endDate = new Date('2025-08-19');
      
      this.logger.log('Scraping applications from date range:', {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0]
      });
      
      // Get existing applied jobs to avoid duplicates
      const existingAppliedJobs = await this.getExistingAppliedJobs();
      this.logger.log(`Found ${existingAppliedJobs.length} existing applied jobs in database`);
      
      // Fetch application confirmation emails
      const applicationEmails = await this.fetchApplicationEmails(startDate, endDate);
      this.logger.log(`Found ${applicationEmails.length} potential application emails`);
      
      // Process emails and extract job applications
      const newApplications = await this.processApplicationEmails(applicationEmails, existingAppliedJobs);
      
      // Save new applications to database
      const savedApplications = await this.saveNewApplications(newApplications);
      
      // Generate summary report
      await this.generateSummaryReport(savedApplications, existingAppliedJobs);
      
      this.logger.log('Application scraping completed successfully!');
      
      return {
        totalEmailsProcessed: applicationEmails.length,
        newApplicationsFound: newApplications.length,
        applicationsSaved: savedApplications.length,
        existingApplications: existingAppliedJobs.length
      };
      
    } catch (error) {
      this.logger.error('Application scraping failed:', error);
      throw error;
    } finally {
      await mongoose.disconnect();
    }
  }

  /**
   * Connect to MongoDB database
   */
  async connectToDatabase() {
    try {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/jobtool');
      this.logger.log('Connected to MongoDB');
    } catch (error) {
      this.logger.error('Failed to connect to MongoDB:', error);
      throw error;
    }
  }

  /**
   * Get existing applied jobs from database
   * @returns {Array} Array of existing applied jobs
   */
  async getExistingAppliedJobs() {
    try {
      const appliedJobs = await Job.find({ status: 'applied' })
        .select('company position dateApplied applicationUrl')
        .lean();
      
      return appliedJobs.map(job => ({
        ...job,
        normalizedCompany: this.normalizeCompanyName(job.company),
        normalizedPosition: this.normalizePositionTitle(job.position)
      }));
    } catch (error) {
      this.logger.error('Error fetching existing applied jobs:', error);
      return [];
    }
  }

  /**
   * Fetch application confirmation emails from Gmail
   * @param {Date} startDate - Start date for search
   * @param {Date} endDate - End date for search
   * @returns {Array} Array of email objects
   */
  async fetchApplicationEmails(startDate, endDate) {
    try {
      // Build Gmail search query
      const query = [
        `after:${this.formatDateForGmail(startDate)}`,
        `before:${this.formatDateForGmail(endDate)}`,
        'in:inbox',
        // Search for application-related terms
        '(subject:"application" OR subject:"applied" OR subject:"thank you for" OR subject:"confirmation")',
        // Exclude SWEList and other job posting emails
        '-from:noreply@swelist.com',
        '-from:notifications@linkedin.com',
        '-from:jobs-noreply@linkedin.com'
      ].join(' ');

      this.logger.log('Gmail search query:', { query });

      const emails = await this.gmailService.searchEmails(query, 200);
      
      // Filter for application confirmation emails
      const applicationEmails = emails.filter(email => this.isApplicationEmail(email));
      
      this.logger.log(`Filtered ${emails.length} emails to ${applicationEmails.length} application emails`);
      
      return applicationEmails;
      
    } catch (error) {
      this.logger.error('Error fetching application emails:', error);
      return [];
    }
  }

  /**
   * Check if email is an application confirmation
   * @param {Object} email - Email object
   * @returns {boolean} Whether email is application confirmation
   */
  isApplicationEmail(email) {
    const subject = (email.subject || '').toLowerCase();
    const content = (email.content || '').toLowerCase();
    const sender = (email.sender || '').toLowerCase();

    // Check subject patterns
    const hasApplicationSubject = this.applicationPatterns.subjects.some(pattern => 
      subject.includes(pattern)
    );

    // Check sender patterns
    const hasApplicationSender = this.applicationPatterns.senders.some(pattern => 
      sender.includes(pattern)
    ) || this.applicationPlatforms.some(platform => sender.includes(platform));

    // Check content keywords
    const hasApplicationKeywords = this.applicationPatterns.keywords.some(keyword => 
      content.includes(keyword)
    );

    // Must have at least 2 out of 3 indicators
    const indicators = [hasApplicationSubject, hasApplicationSender, hasApplicationKeywords];
    const matchCount = indicators.filter(Boolean).length;

    return matchCount >= 2;
  }

  /**
   * Process application emails and extract job data
   * @param {Array} emails - Array of application emails
   * @param {Array} existingJobs - Array of existing applied jobs
   * @returns {Array} Array of new job applications
   */
  async processApplicationEmails(emails, existingJobs) {
    const newApplications = [];
    
    for (const email of emails) {
      try {
        const jobData = await this.extractJobDataFromEmail(email);
        
        if (jobData && !this.isDuplicate(jobData, existingJobs)) {
          newApplications.push(jobData);
          this.logger.log('Found new application:', {
            company: jobData.company,
            position: jobData.position,
            emailDate: email.receivedDate
          });
        }
        
      } catch (error) {
        this.logger.error('Error processing email:', error, {
          emailId: email.emailId,
          subject: email.subject
        });
      }
    }
    
    return newApplications;
  }

  /**
   * Extract job data from application confirmation email
   * @param {Object} email - Email object
   * @returns {Object|null} Extracted job data
   */
  async extractJobDataFromEmail(email) {
    try {
      const content = email.content || '';
      const subject = email.subject || '';
      const sender = email.sender || '';
      
      // Extract company name
      const company = this.extractCompanyFromEmail(content, subject, sender);
      
      // Extract position title
      const position = this.extractPositionFromEmail(content, subject);
      
      if (!company || !position) {
        this.logger.log('Could not extract company or position:', {
          emailId: email.emailId,
          subject: subject.substring(0, 100),
          extractedCompany: company,
          extractedPosition: position
        });
        return null;
      }
      
      return {
        company: company,
        position: position,
        status: 'applied',
        datePosted: email.receivedDate,
        dateApplied: email.receivedDate,
        lastUpdated: new Date(),
        emailThreadId: email.emailId,
        notes: `Auto-discovered application from email: ${subject.substring(0, 100)}`,
        statusHistory: [{
          status: 'applied',
          date: email.receivedDate,
          emailId: email.emailId,
          source: 'application_scraper',
          notes: 'Discovered from application confirmation email'
        }],
        emailHistory: [{
          emailId: email.emailId,
          subject: email.subject,
          sender: email.sender,
          receivedDate: email.receivedDate,
          emailLink: `https://mail.google.com/mail/u/0/#inbox/${email.emailId}`,
          classification: 'application',
          confidence: 0.8,
          statusUpdate: 'applied',
          processed: true
        }]
      };
      
    } catch (error) {
      this.logger.error('Error extracting job data from email:', error);
      return null;
    }
  }

  /**
   * Extract company name from email content
   * @param {string} content - Email content
   * @param {string} subject - Email subject
   * @param {string} sender - Email sender
   * @returns {string|null} Company name
   */
  extractCompanyFromEmail(content, subject, sender) {
    // Try domain extraction first
    const domain = sender.split('@')[1]?.toLowerCase();
    if (domain && !this.applicationPlatforms.includes(domain)) {
      const companyFromDomain = domain.split('.')[0];
      if (companyFromDomain && companyFromDomain.length > 2) {
        return this.capitalizeCompanyName(companyFromDomain);
      }
    }

    // Common patterns in application emails
    const patterns = [
      /(?:at|with|to)\s+([A-Z][A-Za-z\s&.,-]{2,40})(?:\s+(?:team|,|\.|!|for))/gi,
      /([A-Z][A-Za-z\s&.,-]{2,40})\s+(?:team|company|corp|inc|hiring)/gi,
      /(?:from|regarding|about)\s+([A-Z][A-Za-z\s&.,-]{2,40})(?:\s+(?:application|position|role))/gi,
      /thank you for applying to\s+([A-Z][A-Za-z\s&.,-]{2,40})/gi
    ];

    const text = `${subject} ${content}`;
    
    for (const pattern of patterns) {
      const matches = [...text.matchAll(pattern)];
      for (const match of matches) {
        const company = match[1].trim();
        if (this.isValidCompanyName(company)) {
          return company;
        }
      }
    }

    return null;
  }

  /**
   * Extract position title from email content
   * @param {string} content - Email content
   * @param {string} subject - Email subject
   * @returns {string|null} Position title
   */
  extractPositionFromEmail(content, subject) {
    const patterns = [
      /(?:for|to)\s+(?:the\s+)?([A-Z][A-Za-z\s-]{3,50})\s+(?:position|role|internship|job)/gi,
      /([A-Z][A-Za-z\s-]{3,50})\s+(?:position|role|internship)/gi,
      /(?:application|applied|applying)\s+(?:for|to)\s+(?:the\s+)?([A-Z][A-Za-z\s-]{3,50})(?:\s+at|\s+with|\s+,|\s+\.)/gi,
      /your\s+([A-Z][A-Za-z\s-]{3,50})\s+application/gi
    ];

    const text = `${subject} ${content}`;
    
    for (const pattern of patterns) {
      const matches = [...text.matchAll(pattern)];
      for (const match of matches) {
        const position = match[1].trim();
        if (this.isValidPositionTitle(position)) {
          return position;
        }
      }
    }

    return null;
  }

  /**
   * Check if extracted company name is valid
   * @param {string} name - Company name
   * @returns {boolean} Whether name is valid
   */
  isValidCompanyName(name) {
    if (!name || name.length < 2 || name.length > 50) return false;
    
    const invalidWords = ['team', 'company', 'position', 'role', 'application', 'hiring', 'thank', 'you'];
    const lowerName = name.toLowerCase();
    
    return !invalidWords.some(word => lowerName === word);
  }

  /**
   * Check if extracted position title is valid
   * @param {string} title - Position title
   * @returns {boolean} Whether title is valid
   */
  isValidPositionTitle(title) {
    if (!title || title.length < 3 || title.length > 100) return false;
    
    const invalidPhrases = ['application for', 'position at', 'role at', 'thank you'];
    const lowerTitle = title.toLowerCase();
    
    return !invalidPhrases.some(phrase => lowerTitle.includes(phrase));
  }

  /**
   * Capitalize company name properly
   * @param {string} name - Company name
   * @returns {string} Capitalized company name
   */
  capitalizeCompanyName(name) {
    return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
  }

  /**
   * Check if job application is duplicate
   * @param {Object} jobData - New job data
   * @param {Array} existingJobs - Existing applied jobs
   * @returns {boolean} Whether it's a duplicate
   */
  isDuplicate(jobData, existingJobs) {
    const normalizedCompany = this.normalizeCompanyName(jobData.company);
    const normalizedPosition = this.normalizePositionTitle(jobData.position);
    
    return existingJobs.some(existing => 
      existing.normalizedCompany === normalizedCompany &&
      existing.normalizedPosition === normalizedPosition
    );
  }

  /**
   * Normalize company name for comparison
   * @param {string} company - Company name
   * @returns {string} Normalized company name
   */
  normalizeCompanyName(company) {
    return company
      .toLowerCase()
      .replace(/\s+/g, '')
      .replace(/[.,\-_]/g, '')
      .replace(/inc|corp|llc|ltd|company|co$/g, '')
      .trim();
  }

  /**
   * Normalize position title for comparison
   * @param {string} position - Position title
   * @returns {string} Normalized position title
   */
  normalizePositionTitle(position) {
    return position
      .toLowerCase()
      .replace(/\s+/g, '')
      .replace(/[.,\-_]/g, '')
      .trim();
  }

  /**
   * Save new applications to database
   * @param {Array} applications - Array of new applications
   * @returns {Array} Array of saved applications
   */
  async saveNewApplications(applications) {
    const savedApplications = [];
    
    for (const appData of applications) {
      try {
        const job = new Job(appData);
        const savedJob = await job.save();
        savedApplications.push(savedJob);
        
        this.logger.log('Saved new application:', {
          id: savedJob._id,
          company: savedJob.company,
          position: savedJob.position
        });
        
      } catch (error) {
        this.logger.error('Error saving application:', error, {
          company: appData.company,
          position: appData.position
        });
      }
    }
    
    return savedApplications;
  }

  /**
   * Generate summary report
   * @param {Array} savedApplications - Newly saved applications
   * @param {Array} existingApplications - Existing applications
   */
  async generateSummaryReport(savedApplications, existingApplications) {
    const summary = {
      totalApplicationsFound: savedApplications.length,
      existingApplications: existingApplications.length,
      newApplicationsByCompany: {},
      dateRange: 'June 1, 2025 - August 19, 2025'
    };

    savedApplications.forEach(app => {
      summary.newApplicationsByCompany[app.company] = (summary.newApplicationsByCompany[app.company] || 0) + 1;
    });

    this.logger.log('=== APPLICATION SCRAPING SUMMARY ===');
    this.logger.log('Date Range:', { range: summary.dateRange });
    this.logger.log('Existing Applications in DB:', { count: summary.existingApplications });
    this.logger.log('New Applications Found:', { count: summary.totalApplicationsFound });
    this.logger.log('New Applications by Company:', summary.newApplicationsByCompany);
    
    return summary;
  }

  /**
   * Format date for Gmail search
   * @param {Date} date - Date to format
   * @returns {string} Formatted date
   */
  formatDateForGmail(date) {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${year}/${month}/${day}`;
  }
}

// Main execution function
async function runOneTimeApplicationScraper() {
  try {
    const scraper = new OneTimeApplicationScraper();
    const results = await scraper.scrapeApplications();
    
    console.log('\n🎉 Application scraping completed successfully!');
    console.log('Results:', results);
    
  } catch (error) {
    console.error('❌ Application scraping failed:', error);
    process.exit(1);
  }
}

// Run the scraper
if (require.main === module) {
  runOneTimeApplicationScraper();
}

module.exports = { OneTimeApplicationScraper };