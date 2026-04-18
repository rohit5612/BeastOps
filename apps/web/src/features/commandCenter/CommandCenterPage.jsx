import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getWorkspaceId } from '../../shared/lib/api.js';
import { getChannelOverview } from '../../shared/lib/services/analyticsApi.js';
import { listTasks } from '../../shared/lib/services/tasksApi.js';
import { listVideoProjects } from '../../shared/lib/services/videosApi.js';

function formatNumber(value) {
  return new Intl.NumberFormat().format(value || 0);
}

export function CommandCenterPage() {
  const workspaceId = getWorkspaceId();

  const overviewQuery = useQuery({
    queryKey: ['channelOverview', workspaceId],
    enabled: !!workspaceId,
    queryFn: () => getChannelOverview(workspaceId),
  });

  const tasksQuery = useQuery({
    queryKey: ['tasks', workspaceId, 'command-center'],
    enabled: !!workspaceId,
    queryFn: () => listTasks(workspaceId),
  });

  const videosQuery = useQuery({
    queryKey: ['videoProjects', workspaceId, 'command-center'],
    enabled: !!workspaceId,
    queryFn: () => listVideoProjects(workspaceId),
  });

  const attention = useMemo(() => {
    const now = Date.now();
    const overdueTasks = (tasksQuery.data?.tasks || []).filter((task) => {
      if (!task.dueDate) return false;
      if (task.status === 'DONE' || task.status === 'CANCELLED') return false;
      return new Date(task.dueDate).getTime() < now;
    });

    const stalledVideos = (videosQuery.data?.videoProjects || []).filter((video) => {
      const updatedAt = new Date(video.updatedAt || video.createdAt).getTime();
      const staleForDays = (now - updatedAt) / (1000 * 60 * 60 * 24);
      return staleForDays >= 7;
    });

    return {
      overdueTasks,
      stalledVideos,
    };
  }, [tasksQuery.data, videosQuery.data]);

  return (
    <section className="app-page">
      <div className="app-page-header">
        <h1 className="app-page-title">Command Center</h1>
        <p className="app-page-subtitle">
          Workspace KPI overview and actions that need attention.
        </p>
      </div>

      {!workspaceId ? (
        <div className="app-surface p-4 text-sm text-muted-foreground">
          Select a workspace first.
        </div>
      ) : (
        <>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="app-surface p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Total Views</p>
              <p className="mt-2 text-2xl font-semibold">
                {formatNumber(overviewQuery.data?.overview?.totals?.views)}
              </p>
            </div>
            <div className="app-surface p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Impressions</p>
              <p className="mt-2 text-2xl font-semibold">
                {formatNumber(overviewQuery.data?.overview?.totals?.impressions)}
              </p>
            </div>
            <div className="app-surface p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Watch Time (Sec)</p>
              <p className="mt-2 text-2xl font-semibold">
                {formatNumber(overviewQuery.data?.overview?.totals?.watchTimeSec)}
              </p>
            </div>
            <div className="app-surface p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Videos Tracked</p>
              <p className="mt-2 text-2xl font-semibold">
                {formatNumber(overviewQuery.data?.overview?.videosTracked)}
              </p>
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <div className="app-surface p-4 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Overdue Tasks
                </h2>
                <Link className="text-xs text-primary hover:underline" to="/content-ops/tasks">
                  Open tasks
                </Link>
              </div>
              {attention.overdueTasks.length ? (
                <div className="space-y-2">
                  {attention.overdueTasks.slice(0, 6).map((task) => (
                    <div key={task.id} className="app-surface-muted p-3">
                      <p className="text-sm font-medium">{task.title}</p>
                      <p className="text-xs text-muted-foreground">
                        Due {new Date(task.dueDate).toLocaleDateString()} | {task.status}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No overdue tasks right now.</p>
              )}
            </div>

            <div className="app-surface p-4 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Stalled Videos
                </h2>
                <Link className="text-xs text-primary hover:underline" to="/content-ops/pipeline">
                  Open pipeline
                </Link>
              </div>
              {attention.stalledVideos.length ? (
                <div className="space-y-2">
                  {attention.stalledVideos.slice(0, 6).map((video) => (
                    <div key={video.id} className="app-surface-muted p-3">
                      <p className="text-sm font-medium">{video.title}</p>
                      <p className="text-xs text-muted-foreground">
                        Stage: {video.stage?.name || 'Unassigned'} | Last update:{' '}
                        {new Date(video.updatedAt || video.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No stalled video projects right now.</p>
              )}
            </div>
          </div>
        </>
      )}
    </section>
  );
}

