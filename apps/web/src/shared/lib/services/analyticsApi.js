import { apiRequest, workspaceHeaders } from '../api.js';

export function getChannelOverview(workspaceId) {
  return apiRequest('/analytics/channel-overview', {
    headers: workspaceHeaders(workspaceId),
  });
}

export function listAnalyticsVideos(workspaceId, limit = 50) {
  return apiRequest(`/analytics/videos?limit=${encodeURIComponent(limit)}`, {
    headers: workspaceHeaders(workspaceId),
  });
}

export function getAnalyticsVideoTimeseries(workspaceId, videoId, days = 30) {
  return apiRequest(
    `/analytics/videos/${videoId}/timeseries?days=${encodeURIComponent(days)}`,
    {
      headers: workspaceHeaders(workspaceId),
    },
  );
}

