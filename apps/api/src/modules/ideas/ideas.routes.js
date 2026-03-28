import expressPromiseRouter from 'express-promise-router';
import { requireAuthMiddleware } from '../../auth/session.js';
import { requireWorkspaceMember } from '../../auth/middlewares/workspaceScope.js';
import { getIdeas, postIdea } from './ideas.controller.js';

export function createIdeasRouter() {
  const router = expressPromiseRouter();

  router.get('/', requireAuthMiddleware, requireWorkspaceMember, getIdeas);
  router.post('/', requireAuthMiddleware, requireWorkspaceMember, postIdea);

  return router;
}
