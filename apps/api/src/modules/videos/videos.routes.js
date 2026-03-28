import expressPromiseRouter from 'express-promise-router';
import { requireAuthMiddleware } from '../../auth/session.js';
import { requireWorkspaceMember } from '../../auth/middlewares/workspaceScope.js';
import { getVideos, patchVideoStage, postVideo } from './videos.controller.js';

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

  return router;
}
