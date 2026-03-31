import expressPromiseRouter from 'express-promise-router';
import { requireAuthMiddleware } from '../../auth/session.js';
import { requireWorkspaceMember } from '../../auth/middlewares/workspaceScope.js';
import { requireRole } from '../../auth/rbac.js';
import { getTasks, patchTask, postTask, removeTask } from './tasks.controller.js';

export function createTasksRouter() {
  const router = expressPromiseRouter();

  router.get('/', requireAuthMiddleware, requireWorkspaceMember, getTasks);
  router.post(
    '/',
    requireAuthMiddleware,
    requireWorkspaceMember,
    requireRole(['ADMIN', 'CREATOR', 'EDITOR']),
    postTask,
  );
  router.patch(
    '/:id',
    requireAuthMiddleware,
    requireWorkspaceMember,
    requireRole(['ADMIN', 'CREATOR', 'EDITOR']),
    patchTask,
  );
  router.delete(
    '/:id',
    requireAuthMiddleware,
    requireWorkspaceMember,
    requireRole(['ADMIN', 'CREATOR', 'EDITOR']),
    removeTask,
  );

  return router;
}
