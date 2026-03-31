import { prisma } from '../../core/db/client.js';
import { AppError } from '../../core/utils/errors.js';
import { appendAuditEvent } from '../audit/audit.service.js';
import { ensureDefaultPipelineStages } from '../pipeline/pipeline.service.js';

export async function listIdeas(workspaceId) {
  return prisma.idea.findMany({
    where: { workspaceId },
    orderBy: { updatedAt: 'desc' },
    include: {
      videoProject: {
        select: { id: true, title: true, stageId: true, createdAt: true },
      },
    },
  });
}

export async function createIdea(workspaceId, actorId, body) {
  const title = String(body?.title ?? '').trim();
  if (!title) {
    throw new AppError('title is required', 400, 'ValidationError');
  }

  const tags = Array.isArray(body?.tags)
    ? body.tags.map((t) => String(t))
    : [];

  const idea = await prisma.idea.create({
    data: {
      workspaceId,
      title,
      hooks: body?.hooks != null ? String(body.hooks) : null,
      thumbnailConcepts:
        body?.thumbnailConcepts != null
          ? String(body.thumbnailConcepts)
          : null,
      tags,
      expectedPerformance:
        body?.expectedPerformance != null
          ? String(body.expectedPerformance)
          : null,
    },
    include: {
      videoProject: {
        select: { id: true, title: true, stageId: true, createdAt: true },
      },
    },
  });

  await appendAuditEvent({
    workspaceId,
    actorId,
    action: 'idea.created',
    payload: { ideaId: idea.id, title: idea.title },
  });

  return idea;
}

export async function getIdeaById(workspaceId, ideaId) {
  const idea = await prisma.idea.findFirst({
    where: { id: ideaId, workspaceId },
    include: {
      videoProject: {
        select: { id: true, title: true, stageId: true, createdAt: true },
      },
    },
  });
  if (!idea) {
    throw new AppError('Idea not found', 404, 'NotFound');
  }
  return idea;
}

export async function updateIdea(workspaceId, ideaId, actorId, body) {
  await getIdeaById(workspaceId, ideaId);
  const data = {};
  if (body?.title !== undefined) {
    const title = String(body.title).trim();
    if (!title) throw new AppError('title cannot be empty', 400, 'ValidationError');
    data.title = title;
  }
  if (body?.hooks !== undefined) data.hooks = body.hooks ? String(body.hooks) : null;
  if (body?.thumbnailConcepts !== undefined) {
    data.thumbnailConcepts = body.thumbnailConcepts
      ? String(body.thumbnailConcepts)
      : null;
  }
  if (body?.expectedPerformance !== undefined) {
    data.expectedPerformance = body.expectedPerformance
      ? String(body.expectedPerformance)
      : null;
  }
  if (body?.tags !== undefined) {
    if (!Array.isArray(body.tags)) {
      throw new AppError('tags must be an array', 400, 'ValidationError');
    }
    data.tags = body.tags.map((t) => String(t));
  }

  const idea = await prisma.idea.update({
    where: { id: ideaId },
    data,
    include: {
      videoProject: {
        select: { id: true, title: true, stageId: true, createdAt: true },
      },
    },
  });

  await appendAuditEvent({
    workspaceId,
    actorId,
    action: 'idea.updated',
    payload: { ideaId, changedFields: Object.keys(data) },
  });

  return idea;
}

export async function deleteIdea(workspaceId, ideaId, actorId) {
  const idea = await getIdeaById(workspaceId, ideaId);
  if (idea.videoProject) {
    throw new AppError(
      'Converted ideas cannot be deleted',
      400,
      'ValidationError',
    );
  }
  await prisma.idea.delete({ where: { id: ideaId } });
  await appendAuditEvent({
    workspaceId,
    actorId,
    action: 'idea.deleted',
    payload: { ideaId },
  });
}

export async function convertIdeaToVideoProject(workspaceId, ideaId, actorId) {
  const idea = await getIdeaById(workspaceId, ideaId);
  if (idea.videoProject) {
    return idea.videoProject;
  }

  await ensureDefaultPipelineStages(workspaceId);
  const firstStage = await prisma.pipelineStage.findFirst({
    where: { workspaceId },
    orderBy: { sortOrder: 'asc' },
  });
  if (!firstStage) {
    throw new AppError('No pipeline stages found', 500, 'InternalServerError');
  }

  const videoProject = await prisma.videoProject.create({
    data: {
      workspaceId,
      title: idea.title,
      stageId: firstStage.id,
      ideaId: idea.id,
    },
    include: {
      stage: { select: { id: true, name: true, sortOrder: true } },
    },
  });

  await appendAuditEvent({
    workspaceId,
    videoProjectId: videoProject.id,
    actorId,
    action: 'idea.convertedToVideoProject',
    payload: { ideaId: idea.id, videoProjectId: videoProject.id },
  });

  return videoProject;
}
