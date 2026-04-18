import { useMemo } from 'react';
import { apiRequest, getApiBaseUrl, getWorkspaceId, workspaceHeaders } from '../../shared/lib/api.js';
import { useQuery } from '@tanstack/react-query';

function useCurrentWorkspaceRole(session) {
  const workspaceId = getWorkspaceId();
  return useMemo(() => {
    if (!workspaceId || !session?.workspaces) {
      return '';
    }
    return session.workspaces.find((w) => w.id === workspaceId)?.role || '';
  }, [session, workspaceId]);
}

export function IntegrationsPage({ session }) {
  const workspaceId = getWorkspaceId();
  const role = useCurrentWorkspaceRole(session);
  const canManage = role === 'ADMIN' || session?.user?.elevatedAccess;

  const statusQuery = useQuery({
    queryKey: ['youtubeIntegrationStatus', workspaceId],
    queryFn: () =>
      apiRequest('/integrations/youtube/status', {
        headers: workspaceHeaders(workspaceId),
      }),
    enabled: !!workspaceId,
  });

  const connectHref = `${getApiBaseUrl()}/api/integrations/youtube/connect?workspaceId=${encodeURIComponent(workspaceId)}`;

  return (
    <section className="app-page">
      <div className="app-page-header">
        <h1 className="app-page-title">Integrations</h1>
        <p className="app-page-subtitle">Connect external services at workspace level.</p>
      </div>
      {!workspaceId ? (
        <div className="app-surface p-4 text-sm text-muted-foreground">
          Select a workspace before managing integrations.
        </div>
      ) : (
        <div className="app-surface p-5 space-y-3">
          <div>
            <h2 className="text-base font-semibold">YouTube</h2>
            <p className="text-sm text-muted-foreground">
              Admins can link a Google account to sync channel metrics.
            </p>
          </div>

          {statusQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading integration status...</p>
          ) : statusQuery.isError ? (
            <p className="text-sm text-destructive">
              {statusQuery.error?.payload?.message || statusQuery.error?.message || 'Failed to load status'}
            </p>
          ) : (
            <div className="text-sm space-y-1 app-surface-muted p-3">
              <p>
                Status:{' '}
                <span className={statusQuery.data?.connected ? 'text-green-600' : 'text-muted-foreground'}>
                  {statusQuery.data?.connected ? 'Connected' : 'Not connected'}
                </span>
              </p>
              {(statusQuery.data?.channels || []).map((channel) => (
                <p key={channel.id} className="text-muted-foreground">
                  {channel.title || 'Untitled channel'} ({channel.youtubeChannelId})
                </p>
              ))}
            </div>
          )}

          <a
            href={canManage ? connectHref : '#'}
            className="app-btn-primary"
            aria-disabled={!canManage}
            onClick={(e) => {
              if (!canManage) {
                e.preventDefault();
              }
            }}
          >
            Connect YouTube
          </a>
          {!canManage ? (
            <p className="text-xs text-muted-foreground">
              Only workspace admins can connect integrations.
            </p>
          ) : null}
        </div>
      )}
    </section>
  );
}
