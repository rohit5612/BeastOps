import { prisma } from '../../core/db/client.js';
import { AppError } from '../../core/utils/errors.js';
import { assertUserIsMutable } from '../../core/systemUsers/guards.js';
import { listWorkspacesForUser } from '../workspaces/workspaces.service.js';

export async function upsertDevUser({ email, name }) {
  const e = String(email ?? '').trim().toLowerCase();
  if (!e) {
    throw new AppError('email is required', 400, 'ValidationError');
  }

  const existing = await prisma.user.findUnique({ where: { email: e } });
  if (existing && existing.systemAccount !== 'NONE') {
    return existing;
  }

  const displayName =
    String(name ?? '').trim() || e.split('@')[0] || 'User';

  return prisma.user.upsert({
    where: { email: e },
    create: { email: e, name: displayName },
    update: { ...(name && { name: String(name).trim() }) },
  });
}

export async function getMePayload(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      imageUrl: true,
      systemAccount: true,
      isActive: true,
    },
  });

  if (!user) {
    throw new AppError('User not found', 404, 'NotFound');
  }

  if (!user.isActive) {
    throw new AppError('Account is disabled', 403, 'Forbidden');
  }

  const workspaces = await listWorkspacesForUser(userId);

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      imageUrl: user.imageUrl,
      systemAccount: user.systemAccount,
      elevatedAccess: user.systemAccount !== 'NONE',
    },
    workspaces,
  };
}

export async function updateMyProfile(userId, body) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new AppError('User not found', 404, 'NotFound');
  }
  assertUserIsMutable(user);

  const name =
    body?.name !== undefined ? String(body.name).trim() : undefined;

  return prisma.user.update({
    where: { id: userId },
    data: {
      ...(name !== undefined && { name: name || null }),
    },
    select: {
      id: true,
      email: true,
      name: true,
      imageUrl: true,
      systemAccount: true,
    },
  });
}
