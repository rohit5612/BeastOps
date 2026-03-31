import { prisma } from '../../core/db/client.js';
import { AppError } from '../../core/utils/errors.js';
import { isElevatedSystemAccount } from '../../core/systemUsers/guards.js';
import { appendAuditEvent } from '../audit/audit.service.js';

async function ensureTaskInWorkspace(workspaceId, taskId) {
  if (!taskId) return null;
  const task = await prisma.task.findFirst({
    where: { id: taskId, workspaceId },
    select: { id: true, videoProjectId: true },
  });
  if (!task) {
    throw new AppError('taskId is invalid for this workspace', 400, 'ValidationError');
  }
  return task;
}

async function ensureVideoProjectInWorkspace(workspaceId, videoProjectId) {
  if (!videoProjectId) return null;
  const project = await prisma.videoProject.findFirst({
    where: { id: videoProjectId, workspaceId },
    select: { id: true },
  });
  if (!project) {
    throw new AppError('videoProjectId is invalid for this workspace', 400, 'ValidationError');
  }
  return project;
}

export async function listComments(workspaceId, filters = {}) {
  const where = { workspaceId };
  if (filters.taskId) where.taskId = filters.taskId;
  if (filters.videoProjectId) where.videoProjectId = filters.videoProjectId;

  return prisma.comment.findMany({
    where,
    include: {
      author: { select: { id: true, email: true, name: true } },
    },
    orderBy: { createdAt: 'asc' },
  });
}

export async function createComment(workspaceId, actorId, body) {
  const text = String(body?.body ?? '').trim();
  if (!text) {
    throw new AppError('body is required', 400, 'ValidationError');
  }

  const task = await ensureTaskInWorkspace(workspaceId, body?.taskId ?? null);
  const project = await ensureVideoProjectInWorkspace(
    workspaceId,
    body?.videoProjectId ?? null,
  );
  const inferredVideoProjectId = project?.id ?? task?.videoProjectId ?? null;

  if (!task && !project) {
    throw new AppError(
      'Either taskId or videoProjectId is required',
      400,
      'ValidationError',
    );
  }

  const comment = await prisma.comment.create({
    data: {
      workspaceId,
      taskId: task?.id ?? null,
      videoProjectId: inferredVideoProjectId,
      authorId: actorId,
      body: text,
    },
    include: {
      author: { select: { id: true, email: true, name: true } },
    },
  });

  await appendAuditEvent({
    workspaceId,
    videoProjectId: comment.videoProjectId,
    actorId,
    action: 'comment.created',
    payload: { commentId: comment.id, taskId: comment.taskId },
  });

  return comment;
}

async function canMutateComment(requestUser, comment) {
  if (comment.authorId === requestUser.sub) return true;
  if (isElevatedSystemAccount(requestUser.systemAccount)) return true;
  return false;
}

export async function updateComment(workspaceId, commentId, actor, body) {
  const comment = await prisma.comment.findFirst({
    where: { id: commentId, workspaceId },
  });
  if (!comment) {
    throw new AppError('Comment not found', 404, 'NotFound');
  }
  if (!(await canMutateComment(actor, comment))) {
    throw new AppError('You cannot edit this comment', 403, 'Forbidden');
  }

  const text = String(body?.body ?? '').trim();
  if (!text) {
    throw new AppError('body is required', 400, 'ValidationError');
  }

  const updated = await prisma.comment.update({
    where: { id: commentId },
    data: { body: text },
    include: {
      author: { select: { id: true, email: true, name: true } },
    },
  });

  await appendAuditEvent({
    workspaceId,
    videoProjectId: updated.videoProjectId,
    actorId: actor.sub,
    action: 'comment.updated',
    payload: { commentId: updated.id },
  });

  return updated;
}

export async function deleteComment(workspaceId, commentId, actor) {
  const comment = await prisma.comment.findFirst({
    where: { id: commentId, workspaceId },
  });
  if (!comment) {
    throw new AppError('Comment not found', 404, 'NotFound');
  }
  if (!(await canMutateComment(actor, comment))) {
    throw new AppError('You cannot delete this comment', 403, 'Forbidden');
  }

  await prisma.comment.delete({ where: { id: commentId } });

  await appendAuditEvent({
    workspaceId,
    videoProjectId: comment.videoProjectId,
    actorId: actor.sub,
    action: 'comment.deleted',
    payload: { commentId: comment.id },
  });
}
