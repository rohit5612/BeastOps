import expressPromiseRouter from 'express-promise-router';
import { requireAuthMiddleware } from '../../auth/session.js';
import { requireWorkspaceMember } from '../../auth/middlewares/workspaceScope.js';
import { requirePermission } from '../../auth/policy.js';
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
    requirePermission('analytics', 'read'),
    getAnalyticsChannelOverview,
  );
  router.get(
    '/videos',
    requireAuthMiddleware,
    requireWorkspaceMember,
    requirePermission('analytics', 'read'),
    getAnalyticsVideoList,
  );
  router.get(
    '/videos/:videoId/timeseries',
    requireAuthMiddleware,
    requireWorkspaceMember,
    requirePermission('analytics', 'read'),
    getAnalyticsVideoTimeseries,
  );

  return router;
}
