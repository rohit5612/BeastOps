import { prisma } from '../../core/db/client.js';
import { loadConfig } from '../../core/config/index.js';
import { AppError } from '../../core/utils/errors.js';
import { encryptSecret } from '../../core/utils/crypto.js';
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

function resolveSystemAccountForEmail(email, currentSystemAccount) {
  if (currentSystemAccount && currentSystemAccount !== 'NONE') {
    return currentSystemAccount;
  }
  const config = loadConfig();
  const normalized = String(email || '').toLowerCase();
  if (normalized === config.systemUsers.primaryEmail) return 'SUPERUSER';
  if (normalized === config.systemUsers.backupEmail) return 'BACKUP_SUPERUSER';
  return 'NONE';
}

export async function upsertGoogleUserAndAccount({
  providerAccountId,
  email,
  name,
  imageUrl,
  accessToken,
  refreshToken,
  expiresInSec,
}) {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  if (!normalizedEmail) {
    throw new AppError('Google profile email missing', 400, 'OAuthProfileInvalid');
  }

  const existing = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true, systemAccount: true, isActive: true },
  });

  const systemAccount = resolveSystemAccountForEmail(
    normalizedEmail,
    existing?.systemAccount,
  );

  const user = await prisma.user.upsert({
    where: { email: normalizedEmail },
    create: {
      email: normalizedEmail,
      name: name ? String(name) : null,
      imageUrl: imageUrl ? String(imageUrl) : null,
      systemAccount,
      isActive: true,
    },
    update: {
      name: name ? String(name) : undefined,
      imageUrl: imageUrl ? String(imageUrl) : undefined,
      systemAccount,
      ...(systemAccount !== 'NONE' && { isActive: true }),
    },
  });

  if (!user.isActive) {
    throw new AppError('Account is disabled', 403, 'Forbidden');
  }

  await prisma.oAuthAccount.upsert({
    where: {
      provider_providerAccountId: {
        provider: 'google',
        providerAccountId: String(providerAccountId),
      },
    },
    create: {
      userId: user.id,
      provider: 'google',
      providerAccountId: String(providerAccountId),
      accessTokenEncrypted: encryptSecret(accessToken || ''),
      refreshTokenEncrypted: encryptSecret(refreshToken || ''),
      expiresAt: expiresInSec
        ? new Date(Date.now() + Number(expiresInSec) * 1000)
        : null,
    },
    update: {
      userId: user.id,
      accessTokenEncrypted: accessToken
        ? encryptSecret(accessToken)
        : undefined,
      refreshTokenEncrypted: refreshToken
        ? encryptSecret(refreshToken)
        : undefined,
      expiresAt: expiresInSec
        ? new Date(Date.now() + Number(expiresInSec) * 1000)
        : undefined,
    },
  });

  return user;
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
