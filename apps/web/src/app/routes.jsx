import { useEffect, useMemo, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AppShell } from './layout/AppShell.jsx';
import { TasksPage } from '../features/tasks/TasksPage.jsx';
import { CommentsPage } from '../features/comments/CommentsPage.jsx';
import { VideoTimelinePage } from '../features/videoTimeline/VideoTimelinePage.jsx';
import { LoginPage } from '../features/auth/LoginPage.jsx';
import { apiRequest, getWorkspaceId, setWorkspaceId } from '../shared/lib/api.js';

function ProtectedLayout({ session, refreshSession }) {
  const location = useLocation();
  if (!session) {
    return <Navigate to="/login" replace />;
  }
  return (
    <AppShell
      session={session}
      refreshSession={refreshSession}
      activePath={location.pathname}
    >
      <Routes>
        <Route path="/" element={<div className="text-muted-foreground">Command Center coming soon</div>} />
        <Route path="/tasks" element={<TasksPage />} />
        <Route path="/comments" element={<CommentsPage />} />
        <Route path="/timeline" element={<VideoTimelinePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  );
}

export function AppRoutes() {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);

  async function refreshSession() {
    try {
      const payload = await apiRequest('/auth/me');
      setSession(payload);
      const workspaceId = getWorkspaceId();
      if (!workspaceId && payload?.workspaces?.length) {
        setWorkspaceId(payload.workspaces[0].id);
      }
    } catch (err) {
      if (err?.status === 401) {
        setSession(null);
      } else {
        setSession(null);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refreshSession();
  }, []);

  const content = useMemo(() => {
    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center text-muted-foreground">
          Loading...
        </div>
      );
    }

    return (
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/*"
            element={<ProtectedLayout session={session} refreshSession={refreshSession} />}
          />
        </Routes>
      </BrowserRouter>
    );
  }, [loading, session]);

  return content;
}

