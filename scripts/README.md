# LinkedIn OAuth Scripts

These scripts help you authenticate with LinkedIn and post updates.

## Setup

1. **Set your LinkedIn Client Secret** (required):
   ```bash
   export LINKEDIN_CLIENT_SECRET="your_secret_here"
   ```

2. **Get your access token** using one of these methods:

   ### Method 1: Automated OAuth Flow
   ```bash
   node scripts/linkedin-oauth.js
   ```
   This will open your browser and guide you through the OAuth flow.

   ### Method 2: Manual OAuth Flow
   ```bash
   # Step 1: Get the authorization URL
   node scripts/get-linkedin-token-with-profile.js
   
   # Step 2: Open the URL in your browser and authorize
   # Step 3: Copy the code from the redirect URL
   # Step 4: Exchange the code for a token
   node scripts/exchange-token-with-profile.js YOUR_CODE_HERE
   ```

3. **Set the tokens** from the output:
   ```bash
   export LINKEDIN_ACCESS_TOKEN="your_token_here"
   export LINKEDIN_PERSON_URN="urn:li:person:your_id_here"
   ```

## Post to LinkedIn

Once you have your tokens set:

```bash
node scripts/post-to-linkedin.js
```

This will post the content from `docs/linkedin-posts/` to your LinkedIn profile.

## Security Notes

- **NEVER commit your `LINKEDIN_CLIENT_SECRET`** - it's in `.gitignore`
- Access tokens expire after ~60 days
- Keep your tokens secure and don't share them
