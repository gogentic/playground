# Supabase Setup Guide for Playground

## Overview
This guide will help you set up Supabase for user authentication and scene storage in Playground.

## Step 1: Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Fill in the project details:
   - Project name: `playground` (or your preferred name)
   - Database Password: Choose a strong password (save this!)
   - Region: Choose the closest to your location
4. Click "Create new project" and wait for setup to complete

## Step 2: Get Your API Keys

1. Once your project is created, go to Settings → API
2. You'll need two values:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **Anon/Public Key**: A long string starting with `eyJ...`

## Step 3: Configure Environment Variables

1. Copy the `.env.example` file to `.env`:
```bash
cp .env.example .env
```

2. Edit `.env` and add your Supabase credentials:
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

## Step 4: Set Up the Database Schema

1. In your Supabase dashboard, go to SQL Editor
2. Copy the entire contents of `/supabase/schema.sql`
3. Paste it into the SQL Editor
4. Click "Run" to create all tables, policies, and triggers

## Step 5: Configure Authentication

1. In Supabase dashboard, go to Authentication → Providers
2. Enable Email provider (should be on by default)
3. Optionally enable OAuth providers:
   - **Google**: Requires Google Cloud Console setup
   - **GitHub**: Requires GitHub OAuth App setup

### Optional: Enable OAuth Providers

#### For Google OAuth:
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `https://your-project-id.supabase.co/auth/v1/callback`
6. Copy Client ID and Client Secret to Supabase

#### For GitHub OAuth:
1. Go to GitHub Settings → Developer Settings → OAuth Apps
2. Create a new OAuth App
3. Set Authorization callback URL: `https://your-project-id.supabase.co/auth/v1/callback`
4. Copy Client ID and Client Secret to Supabase

## Step 6: Test the Setup

1. Restart your development server:
```bash
npm run dev
```

2. In the app:
   - Click File → Sign In
   - Create a new account or sign in
   - Try saving a scene (File → Save/Load Scene)

## Database Structure

The setup creates the following tables:

### `profiles`
- Stores user profile information
- Automatically created when a user signs up

### `scenes`
- Stores saved physics scenes
- Includes:
  - Scene name and description
  - Full scene data (particles, constraints, environment)
  - Ownership and sharing settings
  - Timestamps

## Security

The database uses Row Level Security (RLS) policies:
- Users can only view/edit/delete their own scenes
- Public scenes can be viewed by everyone
- User profiles are viewable by all (for future collaboration features)

## Troubleshooting

### "Supabase credentials not found" warning
- Make sure your `.env` file exists and contains the correct keys
- Restart the dev server after adding the `.env` file

### Authentication not working
- Check that your Supabase project URL and anon key are correct
- Ensure the database schema has been applied
- Check the Supabase dashboard logs for errors

### Cannot save/load scenes
- Ensure you're signed in
- Check browser console for errors
- Verify the database tables exist in Supabase dashboard

## Next Steps

Once setup is complete, you can:
1. Save and load physics scenes
2. Share scenes publicly (coming soon)
3. Collaborate with other users (coming soon)

## Local Development vs Production

For production deployment:
1. Use environment variables in your hosting platform
2. Consider enabling additional security features in Supabase
3. Set up proper domain and SSL certificates
4. Configure CORS settings if needed