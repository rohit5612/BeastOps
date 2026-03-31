import { prisma } from '../../core/db/client.js';
import { AppError } from '../../core/utils/errors.js';
import { appendAuditEvent } from '../audit/audit.service.js';
import { listAuditEventsForVideo } from '../audit/audit.service.js';
import { ensureDefaultPipelineStages } from '../pipeline/pipeline.service.js';

export async function listVideoProjects(workspaceId) {
  await ensureDefaultPipelineStages(workspaceId);
  return prisma.videoProject.findMany({
    where: { workspaceId },
    orderBy: { updatedAt: 'desc' },
    include: {
      stage: { select: { id: true, name: true, sortOrder: true } },
    },
  });
}

export async function createVideoProject(workspaceId, { title, stageId }) {
  await ensureDefaultPipelineStages(workspaceId);
  const t = String(title ?? '').trim();
  if (!t) {
    throw new AppError('title is required', 400, 'ValidationError');
  }

  let stage = null;
  if (stageId) {
    stage = await prisma.pipelineStage.findFirst({
      where: { id: stageId, workspaceId },
    });
  }
  if (!stage) {
    stage = await prisma.pipelineStage.findFirst({
      where: { workspaceId },
      orderBy: { sortOrder: 'asc' },
    });
  }
  if (!stage) {
    throw new AppError('No pipeline stages', 500, 'InternalServerError');
  }

  return prisma.videoProject.create({
    data: {
      workspaceId,
      stageId: stage.id,
      title: t,
    },
    include: {
      stage: { select: { id: true, name: true, sortOrder: true } },
    },
  });
}

export async function moveVideoProjectToStage(
  workspaceId,
  videoProjectId,
  nextStageId,
  actorId,
) {
  const stage = await prisma.pipelineStage.findFirst({
    where: { id: nextStageId, workspaceId },
  });
  if (!stage) {
    throw new AppError('Invalid stage', 400, 'ValidationError');
  }

  const video = await prisma.videoProject.findFirst({
    where: { id: videoProjectId, workspaceId },
  });
  if (!video) {
    throw new AppError('Video project not found', 404, 'NotFound');
  }

  const previousStageId = video.stageId;

  const updated = await prisma.videoProject.update({
    where: { id: videoProjectId },
    data: { stageId: nextStageId },
    include: {
      stage: { select: { id: true, name: true, sortOrder: true } },
    },
  });

  await appendAuditEvent({
    workspaceId,
    videoProjectId,
    actorId,
    action: 'videoProject.stageChanged',
    payload: { stageId: nextStageId, previousStageId },
  });

  return updated;
}

export async function getVideoAuditTimeline(workspaceId, videoProjectId, limit) {
  const video = await prisma.videoProject.findFirst({
    where: { id: videoProjectId, workspaceId },
    select: { id: true },
  });
  if (!video) {
    throw new AppError('Video project not found', 404, 'NotFound');
  }
  return listAuditEventsForVideo(workspaceId, videoProjectId, limit);
}
