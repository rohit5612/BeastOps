import { getApiBaseUrl } from '../../shared/lib/api.js';

export function LoginPage() {
  const loginUrl = `${getApiBaseUrl()}/api/auth/google`;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-6">
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-sm space-y-4">
        <h1 className="text-2xl font-semibold">Welcome to BeastOps</h1>
        <p className="text-sm text-muted-foreground">
          Sign in with Google to access your workspace.
        </p>
        <a
          href={loginUrl}
          className="inline-flex w-full items-center justify-center rounded-md bg-primary px-4 py-2 text-primary-foreground font-medium hover:opacity-90"
        >
          Continue with Google
        </a>
      </div>
    </div>
  );
}
