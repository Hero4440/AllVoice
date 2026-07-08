#!/usr/bin/env node

/**
 * LinkedIn Token Helper - Manual OAuth Flow
 * This will guide you through getting your LinkedIn access token manually
 */

const CLIENT_ID = process.env.LINKEDIN_CLIENT_ID || '86h9k9p9p7ju8w';
const CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET;
const SCOPE = 'w_member_social';

if (!CLIENT_SECRET) {
  console.error('❌ LINKEDIN_CLIENT_SECRET environment variable is required');
  console.log('Set it with: export LINKEDIN_CLIENT_SECRET="your_secret_here"');
  process.exit(1);
}

console.log('🔗 LinkedIn OAuth Manual Flow');
console.log('=============================\n');

console.log('Step 1: Open this URL in your browser:');
console.log('--------------------------------------');

const authUrl = `https://www.linkedin.com/oauth/v2/authorization?` +
  `response_type=code&` +
  `client_id=${CLIENT_ID}&` +
  `redirect_uri=${encodeURIComponent('https://localhost:3000/callback')}&` +
  `scope=${SCOPE}`;

console.log(authUrl);
console.log('\n');

console.log('Step 2: After authorizing, you\'ll be redirected to a page that won\'t load.');
console.log('Copy the "code" parameter from the URL. It will look like:');
console.log('https://localhost:3000/callback?code=YOUR_CODE_HERE&state=...');
console.log('\n');

console.log('Step 3: Run this command with your code:');
console.log('node scripts/exchange-token.js YOUR_CODE_HERE');
console.log('\n');

console.log('💡 Tip: The redirect page will show an error - that\'s normal!');
console.log('Just copy the code from the URL bar.');