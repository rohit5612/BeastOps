import { prisma } from '../../core/db/client.js';
import { AppError } from '../../core/utils/errors.js';
import { appendAuditEvent } from '../audit/audit.service.js';

function normalizeTaskStatus(value) {
  if (value == null) return undefined;
  const v = String(value).trim().toUpperCase();
  const allowed = ['TODO', 'IN_PROGRESS', 'DONE', 'CANCELLED'];
  if (!allowed.includes(v)) {
    throw new AppError('Invalid task status', 400, 'ValidationError');
  }
  return v;
}

function normalizeTaskPriority(value) {
  if (value == null) return undefined;
  const v = String(value).trim().toUpperCase();
  const allowed = ['LOW', 'MEDIUM', 'HIGH'];
  if (!allowed.includes(v)) {
    throw new AppError('Invalid task priority', 400, 'ValidationError');
  }
  return v;
}

async function ensureVideoProjectInWorkspace(workspaceId, videoProjectId) {
  if (!videoProjectId) return null;
  const videoProject = await prisma.videoProject.findFirst({
    where: { id: videoProjectId, workspaceId },
    select: { id: true },
  });
  if (!videoProject) {
    throw new AppError('videoProjectId is invalid for this workspace', 400, 'ValidationError');
  }
  return videoProject.id;
}

async function ensureAssigneeInWorkspace(workspaceId, assigneeId) {
  if (!assigneeId) return null;
  const user = await prisma.user.findUnique({ where: { id: assigneeId } });
  if (!user) {
    throw new AppError('assigneeId does not exist', 400, 'ValidationError');
  }
  if (user.systemAccount !== 'NONE') {
    return assigneeId;
  }
  const member = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId: assigneeId } },
    select: { id: true },
  });
  if (!member) {
    throw new AppError('assignee must belong to this workspace', 400, 'ValidationError');
  }
  return assigneeId;
}

export async function listTasks(workspaceId, filters = {}) {
  const where = { workspaceId };
  if (filters.videoProjectId) {
    where.videoProjectId = filters.videoProjectId;
  }
  if (filters.status) {
    where.status = normalizeTaskStatus(filters.status);
  }
  return prisma.task.findMany({
    where,
    include: {
      assignee: { select: { id: true, email: true, name: true } },
      videoProject: { select: { id: true, title: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function createTask(workspaceId, actorId, body) {
  const title = String(body?.title ?? '').trim();
  if (!title) {
    throw new AppError('title is required', 400, 'ValidationError');
  }

  const videoProjectId = await ensureVideoProjectInWorkspace(
    workspaceId,
    body?.videoProjectId ?? null,
  );
  const assigneeId = await ensureAssigneeInWorkspace(
    workspaceId,
    body?.assigneeId ?? null,
  );
  const status = normalizeTaskStatus(body?.status);
  const priority = normalizeTaskPriority(body?.priority);

  const task = await prisma.task.create({
    data: {
      workspaceId,
      videoProjectId,
      assigneeId,
      title,
      dueDate: body?.dueDate ? new Date(body.dueDate) : null,
      ...(status && { status }),
      ...(priority && { priority }),
    },
    include: {
      assignee: { select: { id: true, email: true, name: true } },
      videoProject: { select: { id: true, title: true } },
    },
  });

  await appendAuditEvent({
    workspaceId,
    videoProjectId: task.videoProjectId,
    actorId,
    action: 'task.created',
    payload: { taskId: task.id, title: task.title },
  });

  return task;
}

export async function updateTask(workspaceId, taskId, actorId, body) {
  const current = await prisma.task.findFirst({
    where: { id: taskId, workspaceId },
  });
  if (!current) {
    throw new AppError('Task not found', 404, 'NotFound');
  }

  const data = {};
  if (body?.title !== undefined) {
    const title = String(body.title).trim();
    if (!title) throw new AppError('title cannot be empty', 400, 'ValidationError');
    data.title = title;
  }
  if (body?.videoProjectId !== undefined) {
    data.videoProjectId = await ensureVideoProjectInWorkspace(
      workspaceId,
      body.videoProjectId || null,
    );
  }
  if (body?.assigneeId !== undefined) {
    data.assigneeId = await ensureAssigneeInWorkspace(
      workspaceId,
      body.assigneeId || null,
    );
  }
  if (body?.status !== undefined) {
    data.status = normalizeTaskStatus(body.status);
  }
  if (body?.priority !== undefined) {
    data.priority = normalizeTaskPriority(body.priority);
  }
  if (body?.dueDate !== undefined) {
    data.dueDate = body.dueDate ? new Date(body.dueDate) : null;
  }

  const updated = await prisma.task.update({
    where: { id: taskId },
    data,
    include: {
      assignee: { select: { id: true, email: true, name: true } },
      videoProject: { select: { id: true, title: true } },
    },
  });

  await appendAuditEvent({
    workspaceId,
    videoProjectId: updated.videoProjectId,
    actorId,
    action: 'task.updated',
    payload: { taskId: updated.id, changedFields: Object.keys(data) },
  });

  return updated;
}

export async function deleteTask(workspaceId, taskId, actorId) {
  const task = await prisma.task.findFirst({
    where: { id: taskId, workspaceId },
  });
  if (!task) {
    throw new AppError('Task not found', 404, 'NotFound');
  }

  await prisma.task.delete({ where: { id: taskId } });

  await appendAuditEvent({
    workspaceId,
    videoProjectId: task.videoProjectId,
    actorId,
    action: 'task.deleted',
    payload: { taskId },
  });
}
