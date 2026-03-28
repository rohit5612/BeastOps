import dotenv from 'dotenv';
import { trimEnvValue } from './core/config/envUtils.js';

dotenv.config();

function ensureDatabaseUrl() {
  const existing = trimEnvValue(process.env.DATABASE_URL);
  if (existing) {
    process.env.DATABASE_URL = existing;
    return;
  }

  const host = trimEnvValue(process.env.DB_HOST) || 'localhost';
  const port = trimEnvValue(process.env.DB_PORT) || '5432';
  const user = trimEnvValue(process.env.DB_USER);
  const password = trimEnvValue(process.env.DB_PASSWORD) ?? '';
  const name = trimEnvValue(process.env.DB_NAME);

  if (!user || !name) {
    return;
  }

  const encUser = encodeURIComponent(user);
  const encPass = encodeURIComponent(password);
  process.env.DATABASE_URL = `postgresql://${encUser}:${encPass}@${host}:${port}/${name}?schema=public`;
}

ensureDatabaseUrl();
