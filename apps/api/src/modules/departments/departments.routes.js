import expressPromiseRouter from 'express-promise-router';
import { requireAuthMiddleware } from '../../auth/session.js';
import { requireWorkspaceMember } from '../../auth/middlewares/workspaceScope.js';
import { requirePermission } from '../../auth/policy.js';
import {
  getDepartments,
  patchDepartment,
  postDepartment,
  removeDepartment,
} from './departments.controller.js';

export function createDepartmentsRouter() {
  const router = expressPromiseRouter();

  router.get(
    '/',
    requireAuthMiddleware,
    requireWorkspaceMember,
    requirePermission('departments', 'read'),
    getDepartments,
  );
  router.post(
    '/',
    requireAuthMiddleware,
    requireWorkspaceMember,
    requirePermission('departments', 'manage'),
    postDepartment,
  );
  router.patch(
    '/:id',
    requireAuthMiddleware,
    requireWorkspaceMember,
    requirePermission('departments', 'manage'),
    patchDepartment,
  );
  router.delete(
    '/:id',
    requireAuthMiddleware,
    requireWorkspaceMember,
    requirePermission('departments', 'manage'),
    removeDepartment,
  );

  return router;
}
