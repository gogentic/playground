#!/usr/bin/env node

/**
 * Test script to diagnose Supabase email issues
 * Run with: node scripts/test-email.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '..', '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testEmail() {
  const testEmail = process.argv[2];
  
  if (!testEmail) {
    console.log('Usage: node scripts/test-email.js your@email.com');
    process.exit(1);
  }

  console.log('🔍 Testing Supabase email configuration...\n');
  console.log(`📧 Test email: ${testEmail}`);
  console.log(`🔗 Supabase URL: ${supabaseUrl}`);
  console.log(`🔑 Using anon key: ${supabaseAnonKey.substring(0, 20)}...`);
  
  console.log('\n--- Test 1: Magic Link ---');
  try {
    const { data, error } = await supabase.auth.signInWithOtp({
      email: testEmail,
      options: {
        emailRedirectTo: 'https://playground.gogentic.ai',
      }
    });
    
    if (error) {
      console.error('❌ Magic link failed:', error.message);
      console.error('Error details:', error);
    } else {
      console.log('✅ Magic link request sent successfully!');
      console.log('Response:', data);
      console.log('\n📬 Check your email (including spam folder)');
    }
  } catch (err) {
    console.error('❌ Unexpected error:', err);
  }

  console.log('\n--- Test 2: Sign Up ---');
  try {
    // Generate random password for test
    const testPassword = 'TestPass' + Math.random().toString(36).substring(7) + '!';
    
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        emailRedirectTo: 'https://playground.gogentic.ai',
      }
    });
    
    if (error) {
      console.error('❌ Sign up failed:', error.message);
      console.error('Error details:', error);
    } else {
      console.log('✅ Sign up request sent successfully!');
      console.log('User created:', data.user?.email);
      console.log('Confirmation sent:', data.user?.confirmation_sent_at);
      console.log('User ID:', data.user?.id);
      
      if (data.user && !data.user.confirmed_at) {
        console.log('\n⚠️  User created but NOT confirmed - check email!');
      }
    }
  } catch (err) {
    console.error('❌ Unexpected error:', err);
  }

  console.log('\n--- Test 3: Check Auth Settings ---');
  try {
    // This will fail with anon key, but the error tells us something
    const { data, error } = await supabase.auth.admin.listUsers();
    if (error) {
      if (error.message.includes('not authorized')) {
        console.log('✅ Auth endpoint reachable (admin access denied as expected)');
      } else {
        console.log('⚠️  Unexpected auth error:', error.message);
      }
    }
  } catch (err) {
    console.log('Auth check response:', err.message);
  }

  console.log('\n--- Diagnostic Summary ---');
  console.log('1. If you see "sent successfully" but no email arrives:');
  console.log('   - Check Supabase Dashboard > Auth > Logs for email errors');
  console.log('   - Verify SMTP settings are saved and test connection');
  console.log('   - Check email provider spam/blocked senders');
  console.log('   - Ensure email templates are enabled');
  console.log('\n2. If you see errors above:');
  console.log('   - Check Supabase project is active (not paused)');
  console.log('   - Verify API keys are correct');
  console.log('   - Check network/firewall settings');
  
  console.log('\n📋 Next steps:');
  console.log('1. Go to: https://app.supabase.com/project/' + supabaseUrl.split('.')[0].replace('https://', ''));
  console.log('2. Check: Authentication > Logs');
  console.log('3. Check: Project Settings > Auth > SMTP Settings');
  console.log('4. Test SMTP connection in Supabase dashboard');
}

testEmail().catch(console.error);