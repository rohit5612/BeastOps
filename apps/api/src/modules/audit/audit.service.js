import { prisma } from '../../core/db/client.js';

export async function appendAuditEvent({
  workspaceId,
  videoProjectId,
  actorId,
  action,
  payload,
}) {
  return prisma.auditEvent.create({
    data: {
      workspaceId,
      videoProjectId: videoProjectId ?? null,
      actorId: actorId ?? null,
      action,
      payload: payload === undefined ? undefined : payload,
    },
  });
}

export async function listAuditEventsForVideo(
  workspaceId,
  videoProjectId,
  limit = 100,
) {
  const safeLimit = Math.max(1, Math.min(Number(limit) || 50, 200));
  return prisma.auditEvent.findMany({
    where: {
      workspaceId,
      videoProjectId,
    },
    include: {
      actor: {
        select: { id: true, email: true, name: true },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: safeLimit,
  });
}
