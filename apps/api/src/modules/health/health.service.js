import { prisma } from '../../core/db/client.js';

export function getHealthStatus() {
  return {
    status: 'ok',
  };
}

export async function getDbHealthStatus() {
  await prisma.$queryRaw`SELECT 1`;
  return { status: 'ok', database: 'connected' };
}

