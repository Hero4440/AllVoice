# LinkedIn Automation Complete Guide

## Overview
Your hook is configured to automatically generate and post LinkedIn updates when you complete spec tasks. This guide will help you get it fully working.

## Current Status

✅ Hook configured (`.kiro/hooks/linkedin-post-on-task.kiro.hook`)
✅ Scripts created
✅ LinkedIn app created with Client ID and Secret
❌ Need to add `r_liteprofile` scope to your app
❌ Need to get new access token with both scopes

## Step-by-Step Setup

### Step 1: Update Your LinkedIn App Scopes

1. Go to: https://www.linkedin.com/developers/apps
2. Click on your app (Client ID: 86h9k9p9p7ju8w)
3. Go to the "Products" tab
4. Request access to "Sign In with LinkedIn using OpenID Connect" (this gives you r_liteprofile)
5. Wait for approval (usually instant for personal apps)

OR

1. Go to the "Auth" tab
2. Under "OAuth 2.0 scopes", make sure you have:
   - ✅ `w_member_social` - Post, comment and like on behalf of a member
   - ✅ `r_liteprofile` - Retrieve authenticated member's name and profile

### Step 2: Get Your Access Token and Person URN

Run the OAuth flow with both scopes:

```bash
node scripts/get-linkedin-token-with-profile.js
```

This will:
1. Show you a URL to open in your browser
2. You'll authorize the app with BOTH scopes
3. Copy the code from the redirect URL
4. Run: `node scripts/exchange-token-with-profile.js YOUR_CODE`
5. Get both your access token AND person URN

### Step 3: Set Environment Variables

Add to your shell profile (`~/.zshrc` or `~/.bashrc`):

```bash
export LINKEDIN_ACCESS_TOKEN="your_token_here"
export LINKEDIN_PERSON_URN="urn:li:person:YOUR_ID"
```

Then reload: `source ~/.zshrc`

### Step 4: Test Manual Posting

```bash
node scripts/post-to-linkedin.js
```

This will post your latest LinkedIn post file to LinkedIn.

### Step 5: Test the Hook

Complete any task in your AllVoice spec:

```bash
# Example: Execute a task
kiro execute task 1
```

The hook will automatically:
1. Generate a professional LinkedIn post
2. Save it to `docs/linkedin-posts/YYYY-MM-DD-task-name.md`
3. Post it to LinkedIn via the API

## How It Works

### Hook Trigger
- **Event**: `postTaskExecution`
- **Action**: `askAgent` - Generates a professional LinkedIn post
- **Then**: Runs `node scripts/post-to-linkedin.js` to post it

### Post Generation
The agent creates posts with:
- Professional but approachable tone
- Technical details about what was shipped
- Connection to AllVoice mission (accessibility for blind/low-vision users)
- Kiro Spark Challenge context
- Relevant hashtags
- Under 1300 characters

### API Posting
The script:
1. Reads the latest post from `docs/linkedin-posts/`
2. Extracts the post content
3. Calls LinkedIn Posts API with your credentials
4. Returns the post ID on success

## Troubleshooting

### "Invalid access token" (401)
- Your token expired (they last ~60 days)
- Solution: Get a new token (Step 2)

### "Access denied" (403)
- Missing `r_liteprofile` scope
- Solution: Add the scope to your app (Step 1)

### "Person URN not set"
- Environment variable not configured
- Solution: Set `LINKEDIN_PERSON_URN` (Step 3)

### Hook not triggering
- Check hook is enabled: `.kiro/hooks/linkedin-post-on-task.kiro.hook`
- Verify `"enabled": true` in the hook file
- Make sure you're completing tasks (not just editing files)

## Alternative: Manual Posting

If you prefer to review posts before publishing:

1. Let the hook generate the post (it will save to `docs/linkedin-posts/`)
2. Review the content
3. Manually run: `node scripts/post-to-linkedin.js`

Or copy/paste the content directly to LinkedIn.

## Next Steps

1. **Add r_liteprofile scope** to your LinkedIn app
2. **Get new credentials** with both scopes
3. **Test posting** with the script
4. **Complete a task** to test the full automation

Once setup is complete, every task you finish will automatically post to LinkedIn! 🚀