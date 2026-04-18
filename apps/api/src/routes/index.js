import expressPromiseRouter from 'express-promise-router';
import { createHealthRouter } from '../modules/health/health.routes.js';
import { createAuthRouter } from '../modules/auth/auth.routes.js';
import { createWorkspacesRouter } from '../modules/workspaces/workspaces.routes.js';
import { createPipelineRouter } from '../modules/pipeline/pipeline.routes.js';
import { createVideosRouter } from '../modules/videos/videos.routes.js';
import { createIdeasRouter } from '../modules/ideas/ideas.routes.js';
import { createTasksRouter } from '../modules/tasks/tasks.routes.js';
import { createCommentsRouter } from '../modules/comments/comments.routes.js';
import { createAnalyticsRouter } from '../modules/analytics/analytics.routes.js';
import { createIntegrationsRouter } from '../modules/integrations/integrations.routes.js';
import { createUsersRouter } from '../modules/users/users.routes.js';
import { createOnboardingRouter } from '../modules/onboarding/onboarding.routes.js';
import { createRolesRouter } from '../modules/roles/roles.routes.js';
import { createDepartmentsRouter } from '../modules/departments/departments.routes.js';

export function createRootRouter() {
  const router = expressPromiseRouter();

  router.use('/health', createHealthRouter());

  router.use('/auth', createAuthRouter());
  router.use('/workspaces', createWorkspacesRouter());
  router.use('/pipeline', createPipelineRouter());
  router.use('/videos', createVideosRouter());
  router.use('/ideas', createIdeasRouter());
  router.use('/tasks', createTasksRouter());
  router.use('/comments', createCommentsRouter());
  router.use('/analytics', createAnalyticsRouter());
  router.use('/integrations', createIntegrationsRouter());
  router.use('/users', createUsersRouter());
  router.use('/onboarding', createOnboardingRouter());
  router.use('/roles', createRolesRouter());
  router.use('/departments', createDepartmentsRouter());

  return router;
}

