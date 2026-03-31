import expressPromiseRouter from 'express-promise-router';
import { requireAuthMiddleware } from '../../auth/session.js';
import { requireWorkspaceMember } from '../../auth/middlewares/workspaceScope.js';
import {
  getComments,
  patchComment,
  postComment,
  removeComment,
} from './comments.controller.js';

export function createCommentsRouter() {
  const router = expressPromiseRouter();

  router.get('/', requireAuthMiddleware, requireWorkspaceMember, getComments);
  router.post('/', requireAuthMiddleware, requireWorkspaceMember, postComment);
  router.patch('/:id', requireAuthMiddleware, requireWorkspaceMember, patchComment);
  router.delete('/:id', requireAuthMiddleware, requireWorkspaceMember, removeComment);

  return router;
}
