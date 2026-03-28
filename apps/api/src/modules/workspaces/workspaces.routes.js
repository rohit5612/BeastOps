import expressPromiseRouter from 'express-promise-router';
import { requireAuthMiddleware } from '../../auth/session.js';
import { getWorkspaces, postWorkspace } from './workspaces.controller.js';

export function createWorkspacesRouter() {
  const router = expressPromiseRouter();

  router.get('/', requireAuthMiddleware, getWorkspaces);
  router.post('/', requireAuthMiddleware, postWorkspace);

  return router;
}
