import expressPromiseRouter from 'express-promise-router';
import { requireAuthMiddleware } from '../../auth/session.js';
import { requireWorkspaceMember } from '../../auth/middlewares/workspaceScope.js';
import { requirePermission } from '../../auth/policy.js';
import { listStages } from './pipeline.controller.js';

export function createPipelineRouter() {
  const router = expressPromiseRouter();

  router.get(
    '/stages',
    requireAuthMiddleware,
    requireWorkspaceMember,
    requirePermission('pipeline', 'read'),
    listStages,
  );

  return router;
}
