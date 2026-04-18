import { prisma } from '../../core/db/client.js';
import { AppError } from '../../core/utils/errors.js';

function normalizeModuleAccess(moduleAccess) {
  if (!moduleAccess || typeof moduleAccess !== 'object') {
    return {};
  }
  const result = {};
  for (const [key, value] of Object.entries(moduleAccess)) {
    result[String(key)] = Boolean(value);
  }
  return result;
}

export async function listDepartments(tenantId) {
  if (!tenantId) {
    throw new AppError('Tenant context missing', 400, 'BadRequest');
  }
  return prisma.department.findMany({
    where: { tenantId },
    include: {
      _count: {
        select: {
          members: true,
          roles: true,
        },
      },
    },
    orderBy: { name: 'asc' },
  });
}

export async function createDepartment(tenantId, body) {
  if (!tenantId) {
    throw new AppError('Tenant context missing', 400, 'BadRequest');
  }
  const name = String(body?.name || '').trim();
  if (!name) {
    throw new AppError('Department name is required', 400, 'ValidationError');
  }
  return prisma.department.create({
    data: {
      tenantId,
      name,
      moduleAccess: normalizeModuleAccess(body?.moduleAccess),
    },
  });
}

export async function updateDepartment(tenantId, departmentId, body) {
  if (!tenantId) {
    throw new AppError('Tenant context missing', 400, 'BadRequest');
  }
  const existing = await prisma.department.findFirst({
    where: {
      id: departmentId,
      tenantId,
    },
    select: { id: true },
  });
  if (!existing) {
    throw new AppError('Department not found', 404, 'NotFound');
  }
  const name = body?.name !== undefined ? String(body.name).trim() : undefined;
  if (body?.name !== undefined && !name) {
    throw new AppError('Department name cannot be empty', 400, 'ValidationError');
  }
  return prisma.department.update({
    where: { id: departmentId },
    data: {
      ...(name !== undefined ? { name } : {}),
      ...(body?.moduleAccess !== undefined
        ? { moduleAccess: normalizeModuleAccess(body.moduleAccess) }
        : {}),
    },
  });
}

export async function deleteDepartment(tenantId, departmentId, opts = {}) {
  if (!tenantId) {
    throw new AppError('Tenant context missing', 400, 'BadRequest');
  }
  const existing = await prisma.department.findFirst({
    where: {
      id: departmentId,
      tenantId,
    },
    include: {
      _count: {
        select: {
          members: true,
          roles: true,
        },
      },
    },
  });
  if (!existing) {
    throw new AppError('Department not found', 404, 'NotFound');
  }
  const force = Boolean(opts.force);
  if (!force && (existing._count.members > 0 || existing._count.roles > 0)) {
    throw new AppError(
      'Department has active members/roles. Reassign first or pass force=true.',
      400,
      'ValidationError',
    );
  }
  return prisma.$transaction(async (tx) => {
    if (force) {
      await tx.tenantMember.updateMany({
        where: {
          tenantId,
          departmentId,
        },
        data: { departmentId: null },
      });
      await tx.role.updateMany({
        where: {
          tenantId,
          departmentId,
        },
        data: { departmentId: null },
      });
    }
    await tx.department.delete({
      where: { id: departmentId },
    });
  });
}
