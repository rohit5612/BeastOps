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
