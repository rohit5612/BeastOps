import { prisma } from '../../core/db/client.js';
import { DEFAULT_PIPELINE_STAGE_NAMES } from '../../core/constants/pipelineStages.js';

export async function ensureDefaultPipelineStages(workspaceId) {
  const count = await prisma.pipelineStage.count({ where: { workspaceId } });
  if (count > 0) return;

  await prisma.pipelineStage.createMany({
    data: DEFAULT_PIPELINE_STAGE_NAMES.map((name, sortOrder) => ({
      workspaceId,
      name,
      sortOrder,
    })),
  });
}

export async function listStagesForWorkspace(workspaceId) {
  await ensureDefaultPipelineStages(workspaceId);
  return prisma.pipelineStage.findMany({
    where: { workspaceId },
    orderBy: { sortOrder: 'asc' },
  });
}
