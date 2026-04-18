import expressPromiseRouter from 'express-promise-router';
import { requireAuthMiddleware } from '../../auth/session.js';
import { requireWorkspaceMember } from '../../auth/middlewares/workspaceScope.js';
import { requirePermission } from '../../auth/policy.js';
import {
  getYouTubeConnectCallback,
  getYouTubeConnectStart,
  getYouTubeStatus,
} from './integrations.controller.js';

export function createIntegrationsRouter() {
  const router = expressPromiseRouter();

  router.get(
    '/youtube/status',
    requireAuthMiddleware,
    requireWorkspaceMember,
    requirePermission('integrations', 'read'),
    getYouTubeStatus,
  );
  router.get(
    '/youtube/connect',
    requireAuthMiddleware,
    getYouTubeConnectStart,
  );
  router.get('/youtube/callback', getYouTubeConnectCallback);

  return router;
}
