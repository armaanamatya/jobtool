const { GmailService } = require('../services/gmailService');

async function testGmailFetch() {
  console.log('🔍 Testing Gmail service...');
  
  const gmailService = new GmailService();
  
  try {
    // Initialize the service
    await gmailService.initialize();
    
    // Fetch SWEList emails from the last 30 days
    console.log('📧 Fetching SWEList emails...');
    const emails = await gmailService.getSWEListEmails(30);
    
    console.log(`\n✅ Found ${emails.length} SWEList emails`);
    
    // Process each email
    for (let i = 0; i < Math.min(emails.length, 3); i++) {
      const email = emails[i];
      console.log(`\n--- Email ${i + 1} ---`);
      
      // Extract metadata
      const metadata = gmailService.extractEmailMetadata(email);
      console.log('📋 Subject:', metadata.subject);
      console.log('📅 Date:', metadata.date);
      console.log('📬 From:', metadata.from);
      
      // Extract body
      const body = gmailService.extractEmailBody(email);
      console.log('📄 Has HTML:', !!body.html);
      console.log('📄 Has Text:', !!body.text);
      
      // Show first 200 characters of the body for preview
      const preview = body.html || body.text;
      if (preview) {
        console.log('📝 Preview:', preview.substring(0, 200) + '...');
      }
    }
    
    console.log('\n🎉 Gmail test completed successfully!');
    
  } catch (error) {
    console.error('❌ Gmail test failed:', error.message);
  }
}

if (require.main === module) {
  testGmailFetch();
}

module.exports = testGmailFetch;