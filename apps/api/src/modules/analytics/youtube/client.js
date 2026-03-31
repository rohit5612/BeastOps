import { AppError } from '../../../core/utils/errors.js';

function bearer(accessToken) {
  return {
    Authorization: `Bearer ${accessToken}`,
  };
}

export async function fetchYouTubeChannelList(accessToken) {
  const url = new URL('https://www.googleapis.com/youtube/v3/channels');
  url.searchParams.set('part', 'snippet,statistics');
  url.searchParams.set('mine', 'true');
  const res = await fetch(url.toString(), { headers: bearer(accessToken) });
  const payload = await res.json();
  if (!res.ok) {
    throw new AppError(payload?.error?.message || 'YouTube channel fetch failed', 502, 'YouTubeApiError');
  }
  return payload;
}

export async function fetchYouTubeVideos(accessToken, channelId, maxResults = 25) {
  const url = new URL('https://www.googleapis.com/youtube/v3/search');
  url.searchParams.set('part', 'snippet');
  url.searchParams.set('channelId', channelId);
  url.searchParams.set('type', 'video');
  url.searchParams.set('order', 'date');
  url.searchParams.set('maxResults', String(maxResults));
  const res = await fetch(url.toString(), { headers: bearer(accessToken) });
  const payload = await res.json();
  if (!res.ok) {
    throw new AppError(payload?.error?.message || 'YouTube videos fetch failed', 502, 'YouTubeApiError');
  }
  return payload;
}

export async function fetchYouTubeAnalyticsTimeseries(
  accessToken,
  startDate,
  endDate,
  ids = 'channel==MINE',
) {
  const url = new URL('https://youtubeanalytics.googleapis.com/v2/reports');
  url.searchParams.set('ids', ids);
  url.searchParams.set('startDate', startDate);
  url.searchParams.set('endDate', endDate);
  url.searchParams.set('metrics', 'views,impressions,averageViewDuration,averageViewPercentage');
  url.searchParams.set('dimensions', 'day');
  const res = await fetch(url.toString(), { headers: bearer(accessToken) });
  const payload = await res.json();
  if (!res.ok) {
    throw new AppError(payload?.error?.message || 'YouTube analytics fetch failed', 502, 'YouTubeApiError');
  }
  return payload;
}
