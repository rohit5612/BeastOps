import expressPromiseRouter from 'express-promise-router';
import { requireAuthMiddleware } from '../../auth/session.js';
import { requireWorkspaceMember } from '../../auth/middlewares/workspaceScope.js';
import { requirePermission } from '../../auth/policy.js';
import {
  getComments,
  patchComment,
  postComment,
  removeComment,
} from './comments.controller.js';

export function createCommentsRouter() {
  const router = expressPromiseRouter();

  router.get(
    '/',
    requireAuthMiddleware,
    requireWorkspaceMember,
    requirePermission('comments', 'read'),
    getComments,
  );
  router.post(
    '/',
    requireAuthMiddleware,
    requireWorkspaceMember,
    requirePermission('comments', 'create'),
    postComment,
  );
  router.patch(
    '/:id',
    requireAuthMiddleware,
    requireWorkspaceMember,
    requirePermission('comments', 'update'),
    patchComment,
  );
  router.delete(
    '/:id',
    requireAuthMiddleware,
    requireWorkspaceMember,
    requirePermission('comments', 'delete'),
    removeComment,
  );

  return router;
}
