#!/usr/bin/env node

/**
 * LinkedIn Token Exchange with Profile Fetch
 * Exchanges authorization code for access token and fetches person URN
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
  console.log('Usage: node scripts/exchange-token-with-profile.js YOUR_CODE_HERE');
  process.exit(1);
}

async function exchangeAndFetchProfile() {
  try {
    console.log('🔄 Step 1: Exchanging authorization code for access token...\n');
    
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
    
    if (!data.access_token) {
      console.error('❌ Error getting token:', data);
      process.exit(1);
    }

    const accessToken = data.access_token;
    const idToken = data.id_token; // OpenID Connect ID token
    console.log('✅ Access token received!');
    console.log('Token expires in:', data.expires_in, 'seconds\n');

    // Step 2: Decode the ID token to get person ID
    if (idToken) {
      console.log('🔄 Step 2: Decoding ID token to get your person ID...\n');
      
      // ID tokens are JWT format: header.payload.signature
      // We only need the payload (middle part)
      const parts = idToken.split('.');
      if (parts.length === 3) {
        try {
          // Decode base64url payload
          const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
          const personId = payload.sub; // 'sub' claim contains the person ID
          const personUrn = `urn:li:person:${personId}`;
          
          console.log('✅ ID token decoded successfully!');
          console.log('Person URN:', personUrn);
          console.log('Name:', payload.name || `${payload.given_name} ${payload.family_name}`);
          if (payload.email) console.log('Email:', payload.email);
          console.log('\n');
          
          console.log('🎉 SUCCESS! Here are your credentials:');
          console.log('==========================================');
          console.log('\n📋 Add these to your environment:\n');
          console.log(`export LINKEDIN_ACCESS_TOKEN="${accessToken}"`);
          console.log(`export LINKEDIN_PERSON_URN="${personUrn}"`);
          console.log('\n');
          console.log('💾 Or add to your .env file:\n');
          console.log(`LINKEDIN_ACCESS_TOKEN=${accessToken}`);
          console.log(`LINKEDIN_PERSON_URN=${personUrn}`);
          console.log('\n');
          console.log('✅ Now you can post to LinkedIn!');
          console.log('Test it with these environment variables set:');
          console.log('node scripts/post-to-linkedin.js');
          
          process.exit(0);
        } catch (decodeError) {
          console.error('❌ Failed to decode ID token:', decodeError.message);
        }
      }
    }

    // Step 3: Fallback - try to fetch profile
    console.log('🔄 Step 2: Fetching your LinkedIn profile...\n');
    
    // Try the OpenID Connect userinfo endpoint first
    let profileResponse = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (profileResponse.ok) {
      const profile = await profileResponse.json();
      const personUrn = `urn:li:person:${profile.sub}`; // OpenID Connect uses 'sub' for user ID
      
      console.log('✅ Profile fetched successfully!');
      console.log('Person URN:', personUrn);
      console.log('Name:', profile.name || `${profile.given_name} ${profile.family_name}`);
      console.log('Email:', profile.email);
      console.log('\n');
      
      console.log('🎉 SUCCESS! Here are your credentials:');
      console.log('==========================================');
      console.log('\n📋 Add these to your environment:\n');
      console.log(`export LINKEDIN_ACCESS_TOKEN="${accessToken}"`);
      console.log(`export LINKEDIN_PERSON_URN="${personUrn}"`);
      console.log('\n');
      console.log('💾 Or add to your .env file:\n');
      console.log(`LINKEDIN_ACCESS_TOKEN=${accessToken}`);
      console.log(`LINKEDIN_PERSON_URN=${personUrn}`);
      console.log('\n');
      console.log('✅ Now you can post to LinkedIn!');
      console.log('Test it: node scripts/post-to-linkedin.js');
      
    } else {
      // Fallback to v2/me endpoint
      console.log('⚠️  OpenID endpoint failed, trying v2/me...\n');
      
      profileResponse = await fetch('https://api.linkedin.com/v2/me', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (profileResponse.ok) {
        const profile = await profileResponse.json();
        const personUrn = `urn:li:person:${profile.id}`;
        
        console.log('✅ Profile fetched successfully!');
        console.log('Person URN:', personUrn);
        console.log('Name:', profile.localizedFirstName, profile.localizedLastName);
        console.log('\n');
        
        console.log('🎉 SUCCESS! Here are your credentials:');
        console.log('==========================================');
        console.log('\n📋 Add these to your environment:\n');
        console.log(`export LINKEDIN_ACCESS_TOKEN="${accessToken}"`);
        console.log(`export LINKEDIN_PERSON_URN="${personUrn}"`);
        console.log('\n');
        console.log('💾 Or add to your .env file:\n');
        console.log(`LINKEDIN_ACCESS_TOKEN=${accessToken}`);
        console.log(`LINKEDIN_PERSON_URN=${personUrn}`);
        console.log('\n');
        console.log('✅ Now you can post to LinkedIn!');
        console.log('Test it: node scripts/post-to-linkedin.js');
        
      } else {
        const error = await profileResponse.text();
        console.error('❌ Failed to fetch profile:', profileResponse.status, profileResponse.statusText);
        console.error('Error:', error);
        console.log('\n⚠️  Your token works, but profile access failed!');
        console.log('Make sure your app has the "profile" or "openid" scope enabled.');
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

exchangeAndFetchProfile();