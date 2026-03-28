import { prisma } from '../db/client.js';
import { loadConfig } from '../config/index.js';

/**
 * Upserts the two protected system accounts from env (see loadConfig systemUsers).
 * Call once at process startup after DB is reachable.
 */
export async function ensureSystemSuperusers() {
  const config = loadConfig();
  const primary = config.systemUsers.primaryEmail;
  const backup = config.systemUsers.backupEmail;

  if (!primary || !backup) {
    if (config.env === 'production') {
      throw new Error(
        'SUPERUSER_EMAIL and BACKUP_SUPERUSER_EMAIL must be set in production',
      );
    }
    // eslint-disable-next-line no-console
    console.warn(
      '[systemUsers] SUPERUSER_EMAIL / BACKUP_SUPERUSER_EMAIL missing; skipping system account bootstrap',
    );
    return;
  }

  if (primary === backup) {
    throw new Error(
      'SUPERUSER_EMAIL and BACKUP_SUPERUSER_EMAIL must be different addresses',
    );
  }

  await prisma.user.upsert({
    where: { email: primary },
    create: {
      email: primary,
      name: 'Superuser',
      systemAccount: 'SUPERUSER',
      isActive: true,
    },
    update: {
      systemAccount: 'SUPERUSER',
      isActive: true,
    },
  });

  await prisma.user.upsert({
    where: { email: backup },
    create: {
      email: backup,
      name: 'Backup superuser',
      systemAccount: 'BACKUP_SUPERUSER',
      isActive: true,
    },
    update: {
      systemAccount: 'BACKUP_SUPERUSER',
      isActive: true,
    },
  });

  // eslint-disable-next-line no-console
  console.log('[systemUsers] Primary and backup superuser records ensured');
}
