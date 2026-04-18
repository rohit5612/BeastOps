import { Link } from 'react-router-dom';
import { apiRequest, getWorkspaceId, setWorkspaceId } from '../../shared/lib/api.js';
import { NAVIGATION_MODULES, deriveNavigationState } from '../navigation.config.js';

export function AppShell({ children, session, refreshSession, activePath }) {
  const currentWorkspace = getWorkspaceId();
  const navState = deriveNavigationState(activePath);

  async function handleLogout() {
    await apiRequest('/auth/logout', { method: 'POST' });
    setWorkspaceId('');
    await refreshSession();
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <aside className="w-72 border-r border-sidebar-border bg-sidebar/95 text-sidebar-foreground p-5 hidden md:block">
        <div className="mb-6">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Workspace OS</p>
          <h1 className="font-semibold text-xl">BeastOps</h1>
        </div>
        <nav className="space-y-1.5 text-sm">
          {NAVIGATION_MODULES.map((item) => (
            <Link
              key={item.id}
              className={`block rounded-lg px-3 py-2.5 transition-colors ${navState.module?.id === item.id ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/70'}`}
              to={item.path}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="flex-1 flex flex-col">
        <header className="h-16 border-b border-border bg-card/90 backdrop-blur flex items-center justify-between px-6 gap-3">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">Signed in as</p>
            <p className="text-sm font-medium truncate">
              {session?.user?.name || session?.user?.email || 'BeastOps'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <select
              className="app-select min-w-48"
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
              className="app-btn-muted"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        </header>
        <div className="border-b border-border bg-card/70 px-6 py-3">
          <div className="flex flex-wrap gap-2">
            {(navState.module?.sections || []).map((section) => (
              <Link
                key={section.id}
                to={section.path}
                className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${navState.section?.id === section.id ? 'bg-secondary text-secondary-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
              >
                {section.label}
              </Link>
            ))}
          </div>
          {(navState.section?.children || []).length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-2 border-t border-border/70 pt-2">
              {navState.section.children.map((child) => (
                <Link
                  key={child.id}
                  to={child.path}
                  className={`rounded-md px-3 py-1 text-xs transition-colors ${navState.subsection?.id === child.id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
                >
                  {child.label}
                </Link>
              ))}
            </div>
          ) : null}
        </div>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}

