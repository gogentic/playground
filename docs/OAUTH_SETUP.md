# OAuth Setup Guide for Playground

## Setting up OAuth Providers in Supabase

### 1. Enable Google OAuth

1. Go to your Supabase project dashboard
2. Navigate to **Authentication** → **Providers**
3. Find **Google** in the list and click to expand
4. Toggle **Enable Google provider** to ON
5. You'll need:
   - **Client ID** (from Google Cloud Console)
   - **Client Secret** (from Google Cloud Console)

#### Getting Google OAuth Credentials:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Go to **Credentials** → **Create Credentials** → **OAuth client ID**
5. Choose **Web application**
6. Add authorized redirect URI: 
   ```
   https://[YOUR-SUPABASE-PROJECT].supabase.co/auth/v1/callback
   ```
7. Copy the Client ID and Client Secret to Supabase

### 2. Enable GitHub OAuth

1. In Supabase, find **GitHub** in the providers list
2. Toggle **Enable GitHub provider** to ON
3. You'll need:
   - **Client ID** (from GitHub)
   - **Client Secret** (from GitHub)

#### Getting GitHub OAuth Credentials:
1. Go to GitHub Settings → **Developer settings** → **OAuth Apps**
2. Click **New OAuth App**
3. Fill in:
   - Application name: `Playground`
   - Homepage URL: `https://playground.gogentic.ai`
   - Authorization callback URL:
     ```
     https://[YOUR-SUPABASE-PROJECT].supabase.co/auth/v1/callback
     ```
4. After creating, copy the Client ID and generate a Client Secret
5. Add these to Supabase

### 3. Configure Redirect URLs

In Supabase, go to **Authentication** → **URL Configuration** and add:

**Site URL**: `https://playground.gogentic.ai`

**Redirect URLs** (add all of these):
```
https://playground.gogentic.ai
https://playground.gogentic.ai/*
http://localhost:5173
http://localhost:5173/*
```

### 4. Test the Integration

1. Clear your browser cache
2. Visit https://playground.gogentic.ai
3. Click "Sign in with Google" or "Sign in with GitHub"
4. You should be redirected to the provider's login page
5. After authorization, you'll be redirected back to the app

## Troubleshooting

### "Unsupported Provider" Error
- Make sure the provider is enabled in Supabase
- Check that Client ID and Secret are correctly entered
- Verify the callback URL matches exactly

### Redirect Issues
- Ensure the Site URL and Redirect URLs are configured in Supabase
- Check that the OAuth app's callback URL matches Supabase's callback URL

### Email Whitelist
- If using email whitelist, OAuth users' emails must also be in the whitelist
- Check `/home/ira/dev/protobyte-studio/src/lib/authHelpers.ts` to manage whitelist