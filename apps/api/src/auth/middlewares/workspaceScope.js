import { prisma } from '../../core/db/client.js';
import { isElevatedSystemAccount } from '../../core/systemUsers/guards.js';

/**
 * Requires `X-Workspace-Id` and membership (or system superuser override).
 * Sets `req.workspace`, `req.memberRole`, and `req.superuserWorkspaceAccess` when applicable.
 */
export async function requireWorkspaceMember(req, res, next) {
  const userId = req.user?.sub;
  if (!userId) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
    });
  }

  const workspaceId = req.headers['x-workspace-id'];
  if (!workspaceId || typeof workspaceId !== 'string') {
    return res.status(400).json({
      error: 'BadRequest',
      message: 'X-Workspace-Id header is required',
    });
  }

  const jwtClaim = req.user?.systemAccount;
  if (isElevatedSystemAccount(jwtClaim)) {
    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { systemAccount: true, isActive: true },
    });
    if (
      !dbUser?.isActive ||
      dbUser.systemAccount === 'NONE' ||
      dbUser.systemAccount !== jwtClaim
    ) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Elevated session is no longer valid',
      });
    }

    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
    });
    if (!workspace) {
      return res.status(404).json({
        error: 'NotFound',
        message: 'Workspace not found',
      });
    }

    req.workspace = workspace;
    req.memberRole = 'ADMIN';
    req.superuserWorkspaceAccess = true;
    return next();
  }

  const member = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: { workspaceId, userId },
    },
    include: {
      workspace: true,
    },
  });

  if (!member) {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'You are not a member of this workspace',
    });
  }

  req.workspace = member.workspace;
  req.memberRole = member.role;
  req.superuserWorkspaceAccess = false;
  next();
}
