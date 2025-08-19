const Job = require('../models/Job');
const { JobLogger } = require('./jobLogger');

class JobMatcher {
  constructor() {
    this.logger = new JobLogger('job_matcher');
    
    // Known ATS platforms
    this.atsPlatforms = [
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
      'brassring.com'
    ];
  }

  /**
   * Find matching jobs for an email
   * @param {Object} email - Email object with sender, subject, content
   * @param {Object} classification - Classification result from EmailClassifier
   * @returns {Object} Best job match with confidence score
   */
  async findMatch(email, classification) {
    try {
      const senderDomain = this.extractDomainFromEmail(email.sender);
      const isATS = this.isATSPlatform(senderDomain);
      
      // Extract company and position info
      const emailData = {
        senderDomain,
        isATS,
        companyName: this.extractCompanyFromContent(email.content, isATS),
        positionTitle: this.extractPositionFromContent(email.content),
        classification: classification.type,
        content: email.content
      };

      // Find candidate jobs (applied status from last 30 days)
      const candidateJobs = await this.findCandidateJobs(emailData.companyName, emailData.positionTitle);
      
      if (candidateJobs.length === 0) {
        this.logger.log('No candidate jobs found for matching', {
          emailId: email.emailId,
          companyName: emailData.companyName,
          senderDomain: emailData.senderDomain
        });
        return { job: null, confidence: 0, emailData };
      }

      // Calculate confidence for each candidate job
      const jobMatches = candidateJobs.map(job => ({
        job,
        confidence: this.calculateConfidence(job, emailData),
        emailData
      }));

      // Sort by confidence and return best match
      jobMatches.sort((a, b) => b.confidence - a.confidence);
      const bestMatch = jobMatches[0];

      this.logger.log(`Best job match found: ${bestMatch.job.company} - ${bestMatch.job.position} (${(bestMatch.confidence * 100).toFixed(1)}%)`, {
        emailId: email.emailId,
        jobId: bestMatch.job._id,
        confidence: bestMatch.confidence
      });

      return bestMatch;

    } catch (error) {
      this.logger.error('Error finding job match:', error, { emailId: email.emailId });
      return { job: null, confidence: 0, emailData: {} };
    }
  }

  /**
   * Extract domain from email address
   * @param {string} email - Email address
   * @returns {string} Domain part
   */
  extractDomainFromEmail(email) {
    if (!email || !email.includes('@')) return '';
    return email.split('@')[1]?.toLowerCase() || '';
  }

  /**
   * Check if domain belongs to an ATS platform
   * @param {string} domain - Email domain
   * @returns {boolean} Whether domain is ATS platform
   */
  isATSPlatform(domain) {
    return this.atsPlatforms.includes(domain);
  }

  /**
   * Extract company name from email content
   * @param {string} content - Email content
   * @param {boolean} isATS - Whether sender is ATS platform
   * @returns {string|null} Company name
   */
  extractCompanyFromContent(content, isATS) {
    if (!content) return null;

    try {
      const text = content.toLowerCase();
      
      // For ATS platforms, look for company names in content
      if (isATS) {
        const patterns = [
          // "at [Company]" patterns
          /(?:position|role|opportunity)\s+at\s+([A-Z][A-Za-z\s&.,-]{2,40})(?:\s+(?:is|has|team|,|\.))/gi,
          /(?:interview|meeting)\s+(?:with|at)\s+([A-Z][A-Za-z\s&.,-]{2,40})(?:\s+(?:team|,|\.))/gi,
          // "[Company] team" patterns  
          /([A-Z][A-Za-z\s&.,-]{2,40})\s+(?:team|company|corp|inc|llc|ltd)/gi,
          // "from [Company]" patterns
          /(?:from|regarding)\s+([A-Z][A-Za-z\s&.,-]{2,40})(?:\s+(?:position|role|opportunity))/gi
        ];

        for (const pattern of patterns) {
          const matches = [...content.matchAll(pattern)];
          for (const match of matches) {
            const companyName = match[1].trim();
            if (this.isValidCompanyName(companyName)) {
              return companyName;
            }
          }
        }
      }

      return null;
    } catch (error) {
      this.logger.error('Error extracting company from content:', error);
      return null;
    }
  }

  /**
   * Extract position title from email content
   * @param {string} content - Email content
   * @returns {string|null} Position title
   */
  extractPositionFromContent(content) {
    if (!content) return null;

    try {
      const patterns = [
        // "for [Position]" patterns
        /(?:applying|applied|application)\s+for\s+(?:the\s+)?([A-Z][A-Za-z\s-]{3,50})(?:\s+(?:position|role|at|with))/gi,
        // "[Position] position/role" patterns
        /(?:the\s+)?([A-Z][A-Za-z\s-]{3,50})\s+(?:position|role|internship|job)/gi,
        // "as [Position]" patterns
        /(?:position|role)\s+as\s+(?:a\s+)?([A-Z][A-Za-z\s-]{3,50})(?:\s+(?:at|with|,|\.))/gi
      ];

      for (const pattern of patterns) {
        const matches = [...content.matchAll(pattern)];
        for (const match of matches) {
          const position = match[1].trim();
          if (this.isValidPositionTitle(position)) {
            return position;
          }
        }
      }

      return null;
    } catch (error) {
      this.logger.error('Error extracting position from content:', error);
      return null;
    }
  }

  /**
   * Validate if extracted text is a valid company name
   * @param {string} name - Extracted company name
   * @returns {boolean} Whether name is valid
   */
  isValidCompanyName(name) {
    if (!name || name.length < 2 || name.length > 50) return false;
    
    // Filter out common false positives
    const invalidWords = ['team', 'company', 'position', 'role', 'interview', 'meeting', 'application'];
    const lowerName = name.toLowerCase();
    
    return !invalidWords.some(word => lowerName === word);
  }

  /**
   * Validate if extracted text is a valid position title
   * @param {string} title - Extracted position title
   * @returns {boolean} Whether title is valid
   */
  isValidPositionTitle(title) {
    if (!title || title.length < 3 || title.length > 100) return false;
    
    // Filter out common false positives
    const invalidPhrases = ['position at', 'role at', 'interview with', 'application for'];
    const lowerTitle = title.toLowerCase();
    
    return !invalidPhrases.some(phrase => lowerTitle.includes(phrase));
  }

  /**
   * Find candidate jobs for matching
   * @param {string} companyName - Company name from email
   * @param {string} positionTitle - Position title from email
   * @returns {Array} Array of candidate jobs
   */
  async findCandidateJobs(companyName, positionTitle) {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const query = {
        status: 'applied',
        dateApplied: { $gte: thirtyDaysAgo }
      };

      // Add company filter if extracted from email
      if (companyName) {
        query.$or = [
          { company: new RegExp(companyName, 'i') },
          { company: new RegExp(this.normalizeCompanyName(companyName), 'i') }
        ];
      }

      const jobs = await Job.find(query)
        .sort({ dateApplied: -1 })
        .limit(20); // Limit to prevent excessive processing

      this.logger.log(`Found ${jobs.length} candidate jobs for matching`, {
        companyName,
        positionTitle,
        queryUsed: JSON.stringify(query)
      });

      return jobs;
    } catch (error) {
      this.logger.error('Error finding candidate jobs:', error);
      return [];
    }
  }

  /**
   * Calculate confidence score for job match
   * @param {Object} job - Job document
   * @param {Object} emailData - Extracted email data
   * @returns {number} Confidence score (0-1)
   */
  calculateConfidence(job, emailData) {
    let confidence = 0;
    
    // Exact company name match: +50 points (required for high confidence)
    if (emailData.companyName && this.isExactCompanyMatch(job.company, emailData.companyName)) {
      confidence += 0.5;
    }
    
    // Exact position title match: +45 points (high confidence = 95%+)
    if (emailData.positionTitle && this.isExactPositionMatch(job.position, emailData.positionTitle)) {
      confidence += 0.45;
    }
    
    // Company email domain match: +40 points (medium confidence)
    // Direct match: hr@google.com matches job at "Google"
    if (!emailData.isATS && this.isCompanyDomainMatch(job.company, emailData.senderDomain)) {
      confidence += 0.4;
    }
    
    // ATS platform with company name in content: +35 points
    if (emailData.isATS && emailData.companyName && this.isExactCompanyMatch(job.company, emailData.companyName)) {
      confidence += 0.35;
    }
    
    // Timeline correlation: +15 points (recent application)
    if (this.isRecentApplication(job.dateApplied, 30)) {
      confidence += 0.15;
    }
    
    // Keywords in email content: +10 points
    if (this.hasRelevantKeywords(emailData.content, job)) {
      confidence += 0.1;
    }
    
    return Math.min(confidence, 1.0);
  }

  /**
   * Check for exact company name match
   * @param {string} jobCompany - Company from job
   * @param {string} emailCompany - Company from email
   * @returns {boolean} Whether companies match exactly
   */
  isExactCompanyMatch(jobCompany, emailCompany) {
    if (!jobCompany || !emailCompany) return false;
    
    const normalized1 = this.normalizeCompanyName(jobCompany);
    const normalized2 = this.normalizeCompanyName(emailCompany);
    
    return normalized1 === normalized2 || 
           normalized1.includes(normalized2) || 
           normalized2.includes(normalized1);
  }

  /**
   * Check for exact position title match
   * @param {string} jobPosition - Position from job
   * @param {string} emailPosition - Position from email
   * @returns {boolean} Whether positions match exactly
   */
  isExactPositionMatch(jobPosition, emailPosition) {
    if (!jobPosition || !emailPosition) return false;
    
    const normalized1 = jobPosition.toLowerCase().trim();
    const normalized2 = emailPosition.toLowerCase().trim();
    
    return normalized1 === normalized2 || 
           normalized1.includes(normalized2) || 
           normalized2.includes(normalized1);
  }

  /**
   * Check if email domain matches company
   * @param {string} jobCompany - Company from job
   * @param {string} senderDomain - Email domain
   * @returns {boolean} Whether domain matches company
   */
  isCompanyDomainMatch(jobCompany, senderDomain) {
    if (!jobCompany || !senderDomain) return false;
    
    const normalizedCompany = this.normalizeCompanyName(jobCompany);
    const domainName = senderDomain.split('.')[0]; // google.com → google
    
    return normalizedCompany === domainName || 
           normalizedCompany.includes(domainName) ||
           domainName.includes(normalizedCompany);
  }

  /**
   * Check if application is recent
   * @param {Date} dateApplied - Date when applied
   * @param {number} daysThreshold - Days threshold
   * @returns {boolean} Whether application is recent
   */
  isRecentApplication(dateApplied, daysThreshold = 30) {
    if (!dateApplied) return false;
    
    const threshold = new Date();
    threshold.setDate(threshold.getDate() - daysThreshold);
    
    return new Date(dateApplied) >= threshold;
  }

  /**
   * Check if email content has relevant keywords for job
   * @param {string} content - Email content
   * @param {Object} job - Job object
   * @returns {boolean} Whether relevant keywords found
   */
  hasRelevantKeywords(content, job) {
    if (!content) return false;
    
    const text = content.toLowerCase();
    const company = job.company.toLowerCase();
    const position = job.position.toLowerCase();

    return text.includes(company) || 
           text.includes(position) ||
           this.hasPartialMatch(text, company) ||
           this.hasPartialMatch(text, position);
  }

  /**
   * Check for partial word matches
   * @param {string} text - Text to search in
   * @param {string} target - Target string to find
   * @returns {boolean} Whether partial match found
   */
  hasPartialMatch(text, target) {
    const words = target.split(' ');
    return words.some(word => word.length > 3 && text.includes(word));
  }

  /**
   * Normalize company name for comparison
   * @param {string} companyName - Raw company name
   * @returns {string} Normalized company name
   */
  normalizeCompanyName(companyName) {
    return companyName
      .toLowerCase()
      .replace(/\s+/g, '')
      .replace(/[.,\-_]/g, '')
      .replace(/inc|corp|llc|ltd|company|co$/g, '')
      .trim();
  }
}

module.exports = { JobMatcher };