import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { isEmailAllowed, getWhitelistMessage } from '../../lib/authHelpers';
import './AuthModal.css';

interface AuthFormProps {
  onSuccess: () => void;
}

export function AuthForm({ onSuccess }: AuthFormProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const whitelistMessage = getWhitelistMessage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Check whitelist for sign up
      if (isSignUp && !isEmailAllowed(email)) {
        setError('This email is not authorized to use this application.');
        setLoading(false);
        return;
      }

      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        setError('Check your email for the confirmation link!');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        onSuccess();
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthSignIn = async (provider: 'google' | 'github') => {
    setError(null);
    setLoading(true);

    try {
      // Use the actual app URL for redirects
      const redirectUrl = window.location.origin || 'https://protobyte.gogentic.ai';
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: redirectUrl,
        },
      });
      if (error) throw error;
    } catch (error: any) {
      setError(error.message);
      setLoading(false);
    }
  };

  return (
    <div className="custom-auth-form">
      {whitelistMessage && (
        <div className="whitelist-notice">
          {whitelistMessage}
        </div>
      )}
      
      {error && (
        <div className={error.includes('Check your email') ? 'auth-success' : 'auth-error'}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            disabled={loading}
          />
        </div>

        <button
          type="submit"
          className="auth-submit-btn"
          disabled={loading}
        >
          {loading ? 'Loading...' : (isSignUp ? 'Sign Up' : 'Sign In')}
        </button>

        <button
          type="button"
          className="auth-toggle-btn"
          onClick={() => setIsSignUp(!isSignUp)}
          disabled={loading}
        >
          {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
        </button>
      </form>

      <div className="auth-divider">
        <span>OR</span>
      </div>

      <div className="oauth-buttons">
        <button
          onClick={() => handleOAuthSignIn('google')}
          className="oauth-btn google"
          disabled={loading}
        >
          Sign in with Google
        </button>
        <button
          onClick={() => handleOAuthSignIn('github')}
          className="oauth-btn github"
          disabled={loading}
        >
          Sign in with GitHub
        </button>
      </div>
    </div>
  );
}