import expressPromiseRouter from 'express-promise-router';
import { requireAuthMiddleware } from '../../auth/session.js';
import { requireWorkspaceMember } from '../../auth/middlewares/workspaceScope.js';
import { requirePermission } from '../../auth/policy.js';
import {
  getIdea,
  getIdeas,
  patchIdea,
  postIdea,
  postIdeaConvert,
  removeIdea,
} from './ideas.controller.js';

export function createIdeasRouter() {
  const router = expressPromiseRouter();

  router.get(
    '/',
    requireAuthMiddleware,
    requireWorkspaceMember,
    requirePermission('ideas', 'read'),
    getIdeas,
  );
  router.post(
    '/',
    requireAuthMiddleware,
    requireWorkspaceMember,
    requirePermission('ideas', 'create'),
    postIdea,
  );
  router.get(
    '/:id',
    requireAuthMiddleware,
    requireWorkspaceMember,
    requirePermission('ideas', 'read'),
    getIdea,
  );
  router.patch(
    '/:id',
    requireAuthMiddleware,
    requireWorkspaceMember,
    requirePermission('ideas', 'update'),
    patchIdea,
  );
  router.delete(
    '/:id',
    requireAuthMiddleware,
    requireWorkspaceMember,
    requirePermission('ideas', 'delete'),
    removeIdea,
  );
  router.post(
    '/:id/convert',
    requireAuthMiddleware,
    requireWorkspaceMember,
    requirePermission('ideas', 'update'),
    postIdeaConvert,
  );

  return router;
}
