const { google } = require('googleapis');
const path = require('path');
const fs = require('fs').promises;

// OAuth2 scopes - we only need read access to Gmail
const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];

// Path to your OAuth2 credentials file
const CREDENTIALS_PATH = path.join(__dirname, '..', 'client_secret_599335426572-ejt3gjd97pc0l2gjnvabto5m590d9bn3.apps.googleusercontent.com.json');

// Path to store the token
const TOKEN_PATH = path.join(__dirname, '..', 'token.json');

class GmailAuth {
  constructor() {
    this.oAuth2Client = null;
  }

  async loadCredentials() {
    try {
      const content = await fs.readFile(CREDENTIALS_PATH);
      const credentials = JSON.parse(content);
      return credentials.installed || credentials.web;
    } catch (error) {
      throw new Error('Error loading credentials file: ' + error.message);
    }
  }

  async authorize() {
    const credentials = await this.loadCredentials();
    const { client_secret, client_id, redirect_uris } = credentials;
    
    this.oAuth2Client = new google.auth.OAuth2(
      client_id, 
      client_secret, 
      redirect_uris[0]
    );

    try {
      // Try to load existing token
      const token = await fs.readFile(TOKEN_PATH);
      this.oAuth2Client.setCredentials(JSON.parse(token));
      return this.oAuth2Client;
    } catch (error) {
      // No token exists, need to get new one
      return await this.getNewToken();
    }
  }

  async getNewToken() {
    const authUrl = this.oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
    });

    console.log('Authorize this app by visiting this url:', authUrl);
    console.log('Enter the code from that page here:');
    
    // In a real implementation, you'd handle this differently
    // For now, this will require manual intervention
    throw new Error('Manual authorization required. Please visit the URL above and get the authorization code.');
  }

  async handleAuthCode(code) {
    try {
      const { tokens } = await this.oAuth2Client.getToken(code);
      this.oAuth2Client.setCredentials(tokens);
      
      // Store the token to disk for later program executions
      await fs.writeFile(TOKEN_PATH, JSON.stringify(tokens));
      console.log('Token stored to', TOKEN_PATH);
      
      return this.oAuth2Client;
    } catch (error) {
      throw new Error('Error retrieving access token: ' + error.message);
    }
  }

  getAuthClient() {
    return this.oAuth2Client;
  }
}

module.exports = GmailAuth;