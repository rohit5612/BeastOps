import { prisma } from '../../core/db/client.js';
import { AppError } from '../../core/utils/errors.js';
import { assertUserIsMutable } from '../../core/systemUsers/guards.js';
import { hashPassword, verifyPassword } from '../../auth/password.js';
import { listWorkspacesForUser } from '../workspaces/workspaces.service.js';
import { createPlainToken, hashToken } from '../../core/utils/tokenHash.js';
import { sendEmail } from '../../core/email/mailer.js';
import { loadConfig } from '../../core/config/index.js';

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

async function assertTenantExists(tenantId) {
  const normalized = String(tenantId ?? '').trim().toLowerCase();
  if (!normalized) {
    throw new AppError('tenantId is required', 400, 'ValidationError');
  }

  const tenant = await prisma.tenant.findUnique({
    where: { tenantCode: normalized },
    select: { id: true },
  });
  if (!tenant) {
    throw new AppError('Tenant not found', 404, 'NotFound');
  }
  return tenant;
}

function normalizeTenantCode(companyName) {
  return String(companyName || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 24);
}

async function generateUniqueTenantCode(companyName) {
  const base = normalizeTenantCode(companyName) || 'tenant';
  let index = 0;
  while (index < 50) {
    const code =
      index === 0 ? base : `${base}-${Math.random().toString(36).slice(2, 6)}`;
    const existing = await prisma.tenant.findUnique({
      where: { tenantCode: code },
      select: { id: true },
    });
    if (!existing) return code;
    index += 1;
  }
  throw new AppError('Unable to generate tenant id', 500, 'TenantGenerationFailed');
}

async function createAuthToken({
  type,
  userId,
  tenantId,
  issuedByUserId,
  email,
  payload,
  expiresInMinutes = 30,
}) {
  const raw = createPlainToken();
  const tokenHash = hashToken(raw);
  const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);
  await prisma.authToken.create({
    data: {
      tokenHash,
      type,
      userId,
      tenantId,
      issuedByUserId,
      email,
      payload: payload || undefined,
      expiresAt,
    },
  });
  return raw;
}

async function findActiveAuthToken({ token, type }) {
  const hashed = hashToken(token);
  const record = await prisma.authToken.findUnique({
    where: { tokenHash: hashed },
  });
  if (!record || record.type !== type) {
    throw new AppError('Invalid token', 400, 'TokenInvalid');
  }
  if (record.consumedAt || record.expiresAt <= new Date()) {
    throw new AppError('Expired token', 400, 'TokenExpired');
  }
  return record;
}

async function consumeToken(id) {
  await prisma.authToken.update({
    where: { id },
    data: { consumedAt: new Date() },
  });
}

async function sendVerificationEmail(email, rawToken) {
  const config = loadConfig();
  const url = `${config.frontend.url}/verify-email?token=${encodeURIComponent(rawToken)}`;
  await sendEmail({
    to: email,
    subject: 'Verify your email',
    text: `Verify your BeastOps account: ${url}`,
    html: `<p>Verify your BeastOps account:</p><p><a href="${url}">${url}</a></p>`,
  });
}

const DEFAULT_PERMISSION_BLUEPRINT = [
  ['pipeline', 'read'],
  ['videos', 'read'],
  ['videos', 'create'],
  ['videos', 'update'],
  ['videos', 'delete'],
  ['ideas', 'read'],
  ['ideas', 'create'],
  ['ideas', 'update'],
  ['ideas', 'delete'],
  ['tasks', 'read'],
  ['tasks', 'create'],
  ['tasks', 'update'],
  ['tasks', 'delete'],
  ['comments', 'read'],
  ['comments', 'create'],
  ['comments', 'update'],
  ['comments', 'delete'],
  ['analytics', 'read'],
  ['integrations', 'read'],
  ['integrations', 'manage'],
  ['users', 'read'],
  ['users', 'manage'],
  ['approvals', 'read'],
  ['approvals', 'manage'],
  ['roles', 'read'],
  ['roles', 'manage'],
  ['departments', 'read'],
  ['departments', 'manage'],
  ['settings', 'read'],
  ['settings', 'manage'],
];

export async function registerTenant({
  companyName,
  email,
  password,
  name,
}) {
  const company = String(companyName ?? '').trim();
  if (!company) {
    throw new AppError('companyName is required', 400, 'ValidationError');
  }

  const normalizedEmail = String(email ?? '').trim().toLowerCase();
  if (!normalizedEmail) {
    throw new AppError('email is required', 400, 'ValidationError');
  }

  const passwordHash = await hashPassword(password);
  const displayName =
    String(name ?? '').trim() || normalizedEmail.split('@')[0] || 'User';

  const existing = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true },
  });
  if (existing) {
    throw new AppError(
      'Email already exists. Ask an admin to invite you to this tenant.',
      409,
      'Conflict',
    );
  }

  const tenantCode = await generateUniqueTenantCode(company);
  const backupEmail = `backup.${tenantCode}@system.beastops.local`;
  const backupPasswordHash = await hashPassword(createPlainToken(16));

  const result = await prisma.$transaction(async (tx) => {
    const createdUser = await tx.user.create({
      data: {
        email: normalizedEmail,
        name: displayName,
        passwordHash,
        onboardingStatus: 'PENDING_EMAIL_VERIFICATION',
      },
    });

    const tenant = await tx.tenant.create({
      data: {
        tenantCode,
        companyName: company,
        status: 'PENDING',
        createdByUserId: createdUser.id,
      },
    });

    const workspace = await tx.workspace.create({
      data: {
        name: `${company} Workspace`,
        tenantId: tenant.id,
      },
    });

    await tx.workspaceMember.create({
      data: {
        workspaceId: workspace.id,
        userId: createdUser.id,
        role: 'ADMIN',
      },
    });

    await tx.tenantMember.create({
      data: {
        tenantId: tenant.id,
        userId: createdUser.id,
        workspaceId: workspace.id,
        onboardingStatus: 'PENDING_EMAIL_VERIFICATION',
        accessLevel: 'LEVEL0',
        isPrimarySuperadmin: true,
      },
    });

    const backupUser = await tx.user.create({
      data: {
        email: backupEmail,
        name: `${company} Backup Superadmin`,
        passwordHash: backupPasswordHash,
        emailVerifiedAt: null,
        onboardingStatus: 'PENDING_EMAIL_VERIFICATION',
      },
    });

    await tx.workspaceMember.create({
      data: {
        workspaceId: workspace.id,
        userId: backupUser.id,
        role: 'ADMIN',
      },
    });

    await tx.tenantMember.create({
      data: {
        tenantId: tenant.id,
        userId: backupUser.id,
        workspaceId: workspace.id,
        onboardingStatus: 'PENDING_EMAIL_VERIFICATION',
        accessLevel: 'LEVEL0',
        isBackupSuperadmin: true,
      },
    });

    const permissions = [];
    for (const [resource, action] of DEFAULT_PERMISSION_BLUEPRINT) {
      const permission = await tx.permission.create({
        data: {
          tenantId: tenant.id,
          resource,
          action,
        },
      });
      permissions.push(permission);
    }

    const systemRole = await tx.role.create({
      data: {
        tenantId: tenant.id,
        name: 'Superadmin',
        roleKey: 'SUPERADMIN',
        templateLevel: 0,
        isSystem: true,
      },
    });

    for (const permission of permissions) {
      await tx.rolePermission.create({
        data: {
          roleId: systemRole.id,
          permissionId: permission.id,
          effect: 'allow',
        },
      });
    }

    const primaryMembership = await tx.tenantMember.findUnique({
      where: {
        tenantId_userId: {
          tenantId: tenant.id,
          userId: createdUser.id,
        },
      },
      select: { id: true },
    });
    const backupMembership = await tx.tenantMember.findUnique({
      where: {
        tenantId_userId: {
          tenantId: tenant.id,
          userId: backupUser.id,
        },
      },
      select: { id: true },
    });

    if (primaryMembership) {
      await tx.userRoleAssignment.create({
        data: {
          tenantMemberId: primaryMembership.id,
          roleId: systemRole.id,
        },
      });
    }
    if (backupMembership) {
      await tx.userRoleAssignment.create({
        data: {
          tenantMemberId: backupMembership.id,
          roleId: systemRole.id,
        },
      });
    }

    return { createdUser, tenant, workspace, backupUser };
  });

  const verifyToken = await createAuthToken({
    type: 'EMAIL_VERIFICATION',
    userId: result.createdUser.id,
    tenantId: result.tenant.id,
    email: normalizedEmail,
    payload: { tenantId: result.tenant.id, workspaceId: result.workspace.id },
    expiresInMinutes: 60,
  });
  const backupActivationToken = await createAuthToken({
    type: 'BACKUP_SUPERADMIN_ACTIVATION',
    userId: result.backupUser.id,
    tenantId: result.tenant.id,
    email: result.backupUser.email,
    payload: { tenantId: result.tenant.id, workspaceId: result.workspace.id },
    expiresInMinutes: 24 * 60,
  });

  await sendVerificationEmail(normalizedEmail, verifyToken);
  await sendEmail({
    to: normalizedEmail,
    subject: 'Backup superadmin activation details',
    text: `Backup superadmin activation token: ${backupActivationToken}`,
    html: `<p>Backup superadmin activation token:</p><p><code>${backupActivationToken}</code></p>`,
  });

  const config = loadConfig();
  return {
    user: {
      id: result.createdUser.id,
      email: result.createdUser.email,
      name: result.createdUser.name,
      onboardingStatus: 'PENDING_EMAIL_VERIFICATION',
    },
    tenantId: result.tenant.tenantCode,
    tenantStatus: result.tenant.status,
    message: 'Registration started. Verify your email to activate access.',
    ...(config.env === 'development'
      ? {
          debug: {
            verifyToken,
            backupActivationToken,
          },
        }
      : {}),
  };
}

export async function loginWithPassword({ tenantId, email, password }) {
  const tenant = await assertTenantExists(tenantId);
  const normalizedEmail = String(email ?? '').trim().toLowerCase();
  if (!normalizedEmail) {
    throw new AppError('email is required', 400, 'ValidationError');
  }

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: {
      id: true,
      email: true,
      name: true,
      passwordHash: true,
      systemAccount: true,
      isActive: true,
      imageUrl: true,
      onboardingStatus: true,
      emailVerifiedAt: true,
    },
  });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    throw new AppError('Invalid credentials', 401, 'Unauthorized');
  }
  if (!user.isActive) {
    throw new AppError('Account is disabled', 403, 'Forbidden');
  }
  if (!user.emailVerifiedAt) {
    throw new AppError('Email is not verified', 403, 'EmailNotVerified');
  }
  if (user.onboardingStatus !== 'APPROVED') {
    throw new AppError(
      'Your account is pending approval from tenant superadmin',
      403,
      'ApprovalPending',
    );
  }

  if (user.systemAccount === 'NONE') {
    const membership = await prisma.tenantMember.findUnique({
      where: {
        tenantId_userId: { tenantId: tenant.id, userId: user.id },
      },
      select: { onboardingStatus: true },
    });
    if (!membership || membership.onboardingStatus !== 'APPROVED') {
      throw new AppError(
        'You do not have access to this tenant',
        403,
        'Forbidden',
      );
    }
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
    select: {
      id: true,
      email: true,
      name: true,
      systemAccount: true,
      imageUrl: true,
      lastLoginAt: true,
    },
  });

  return {
    user: updated,
    tenantId: tenant.tenantCode,
  };
}

export async function verifyEmailAddress(token) {
  const record = await findActiveAuthToken({
    token,
    type: 'EMAIL_VERIFICATION',
  });

  if (!record.userId || !record.tenantId) {
    throw new AppError('Invalid verification context', 400, 'TokenInvalid');
  }

  const tenantMember = await prisma.tenantMember.findUnique({
    where: {
      tenantId_userId: {
        tenantId: record.tenantId,
        userId: record.userId,
      },
    },
  });
  const approvedImmediately =
    !!tenantMember &&
    (tenantMember.isPrimarySuperadmin || tenantMember.isBackupSuperadmin);

  const nextOnboardingStatus = approvedImmediately
    ? 'APPROVED'
    : 'PENDING_APPROVAL';

  const user = await prisma.user.update({
    where: { id: record.userId },
    data: {
      emailVerifiedAt: new Date(),
      onboardingStatus: nextOnboardingStatus,
      isActive: approvedImmediately,
    },
  });

  await prisma.tenant.update({
    where: { id: record.tenantId },
    data: { status: 'ACTIVE' },
  });

  await prisma.tenantMember.update({
    where: {
      tenantId_userId: {
        tenantId: record.tenantId,
        userId: record.userId,
      },
    },
    data: {
      onboardingStatus: nextOnboardingStatus,
      approvedAt: approvedImmediately ? new Date() : null,
      approvedByUserId: approvedImmediately ? record.userId : null,
    },
  });

  await consumeToken(record.id);

  const tenant = await prisma.tenant.findUnique({
    where: { id: record.tenantId },
    select: { tenantCode: true, companyName: true },
  });

  await sendEmail({
    to: user.email,
    subject: 'Tenant activated',
    text: `Your tenant is active. Tenant ID: ${tenant?.tenantCode}`,
    html: `<p>Your tenant is active.</p><p>Tenant ID: <strong>${tenant?.tenantCode}</strong></p>`,
  });

  return {
    tenantId: tenant?.tenantCode,
    companyName: tenant?.companyName,
  };
}

export async function resendVerification(email) {
  const normalizedEmail = String(email ?? '').trim().toLowerCase();
  if (!normalizedEmail) {
    throw new AppError('email is required', 400, 'ValidationError');
  }

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    include: {
      tenantMemberships: true,
    },
  });
  if (!user) {
    return { sent: true };
  }
  if (user.emailVerifiedAt) {
    return { sent: true };
  }
  const firstMembership = user.tenantMemberships[0];
  if (!firstMembership) {
    return { sent: true };
  }
  const token = await createAuthToken({
    type: 'EMAIL_VERIFICATION',
    userId: user.id,
    tenantId: firstMembership.tenantId,
    email: user.email,
    payload: { tenantId: firstMembership.tenantId },
    expiresInMinutes: 60,
  });
  await sendVerificationEmail(user.email, token);
  return { sent: true };
}

export async function issueInvite({
  tenantId,
  workspaceId,
  inviterUserId,
  email,
  accessLevel = 'LEVEL5',
  departmentId,
}) {
  const normalizedEmail = String(email ?? '').trim().toLowerCase();
  if (!normalizedEmail) {
    throw new AppError('email is required', 400, 'ValidationError');
  }
  const token = await createAuthToken({
    type: 'INVITE',
    tenantId,
    issuedByUserId: inviterUserId,
    email: normalizedEmail,
    payload: { tenantId, workspaceId, accessLevel, departmentId },
    expiresInMinutes: 72 * 60,
  });
  const config = loadConfig();
  const url = `${config.frontend.url}/register-invite?token=${encodeURIComponent(token)}`;
  await sendEmail({
    to: normalizedEmail,
    subject: 'You are invited to BeastOps',
    text: `Register with your invite link: ${url}`,
    html: `<p>You are invited to BeastOps.</p><p><a href="${url}">${url}</a></p>`,
  });
  return {
    sent: true,
    ...(config.env === 'development' ? { debug: { inviteToken: token } } : {}),
  };
}

export async function registerFromInvite({ token, name, password }) {
  const invite = await findActiveAuthToken({ token, type: 'INVITE' });
  const inviteEmail = String(invite.email || '').trim().toLowerCase();
  if (!inviteEmail) {
    throw new AppError('Invalid invite email', 400, 'TokenInvalid');
  }

  const existing = await prisma.user.findUnique({
    where: { email: inviteEmail },
    select: { id: true },
  });
  if (existing) {
    throw new AppError('Email already registered', 409, 'Conflict');
  }

  const passwordHash = await hashPassword(password);
  const displayName = String(name ?? '').trim() || inviteEmail.split('@')[0];
  const payload = invite.payload || {};

  const created = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email: inviteEmail,
        name: displayName,
        passwordHash,
        onboardingStatus: 'PENDING_EMAIL_VERIFICATION',
      },
    });
    await tx.workspaceMember.create({
      data: {
        workspaceId: payload.workspaceId,
        userId: user.id,
        role: 'VIEWER',
      },
    });
    await tx.tenantMember.create({
      data: {
        tenantId: payload.tenantId,
        userId: user.id,
        workspaceId: payload.workspaceId,
        departmentId: payload.departmentId || null,
        onboardingStatus: 'PENDING_EMAIL_VERIFICATION',
        accessLevel: payload.accessLevel || 'LEVEL5',
      },
    });
    return user;
  });

  const verifyToken = await createAuthToken({
    type: 'EMAIL_VERIFICATION',
    userId: created.id,
    tenantId: payload.tenantId,
    email: created.email,
    payload: payload,
    expiresInMinutes: 60,
  });
  await sendVerificationEmail(created.email, verifyToken);
  await consumeToken(invite.id);

  const config = loadConfig();
  return {
    registered: true,
    email: created.email,
    ...(config.env === 'development' ? { debug: { verifyToken } } : {}),
  };
}

export async function activateBackupSuperadmin({ token, password }) {
  const record = await findActiveAuthToken({
    token,
    type: 'BACKUP_SUPERADMIN_ACTIVATION',
  });
  if (!record.userId || !record.tenantId) {
    throw new AppError('Invalid backup activation token', 400, 'TokenInvalid');
  }
  const passwordHash = await hashPassword(password);
  await prisma.user.update({
    where: { id: record.userId },
    data: {
      passwordHash,
      emailVerifiedAt: new Date(),
      onboardingStatus: 'APPROVED',
      isActive: true,
    },
  });
  await prisma.tenantMember.update({
    where: {
      tenantId_userId: {
        tenantId: record.tenantId,
        userId: record.userId,
      },
    },
    data: {
      onboardingStatus: 'APPROVED',
      approvedAt: new Date(),
      accessLevel: 'LEVEL0',
      isBackupSuperadmin: true,
    },
  });
  await consumeToken(record.id);
  return { activated: true };
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
      onboardingStatus: true,
      emailVerifiedAt: true,
      tenantMemberships: {
        where: { onboardingStatus: 'APPROVED' },
        include: {
          tenant: true,
        },
      },
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
      onboardingStatus: user.onboardingStatus,
      emailVerified: !!user.emailVerifiedAt,
      accessLevel: user.tenantMemberships?.[0]?.accessLevel || null,
    },
    tenants: user.tenantMemberships.map((membership) => ({
      id: membership.tenant.id,
      tenantId: membership.tenant.tenantCode,
      companyName: membership.tenant.companyName,
      status: membership.tenant.status,
      accessLevel: membership.accessLevel,
      onboardingStatus: membership.onboardingStatus,
      isPrimarySuperadmin: membership.isPrimarySuperadmin,
      isBackupSuperadmin: membership.isBackupSuperadmin,
    })),
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
