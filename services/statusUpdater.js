const Job = require('../models/Job');
const { JobLogger } = require('./jobLogger');

class StatusUpdater {
  constructor() {
    this.logger = new JobLogger('status_updater');
    
    // Valid status transitions
    this.validTransitions = {
      'posted': ['applied', 'rejected', 'ghosted'],
      'applied': ['oa_round', 'interview', 'rejected', 'offer', 'ghosted'],
      'oa_round': ['interview', 'rejected', 'offer', 'ghosted'],
      'interview': ['rejected', 'offer', 'ghosted'],
      'rejected': [], // Terminal state
      'offer': [], // Terminal state
      'ghosted': [] // Terminal state
    };

    // Classification to status mapping
    this.classificationToStatus = {
      'rejected': 'rejected',
      'interview': 'interview',
      'oa_round': 'oa_round',
      'offer': 'offer'
    };
  }

  /**
   * Update job status based on email match
   * @param {Object} jobMatch - Job match object from JobMatcher
   * @returns {Object} Update result
   */
  async updateJobStatus(jobMatch) {
    const { job, confidence, emailData } = jobMatch;
    const email = jobMatch.email; // Original email object
    
    try {
      // Determine new status from classification
      const newStatus = this.classificationToStatus[emailData.classification];
      
      if (!newStatus) {
        this.logger.log(`No status mapping for classification: ${emailData.classification}`, {
          jobId: job._id,
          emailId: email.emailId
        });
        return { success: false, reason: 'No status mapping found' };
      }

      // Check if transition is valid
      if (!this.isValidTransition(job.status, newStatus)) {
        this.logger.log(`Invalid status transition: ${job.status} → ${newStatus}`, {
          jobId: job._id,
          emailId: email.emailId
        });
        return { success: false, reason: 'Invalid status transition' };
      }

      // Check confidence threshold
      if (confidence < 0.85) {
        this.logger.log(`Confidence too low for auto-update: ${(confidence * 100).toFixed(1)}%`, {
          jobId: job._id,
          emailId: email.emailId,
          confidence
        });
        return { success: false, reason: 'Confidence below threshold' };
      }

      // Generate Gmail web link
      const emailLink = this.generateGmailLink(email.emailId);

      // Update job with new status and email history
      const updateResult = await this.performStatusUpdate(job, newStatus, email, confidence, emailLink);
      
      if (updateResult.success) {
        this.logger.log(`Job status updated: ${job.status} → ${newStatus} (${(confidence * 100).toFixed(1)}%)`, {
          jobId: job._id,
          emailId: email.emailId,
          company: job.company,
          position: job.position,
          oldStatus: job.status,
          newStatus: newStatus
        });
      }

      return updateResult;

    } catch (error) {
      this.logger.error('Error updating job status:', error, {
        jobId: job._id,
        emailId: email?.emailId
      });
      return { success: false, reason: 'Database error', error: error.message };
    }
  }

  /**
   * Perform the actual database update
   * @param {Object} job - Job document
   * @param {string} newStatus - New status to set
   * @param {Object} email - Email object
   * @param {number} confidence - Confidence score
   * @param {string} emailLink - Gmail web link
   * @returns {Object} Update result
   */
  async performStatusUpdate(job, newStatus, email, confidence, emailLink) {
    try {
      const now = new Date();
      
      // Prepare status history entry
      const statusHistoryEntry = {
        status: newStatus,
        date: now,
        emailId: email.emailId,
        confidence: confidence,
        source: 'email_automation',
        notes: `Auto-updated from email: ${email.subject?.substring(0, 100) || 'No subject'}`
      };

      // Prepare email history entry
      const emailHistoryEntry = {
        emailId: email.emailId,
        subject: email.subject || 'No subject',
        sender: email.sender,
        receivedDate: email.receivedDate || now,
        emailLink: emailLink,
        classification: email.classification || 'unknown',
        confidence: confidence,
        statusUpdate: newStatus,
        processed: true
      };

      // Update the job document
      const updateQuery = {
        $set: {
          status: newStatus,
          lastUpdated: now
        },
        $push: {
          statusHistory: statusHistoryEntry,
          emailHistory: emailHistoryEntry
        }
      };

      // If transitioning to 'applied' and no dateApplied exists, set it
      if (newStatus === 'applied' && !job.dateApplied) {
        updateQuery.$set.dateApplied = now;
      }

      const result = await Job.findByIdAndUpdate(
        job._id,
        updateQuery,
        { new: true, runValidators: true }
      );

      if (!result) {
        return { success: false, reason: 'Job not found during update' };
      }

      return {
        success: true,
        jobId: job._id,
        oldStatus: job.status,
        newStatus: newStatus,
        confidence: confidence,
        emailId: email.emailId,
        updatedJob: result
      };

    } catch (error) {
      this.logger.error('Database update failed:', error, {
        jobId: job._id,
        emailId: email.emailId
      });
      return { success: false, reason: 'Database update failed', error: error.message };
    }
  }

  /**
   * Log email for manual review
   * @param {Object} email - Email object
   * @param {Object} jobMatch - Job match result
   * @returns {Object} Logging result
   */
  async logForManualReview(email, jobMatch) {
    try {
      const { job, confidence, emailData } = jobMatch;
      
      this.logger.log(`Email flagged for manual review - Low confidence: ${(confidence * 100).toFixed(1)}%`, {
        emailId: email.emailId,
        subject: email.subject?.substring(0, 100),
        sender: email.sender,
        jobId: job?._id,
        company: job?.company,
        position: job?.position,
        confidence: confidence,
        classification: emailData.classification,
        reason: confidence < 0.85 ? 'Below confidence threshold' : 'No matching job found'
      });

      // If we have a job match but low confidence, add to email history without status update
      if (job && confidence >= 0.5) {
        await this.addEmailToHistoryOnly(job, email, confidence, emailData.classification);
      }

      return {
        success: true,
        action: 'manual_review_required',
        confidence: confidence,
        jobMatch: job ? {
          jobId: job._id,
          company: job.company,
          position: job.position
        } : null
      };

    } catch (error) {
      this.logger.error('Error logging email for manual review:', error, {
        emailId: email.emailId
      });
      return { success: false, reason: 'Logging error', error: error.message };
    }
  }

  /**
   * Add email to job history without updating status
   * @param {Object} job - Job document
   * @param {Object} email - Email object
   * @param {number} confidence - Confidence score
   * @param {string} classification - Email classification
   */
  async addEmailToHistoryOnly(job, email, confidence, classification) {
    try {
      const emailLink = this.generateGmailLink(email.emailId);
      
      const emailHistoryEntry = {
        emailId: email.emailId,
        subject: email.subject || 'No subject',
        sender: email.sender,
        receivedDate: email.receivedDate || new Date(),
        emailLink: emailLink,
        classification: classification || 'unknown',
        confidence: confidence,
        statusUpdate: null, // No status update
        processed: true
      };

      await Job.findByIdAndUpdate(
        job._id,
        { $push: { emailHistory: emailHistoryEntry } }
      );

      this.logger.log('Email added to job history (no status update)', {
        jobId: job._id,
        emailId: email.emailId,
        confidence: confidence
      });

    } catch (error) {
      this.logger.error('Error adding email to history:', error, {
        jobId: job._id,
        emailId: email.emailId
      });
    }
  }

  /**
   * Check if status transition is valid
   * @param {string} currentStatus - Current job status
   * @param {string} newStatus - Proposed new status
   * @returns {boolean} Whether transition is valid
   */
  isValidTransition(currentStatus, newStatus) {
    if (!currentStatus || !newStatus) return false;
    
    const allowedTransitions = this.validTransitions[currentStatus] || [];
    return allowedTransitions.includes(newStatus);
  }

  /**
   * Generate Gmail web link for email
   * @param {string} emailId - Gmail message ID
   * @returns {string} Gmail web link
   */
  generateGmailLink(emailId) {
    if (!emailId) return '';
    return `https://mail.google.com/mail/u/0/#inbox/${emailId}`;
  }

  /**
   * Get status update statistics
   * @param {Date} startDate - Start date for statistics
   * @param {Date} endDate - End date for statistics
   * @returns {Object} Statistics object
   */
  async getUpdateStatistics(startDate, endDate = new Date()) {
    try {
      const jobs = await Job.find({
        'statusHistory.date': {
          $gte: startDate,
          $lte: endDate
        },
        'statusHistory.source': 'email_automation'
      });

      const stats = {
        totalUpdates: 0,
        updatesByStatus: {},
        averageConfidence: 0,
        updatesByDate: {}
      };

      let totalConfidence = 0;
      let confidenceCount = 0;

      jobs.forEach(job => {
        job.statusHistory.forEach(entry => {
          if (entry.source === 'email_automation' && 
              entry.date >= startDate && 
              entry.date <= endDate) {
            
            stats.totalUpdates++;
            
            // Count by status
            stats.updatesByStatus[entry.status] = (stats.updatesByStatus[entry.status] || 0) + 1;
            
            // Average confidence
            if (entry.confidence) {
              totalConfidence += entry.confidence;
              confidenceCount++;
            }
            
            // Count by date
            const dateKey = entry.date.toISOString().split('T')[0];
            stats.updatesByDate[dateKey] = (stats.updatesByDate[dateKey] || 0) + 1;
          }
        });
      });

      if (confidenceCount > 0) {
        stats.averageConfidence = totalConfidence / confidenceCount;
      }

      return stats;

    } catch (error) {
      this.logger.error('Error getting update statistics:', error);
      return null;
    }
  }
}

module.exports = { StatusUpdater };