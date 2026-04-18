import { getCookieName, verifySessionToken } from './jwt.js';
import { prisma } from '../core/db/client.js';

/**
 * Attaches req.user when a valid JWT is present on the session cookie.
 * Does not reject when missing or invalid (use requireAuth for that).
 */
export function optionalSessionMiddleware(req, res, next) {
  const name = getCookieName();
  const raw = req.cookies?.[name];
  if (!raw) {
    return next();
  }
  try {
    const decoded = verifySessionToken(raw);
    req.user = decoded;
  } catch {
    // invalid or expired token — treat as logged out
  }
  next();
}

export async function requireAuthMiddleware(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
    });
  }

  const account = await prisma.user.findUnique({
    where: { id: req.user.sub },
    select: {
      isActive: true,
      emailVerifiedAt: true,
      onboardingStatus: true,
      systemAccount: true,
    },
  });
  if (!account?.isActive) {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Account is disabled',
    });
  }
  if (
    account.systemAccount === 'NONE' &&
    (!account.emailVerifiedAt || account.onboardingStatus !== 'APPROVED')
  ) {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Account is not fully onboarded',
    });
  }

  next();
}
