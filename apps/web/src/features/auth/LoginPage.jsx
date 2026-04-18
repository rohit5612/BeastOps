import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '../../shared/lib/api.js';

export function LoginPage({ refreshSession }) {
  const navigate = useNavigate();
  const [mode, setMode] = useState('login');
  const [tenantId, setTenantId] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'register') {
        const response = await apiRequest('/auth/register-tenant', {
          method: 'POST',
          body: {
            companyName: companyName.trim(),
            email: email.trim(),
            password,
            name: name.trim(),
          },
        });
        setError(response?.message || 'Check your email to verify the account');
      } else {
        await apiRequest('/auth/login', {
          method: 'POST',
          body: {
            tenantId: tenantId.trim().toLowerCase(),
            email: email.trim(),
            password,
          },
        });
        await refreshSession();
        navigate('/');
      }
    } catch (err) {
      const message = err?.payload?.message || err.message || 'Unable to continue';
      setError(message);
      if ((err?.payload?.error || '').includes('ApprovalPending')) {
        navigate('/pending-approval');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen grid place-items-center bg-background text-foreground p-6">
      <div className="w-full max-w-5xl grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <div className="app-surface p-8 hidden lg:flex flex-col justify-between">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Workspace Operating System</p>
            <h1 className="text-4xl font-semibold tracking-tight">BeastOps</h1>
            <p className="text-sm text-muted-foreground max-w-sm">
              Tenant-aware operations for modern creator teams with approvals, departments, and role-based access.
            </p>
          </div>
          <div className="app-surface-muted p-4 text-sm text-muted-foreground">
            Build repeatable content operations with secure onboarding and clean module workflows.
          </div>
        </div>

        <div className="app-surface p-6 md:p-8 space-y-4">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Workspace Access</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Sign in with tenant ID, or register your company account.
            </p>
          </div>

          <form className="space-y-3" onSubmit={onSubmit}>
          {mode === 'login' ? (
            <input
              className="app-input"
              value={tenantId}
              onChange={(e) => setTenantId(e.target.value)}
              placeholder="Tenant ID (example: acme-media)"
              required
            />
          ) : (
            <input
              className="app-input"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Company name"
              required
            />
          )}
          <input
            className="app-input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            required
          />
          {mode === 'register' && (
            <input
              className="app-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full name"
            />
          )}
          <input
            className="app-input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
          />
          {error ? <p className="text-xs text-destructive">{error}</p> : null}
          <button
            type="submit"
            disabled={loading}
            className="app-btn-primary w-full disabled:opacity-70"
          >
            {loading
              ? 'Please wait...'
              : mode === 'register'
                ? 'Register Tenant'
                : 'Sign In'}
          </button>
        </form>

          {mode === 'register' ? null : (
            <button
              type="button"
              className="text-xs text-muted-foreground hover:text-foreground text-left"
              onClick={async () => {
                if (!email.trim()) {
                  setError('Enter your email first to resend verification');
                  return;
                }
                await apiRequest('/auth/resend-verification', {
                  method: 'POST',
                  body: { email: email.trim() },
                });
                setError('If your account is pending verification, a new email has been sent.');
              }}
            >
              Resend verification email
            </button>
          )}
          <button
            type="button"
            className="text-xs text-muted-foreground hover:text-foreground text-left"
            onClick={() => {
              setMode((curr) => (curr === 'login' ? 'register' : 'login'));
              setError('');
            }}
          >
            {mode === 'login'
              ? 'Need an account? Register your company tenant'
              : 'Already have an account? Sign in'}
          </button>
          <button
            type="button"
            className="text-xs text-muted-foreground hover:text-foreground text-left"
            onClick={() => navigate('/register-invite')}
          >
            Have an invite token? Register invited account
          </button>
        </div>
      </div>
    </div>
  );
}
