# LinkedIn API Setup Instructions

## Problem
Your current LinkedIn app only has the `w_member_social` scope, which allows posting but doesn't allow reading your profile to get your person URN (required for the `author` field).

## Solution
You need to add the `r_liteprofile` scope to your LinkedIn app to read your profile information.

## Steps to Fix

### 1. Update Your LinkedIn App Scopes

Go to your LinkedIn App settings:
https://www.linkedin.com/developers/apps/{your-app-id}/auth

Add the following scope:
- ✅ `w_member_social` (already have)
- ✅ `r_liteprofile` (need to add)

### 2. Get a New Access Token

After adding the scope, you need to get a new access token with both scopes:

```bash
node scripts/get-linkedin-token-with-profile.js
```

This will:
1. Open LinkedIn OAuth with BOTH scopes
2. Get your access token
3. Automatically fetch your person URN
4. Save it for future use

### 3. Test Posting

```bash
export LINKEDIN_ACCESS_TOKEN="your_new_token"
export LINKEDIN_PERSON_URN="urn:li:person:YOUR_ID"
node scripts/post-to-linkedin.js
```

## Alternative: Manual Person URN

If you can't add the `r_liteprofile` scope, you can manually find your person URN:

1. Go to your LinkedIn profile
2. Look at the URL: `https://www.linkedin.com/in/your-profile-name/`
3. Your person ID is in the page source or network requests
4. Set it manually: `export LINKEDIN_PERSON_URN="urn:li:person:YOUR_ID"`

## Current Status

❌ Token only has `w_member_social` scope
❌ Cannot read profile to get person URN
❌ Cannot post without person URN

✅ After adding `r_liteprofile` scope, everything will work!