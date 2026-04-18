import bcrypt from 'bcryptjs';
import { AppError } from '../core/utils/errors.js';

const MIN_PASSWORD_LENGTH = 8;
const SALT_ROUNDS = 10;

export function assertPasswordMeetsPolicy(password) {
  const raw = String(password ?? '');
  if (raw.length < MIN_PASSWORD_LENGTH) {
    throw new AppError(
      `Password must be at least ${MIN_PASSWORD_LENGTH} characters`,
      400,
      'ValidationError',
    );
  }
}

export async function hashPassword(password) {
  assertPasswordMeetsPolicy(password);
  return bcrypt.hash(String(password), SALT_ROUNDS);
}

export async function verifyPassword(password, passwordHash) {
  if (!passwordHash) {
    return false;
  }
  return bcrypt.compare(String(password ?? ''), passwordHash);
}
