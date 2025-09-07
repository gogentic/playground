# Google OAuth Setup for Playground

## Where to Add Google Client ID

The Google Client ID needs to be configured in **Supabase Dashboard**, not in your application code.

## Step-by-Step Setup

### 1. Get Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to **APIs & Services** → **Credentials**
4. Click **+ CREATE CREDENTIALS** → **OAuth client ID**
5. Configure the OAuth consent screen if needed:
   - Choose "External" user type
   - Add app name: "Playground"
   - Add your email as support email
   - Add authorized domain: `gogentic.ai`
6. For the OAuth client ID:
   - Application type: **Web application**
   - Name: "Playground Web Client"
   - Authorized JavaScript origins:
     ```
     https://playground.gogentic.ai
     http://localhost:5173
     ```
   - Authorized redirect URIs (IMPORTANT):
     ```
     https://eyvzodvryeqnuqkwkivy.supabase.co/auth/v1/callback
     ```
7. Click **CREATE**
8. Copy your **Client ID** and **Client Secret**

### 2. Configure in Supabase Dashboard

1. Go to your [Supabase Dashboard](https://app.supabase.com)
2. Select your project (eyvzodvryeqnuqkwkivy)
3. Navigate to **Authentication** → **Providers**
4. Find **Google** in the list
5. Toggle **Enable Sign in with Google** to ON
6. Paste your:
   - **Client ID** from Google
   - **Client Secret** from Google
7. Click **Save**

### 3. Configure Redirect URLs in Supabase

1. Still in Supabase Dashboard
2. Go to **Authentication** → **URL Configuration**
3. Set **Site URL** to:
   ```
   https://playground.gogentic.ai
   ```
4. Add **Redirect URLs** (one per line):
   ```
   https://playground.gogentic.ai
   https://playground.gogentic.ai/*
   http://localhost:5173
   http://localhost:5173/*
   ```
5. Click **Save**

### 4. Test the Integration

1. Visit https://playground.gogentic.ai
2. Click "Sign in with Google"
3. You should be redirected to Google's login page
4. After authorization, you'll be redirected back to the app

## Important Notes

- The **Client ID** goes in Supabase, NOT in your `.env` file
- The callback URL must be exactly: `https://eyvzodvryeqnuqkwkivy.supabase.co/auth/v1/callback`
- Your Supabase project ID is: `eyvzodvryeqnuqkwkivy`
- The OAuth flow: Your App → Supabase → Google → Supabase → Your App

## Troubleshooting

### "Unsupported Provider" Error
This means Google OAuth is not enabled in Supabase. Check step 2.

### "Invalid Client" Error
The Client ID or Secret in Supabase doesn't match what Google expects.

### Redirect URI Mismatch
The callback URL in Google Console must exactly match Supabase's callback URL.

### Email Whitelist
Currently set to `@gogentic.ai` - Google OAuth users need emails ending with this domain to sign up.