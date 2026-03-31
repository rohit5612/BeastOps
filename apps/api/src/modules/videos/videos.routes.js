import expressPromiseRouter from 'express-promise-router';
import { requireAuthMiddleware } from '../../auth/session.js';
import { requireWorkspaceMember } from '../../auth/middlewares/workspaceScope.js';
import {
  getVideoAudit,
  getVideos,
  patchVideoStage,
  postVideo,
} from './videos.controller.js';

export function createVideosRouter() {
  const router = expressPromiseRouter();

  router.get('/', requireAuthMiddleware, requireWorkspaceMember, getVideos);
  router.post('/', requireAuthMiddleware, requireWorkspaceMember, postVideo);
  router.patch(
    '/:id/stage',
    requireAuthMiddleware,
    requireWorkspaceMember,
    patchVideoStage,
  );
  router.get(
    '/:id/audit',
    requireAuthMiddleware,
    requireWorkspaceMember,
    getVideoAudit,
  );

  return router;
}
