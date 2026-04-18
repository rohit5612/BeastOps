import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getWorkspaceId } from '../../shared/lib/api.js';
import {
  getAnalyticsVideoTimeseries,
  getChannelOverview,
  listAnalyticsVideos,
} from '../../shared/lib/services/analyticsApi.js';

function formatMetric(value) {
  return new Intl.NumberFormat().format(value || 0);
}

export function AnalyticsPage() {
  const workspaceId = getWorkspaceId();
  const [selectedVideoId, setSelectedVideoId] = useState('');

  const overviewQuery = useQuery({
    queryKey: ['analyticsOverview', workspaceId],
    enabled: !!workspaceId,
    queryFn: () => getChannelOverview(workspaceId),
  });

  const videosQuery = useQuery({
    queryKey: ['analyticsVideos', workspaceId],
    enabled: !!workspaceId,
    queryFn: () => listAnalyticsVideos(workspaceId, 100),
  });

  useEffect(() => {
    if (!selectedVideoId && videosQuery.data?.videos?.length) {
      setSelectedVideoId(videosQuery.data.videos[0].id);
    }
  }, [selectedVideoId, videosQuery.data]);

  const timeseriesQuery = useQuery({
    queryKey: ['analyticsTimeseries', workspaceId, selectedVideoId],
    enabled: !!workspaceId && !!selectedVideoId,
    queryFn: () => getAnalyticsVideoTimeseries(workspaceId, selectedVideoId, 30),
  });

  const latestPoint = useMemo(() => {
    const points = timeseriesQuery.data?.points || [];
    return points[points.length - 1] || null;
  }, [timeseriesQuery.data]);

  return (
    <section className="app-page">
      <div className="app-page-header">
        <h1 className="app-page-title">Analytics</h1>
        <p className="app-page-subtitle">
          Channel summary, per-video performance, and recent metric trends.
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
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Views (Total)</p>
              <p className="mt-2 text-2xl font-semibold">
                {formatMetric(overviewQuery.data?.overview?.totals?.views)}
              </p>
            </div>
            <div className="app-surface p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Impressions (Total)</p>
              <p className="mt-2 text-2xl font-semibold">
                {formatMetric(overviewQuery.data?.overview?.totals?.impressions)}
              </p>
            </div>
            <div className="app-surface p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Views (Last 28 days)</p>
              <p className="mt-2 text-2xl font-semibold">
                {formatMetric(overviewQuery.data?.overview?.last28Days?.views)}
              </p>
            </div>
            <div className="app-surface p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Tracked Videos</p>
              <p className="mt-2 text-2xl font-semibold">
                {formatMetric(overviewQuery.data?.overview?.videosTracked)}
              </p>
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
            <div className="app-surface overflow-hidden">
              <div className="border-b border-border px-4 py-3">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Per-video Performance
                </h2>
              </div>
              <div className="max-h-[420px] overflow-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-xs text-muted-foreground">
                    <tr>
                      <th className="px-4 py-2 text-left">Title</th>
                      <th className="px-4 py-2 text-left">Views</th>
                      <th className="px-4 py-2 text-left">Impressions</th>
                      <th className="px-4 py-2 text-left">CTR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(videosQuery.data?.videos || []).map((video) => (
                      <tr
                        key={video.id}
                        className={`border-t border-border/70 cursor-pointer hover:bg-muted/30 ${selectedVideoId === video.id ? 'bg-muted/40' : ''}`}
                        onClick={() => setSelectedVideoId(video.id)}
                      >
                        <td className="px-4 py-2">{video.title || video.youtubeVideoId}</td>
                        <td className="px-4 py-2">{formatMetric(video.metrics?.views)}</td>
                        <td className="px-4 py-2">{formatMetric(video.metrics?.impressions)}</td>
                        <td className="px-4 py-2">
                          {video.metrics?.ctr != null ? `${(video.metrics.ctr * 100).toFixed(2)}%` : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="app-surface p-4 space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                30-day trend (selected video)
              </h2>
              {timeseriesQuery.isLoading ? (
                <p className="text-sm text-muted-foreground">Loading trend data...</p>
              ) : !selectedVideoId ? (
                <p className="text-sm text-muted-foreground">Select a video from the table.</p>
              ) : (
                <>
                  <div className="app-surface-muted p-3 text-xs text-muted-foreground">
                    <p>Latest views: {formatMetric(latestPoint?.views)}</p>
                    <p>Latest impressions: {formatMetric(latestPoint?.impressions)}</p>
                    <p>
                      Latest CTR:{' '}
                      {latestPoint?.ctr != null ? `${(latestPoint.ctr * 100).toFixed(2)}%` : '-'}
                    </p>
                  </div>
                  <div className="max-h-[280px] overflow-auto space-y-1">
                    {(timeseriesQuery.data?.points || []).map((point) => (
                      <div key={`${point.videoId}-${point.date}`} className="app-surface-muted p-2 text-xs">
                        <p>{new Date(point.date).toLocaleDateString()}</p>
                        <p className="text-muted-foreground">
                          Views {formatMetric(point.views)} | Impressions {formatMetric(point.impressions)}
                        </p>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </section>
  );
}

