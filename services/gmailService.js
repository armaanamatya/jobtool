const { google } = require('googleapis');
const GmailAuth = require('./gmailAuth');

class GmailService {
  constructor() {
    this.gmail = null;
    this.auth = new GmailAuth();
  }

  async initialize() {
    try {
      const authClient = await this.auth.authorize();
      this.gmail = google.gmail({ version: 'v1', auth: authClient });
      console.log('Gmail service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Gmail service:', error.message);
      throw error;
    }
  }

  async searchEmails(query, maxResults = 10) {
    if (!this.gmail) {
      throw new Error('Gmail service not initialized. Call initialize() first.');
    }

    try {
      const response = await this.gmail.users.messages.list({
        userId: 'me',
        q: query,
        maxResults: maxResults
      });

      return response.data.messages || [];
    } catch (error) {
      console.error('Error searching emails:', error.message);
      throw error;
    }
  }

  async getEmailContent(messageId) {
    if (!this.gmail) {
      throw new Error('Gmail service not initialized. Call initialize() first.');
    }

    try {
      const response = await this.gmail.users.messages.get({
        userId: 'me',
        id: messageId,
        format: 'full'
      });

      return response.data;
    } catch (error) {
      console.error('Error getting email content:', error.message);
      throw error;
    }
  }

  async getSWEListEmails(daysBack = 7) {
    const date = new Date();
    date.setDate(date.getDate() - daysBack);
    const dateString = date.toISOString().split('T')[0]; // YYYY-MM-DD format

    // Search for SWEList emails from the last N days
    const query = `from:noreply@swelist.com subject:"New Internships Posted" after:${dateString}`;
    
    console.log('Searching for emails with query:', query);
    
    const messages = await this.searchEmails(query, 50);
    console.log(`Found ${messages.length} SWEList emails`);

    const emails = [];
    for (const message of messages) {
      try {
        const emailData = await this.getEmailContent(message.id);
        emails.push(emailData);
      } catch (error) {
        console.error(`Error fetching email ${message.id}:`, error.message);
      }
    }

    return emails;
  }

  extractEmailMetadata(emailData) {
    const headers = emailData.payload.headers;
    const metadata = {};

    headers.forEach(header => {
      switch (header.name.toLowerCase()) {
        case 'subject':
          metadata.subject = header.value;
          break;
        case 'date':
          metadata.date = new Date(header.value);
          break;
        case 'from':
          metadata.from = header.value;
          break;
        case 'message-id':
          metadata.messageId = header.value;
          break;
      }
    });

    return metadata;
  }

  extractEmailBody(emailData) {
    const parts = emailData.payload.parts || [emailData.payload];
    let htmlBody = '';
    let textBody = '';

    const extractFromParts = (parts) => {
      parts.forEach(part => {
        if (part.mimeType === 'text/html' && part.body.data) {
          htmlBody += Buffer.from(part.body.data, 'base64').toString('utf-8');
        } else if (part.mimeType === 'text/plain' && part.body.data) {
          textBody += Buffer.from(part.body.data, 'base64').toString('utf-8');
        } else if (part.parts) {
          extractFromParts(part.parts);
        }
      });
    };

    extractFromParts(parts);

    // If no parts, check the main body
    if (!htmlBody && !textBody && emailData.payload.body.data) {
      const bodyData = Buffer.from(emailData.payload.body.data, 'base64').toString('utf-8');
      if (emailData.payload.mimeType === 'text/html') {
        htmlBody = bodyData;
      } else {
        textBody = bodyData;
      }
    }

    return {
      html: htmlBody,
      text: textBody
    };
  }
}

module.exports = { GmailService };