import { prisma } from '../../core/db/client.js';
import { AppError } from '../../core/utils/errors.js';
import { ensureDefaultPipelineStages } from '../pipeline/pipeline.service.js';

export async function createWorkspace(userId, { name }) {
  const trimmed = String(name ?? '').trim();
  if (!trimmed) {
    throw new AppError('Workspace name is required', 400, 'ValidationError');
  }

  const workspace = await prisma.$transaction(async (tx) => {
    const w = await tx.workspace.create({ data: { name: trimmed } });
    await tx.workspaceMember.create({
      data: {
        workspaceId: w.id,
        userId,
        role: 'ADMIN',
      },
    });
    return w;
  });

  await ensureDefaultPipelineStages(workspace.id);
  return workspace;
}

export async function listWorkspacesForUser(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { systemAccount: true },
  });

  if (!user) {
    return [];
  }

  if (user.systemAccount !== 'NONE') {
    const all = await prisma.workspace.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return all.map((w) => ({
      id: w.id,
      name: w.name,
      role: 'ADMIN',
      createdAt: w.createdAt,
    }));
  }

  const memberships = await prisma.workspaceMember.findMany({
    where: { userId },
    include: {
      workspace: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return memberships.map((m) => ({
    id: m.workspace.id,
    name: m.workspace.name,
    role: m.role,
    createdAt: m.workspace.createdAt,
  }));
}
