import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { apiRequest } from '../../shared/lib/api.js';

export function VerifyEmailPage() {
  const [params] = useSearchParams();
  const [state, setState] = useState({
    loading: true,
    error: '',
    tenantId: '',
  });
  const navigate = useNavigate();

  useEffect(() => {
    async function verify() {
      const token = params.get('token') || '';
      if (!token) {
        setState({ loading: false, error: 'Missing verification token', tenantId: '' });
        return;
      }
      try {
        const payload = await apiRequest('/auth/verify-email', {
          method: 'POST',
          body: { token },
        });
        setState({
          loading: false,
          error: '',
          tenantId: payload?.tenantId || '',
        });
      } catch (err) {
        setState({
          loading: false,
          error: err?.payload?.message || err.message || 'Verification failed',
          tenantId: '',
        });
      }
    }
    verify();
  }, [params]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-6">
      <div className="w-full max-w-md app-surface p-6 space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight">Verify Email</h1>
        {state.loading ? (
          <p className="text-sm text-muted-foreground">Verifying your email...</p>
        ) : state.error ? (
          <p className="text-sm text-destructive">{state.error}</p>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              Email verified. Your tenant ID is <strong>{state.tenantId}</strong>.
            </p>
            <p className="text-sm text-muted-foreground">
              Superadmin can now sign in. Invited users will require approval after verification.
            </p>
          </>
        )}
        <button
          type="button"
          className="app-btn-primary w-full"
          onClick={() => navigate('/login')}
        >
          Back to Login
        </button>
      </div>
    </div>
  );
}
