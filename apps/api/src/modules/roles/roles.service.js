import { prisma } from '../../core/db/client.js';
import { AppError } from '../../core/utils/errors.js';

async function upsertPermission(tx, tenantId, item) {
  const resource = String(item.resource || '').trim().toLowerCase();
  const action = String(item.action || '').trim().toLowerCase();
  if (!resource || !action) {
    throw new AppError('Permission resource/action required', 400, 'ValidationError');
  }
  return tx.permission.upsert({
    where: {
      tenantId_resource_action: {
        tenantId,
        resource,
        action,
      },
    },
    create: {
      tenantId,
      resource,
      action,
      description: item.description || null,
    },
    update: {
      description: item.description || undefined,
    },
  });
}

export async function listRoles(tenantId) {
  const roles = await prisma.role.findMany({
    where: { tenantId },
    include: {
      department: {
        select: { id: true, name: true },
      },
      rolePermissions: {
        include: { permission: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
  return roles;
}

export async function createRole(tenantId, body) {
  const name = String(body?.name || '').trim();
  if (!name) {
    throw new AppError('Role name is required', 400, 'ValidationError');
  }
  const departmentId =
    body?.departmentId !== undefined && body?.departmentId !== null
      ? String(body.departmentId)
      : null;
  const isSystemRole = String(body?.roleKey || '').toUpperCase() === 'SUPERADMIN';
  if (!isSystemRole && !departmentId) {
    throw new AppError(
      'departmentId is required for non-system roles',
      400,
      'ValidationError',
    );
  }
  if (departmentId) {
    const department = await prisma.department.findFirst({
      where: { id: departmentId, tenantId },
      select: { id: true },
    });
    if (!department) {
      throw new AppError('Department not found', 404, 'NotFound');
    }
  }

  const permissions = Array.isArray(body?.permissions) ? body.permissions : [];
  const role = await prisma.$transaction(async (tx) => {
    const created = await tx.role.create({
      data: {
        tenantId,
        departmentId,
        name,
        roleKey: body?.roleKey || null,
        description: body?.description || null,
        templateLevel:
          body?.templateLevel !== undefined ? Number(body.templateLevel) : null,
      },
    });

    for (const item of permissions) {
      const permission = await upsertPermission(tx, tenantId, item);
      await tx.rolePermission.create({
        data: {
          roleId: created.id,
          permissionId: permission.id,
          effect: item.effect || 'allow',
          conditions: item.conditions || undefined,
        },
      });
    }

    return created;
  });
  return role;
}

export async function assignRoleToMember({ tenantId, roleId, tenantMemberId }) {
  const role = await prisma.role.findFirst({
    where: { id: roleId, tenantId },
    select: { id: true, departmentId: true, roleKey: true },
  });
  if (!role) {
    throw new AppError('Role not found', 404, 'NotFound');
  }

  const member = await prisma.tenantMember.findFirst({
    where: { id: tenantMemberId, tenantId },
    select: { id: true, departmentId: true },
  });
  if (!member) {
    throw new AppError('Tenant member not found', 404, 'NotFound');
  }
  if (
    role.departmentId &&
    member.departmentId &&
    role.departmentId !== member.departmentId
  ) {
    throw new AppError(
      'Role department must match user department',
      400,
      'ValidationError',
    );
  }

  const assignment = await prisma.$transaction(async (tx) => {
    await tx.userRoleAssignment.deleteMany({
      where: { tenantMemberId },
    });
    return tx.userRoleAssignment.create({
      data: {
        tenantMemberId,
        roleId,
      },
    });
  });

  return assignment;
}
