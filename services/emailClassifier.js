const { JobLogger } = require('./jobLogger');

class EmailClassifier {
  constructor() {
    this.logger = new JobLogger('email_classifier');
    
    // Email classification patterns
    this.patterns = {
      rejected: {
        keywords: [
          'unfortunately', 'not moving forward', 'not selected', 'regret to inform',
          'not be moving forward', 'decided to move forward with other candidates',
          'will not be proceeding', 'not chosen', 'not advance', 'unsuccessful',
          'decline', 'withdraw', 'position has been filled'
        ],
        phrases: [
          'we have decided to move forward with other candidates',
          'we will not be moving forward',
          'we have chosen to proceed with other applicants',
          'we are unable to move forward',
          'position is no longer available',
          'we have filled the position'
        ],
        confidence: 0.9
      },
      interview: {
        keywords: [
          'interview invitation', 'schedule an interview', 'next round', 'phone screen',
          'video interview', 'technical interview', 'onsite interview', 'final round',
          'interview request', 'meet with', 'speak with', 'chat with'
        ],
        phrases: [
          'would like to schedule', 'moving to the next step',
          'invite you to interview', 'schedule a time to talk',
          'next step in our process', 'would like to speak with you',
          'arrange an interview', 'set up a call'
        ],
        urls: ['calendly.com', 'acuityscheduling.com', 'when2meet.com', 'doodle.com'],
        confidence: 0.85
      },
      oa_round: {
        keywords: [
          'online assessment', 'coding challenge', 'technical assessment', 'hackerrank',
          'coding test', 'programming challenge', 'take home assignment', 'technical challenge',
          'codesignal', 'leetcode', 'codility', 'assessment invitation'
        ],
        phrases: [
          'complete the following assessment', 'coding test',
          'technical screening', 'programming assignment',
          'take home challenge', 'online coding assessment',
          'technical evaluation', 'skills assessment'
        ],
        urls: ['hackerrank.com', 'codesignal.com', 'karat.com', 'codility.com', 'qualified.io'],
        confidence: 0.9
      },
      offer: {
        keywords: [
          'congratulations', 'offer', 'we are pleased', 'welcome to the team',
          'job offer', 'offer letter', 'compensation', 'salary', 'package',
          'welcome aboard', 'excited to extend', 'pleased to offer'
        ],
        phrases: [
          'extend an offer', 'job offer', 'compensation package',
          'offer of employment', 'welcome to', 'pleased to offer you',
          'excited to offer you', 'formal offer'
        ],
        confidence: 0.95
      }
    };
  }

  /**
   * Classify an email based on its content
   * @param {Object} email - Email object with subject, content, sender
   * @returns {Object} Classification result with type and confidence
   */
  async classify(email) {
    try {
      const emailText = `${email.subject} ${email.content}`.toLowerCase();
      const classifications = [];

      // Check each classification type
      for (const [type, pattern] of Object.entries(this.patterns)) {
        const score = this.calculateClassificationScore(emailText, pattern, email);
        if (score > 0) {
          classifications.push({
            type,
            confidence: score,
            baseConfidence: pattern.confidence
          });
        }
      }

      // Sort by confidence and return best match
      classifications.sort((a, b) => b.confidence - a.confidence);
      
      const result = classifications.length > 0 
        ? classifications[0] 
        : { type: 'unknown', confidence: 0, baseConfidence: 0 };

      this.logger.log(`Email classified as: ${result.type} (${(result.confidence * 100).toFixed(1)}%)`, {
        emailId: email.emailId,
        subject: email.subject?.substring(0, 100),
        sender: email.sender
      });

      return result;

    } catch (error) {
      this.logger.error('Error classifying email:', error, { emailId: email.emailId });
      return { type: 'unknown', confidence: 0, baseConfidence: 0 };
    }
  }

  /**
   * Calculate classification score for a specific pattern
   * @param {string} emailText - Combined email subject and content (lowercase)
   * @param {Object} pattern - Classification pattern
   * @param {Object} email - Original email object
   * @returns {number} Score between 0 and 1
   */
  calculateClassificationScore(emailText, pattern, email) {
    let score = 0;
    let matches = 0;

    // Check keywords
    for (const keyword of pattern.keywords) {
      if (emailText.includes(keyword.toLowerCase())) {
        matches++;
        score += 0.3; // Each keyword match adds weight
      }
    }

    // Check phrases (higher weight)
    for (const phrase of pattern.phrases) {
      if (emailText.includes(phrase.toLowerCase())) {
        matches++;
        score += 0.5; // Phrases are more specific
      }
    }

    // Check URLs if pattern has them
    if (pattern.urls) {
      for (const url of pattern.urls) {
        if (emailText.includes(url.toLowerCase())) {
          matches++;
          score += 0.4; // URLs are strong indicators
        }
      }
    }

    // Normalize score and apply base confidence
    if (matches > 0) {
      const normalizedScore = Math.min(score, 1.0);
      return normalizedScore * pattern.confidence;
    }

    return 0;
  }

  /**
   * Extract company name from email content
   * @param {string} content - Email content
   * @param {boolean} isATS - Whether sender is from ATS platform
   * @returns {string|null} Extracted company name
   */
  extractCompanyName(content, isATS = false) {
    if (!isATS) {
      return null; // For direct company emails, use domain matching
    }

    try {
      const text = content.toLowerCase();
      
      // Common patterns in ATS emails
      const patterns = [
        /at\s+([A-Z][A-Za-z\s&.,-]+?)(?:\s+is\s|\s+has\s|\s+,|\s+\.|\s+team)/g,
        /([A-Z][A-Za-z\s&.,-]+?)\s+(?:team|company|corp|inc|llc)/gi,
        /position\s+at\s+([A-Z][A-Za-z\s&.,-]+?)(?:\s|,|\.)/gi,
        /role\s+at\s+([A-Z][A-Za-z\s&.,-]+?)(?:\s|,|\.)/gi
      ];

      for (const pattern of patterns) {
        const matches = [...content.matchAll(pattern)];
        if (matches.length > 0) {
          const companyName = matches[0][1].trim();
          if (companyName.length > 1 && companyName.length < 50) {
            return companyName;
          }
        }
      }

      return null;
    } catch (error) {
      this.logger.error('Error extracting company name:', error);
      return null;
    }
  }

  /**
   * Extract position title from email content
   * @param {string} content - Email content
   * @returns {string|null} Extracted position title
   */
  extractPositionTitle(content) {
    try {
      // Common patterns for position titles
      const patterns = [
        /(?:position|role|job)\s+(?:of|as|for)\s+([A-Z][A-Za-z\s-]+?)(?:\s+at|\s+with|\s+,|\s+\.)/gi,
        /([A-Z][A-Za-z\s-]+?)\s+(?:position|role|internship)(?:\s+at|\s+with|\s+,|\s+\.)/gi,
        /applying\s+(?:for|to)\s+(?:the\s+)?([A-Z][A-Za-z\s-]+?)(?:\s+position|\s+role|\s+at)/gi
      ];

      for (const pattern of patterns) {
        const matches = [...content.matchAll(pattern)];
        if (matches.length > 0) {
          const position = matches[0][1].trim();
          if (position.length > 3 && position.length < 100) {
            return position;
          }
        }
      }

      return null;
    } catch (error) {
      this.logger.error('Error extracting position title:', error);
      return null;
    }
  }

  /**
   * Check if email content has relevant keywords for a specific job
   * @param {string} content - Email content
   * @param {Object} job - Job object with company and position
   * @returns {boolean} Whether relevant keywords are found
   */
  hasRelevantKeywords(content, job) {
    const text = content.toLowerCase();
    const company = job.company.toLowerCase();
    const position = job.position.toLowerCase();

    // Check for company or position mentions
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
}

module.exports = { EmailClassifier };