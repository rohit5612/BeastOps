import { isElevatedSystemAccount } from '../core/systemUsers/guards.js';

/**
 * @param {string | string[]} allowed One role or list of roles (workspace: use `req.memberRole`)
 */
export function requireRole(allowed) {
  const list = Array.isArray(allowed) ? allowed : [allowed];
  return (req, res, next) => {
    if (isElevatedSystemAccount(req.user?.systemAccount)) {
      return next();
    }
    const role = req.memberRole ?? req.user?.role;
    if (!role || !list.includes(role)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Insufficient permissions',
      });
    }
    next();
  };
}
