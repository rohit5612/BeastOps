import { prisma } from '../core/db/client.js';
import { isElevatedSystemAccount } from '../core/systemUsers/guards.js';

const LEVEL_BASE_PERMISSIONS = {
  LEVEL0: ['*:*'],
  LEVEL1: [
    'pipeline:read',
    'videos:*',
    'ideas:*',
    'tasks:*',
    'comments:*',
    'analytics:read',
    'integrations:manage',
    'users:manage',
    'approvals:manage',
    'roles:read',
    'departments:manage',
    'settings:manage',
  ],
  LEVEL2: [
    'pipeline:read',
    'videos:*',
    'ideas:*',
    'tasks:*',
    'comments:*',
    'analytics:read',
    'integrations:read',
    'users:read',
    'approvals:read',
    'roles:read',
    'departments:read',
    'settings:read',
  ],
  LEVEL3: [
    'pipeline:read',
    'videos:read',
    'videos:update',
    'ideas:*',
    'tasks:*',
    'comments:*',
    'analytics:read',
    'users:read',
    'departments:read',
    'settings:read',
  ],
  LEVEL4: [
    'pipeline:read',
    'videos:read',
    'ideas:read',
    'ideas:create',
    'ideas:update',
    'tasks:read',
    'tasks:create',
    'tasks:update',
    'comments:*',
    'analytics:read',
    'departments:read',
  ],
  LEVEL5: [
    'pipeline:read',
    'videos:read',
    'ideas:read',
    'tasks:read',
    'comments:read',
    'comments:create',
    'analytics:read',
    'settings:read',
  ],
};

const RESOURCE_MODULE_MAP = {
  users: 'user_management',
  approvals: 'user_management',
  roles: 'user_management',
  departments: 'user_management',
  pipeline: 'content_ops',
  videos: 'content_ops',
  ideas: 'content_ops',
  tasks: 'content_ops',
  comments: 'content_ops',
  analytics: 'analytics',
  integrations: 'integrations',
  settings: 'settings',
};

function hasPermission(permissions, target) {
  if (permissions.has('*:*')) return true;
  if (permissions.has(target)) return true;
  const [resource] = target.split(':');
  return permissions.has(`${resource}:*`);
}

function permissionRuleMatches(permission, target) {
  if (!permission || !target) return false;
  if (permission === '*:*') return true;
  if (permission === target) return true;
  const [resource] = target.split(':');
  return permission === `${resource}:*`;
}

function moduleAllowedByDepartment(moduleAccess, moduleKey) {
  if (!moduleAccess || typeof moduleAccess !== 'object') return true;
  if (!Object.prototype.hasOwnProperty.call(moduleAccess, moduleKey)) return true;
  return Boolean(moduleAccess[moduleKey]);
}

function evaluateConditions(conditions, req) {
  if (!conditions || typeof conditions !== 'object') return true;
  if (conditions.departmentMatch === true) {
    const left = req.tenantMember?.departmentId;
    const right = req.resourceOwnerDepartmentId;
    return !right || (left && left === right);
  }
  if (conditions.requireOwnership === true) {
    const ownerId = req.resourceOwnerId;
    return !!ownerId && ownerId === req.user?.sub;
  }
  return true;
}

export function requirePermission(resource, action) {
  return async (req, res, next) => {
    if (isElevatedSystemAccount(req.user?.systemAccount)) {
      return next();
    }

    const tenantMember = req.tenantMember;
    if (!tenantMember) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Tenant membership required',
      });
    }

    const base = LEVEL_BASE_PERMISSIONS[tenantMember.accessLevel] || [];
    const allowed = new Set(base);
    const target = `${resource}:${action}`;

    const assignments = await prisma.userRoleAssignment.findMany({
      where: { tenantMemberId: tenantMember.id },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    let departmentModuleAccess = null;
    if (tenantMember.departmentId) {
      const department = await prisma.department.findUnique({
        where: { id: tenantMember.departmentId },
        select: { moduleAccess: true },
      });
      departmentModuleAccess = department?.moduleAccess || null;
    }

    const assignmentRules = [];
    for (const assignment of assignments) {
      for (const rp of assignment.role.rolePermissions) {
        const permissionKey = `${rp.permission.resource}:${rp.permission.action}`;
        assignmentRules.push({
          permissionKey,
          effect: rp.effect,
          conditions: rp.conditions,
        });
        if (rp.effect !== 'allow') continue;
        if (!evaluateConditions(rp.conditions, req)) continue;
        allowed.add(permissionKey);
      }
    }

    const moduleKey = RESOURCE_MODULE_MAP[resource];
    if (
      moduleKey &&
      !moduleAllowedByDepartment(departmentModuleAccess, moduleKey)
    ) {
      const hasModuleOverride = assignmentRules.some((rule) => {
        if (rule.effect !== 'allow') return false;
        if (!permissionRuleMatches(rule.permissionKey, target)) return false;
        return (
          rule.conditions?.allowOutOfDepartment === true ||
          rule.conditions?.allowModuleOverride === true
        );
      });
      if (!hasModuleOverride) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Department scope does not allow this module',
        });
      }
    }

    if (!hasPermission(allowed, target)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Insufficient policy permissions',
      });
    }

    next();
  };
}
