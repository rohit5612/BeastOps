import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { apiRequest } from '../../shared/lib/api.js';

export function InviteRegistrationPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [token, setToken] = useState(params.get('token') || '');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const payload = await apiRequest('/auth/register-invite', {
        method: 'POST',
        body: { token, name, password },
      });
      setSuccess(
        `Registered ${payload?.email || 'account'}. Verify your email, then wait for superadmin approval.`,
      );
    } catch (err) {
      setError(err?.payload?.message || err.message || 'Unable to register invite');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-6">
      <div className="w-full max-w-md app-surface p-6 space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight">Invite Registration</h1>
        <form className="space-y-3" onSubmit={onSubmit}>
          <textarea
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm min-h-20 focus-visible:ring-2 focus-visible:ring-ring"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Invite token"
            required
          />
          <input
            className="app-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Full name"
            required
          />
          <input
            className="app-input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
          />
          {error ? <p className="text-xs text-destructive">{error}</p> : null}
          {success ? <p className="text-xs text-green-600">{success}</p> : null}
          <button
            type="submit"
            disabled={loading}
            className="app-btn-primary w-full disabled:opacity-70"
          >
            {loading ? 'Registering...' : 'Register Invite'}
          </button>
        </form>
        <button
          type="button"
          className="text-xs text-muted-foreground hover:text-foreground"
          onClick={() => navigate('/login')}
        >
          Back to login
        </button>
      </div>
    </div>
  );
}
