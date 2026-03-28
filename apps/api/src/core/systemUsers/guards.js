import { AppError } from '../utils/errors.js';

export function isElevatedSystemAccount(systemAccount) {
  return systemAccount === 'SUPERUSER' || systemAccount === 'BACKUP_SUPERUSER';
}

/**
 * @param {{ systemAccount: import('@prisma/client').SystemAccountType }} user
 */
export function assertUserIsMutable(user) {
  if (user.systemAccount !== 'NONE') {
    throw new AppError(
      'This account is protected and cannot be changed',
      403,
      'Forbidden',
    );
  }
}

/**
 * @param {{ systemAccount: import('@prisma/client').SystemAccountType, isActive: boolean }} user
 */
export function assertUserIsNotDeletable(user) {
  if (user.systemAccount !== 'NONE') {
    throw new AppError(
      'This account is protected and cannot be deleted',
      403,
      'Forbidden',
    );
  }
}
