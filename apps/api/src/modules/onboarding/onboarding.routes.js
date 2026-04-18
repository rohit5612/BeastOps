import expressPromiseRouter from 'express-promise-router';
import { requireAuthMiddleware } from '../../auth/session.js';
import { requireWorkspaceMember } from '../../auth/middlewares/workspaceScope.js';
import { requirePermission } from '../../auth/policy.js';
import {
  getPendingApprovals,
  postApprove,
  postReject,
} from './onboarding.controller.js';

export function createOnboardingRouter() {
  const router = expressPromiseRouter();

  router.get(
    '/pending',
    requireAuthMiddleware,
    requireWorkspaceMember,
    requirePermission('approvals', 'read'),
    getPendingApprovals,
  );
  router.post(
    '/:id/approve',
    requireAuthMiddleware,
    requireWorkspaceMember,
    requirePermission('approvals', 'manage'),
    postApprove,
  );
  router.post(
    '/:id/reject',
    requireAuthMiddleware,
    requireWorkspaceMember,
    requirePermission('approvals', 'manage'),
    postReject,
  );

  return router;
}
