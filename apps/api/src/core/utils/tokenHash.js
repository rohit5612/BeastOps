import { createHash, randomBytes } from 'node:crypto';

export function createPlainToken(size = 32) {
  return randomBytes(size).toString('hex');
}

export function hashToken(raw) {
  return createHash('sha256').update(String(raw)).digest('hex');
}
