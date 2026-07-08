#!/usr/bin/env node

/**
 * LinkedIn Token Helper with Profile Access
 * This requests BOTH w_member_social AND r_liteprofile scopes
 */

const CLIENT_ID = process.env.LINKEDIN_CLIENT_ID || '86h9k9p9p7ju8w';
const CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET;
const SCOPES = 'openid profile w_member_social email'; // All scopes needed

if (!CLIENT_SECRET) {
  console.error('❌ LINKEDIN_CLIENT_SECRET environment variable is required');
  console.log('Set it with: export LINKEDIN_CLIENT_SECRET="your_secret_here"');
  process.exit(1);
}

console.log('🔗 LinkedIn OAuth with Profile Access');
console.log('=====================================\n');

console.log('⚠️  IMPORTANT: Your LinkedIn app must have these scopes enabled:');
console.log('   - openid (for authentication)');
console.log('   - profile (for reading your profile)');
console.log('   - w_member_social (for posting)');
console.log('   - email (for email access)\n');

console.log('Step 1: Open this URL in your browser:');
console.log('--------------------------------------');

const authUrl = `https://www.linkedin.com/oauth/v2/authorization?` +
  `response_type=code&` +
  `client_id=${CLIENT_ID}&` +
  `redirect_uri=${encodeURIComponent('https://localhost:3000/callback')}&` +
  `scope=${encodeURIComponent(SCOPES)}`;

console.log(authUrl);
console.log('\n');

console.log('Step 2: After authorizing, copy the "code" from the URL');
console.log('The URL will look like:');
console.log('https://localhost:3000/callback?code=YOUR_CODE_HERE&state=...');
console.log('\n');

console.log('Step 3: Run this command with your code:');
console.log('node scripts/exchange-token-with-profile.js YOUR_CODE_HERE');
console.log('\n');

console.log('💡 The page will show an SSL error - that\'s normal!');
console.log('Just copy the code from the URL bar.');