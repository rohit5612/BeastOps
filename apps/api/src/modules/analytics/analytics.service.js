import { prisma } from '../../core/db/client.js';
import { AppError } from '../../core/utils/errors.js';

export async function getChannelOverview(workspaceId) {
  const snapshots = await prisma.metricSnapshot.findMany({
    where: {
      video: { workspaceId },
    },
    select: {
      views: true,
      impressions: true,
      watchTimeSec: true,
    },
  });

  const now = new Date();
  const since = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);
  const recentTs = await prisma.metricTimeseries.findMany({
    where: {
      video: { workspaceId },
      date: { gte: since },
    },
    select: {
      views: true,
      impressions: true,
      watchTimeSec: true,
    },
  });

  const totals = snapshots.reduce(
    (acc, row) => {
      acc.views += row.views || 0;
      acc.impressions += row.impressions || 0;
      acc.watchTimeSec += row.watchTimeSec || 0;
      return acc;
    },
    { views: 0, impressions: 0, watchTimeSec: 0 },
  );

  const last28Days = recentTs.reduce(
    (acc, row) => {
      acc.views += row.views || 0;
      acc.impressions += row.impressions || 0;
      acc.watchTimeSec += row.watchTimeSec || 0;
      return acc;
    },
    { views: 0, impressions: 0, watchTimeSec: 0 },
  );

  return {
    totals,
    last28Days,
    videosTracked: snapshots.length,
  };
}

export async function listVideoPerformance(workspaceId, limit = 50) {
  const take = Math.max(1, Math.min(Number(limit) || 50, 200));
  const videos = await prisma.video.findMany({
    where: { workspaceId },
    include: {
      snapshot: true,
    },
    orderBy: { updatedAt: 'desc' },
    take,
  });

  return videos.map((v) => ({
    id: v.id,
    youtubeVideoId: v.youtubeVideoId,
    title: v.title,
    publishedAt: v.publishedAt,
    metrics: {
      views: v.snapshot?.views ?? 0,
      impressions: v.snapshot?.impressions ?? 0,
      ctr: v.snapshot?.ctr ?? null,
      watchTimeSec: v.snapshot?.watchTimeSec ?? null,
    },
  }));
}

export async function getVideoTimeseries(workspaceId, videoId, days = 30) {
  const video = await prisma.video.findFirst({
    where: { id: videoId, workspaceId },
    select: { id: true, youtubeVideoId: true, title: true },
  });
  if (!video) {
    throw new AppError('Video not found', 404, 'NotFound');
  }
  const n = Math.max(1, Math.min(Number(days) || 30, 180));
  const since = new Date(Date.now() - n * 24 * 60 * 60 * 1000);
  const points = await prisma.metricTimeseries.findMany({
    where: { videoId: video.id, date: { gte: since } },
    orderBy: { date: 'asc' },
  });

  return {
    video,
    points,
  };
}
