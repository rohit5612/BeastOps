import { prisma } from '../../core/db/client.js';
import { AppError } from '../../core/utils/errors.js';
import { isElevatedSystemAccount } from '../../core/systemUsers/guards.js';
import { encryptSecret } from '../../core/utils/crypto.js';
import { fetchYouTubeChannelList } from '../analytics/youtube/client.js';

export async function assertAdminCanManageWorkspaceIntegration(userId, workspaceId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { systemAccount: true, isActive: true },
  });
  if (!user?.isActive) {
    throw new AppError('Account is disabled', 403, 'Forbidden');
  }

  if (isElevatedSystemAccount(user.systemAccount)) {
    return;
  }

  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: { id: true, tenantId: true },
  });
  if (!workspace) {
    throw new AppError('Workspace not found', 404, 'NotFound');
  }

  const workspaceMember = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: { workspaceId, userId },
    },
    select: { role: true },
  });
  if (!workspaceMember) {
    throw new AppError('User is not a workspace member', 403, 'Forbidden');
  }

  let hasAdminAccess = workspaceMember.role === 'ADMIN';
  if (workspace.tenantId) {
    const tenantMember = await prisma.tenantMember.findUnique({
      where: {
        tenantId_userId: {
          tenantId: workspace.tenantId,
          userId,
        },
      },
      select: {
        accessLevel: true,
        isPrimarySuperadmin: true,
        isBackupSuperadmin: true,
      },
    });
    if (tenantMember) {
      hasAdminAccess =
        hasAdminAccess ||
        tenantMember.accessLevel === 'LEVEL0' ||
        tenantMember.accessLevel === 'LEVEL1' ||
        tenantMember.isPrimarySuperadmin ||
        tenantMember.isBackupSuperadmin;
    }
  }

  if (!hasAdminAccess) {
    throw new AppError(
      'Only workspace admins can manage integrations',
      403,
      'Forbidden',
    );
  }
}

export async function linkGoogleIntegrationForWorkspace({
  workspaceId,
  userId,
  providerAccountId,
  accessToken,
  refreshToken,
  expiresInSec,
}) {
  await assertAdminCanManageWorkspaceIntegration(userId, workspaceId);

  await prisma.oAuthAccount.upsert({
    where: {
      provider_providerAccountId: {
        provider: 'google',
        providerAccountId: String(providerAccountId),
      },
    },
    create: {
      userId,
      provider: 'google',
      providerAccountId: String(providerAccountId),
      accessTokenEncrypted: encryptSecret(accessToken || ''),
      refreshTokenEncrypted: encryptSecret(refreshToken || ''),
      expiresAt: expiresInSec ? new Date(Date.now() + Number(expiresInSec) * 1000) : null,
    },
    update: {
      userId,
      accessTokenEncrypted: accessToken ? encryptSecret(accessToken) : undefined,
      refreshTokenEncrypted: refreshToken ? encryptSecret(refreshToken) : undefined,
      expiresAt: expiresInSec ? new Date(Date.now() + Number(expiresInSec) * 1000) : undefined,
    },
  });

  const channelPayload = await fetchYouTubeChannelList(accessToken);
  const firstChannel = channelPayload?.items?.[0];
  if (firstChannel?.id) {
    await prisma.channel.upsert({
      where: { youtubeChannelId: firstChannel.id },
      create: {
        workspaceId,
        youtubeChannelId: firstChannel.id,
        title: firstChannel?.snippet?.title || null,
      },
      update: {
        workspaceId,
        title: firstChannel?.snippet?.title || null,
      },
    });
  }
}

export async function getYouTubeIntegrationStatus(workspaceId) {
  const channels = await prisma.channel.findMany({
    where: { workspaceId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      youtubeChannelId: true,
      title: true,
      createdAt: true,
    },
  });

  return {
    connected: channels.length > 0,
    channels,
  };
}
