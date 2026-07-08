#!/usr/bin/env node

/**
 * LinkedIn OAuth Helper Script
 * Run this to get your access token for the LinkedIn API
 */

import express from 'express';
import open from 'open';

const CLIENT_ID = process.env.LINKEDIN_CLIENT_ID || '86h9k9p9p7ju8w';
const CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET;
const REDIRECT_URI = 'http://localhost:3000/callback';
const SCOPE = 'w_member_social';

if (!CLIENT_SECRET) {
  console.error('❌ LINKEDIN_CLIENT_SECRET environment variable is required');
  console.log('Set it with: export LINKEDIN_CLIENT_SECRET="your_secret_here"');
  process.exit(1);
}

const app = express();

// Step 1: Start the OAuth flow
app.get('/auth', (req, res) => {
  const authUrl = `https://www.linkedin.com/oauth/v2/authorization?` +
    `response_type=code&` +
    `client_id=${CLIENT_ID}&` +
    `redirect_uri=${encodeURIComponent(REDIRECT_URI)}&` +
    `scope=${SCOPE}`;
  
  res.redirect(authUrl);
});

// Step 2: Handle the callback and exchange code for token
app.get('/callback', async (req, res) => {
  const { code } = req.query;
  
  if (!code) {
    res.send('Error: No authorization code received');
    return;
  }

  try {
    // Exchange code for access token
    const tokenResponse = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
      }),
    });

    const tokenData = await tokenResponse.json();
    
    if (tokenData.access_token) {
      console.log('\n🎉 SUCCESS! Your LinkedIn Access Token:');
      console.log(tokenData.access_token);
      console.log('\nAdd this to your environment:');
      console.log(`export LINKEDIN_ACCESS_TOKEN="${tokenData.access_token}"`);
      
      res.send(`
        <h1>✅ Success!</h1>
        <p>Your access token has been generated. Check your terminal for the token.</p>
        <p>You can close this window.</p>
      `);
    } else {
      console.error('Error getting token:', tokenData);
      res.send('Error getting access token. Check terminal for details.');
    }
  } catch (error) {
    console.error('Error:', error);
    res.send('Error occurred. Check terminal for details.');
  }
});

// Start server
const server = app.listen(3000, () => {
  console.log('🚀 LinkedIn OAuth server started on http://localhost:3000');
  console.log('Opening browser to start OAuth flow...');
  
  // Open browser to start OAuth flow
  open('http://localhost:3000/auth');
});

// Auto-close server after 5 minutes
setTimeout(() => {
  console.log('\n⏰ Closing OAuth server after 5 minutes');
  server.close();
}, 5 * 60 * 1000);