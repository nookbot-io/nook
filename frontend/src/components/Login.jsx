import { useState } from 'react';

export default function Login({ onLogin }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password.trim()) return;

    setLoading(true);
    setError('');

    const result = await onLogin(password);
    if (!result.success) {
      setError(result.error || 'Login failed');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-app p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <img src="/nook.png" alt="Nook" className="w-14 h-14 mx-auto mb-4 rounded-2xl" />
          <h1 className="text-3xl font-semibold text-text-primary tracking-tight mb-1">Nook</h1>
          <p className="text-sm text-text-tertiary">Sign in to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="card">
          <label className="label">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input-field mb-4"
            autoFocus
            placeholder="Enter your password"
          />

          {error && (
            <p className="mb-4 text-sm text-danger">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !password.trim()}
            className="w-full accent-button"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
