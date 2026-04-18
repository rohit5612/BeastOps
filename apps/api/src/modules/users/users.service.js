import { prisma } from '../../core/db/client.js';
import { AppError } from '../../core/utils/errors.js';

export async function listTenantUsers(tenantId) {
  if (!tenantId) {
    throw new AppError('Tenant context missing', 400, 'BadRequest');
  }
  const members = await prisma.tenantMember.findMany({
    where: { tenantId },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          isActive: true,
          onboardingStatus: true,
          emailVerifiedAt: true,
          createdAt: true,
        },
      },
      department: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return members.map((m) => ({
    id: m.id,
    userId: m.userId,
    email: m.user.email,
    name: m.user.name,
    departmentId: m.departmentId,
    accessLevel: m.accessLevel,
    onboardingStatus: m.onboardingStatus,
    isPrimarySuperadmin: m.isPrimarySuperadmin,
    isBackupSuperadmin: m.isBackupSuperadmin,
    department: m.department?.name || null,
    approvedAt: m.approvedAt,
  }));
}

export async function updateTenantUser(tenantId, tenantMemberId, body) {
  const member = await prisma.tenantMember.findFirst({
    where: {
      id: tenantMemberId,
      tenantId,
    },
  });
  if (!member) {
    throw new AppError('User membership not found', 404, 'NotFound');
  }
  const accessLevel = body?.accessLevel ? String(body.accessLevel) : undefined;
  const departmentId = body?.departmentId === null ? null : body?.departmentId;
  const isActive = body?.isActive;
  if (departmentId) {
    const department = await prisma.department.findFirst({
      where: {
        id: String(departmentId),
        tenantId,
      },
      select: { id: true },
    });
    if (!department) {
      throw new AppError('Department not found', 404, 'NotFound');
    }
  }

  const updated = await prisma.$transaction(async (tx) => {
    const m = await tx.tenantMember.update({
      where: { id: tenantMemberId },
      data: {
        ...(accessLevel ? { accessLevel } : {}),
        ...(departmentId !== undefined ? { departmentId: departmentId ? String(departmentId) : null } : {}),
      },
    });
    if (typeof isActive === 'boolean') {
      await tx.user.update({
        where: { id: m.userId },
        data: { isActive },
      });
    }
    return m;
  });
  return updated;
}
