#!/usr/bin/env node

/**
 * Test LinkedIn Token
 * Tests if the LinkedIn access token is working and what permissions it has
 */

async function testToken() {
  const accessToken = process.env.LINKEDIN_ACCESS_TOKEN;
  
  if (!accessToken) {
    console.error('❌ LINKEDIN_ACCESS_TOKEN environment variable not set');
    process.exit(1);
  }

  console.log('🔍 Testing LinkedIn access token...\n');

  try {
    // Test 1: Get user profile (basic info)
    console.log('Test 1: Getting user profile...');
    const profileResponse = await fetch('https://api.linkedin.com/v2/people/~', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('Profile API Status:', profileResponse.status, profileResponse.statusText);
    
    if (profileResponse.ok) {
      const profile = await profileResponse.json();
      console.log('✅ Profile access works!');
      console.log('User ID:', profile.id);
      console.log('Name:', profile.localizedFirstName, profile.localizedLastName);
    } else {
      const error = await profileResponse.text();
      console.log('❌ Profile access failed:', error);
    }

    console.log('\n---\n');

    // Test 2: Try to get profile with different endpoint
    console.log('Test 2: Getting profile with projection...');
    const profileResponse2 = await fetch('https://api.linkedin.com/v2/people/~?projection=(id,localizedFirstName,localizedLastName)', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('Profile Projection API Status:', profileResponse2.status, profileResponse2.statusText);
    
    if (profileResponse2.ok) {
      const profile2 = await profileResponse2.json();
      console.log('✅ Profile projection works!');
      console.log('Response:', JSON.stringify(profile2, null, 2));
    } else {
      const error2 = await profileResponse2.text();
      console.log('❌ Profile projection failed:', error2);
    }

    console.log('\n---\n');

    // Test 3: Check token introspection (if available)
    console.log('Test 3: Token introspection...');
    const introspectResponse = await fetch('https://api.linkedin.com/v2/introspectToken', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `token=${accessToken}`,
    });

    console.log('Introspection API Status:', introspectResponse.status, introspectResponse.statusText);
    
    if (introspectResponse.ok) {
      const introspection = await introspectResponse.json();
      console.log('✅ Token introspection works!');
      console.log('Scopes:', introspection.scope);
      console.log('Expires in:', introspection.expires_in);
    } else {
      console.log('❌ Token introspection not available or failed');
    }

  } catch (error) {
    console.error('❌ Error testing token:', error.message);
  }
}

testToken();