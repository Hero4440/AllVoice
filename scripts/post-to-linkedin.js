#!/usr/bin/env node

/**
 * LinkedIn Post Script
 * Posts the latest LinkedIn post to LinkedIn API
 */

import fs from 'fs';
import path from 'path';

async function postToLinkedIn() {
  const accessToken = process.env.LINKEDIN_ACCESS_TOKEN;
  const personUrn = process.env.LINKEDIN_PERSON_URN;
  
  if (!accessToken) {
    console.error('❌ LINKEDIN_ACCESS_TOKEN environment variable not set');
    console.log('Run: export LINKEDIN_ACCESS_TOKEN="your_token_here"');
    process.exit(1);
  }

  if (!personUrn) {
    console.error('❌ LINKEDIN_PERSON_URN environment variable not set');
    console.log('Run: export LINKEDIN_PERSON_URN="urn:li:person:YOUR_ID"');
    console.log('\n💡 To get your person URN, run:');
    console.log('node scripts/get-linkedin-token-with-profile.js');
    process.exit(1);
  }

  try {
    // Find the latest LinkedIn post file
    const postsDir = path.join(process.cwd(), 'docs/linkedin-posts');
    const files = fs.readdirSync(postsDir)
      .filter(file => file.endsWith('.md'))
      .sort()
      .reverse(); // Get latest first

    if (files.length === 0) {
      console.error('❌ No LinkedIn post files found in docs/linkedin-posts/');
      process.exit(1);
    }

    const latestFile = files[0];
    const filePath = path.join(postsDir, latestFile);
    const content = fs.readFileSync(filePath, 'utf8');

    // Extract the post content (look for content in code blocks or after ---)
    let postText = '';
    
    if (content.includes('```')) {
      // Extract from code block
      const match = content.match(/```\n([\s\S]*?)\n```/);
      if (match) {
        postText = match[1].trim();
      }
    } else {
      // Extract content after --- separator
      const parts = content.split('---');
      if (parts.length >= 3) {
        postText = parts[2].trim();
        // Remove the "Note:" section at the end
        postText = postText.replace(/\n\n\*\*Note:\*\*.*$/s, '');
      }
    }

    if (!postText) {
      console.error('❌ Could not extract post content from', latestFile);
      process.exit(1);
    }

    console.log('📝 Posting to LinkedIn:');
    console.log('---');
    console.log(postText);
    console.log('---');

    // Create the post using the new LinkedIn Posts API (v2)
    console.log('🚀 Posting via LinkedIn Posts API...');
    
    const postData = {
      author: personUrn,
      commentary: postText,
      visibility: 'PUBLIC',
      distribution: {
        feedDistribution: 'MAIN_FEED',
        targetEntities: [],
        thirdPartyDistributionChannels: []
      },
      lifecycleState: 'PUBLISHED',
      isReshareDisabledByAuthor: false
    };

    const postResponse = await fetch('https://api.linkedin.com/rest/posts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'LinkedIn-Version': '202604',
        'X-Restli-Protocol-Version': '2.0.0'
      },
      body: JSON.stringify(postData),
    });

    if (postResponse.ok) {
      const postId = postResponse.headers.get('x-restli-id');
      console.log('🎉 Successfully posted to LinkedIn!');
      console.log('Post ID:', postId);
      console.log('Status:', postResponse.status, postResponse.statusText);
    } else {
      const error = await postResponse.text();
      console.error('❌ Failed to post to LinkedIn:', postResponse.status, postResponse.statusText);
      console.error('Error details:', error);
      
      // Show debugging info
      console.log('\n🔍 Debugging info:');
      console.log('Token length:', accessToken.length);
      console.log('Post length:', postText.length);
      console.log('API endpoint: https://api.linkedin.com/rest/posts');
      console.log('Required scope: w_member_social ✅');
    }

  } catch (error) {
    console.error('❌ Error posting to LinkedIn:', error.message);
    process.exit(1);
  }
}

postToLinkedIn();