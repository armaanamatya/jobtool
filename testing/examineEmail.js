const GmailService = require('../services/gmailService');
const fs = require('fs').promises;

async function examineEmailStructure() {
  console.log('🔍 Examining SWEList email structure...');
  
  const gmailService = new GmailService();
  
  try {
    await gmailService.initialize();
    
    // Get the most recent email
    const emails = await gmailService.getSWEListEmails(1);
    
    if (emails.length === 0) {
      console.log('No emails found');
      return;
    }
    
    const email = emails[0];
    const metadata = gmailService.extractEmailMetadata(email);
    const body = gmailService.extractEmailBody(email);
    
    console.log('📋 Subject:', metadata.subject);
    console.log('📅 Date:', metadata.date);
    
    // Save the HTML to a file for examination
    await fs.writeFile('C:\\Users\\armaa\\OneDrive\\Desktop\\jobtool\\debug_email.html', body.html);
    console.log('📄 HTML content saved to debug_email.html');
    
    // Extract the first 2000 characters to see the structure
    console.log('\n📝 HTML Structure Preview:');
    console.log(body.html.substring(0, 2000));
    
    // Look for specific patterns
    console.log('\n🔍 Looking for job patterns...');
    
    const cheerio = require('cheerio');
    const $ = cheerio.load(body.html);
    
    // Find all links
    console.log(`\n🔗 Found ${$('a').length} links total`);
    
    // Find Simplify links specifically
    const simplifyLinks = $('a[href*="simplify.jobs"]');
    console.log(`🎯 Found ${simplifyLinks.length} Simplify links`);
    
    // Examine each Simplify link and its context
    simplifyLinks.each((index, element) => {
      if (index < 5) { // Show first 5
        const $link = $(element);
        const href = $link.attr('href');
        const text = $link.text().trim();
        const parent = $link.parent();
        const parentText = parent.text().trim();
        
        console.log(`\n--- Link ${index + 1} ---`);
        console.log('Text:', text);
        console.log('Parent text:', parentText.substring(0, 200));
        console.log('URL:', href.substring(0, 80) + '...');
        
        // Look at siblings
        const siblings = parent.children();
        console.log('Siblings count:', siblings.length);
        siblings.each((i, sibling) => {
          if (i < 3) {
            const siblingText = $(sibling).text().trim();
            if (siblingText && siblingText.length > 0) {
              console.log(`  Sibling ${i}: ${siblingText.substring(0, 100)}`);
            }
          }
        });
      }
    });
    
  } catch (error) {
    console.error('❌ Error examining email:', error.message);
  }
}

if (require.main === module) {
  examineEmailStructure();
}

module.exports = examineEmailStructure;