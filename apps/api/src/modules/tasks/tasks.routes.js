import expressPromiseRouter from 'express-promise-router';
import { requireAuthMiddleware } from '../../auth/session.js';
import { requireWorkspaceMember } from '../../auth/middlewares/workspaceScope.js';
import { requirePermission } from '../../auth/policy.js';
import { getTasks, patchTask, postTask, removeTask } from './tasks.controller.js';

export function createTasksRouter() {
  const router = expressPromiseRouter();

  router.get(
    '/',
    requireAuthMiddleware,
    requireWorkspaceMember,
    requirePermission('tasks', 'read'),
    getTasks,
  );
  router.post(
    '/',
    requireAuthMiddleware,
    requireWorkspaceMember,
    requirePermission('tasks', 'create'),
    postTask,
  );
  router.patch(
    '/:id',
    requireAuthMiddleware,
    requireWorkspaceMember,
    requirePermission('tasks', 'update'),
    patchTask,
  );
  router.delete(
    '/:id',
    requireAuthMiddleware,
    requireWorkspaceMember,
    requirePermission('tasks', 'delete'),
    removeTask,
  );

  return router;
}
