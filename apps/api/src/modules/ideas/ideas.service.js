import { prisma } from '../../core/db/client.js';
import { AppError } from '../../core/utils/errors.js';

export async function listIdeas(workspaceId) {
  return prisma.idea.findMany({
    where: { workspaceId },
    orderBy: { updatedAt: 'desc' },
  });
}

export async function createIdea(workspaceId, body) {
  const title = String(body?.title ?? '').trim();
  if (!title) {
    throw new AppError('title is required', 400, 'ValidationError');
  }

  const tags = Array.isArray(body?.tags)
    ? body.tags.map((t) => String(t))
    : [];

  return prisma.idea.create({
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
  });
}
