import { Link } from 'react-router-dom';
import { getWorkspaceId, setWorkspaceId } from '../../shared/lib/api.js';

export function AppShell({ children, session, refreshSession, activePath }) {
  const currentWorkspace = getWorkspaceId();

  async function handleLogout() {
    await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    });
    setWorkspaceId('');
    await refreshSession();
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <aside className="w-64 border-r border-sidebar-border bg-sidebar text-sidebar-foreground p-4 hidden md:block">
        <div className="font-semibold text-lg mb-4">BeastOps</div>
        <nav className="space-y-2 text-sm">
          <Link
            className={`block rounded px-2 py-1 ${activePath === '/' ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            to="/"
          >
            Command Center
          </Link>
          <Link
            className={`block rounded px-2 py-1 ${activePath === '/tasks' ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            to="/tasks"
          >
            Tasks
          </Link>
          <Link
            className={`block rounded px-2 py-1 ${activePath === '/comments' ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            to="/comments"
          >
            Comments
          </Link>
          <Link
            className={`block rounded px-2 py-1 ${activePath === '/timeline' ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            to="/timeline"
          >
            Video Timeline
          </Link>
        </nav>
      </aside>
      <div className="flex-1 flex flex-col">
        <header className="h-14 border-b border-border bg-card flex items-center justify-between px-4 gap-3">
          <span className="text-sm text-muted-foreground">
            {session?.user?.name || session?.user?.email || 'BeastOps'}
          </span>
          <div className="flex items-center gap-2">
            <select
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              value={currentWorkspace}
              onChange={(e) => {
                setWorkspaceId(e.target.value);
                refreshSession();
              }}
            >
              <option value="">Select workspace</option>
              {(session?.workspaces || []).map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
            <button
              className="h-9 rounded-md border border-input bg-background px-3 text-sm hover:bg-muted"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        </header>
        <main className="flex-1 p-4">{children}</main>
      </div>
    </div>
  );
}

