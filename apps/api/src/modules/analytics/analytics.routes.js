import expressPromiseRouter from 'express-promise-router';
import { requireAuthMiddleware } from '../../auth/session.js';
import { requireWorkspaceMember } from '../../auth/middlewares/workspaceScope.js';
import {
  getAnalyticsChannelOverview,
  getAnalyticsVideoList,
  getAnalyticsVideoTimeseries,
} from './analytics.controller.js';

export function createAnalyticsRouter() {
  const router = expressPromiseRouter();

  router.get(
    '/channel-overview',
    requireAuthMiddleware,
    requireWorkspaceMember,
    getAnalyticsChannelOverview,
  );
  router.get(
    '/videos',
    requireAuthMiddleware,
    requireWorkspaceMember,
    getAnalyticsVideoList,
  );
  router.get(
    '/videos/:videoId/timeseries',
    requireAuthMiddleware,
    requireWorkspaceMember,
    getAnalyticsVideoTimeseries,
  );

  return router;
}
