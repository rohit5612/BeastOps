import { useNavigate } from 'react-router-dom';

export function PendingApprovalPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-6">
      <div className="w-full max-w-md app-surface p-6 space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight">Approval Pending</h1>
        <p className="text-sm text-muted-foreground">
          Your email is verified but your account is waiting for tenant superadmin approval.
        </p>
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
