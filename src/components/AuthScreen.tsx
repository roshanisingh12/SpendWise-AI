// AuthScreen component – handles Login and Registration
// Wired to AuthContext; does NOT call ApiService directly.
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

/** Map HTTP-status-bearing error messages to user-friendly strings. */
function friendlyError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);

  // 400 field-level Zod errors — check FIRST to avoid keyword false-matches
  if (msg.startsWith('400:')) {
    const fieldPart = msg.replace(/^400:\s*/, '');
    if (fieldPart.toLowerCase().includes('email')) {
      return 'Please enter a valid email address.';
    }
    if (fieldPart.toLowerCase().includes('password')) {
      return 'Password must be at least 8 characters and include a number and uppercase letter.';
    }
    if (fieldPart.toLowerCase().includes('name')) {
      return 'Please enter your name (at least 2 characters).';
    }
    return 'Please check your inputs and try again.';
  }
  // 401 → wrong credentials
  if (msg.startsWith('401:') || msg.toLowerCase().includes('invalid') || msg.toLowerCase().includes('incorrect') || msg.toLowerCase().includes('wrong')) {
    return 'Invalid email or password. Please try again.';
  }
  // 409 → duplicate account
  if (msg.startsWith('409:') || msg.toLowerCase().includes('already exists') || msg.toLowerCase().includes('duplicate')) {
    return 'An account with that email already exists. Try logging in.';
  }
  // 422 explicit unprocessable entity
  if (msg.startsWith('422:')) {
    return 'Please check your inputs and try again.';
  }
  // Rate limiting
  if (msg.startsWith('429:') || msg.toLowerCase().includes('too many')) {
    return 'Too many attempts. Please wait a moment and try again.';
  }
  // Server errors
  if (msg.startsWith('500:') || msg.toLowerCase().includes('server')) {
    return 'A server error occurred. Please try again later.';
  }
  // Network / CORS failure
  if (msg.toLowerCase().includes('failed to fetch') || msg.toLowerCase().includes('networkerror')) {
    return 'Unable to reach the server. Please check your connection and try again.';
  }
  // Fallback: show the message but never a stack trace
  return msg.split('\n')[0] || 'Authentication failed. Please try again.';
}

export function AuthScreen() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Basic client-side validation
    if (mode === 'register' && !name.trim()) {
      setError('Please enter your name.');
      return;
    }
    if (!email.trim()) { setError('Please enter your email address.'); return; }
    if (!password) { setError('Please enter your password.'); return; }
    if (mode === 'register' && password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (mode === 'register' && !/[A-Z]/.test(password)) {
      setError('Password must contain at least one uppercase letter.');
      return;
    }
    if (mode === 'register' && !/[0-9]/.test(password)) {
      setError('Password must contain at least one number.');
      return;
    }

    setSubmitting(true);
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register(name, email, password);
      }
      // On success the AuthContext sets user → App re-renders to dashboard automatically
    } catch (err: unknown) {
      setError(friendlyError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-screen">
      <h2 className="auth-title">{mode === 'login' ? 'Welcome Back' : 'Create Account'}</h2>
      {error && <div className="form-error" role="alert">{error}</div>}
      <form onSubmit={handleSubmit} className="auth-form">
        {mode === 'register' && (
          <div className="form-field">
            <label>Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              disabled={submitting}
              placeholder="Your full name"
              autoComplete="name"
            />
          </div>
        )}
        <div className="form-field">
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            disabled={submitting}
            placeholder="you@example.com"
            autoComplete="email"
          />
        </div>
        <div className="form-field">
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            disabled={submitting}
            placeholder={mode === 'register' ? 'Min 8 chars, 1 uppercase, 1 number' : 'Your password'}
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          />
        </div>
        <button type="submit" className="button button-primary auth-submit" disabled={submitting}>
          {submitting
            ? (mode === 'login' ? 'Signing in…' : 'Creating account…')
            : (mode === 'login' ? 'Log In' : 'Register')}
        </button>
      </form>
      <div className="auth-toggle">
        {mode === 'login' ? (
          <p>
            New here?{' '}
            <button type="button" onClick={() => { setMode('register'); setError(''); }}>
              Create an account
            </button>
          </p>
        ) : (
          <p>
            Already have an account?{' '}
            <button type="button" onClick={() => { setMode('login'); setError(''); }}>
              Log In
            </button>
          </p>
        )}
      </div>
    </div>
  );
}
