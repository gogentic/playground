# Supabase Email Configuration Guide

## Issue: Not Receiving Confirmation Emails

If you're not receiving confirmation emails for @gogentic.ai addresses, you need to configure Supabase email settings.

## Steps to Enable Email Authentication

### 1. Check Email Provider Settings in Supabase

1. Go to your Supabase project dashboard: https://app.supabase.com
2. Navigate to **Authentication** → **Providers**
3. Ensure **Email** is enabled
4. Check the following settings:
   - ✅ Enable Email provider
   - ✅ Confirm email (should be ON for security)
   - ✅ Secure email change (recommended)

### 2. Configure SMTP Settings (Required for Production)

By default, Supabase uses their built-in email service which has rate limits. For production, you should configure custom SMTP:

1. Go to **Project Settings** → **Auth**
2. Scroll to **SMTP Settings**
3. Enable **Custom SMTP**
4. Configure with your email provider:

#### Option A: Using Gmail/Google Workspace (Recommended for @gogentic.ai)
```
Host: smtp.gmail.com
Port: 587
Username: your-email@gogentic.ai
Password: [App-specific password - see below]
Sender email: noreply@gogentic.ai
Sender name: Playground
```

**To get Gmail App Password:**
1. Go to Google Account settings
2. Security → 2-Step Verification (must be enabled)
3. App passwords → Generate new app password
4. Use this password in Supabase SMTP settings

#### Option B: Using SendGrid (Alternative)
```
Host: smtp.sendgrid.net
Port: 587
Username: apikey
Password: [Your SendGrid API key]
Sender email: noreply@gogentic.ai
Sender name: Playground
```

### 3. Configure Email Templates

1. In Supabase, go to **Authentication** → **Email Templates**
2. Customize these templates:
   - **Confirm signup** - For new registrations
   - **Magic Link** - For passwordless login
   - **Reset Password** - For password recovery

Example Magic Link template:
```html
<h2>Sign in to Playground</h2>
<p>Click the link below to sign in to your Playground account:</p>
<p><a href="{{ .ConfirmationURL }}">Sign In</a></p>
<p>This link will expire in 60 minutes.</p>
<p>If you didn't request this, please ignore this email.</p>
```

### 4. Configure Redirect URLs

1. Go to **Authentication** → **URL Configuration**
2. Add these to **Redirect URLs**:
   ```
   https://playground.gogentic.ai
   https://playground.gogentic.ai/*
   http://localhost:5173
   http://localhost:5173/*
   ```

### 5. Check Rate Limits

If using Supabase's default email service:
- **Rate limit**: 4 emails per hour per user
- **Daily limit**: 30 emails per project

This is why custom SMTP is recommended for production.

### 6. Test Email Delivery

1. Check spam/junk folder
2. Verify the sender domain (gogentic.ai) has proper:
   - SPF records
   - DKIM records
   - DMARC policy

### 7. Debug Email Issues

In Supabase dashboard:
1. Go to **Authentication** → **Users**
2. Check if users are created but unconfirmed
3. Go to **Logs** → **Auth Logs** to see email sending attempts

## Quick Checklist

- [ ] Email provider enabled in Supabase
- [ ] Custom SMTP configured (for production)
- [ ] Redirect URLs include playground.gogentic.ai
- [ ] Email templates configured
- [ ] SPF/DKIM records set up for domain
- [ ] Test with magic link option (no password required)

## Testing the Fix

1. Go to https://playground.gogentic.ai
2. Click "Sign in with magic link"
3. Enter your @gogentic.ai email
4. Check email (including spam folder)
5. Click the magic link to sign in

If emails still don't arrive after SMTP configuration, check:
- Firewall/security settings blocking SMTP
- Email provider logs for bounce/rejection reasons
- Supabase auth logs for errors