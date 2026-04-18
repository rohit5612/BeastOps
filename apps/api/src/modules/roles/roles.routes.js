import expressPromiseRouter from 'express-promise-router';
import { requireAuthMiddleware } from '../../auth/session.js';
import { requireWorkspaceMember } from '../../auth/middlewares/workspaceScope.js';
import { requirePermission } from '../../auth/policy.js';
import { getRoles, postRole, postRoleAssignment } from './roles.controller.js';

export function createRolesRouter() {
  const router = expressPromiseRouter();

  router.get(
    '/',
    requireAuthMiddleware,
    requireWorkspaceMember,
    requirePermission('roles', 'read'),
    getRoles,
  );
  router.post(
    '/',
    requireAuthMiddleware,
    requireWorkspaceMember,
    requirePermission('roles', 'manage'),
    postRole,
  );
  router.post(
    '/:id/assign',
    requireAuthMiddleware,
    requireWorkspaceMember,
    requirePermission('roles', 'manage'),
    postRoleAssignment,
  );

  return router;
}
