#!/usr/bin/env node

/**
 * LinkedIn Token Exchange
 * Exchanges authorization code for access token
 */

const CLIENT_ID = process.env.LINKEDIN_CLIENT_ID || '86h9k9p9p7ju8w';
const CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET;
const REDIRECT_URI = 'https://localhost:3000/callback';

if (!CLIENT_SECRET) {
  console.error('❌ LINKEDIN_CLIENT_SECRET environment variable is required');
  console.log('Set it with: export LINKEDIN_CLIENT_SECRET="your_secret_here"');
  process.exit(1);
}

const authCode = process.argv[2];

if (!authCode) {
  console.error('❌ Please provide the authorization code');
  console.log('Usage: node scripts/exchange-token.js YOUR_CODE_HERE');
  process.exit(1);
}

async function exchangeToken() {
  try {
    console.log('🔄 Exchanging authorization code for access token...');
    
    const response = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: authCode,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
      }),
    });

    const data = await response.json();
    
    if (data.access_token) {
      console.log('\n🎉 SUCCESS! Your LinkedIn Access Token:');
      console.log('==========================================');
      console.log(data.access_token);
      console.log('\n📋 Add this to your environment:');
      console.log(`export LINKEDIN_ACCESS_TOKEN="${data.access_token}"`);
      console.log('\n⏰ Token expires in:', data.expires_in, 'seconds');
      console.log('💡 Save this token - you\'ll need it to post to LinkedIn!');
    } else {
      console.error('❌ Error getting token:', data);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

exchangeToken();