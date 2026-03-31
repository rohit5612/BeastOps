import {
  getChannelOverview,
  getVideoTimeseries,
  listVideoPerformance,
} from './analytics.service.js';

export async function getAnalyticsChannelOverview(req, res) {
  const overview = await getChannelOverview(req.workspace.id);
  res.json({ overview });
}

export async function getAnalyticsVideoList(req, res) {
  const rows = await listVideoPerformance(req.workspace.id, req.query.limit);
  res.json({ videos: rows });
}

export async function getAnalyticsVideoTimeseries(req, res) {
  const payload = await getVideoTimeseries(
    req.workspace.id,
    req.params.videoId,
    req.query.days,
  );
  res.json(payload);
}
