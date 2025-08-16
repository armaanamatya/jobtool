const GmailAuth = require('../services/gmailAuth');
const readline = require('readline');

async function authenticate() {
  const auth = new GmailAuth();
  
  try {
    // Try to authorize with existing token
    const authClient = await auth.authorize();
    console.log('✅ Authentication successful! Gmail API is ready to use.');
    return authClient;
  } catch (error) {
    if (error.message.includes('Manual authorization required')) {
      console.log('\n🔐 First-time setup required...');
      
      // Generate auth URL
      const credentials = await auth.loadCredentials();
      const { client_secret, client_id, redirect_uris } = credentials;
      
      const oAuth2Client = new (require('googleapis').google.auth.OAuth2)(
        client_id, 
        client_secret, 
        redirect_uris[0]
      );

      const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: ['https://www.googleapis.com/auth/gmail.readonly'],
      });

      console.log('\n📋 Please follow these steps:');
      console.log('1. Visit this URL in your browser:');
      console.log('\n' + authUrl + '\n');
      console.log('2. Authorize the application');
      console.log('3. Copy the authorization code from the browser');
      console.log('4. Paste it below when prompted\n');

      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      rl.question('Enter the authorization code: ', async (code) => {
        try {
          auth.oAuth2Client = oAuth2Client;
          await auth.handleAuthCode(code);
          console.log('✅ Authentication successful! You can now run the email scraper.');
          rl.close();
        } catch (error) {
          console.error('❌ Authentication failed:', error.message);
          rl.close();
          process.exit(1);
        }
      });
    } else {
      console.error('❌ Authentication error:', error.message);
      process.exit(1);
    }
  }
}

if (require.main === module) {
  authenticate();
}

module.exports = authenticate;