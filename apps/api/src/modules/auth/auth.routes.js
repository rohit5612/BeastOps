import expressPromiseRouter from 'express-promise-router';
import { requireAuthMiddleware } from '../../auth/session.js';
import { requireWorkspaceMember } from '../../auth/middlewares/workspaceScope.js';
import { requirePermission } from '../../auth/policy.js';
import {
  getOnboardingStatus,
  getMe,
  patchMe,
  postActivateBackup,
  postDevLogin,
  postInvite,
  postLogin,
  postRegisterInvite,
  postRegisterTenant,
  postResendVerification,
  postVerifyEmail,
  postRegister,
  postLogout,
} from './auth.controller.js';

export function createAuthRouter() {
  const router = expressPromiseRouter();

  router.post('/dev-login', postDevLogin);
  router.post('/register-tenant', postRegisterTenant);
  router.post('/verify-email', postVerifyEmail);
  router.post('/resend-verification', postResendVerification);
  router.post('/register-invite', postRegisterInvite);
  router.post('/activate-backup', postActivateBackup);
  router.post(
    '/invite',
    requireAuthMiddleware,
    requireWorkspaceMember,
    requirePermission('approvals', 'manage'),
    postInvite,
  );
  router.post('/register', postRegister);
  router.post('/login', postLogin);
  router.post('/logout', postLogout);
  router.get('/me', requireAuthMiddleware, getMe);
  router.get('/onboarding-status', requireAuthMiddleware, getOnboardingStatus);
  router.patch('/me', requireAuthMiddleware, patchMe);

  return router;
}
