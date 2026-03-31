import { trimEnvValue } from './envUtils.js';

/**
 * Single place for env-backed config. Uses variables from `apps/api/.env` only
 * (no alternate names) so behavior matches your file.
 */
export function loadConfig() {
  const NODE_ENV = trimEnvValue(process.env.NODE_ENV) || 'development';
  const PORT = trimEnvValue(process.env.PORT) || '4000';
  const CORS_ORIGIN =
    trimEnvValue(process.env.CORS_ORIGIN) || 'http://localhost:5173';

  const DB_HOST = trimEnvValue(process.env.DB_HOST) || 'localhost';
  const DB_PORT = trimEnvValue(process.env.DB_PORT) || '5432';
  const DB_NAME = trimEnvValue(process.env.DB_NAME);
  const DB_USER = trimEnvValue(process.env.DB_USER);
  const DB_PASSWORD = trimEnvValue(process.env.DB_PASSWORD) ?? '';

  const JWT_SECRET = trimEnvValue(process.env.JWT_SECRET) || 'dev-secret-change-me';
  const JWT_EXPIRES_IN = trimEnvValue(process.env.JWT_EXPIRES_IN) || '7d';
  const TOKEN_ENCRYPTION_KEY = trimEnvValue(process.env.TOKEN_ENCRYPTION_KEY);

  const GOOGLE_CLIENT_ID = trimEnvValue(process.env.GOOGLE_CLIENT_ID);
  const GOOGLE_CLIENT_SECRET = trimEnvValue(process.env.GOOGLE_CLIENT_SECRET);
  const GOOGLE_REDIRECT_URI = trimEnvValue(process.env.GOOGLE_REDIRECT_URI);

  const FRONTEND_URL =
    trimEnvValue(process.env.FRONTEND_URL) || CORS_ORIGIN;

  const EMAIL_USER = trimEnvValue(process.env.EMAIL_USER);
  const EMAIL_PASS = trimEnvValue(process.env.EMAIL_PASS);
  const EMAIL_FROM = trimEnvValue(process.env.EMAIL_FROM);
  const EMAIL_SUBJECT_PREFIX =
    trimEnvValue(process.env.EMAIL_SUBJECT_PREFIX) || '[BeastOps]';

  const REDIS_URL = trimEnvValue(process.env.REDIS_URL);

  const superuserEmailRaw = trimEnvValue(process.env.SUPERUSER_EMAIL);
  const backupSuperuserEmailRaw = trimEnvValue(
    process.env.BACKUP_SUPERUSER_EMAIL,
  );
  let superuserEmail = superuserEmailRaw?.toLowerCase() ?? null;
  let backupSuperuserEmail = backupSuperuserEmailRaw?.toLowerCase() ?? null;
  if (NODE_ENV === 'development') {
    superuserEmail = superuserEmail || 'superuser@beastops.local';
    backupSuperuserEmail =
      backupSuperuserEmail || 'backupsuperuser@beastops.local';
  }

  return {
    env: NODE_ENV,
    port: Number(PORT),
    cors: {
      origin: CORS_ORIGIN,
    },
    database: {
      host: DB_HOST,
      port: DB_PORT,
      name: DB_NAME,
      user: DB_USER,
      // password intentionally omitted from returned object (use env / Prisma only)
    },
    auth: {
      jwtSecret: JWT_SECRET,
      jwtExpiresIn: JWT_EXPIRES_IN,
      tokenEncryptionKey: TOKEN_ENCRYPTION_KEY,
    },
    oauth: {
      googleClientId: GOOGLE_CLIENT_ID,
      googleClientSecret: GOOGLE_CLIENT_SECRET,
      googleRedirectUri: GOOGLE_REDIRECT_URI,
    },
    frontend: {
      url: FRONTEND_URL,
    },
    email: {
      user: EMAIL_USER,
      pass: EMAIL_PASS,
      from: EMAIL_FROM,
      subjectPrefix: EMAIL_SUBJECT_PREFIX,
    },
    redis: {
      url: REDIS_URL,
    },
    systemUsers: {
      primaryEmail: superuserEmail,
      backupEmail: backupSuperuserEmail,
    },
  };
}
