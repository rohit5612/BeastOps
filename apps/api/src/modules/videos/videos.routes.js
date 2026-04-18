import expressPromiseRouter from 'express-promise-router';
import { requireAuthMiddleware } from '../../auth/session.js';
import { requireWorkspaceMember } from '../../auth/middlewares/workspaceScope.js';
import { requirePermission } from '../../auth/policy.js';
import {
  getVideoAudit,
  getVideos,
  patchVideoStage,
  postVideo,
} from './videos.controller.js';

export function createVideosRouter() {
  const router = expressPromiseRouter();

  router.get(
    '/',
    requireAuthMiddleware,
    requireWorkspaceMember,
    requirePermission('videos', 'read'),
    getVideos,
  );
  router.post(
    '/',
    requireAuthMiddleware,
    requireWorkspaceMember,
    requirePermission('videos', 'create'),
    postVideo,
  );
  router.patch(
    '/:id/stage',
    requireAuthMiddleware,
    requireWorkspaceMember,
    requirePermission('videos', 'update'),
    patchVideoStage,
  );
  router.get(
    '/:id/audit',
    requireAuthMiddleware,
    requireWorkspaceMember,
    requirePermission('videos', 'read'),
    getVideoAudit,
  );

  return router;
}
