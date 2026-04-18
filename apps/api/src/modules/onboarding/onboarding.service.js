import { prisma } from '../../core/db/client.js';
import { AppError } from '../../core/utils/errors.js';

export async function listPendingApprovals(tenantId) {
  const members = await prisma.tenantMember.findMany({
    where: {
      tenantId,
      onboardingStatus: 'PENDING_APPROVAL',
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
        },
      },
      department: true,
    },
    orderBy: { createdAt: 'asc' },
  });
  return members;
}

export async function approveMember({
  tenantId,
  memberId,
  approverUserId,
  accessLevel,
}) {
  const member = await prisma.tenantMember.findFirst({
    where: {
      id: memberId,
      tenantId,
    },
    include: { user: true },
  });
  if (!member) {
    throw new AppError('Pending member not found', 404, 'NotFound');
  }

  const updated = await prisma.$transaction(async (tx) => {
    const m = await tx.tenantMember.update({
      where: { id: memberId },
      data: {
        onboardingStatus: 'APPROVED',
        approvedByUserId: approverUserId,
        approvedAt: new Date(),
        ...(accessLevel ? { accessLevel } : {}),
      },
    });
    await tx.user.update({
      where: { id: m.userId },
      data: {
        onboardingStatus: 'APPROVED',
        isActive: true,
      },
    });
    return m;
  });
  return updated;
}

export async function rejectMember({ tenantId, memberId, approverUserId }) {
  const member = await prisma.tenantMember.findFirst({
    where: {
      id: memberId,
      tenantId,
    },
  });
  if (!member) {
    throw new AppError('Pending member not found', 404, 'NotFound');
  }

  const updated = await prisma.$transaction(async (tx) => {
    const m = await tx.tenantMember.update({
      where: { id: memberId },
      data: {
        onboardingStatus: 'REJECTED',
        approvedByUserId: approverUserId,
        approvedAt: new Date(),
      },
    });
    await tx.user.update({
      where: { id: m.userId },
      data: {
        onboardingStatus: 'REJECTED',
        isActive: false,
      },
    });
    return m;
  });
  return updated;
}
