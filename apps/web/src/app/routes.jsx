import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppShell } from './layout/AppShell.jsx';

export function AppRoutes() {
  return (
    <BrowserRouter>
      <AppShell>
        <Routes>
          {/* TODO: wire real feature routes */}
          <Route path="/" element={<div>BeastOps Command Center (coming soon)</div>} />
        </Routes>
      </AppShell>
    </BrowserRouter>
  );
}

