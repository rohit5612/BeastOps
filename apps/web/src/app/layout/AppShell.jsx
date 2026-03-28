export function AppShell({ children }) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex">
      <aside className="w-64 border-r border-slate-800 p-4 hidden md:block">
        <div className="font-semibold text-lg mb-4">BeastOps</div>
        {/* TODO: nav items */}
      </aside>
      <div className="flex-1 flex flex-col">
        <header className="h-14 border-b border-slate-800 flex items-center px-4">
          {/* TODO: workspace switcher, user menu */}
          <span className="text-sm text-slate-400">MVP Shell</span>
        </header>
        <main className="flex-1 p-4">{children}</main>
      </div>
    </div>
  );
}

