import expressPromiseRouter from 'express-promise-router';
import { createHealthRouter } from '../modules/health/health.routes.js';
import { createStubRouter } from '../core/utils/stubRouter.js';
import { createAuthRouter } from '../modules/auth/auth.routes.js';
import { createWorkspacesRouter } from '../modules/workspaces/workspaces.routes.js';
import { createPipelineRouter } from '../modules/pipeline/pipeline.routes.js';
import { createVideosRouter } from '../modules/videos/videos.routes.js';
import { createIdeasRouter } from '../modules/ideas/ideas.routes.js';

export function createRootRouter() {
  const router = expressPromiseRouter();

  router.use('/health', createHealthRouter());

  router.use('/auth', createAuthRouter());
  router.use('/workspaces', createWorkspacesRouter());
  router.use('/pipeline', createPipelineRouter());
  router.use('/videos', createVideosRouter());
  router.use('/ideas', createIdeasRouter());
  router.use('/tasks', createStubRouter('tasks'));
  router.use('/comments', createStubRouter('comments'));
  router.use('/analytics', createStubRouter('analytics'));

  return router;
}

