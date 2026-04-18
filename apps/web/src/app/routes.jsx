import { useEffect, useMemo, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AppShell } from './layout/AppShell.jsx';
import { TasksPage } from '../features/tasks/TasksPage.jsx';
import { CommentsPage } from '../features/comments/CommentsPage.jsx';
import { VideoTimelinePage } from '../features/videoTimeline/VideoTimelinePage.jsx';
import { LoginPage } from '../features/auth/LoginPage.jsx';
import { IntegrationsPage } from '../features/integrations/IntegrationsPage.jsx';
import { VerifyEmailPage } from '../features/auth/VerifyEmailPage.jsx';
import { InviteRegistrationPage } from '../features/auth/InviteRegistrationPage.jsx';
import { PendingApprovalPage } from '../features/auth/PendingApprovalPage.jsx';
import { UserDirectoryPage } from '../features/admin/UserDirectoryPage.jsx';
import { UserApprovalsPage } from '../features/admin/UserApprovalsPage.jsx';
import { RoleManagementPage } from '../features/admin/RoleManagementPage.jsx';
import { DepartmentManagementPage } from '../features/admin/DepartmentManagementPage.jsx';
import { CommandCenterPage } from '../features/commandCenter/CommandCenterPage.jsx';
import { PipelineBoardPage } from '../features/pipeline/PipelineBoardPage.jsx';
import { IdeasPage } from '../features/ideas/IdeasPage.jsx';
import { CalendarPage } from '../features/calendar/CalendarPage.jsx';
import { AnalyticsPage } from '../features/analytics/AnalyticsPage.jsx';
import { VideoDetailPage } from '../features/videoDetail/VideoDetailPage.jsx';
import { PlaceholderPage } from '../features/common/PlaceholderPage.jsx';
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
        <Route path="/command-center" element={<CommandCenterPage />} />
        <Route path="/user-management/directory" element={<UserDirectoryPage />} />
        <Route path="/user-management/approvals" element={<UserApprovalsPage />} />
        <Route path="/user-management/org-management/departments" element={<DepartmentManagementPage />} />
        <Route path="/user-management/org-management/roles" element={<RoleManagementPage />} />
        <Route path="/user-management" element={<Navigate to="/user-management/directory" replace />} />
        <Route
          path="/user-management/org-management"
          element={<Navigate to="/user-management/org-management/departments" replace />}
        />
        <Route path="/content-ops/pipeline" element={<PipelineBoardPage />} />
        <Route path="/content-ops/ideas" element={<IdeasPage />} />
        <Route path="/content-ops/tasks" element={<TasksPage />} />
        <Route path="/content-ops/comments" element={<CommentsPage />} />
        <Route path="/content-ops/timeline" element={<VideoTimelinePage />} />
        <Route path="/content-ops/calendar" element={<CalendarPage />} />
        <Route path="/content-ops/video-projects/:id" element={<VideoDetailPage />} />
        <Route path="/content-ops" element={<Navigate to="/content-ops/pipeline" replace />} />
        <Route path="/analytics/overview" element={<AnalyticsPage />} />
        <Route path="/analytics" element={<Navigate to="/analytics/overview" replace />} />
        <Route path="/integrations/youtube" element={<IntegrationsPage session={session} />} />
        <Route path="/integrations" element={<Navigate to="/integrations/youtube" replace />} />
        <Route
          path="/settings/general"
          element={<PlaceholderPage title="Settings" description="Workspace and account settings." />}
        />
        <Route path="/settings" element={<Navigate to="/settings/general" replace />} />

        <Route path="/" element={<Navigate to="/command-center" replace />} />
        <Route path="/pipeline" element={<Navigate to="/content-ops/pipeline" replace />} />
        <Route path="/ideas" element={<Navigate to="/content-ops/ideas" replace />} />
        <Route path="/calendar" element={<Navigate to="/content-ops/calendar" replace />} />
        <Route path="/tasks" element={<Navigate to="/content-ops/tasks" replace />} />
        <Route path="/comments" element={<Navigate to="/content-ops/comments" replace />} />
        <Route path="/timeline" element={<Navigate to="/content-ops/timeline" replace />} />
        <Route path="/users" element={<Navigate to="/user-management/directory" replace />} />
        <Route path="/approvals" element={<Navigate to="/user-management/approvals" replace />} />
        <Route path="/roles" element={<Navigate to="/user-management/org-management/roles" replace />} />
        <Route path="*" element={<Navigate to="/command-center" replace />} />
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
        <div className="min-h-screen flex items-center justify-center">
          <div className="app-surface px-6 py-4 text-sm text-muted-foreground">
            Loading workspace...
          </div>
        </div>
      );
    }

    return (
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage refreshSession={refreshSession} />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/register-invite" element={<InviteRegistrationPage />} />
          <Route path="/pending-approval" element={<PendingApprovalPage />} />
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

