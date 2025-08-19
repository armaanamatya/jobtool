const { GmailService } = require('../services/gmailService');
const { JobLogger } = require('../services/jobLogger');
require('dotenv').config();

async function debugApplicationScraper() {
  const gmailService = new GmailService();
  const logger = new JobLogger('debug_application_scraper');
  
  try {
    logger.log('Debugging application scraper...');
    
    // Initialize Gmail service
    await gmailService.initialize();
    
    // Test broader search patterns
    const queries = [
      // Very broad search for June-August 2025
      'after:2025/6/1 before:2025/8/19 in:inbox',
      
      // Application-related terms
      'after:2025/6/1 before:2025/8/19 in:inbox (application OR applied OR "thank you")',
      
      // Confirmation emails
      'after:2025/6/1 before:2025/8/19 in:inbox (confirmation OR received OR submitted)',
      
      // Specific companies or platforms
      'after:2025/6/1 before:2025/8/19 in:inbox (greenhouse OR lever OR workday OR simplify)',
      
      // Common senders
      'after:2025/6/1 before:2025/8/19 in:inbox (from:noreply OR from:careers OR from:hiring)'
    ];
    
    for (let i = 0; i < queries.length; i++) {
      const query = queries[i];
      logger.log(`\n=== Testing Query ${i + 1} ===`);
      logger.log('Query:', { query });
      
      try {
        const emails = await gmailService.searchEmails(query, 10);
        logger.log(`Found ${emails.length} emails`);
        
        // Show sample emails
        emails.slice(0, 3).forEach((email, index) => {
          logger.log(`Sample Email ${index + 1}:`, {
            subject: email.subject?.substring(0, 100),
            sender: email.sender,
            date: email.receivedDate
          });
        });
        
      } catch (error) {
        logger.error(`Query ${i + 1} failed:`, error);
      }
      
      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Test specific date that definitely has emails
    logger.log('\n=== Testing Recent Week ===');
    const recentQuery = 'after:2025/8/12 before:2025/8/19 in:inbox';
    const recentEmails = await gmailService.searchEmails(recentQuery, 10);
    
    logger.log(`Recent week emails: ${recentEmails.length}`);
    recentEmails.slice(0, 5).forEach((email, index) => {
      logger.log(`Recent Email ${index + 1}:`, {
        subject: email.subject?.substring(0, 100),
        sender: email.sender,
        date: email.receivedDate
      });
    });
    
  } catch (error) {
    logger.error('Debug failed:', error);
  }
}

debugApplicationScraper();