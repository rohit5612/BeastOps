import expressPromiseRouter from 'express-promise-router';
import { requireAuthMiddleware } from '../../auth/session.js';
import { getMe, patchMe, postDevLogin, postLogout } from './auth.controller.js';

export function createAuthRouter() {
  const router = expressPromiseRouter();

  router.post('/dev-login', postDevLogin);
  router.post('/logout', postLogout);
  router.get('/me', requireAuthMiddleware, getMe);
  router.patch('/me', requireAuthMiddleware, patchMe);

  return router;
}
