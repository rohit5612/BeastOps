import expressPromiseRouter from 'express-promise-router';
import { requireAuthMiddleware } from '../../auth/session.js';
import { requireWorkspaceMember } from '../../auth/middlewares/workspaceScope.js';
import { requirePermission } from '../../auth/policy.js';
import { getUsers, patchUser } from './users.controller.js';

export function createUsersRouter() {
  const router = expressPromiseRouter();

  router.get(
    '/',
    requireAuthMiddleware,
    requireWorkspaceMember,
    requirePermission('users', 'read'),
    getUsers,
  );
  router.patch(
    '/:id',
    requireAuthMiddleware,
    requireWorkspaceMember,
    requirePermission('users', 'manage'),
    patchUser,
  );

  return router;
}
